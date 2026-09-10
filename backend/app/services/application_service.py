import re
import uuid
from pathlib import PurePosixPath

from sqlalchemy.orm import Session

from app.models import application
from app.providers import resume_extractor
from app.repositories import (
    application_repository,
    audit_repository,
    candidate_repository,
    job_repository,
    profile_repository,
    screening_repository,
)
from app.schemas.application import ApplicationFormFields
from app.services import document_service, screening_service, storage_service, validation_service

MAX_CV_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_CV_CONTENT_TYPE = "application/pdf"


class ApplicationError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def submit_application(
    db: Session,
    *,
    form: ApplicationFormFields,
    cv_filename: str,
    cv_content_type: str,
    cv_bytes: bytes,
) -> Application:
    _validate_cv(cv_filename, cv_content_type, cv_bytes)

    job = job_repository.get(db, form.job_id)
    if job is None:
        raise ApplicationError("Job not found", status_code=404)
    if not job.is_open:
        raise ApplicationError("This job is no longer open", status_code=400)

    linkedin_url = str(form.linkedin_url) if form.linkedin_url else None
    candidate = candidate_repository.get_by_email(db, form.email)
    if candidate is None:
        candidate = candidate_repository.create(
            db,
            full_name=form.full_name,
            email=form.email,
            phone=form.phone,
            location=form.location,
            linkedin_url=linkedin_url,
        )
    else:
        candidate = candidate_repository.update_contact(
            db,
            candidate,
            full_name=form.full_name,
            phone=form.phone,
            location=form.location,
            linkedin_url=linkedin_url,
        )

    application_id = uuid.uuid4()
    safe_name = _sanitize_filename(cv_filename)
    cv_path = f"{application_id}/{safe_name}"
    cv_metadata = {
        "original_filename": safe_name,
        "content_type": cv_content_type,
        "size_bytes": len(cv_bytes),
    }

    try:
        storage_service.upload_cv_bytes(cv_path, cv_bytes)
        application = application_repository.create(
            db,
            application_id=application_id,
            job_id=job.id,
            candidate_id=candidate.id,
            cv_storage_path=cv_path,
            cv_metadata=cv_metadata,
        )
        form_data = {
            "full_name": form.full_name,
            "email": form.email,
            "phone": form.phone,
            "location": form.location,
            "linkedin_url": linkedin_url,
            "job_id": str(job.id),
            "job_title": job.title,
        }
        profile_repository.create_form_profile(
            db,
            application_id=application.id,
            form_data=form_data,
        )
        audit_repository.append(
            db,
            application_id=application.id,
            event_type="APPLICATION_SUBMITTED",
            payload={
                "candidate_id": str(candidate.id),
                "job_id": str(job.id),
                "cv_storage_path": cv_path,
            },
        )
        db.commit()
    except Exception:
        db.rollback()
        raise

    process_application(
        db,
        application=application,
        job=job,
        form_data=form_data,
        cv_bytes=cv_bytes,
    )
    return application


