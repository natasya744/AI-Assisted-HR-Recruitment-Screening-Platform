import re
import uuid
from pathlib import PurePosixPath

from sqlalchemy.orm import Session

from app.models import Application
from app.repositories import (
    application_repository,
    audit_repository,
    candidate_repository,
    job_repository,
    profile_repository,
)
from app.schemas.application import ApplicationFormFields
from app.services import storage_service

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
        profile_repository.create_form_profile(
            db,
            application_id=application.id,
            form_data={
                "full_name": form.full_name,
                "email": form.email,
                "phone": form.phone,
                "location": form.location,
                "linkedin_url": linkedin_url,
                "job_id": str(job.id),
                "job_title": job.title,
            },
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
    return application


def list_applications_with_details(
    db: Session, limit: int = 100
) -> list[tuple[Application, str, str, str]]:
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