def process_application(
    db: Session,
    *,
    application: Application,
    job: object,
    form_data: dict,
    cv_bytes: bytes,
) -> Application:
    """Extract, validate and persist the PDF profile for a submitted application.

    Extraction failure → ``DOCUMENT_PROCESSING_FAILED`` (manual review).
    Screening failure → still ``HR_REVIEW`` with a zero-score fallback verdict
    so HR always sees *something*.
    """
    try:
        cv_text = document_service.pdf_to_text(cv_bytes)
        if not cv_text.strip():
            raise ApplicationError("PDF contains no extractable text")

        result = resume_extractor.extract_resume(cv_text)
        if not result.success or result.profile is None:
            detail = result.error or "unknown extraction error"
            raise ApplicationError(f"Extraction failed: {detail}")

        validated = validation_service.run_validation_pipeline(result.profile, form_data=form_data)
        profile = validated["profile"]
        field_provenance = validated["field_provenance"]
        business_warnings = validated["business_warnings"]
        alignment_check = validated["alignment_check"]

        profile_repository.create_pdf_profile(
            db,
            application_id=application.id,
            extracted_data=profile.model_dump(mode="json"),
            provenance=field_provenance,
            extraction_status="completed",
            alignment_check=alignment_check or {},
        )
        application.status = "SCREENING"
        audit_repository.append(
            db,
            application_id=application.id,
            event_type="EXTRACTED",
            payload={
                "extraction_status": "completed",
                "business_warnings": business_warnings,
                "field_provenance": field_provenance,
            },
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        _mark_processing_failed(db, application, str(exc))
        return application

    try:
        screening_service.run_deterministic_screening(
            db,
            application_id=application.id,
            job=job,
            profile=profile,
        )

        advice = screening_service.run_ai_advisor(
            job=job,
            profile=profile,
        )
        screening_repository.update_ai_advice(
            db,
            application_id=application.id,
            ai_advice=advice,
        )
    except screening_service.ScreeningError:
        pass
    except Exception as exc:
        db.rollback()
        screening_service.create_fallback_screening(
            db,
            application_id=application.id,
            job=job,
            error=str(exc),
        )

    application.status = "HR_REVIEW"
    audit_repository.append(
        db,
        application_id=application.id,
        event_type="SCREENED",
        payload={
            "screening_status": "completed",
            "status": "HR_REVIEW",
        },
    )
    db.commit()
    return application


def ensure_application_screened(
    db: Session,
    *,
    application: Application,
    job: object,
) -> Application:
    """Backfill a screening result for an application that lacks one.

    Used when the detail endpoint is called for an old row that was created
    before screening was wired into the intake flow.  If the scoring engine
    itself raises, a zero-score fallback is persisted.
    """
    already = screening_repository.get_by_application(db, application.id)
    if already is not None:
        return application

    pdf_profile = profile_repository.get_pdf_profile(db, application.id)
    if pdf_profile is None or pdf_profile.extraction_status != "completed":
        return application

    try:
        screening_service.screen_application(
            db,
            application_id=application.id,
            job=job,
            extracted_data=pdf_profile.extracted_data,
        )
        application.status = "HR_REVIEW"
        db.commit()
    except screening_service.ScreeningError:
        db.rollback()
    except Exception as exc:
        db.rollback()
        screening_service.create_fallback_screening(
            db,
            application_id=application.id,
            job=job,
            error=str(exc),
        )
        db.commit()

    return application


def _mark_processing_failed(db: Session, application: Application, error: str) -> None:
    profile_repository.create_pdf_profile(
        db,
        application_id=application.id,
        extracted_data={},
        provenance={},
        extraction_status="failed",
        alignment_check={},
    )
    application.status = "DOCUMENT_PROCESSING_FAILED"
    audit_repository.append(
        db,
        application_id=application.id,
        event_type="DOCUMENT_PROCESSING_FAILED",
        payload={"error": error},
    )
    db.commit()


def get_application_detail(
    db: Session, application_id: uuid.UUID
) -> tuple[Application, object, object] | None:
    row = application_repository.get_with_job_and_candidate(db, application_id)
    if row is None:
        return None
    return row


def list_applications_with_details(
    db: Session, limit: int = 100
) -> list[tuple[Application, object, object, object | None]]:
    return application_repository.list_with_details(db, limit=limit)


def _validate_cv(filename: str, content_type: str, data: bytes) -> None:
    if len(data) == 0:
        raise ApplicationError("CV file is empty")
    if len(data) > MAX_CV_SIZE_BYTES:
        raise ApplicationError("CV file exceeds the 10 MB limit", status_code=413)
    if content_type != ALLOWED_CV_CONTENT_TYPE:
        raise ApplicationError("CV must be a PDF file")
    if PurePosixPath(filename.replace("\\", "/")).suffix.lower() != ".pdf":
        raise ApplicationError("CV must have a .pdf extension")
    if not data.startswith(b"%PDF-"):
        raise ApplicationError("CV file is not a valid PDF document")


def _sanitize_filename(filename: str) -> str:
    name = PurePosixPath(filename.replace("\\", "/")).name
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", name).strip("._")
    return cleaned or "cv.pdf"
