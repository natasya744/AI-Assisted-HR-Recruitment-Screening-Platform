import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import CandidateProfileForm, CandidateProfilePdf
from app.repositories import profile_repository, screening_repository
from app.schemas.application import (
    ApplicationDetail,
    ApplicationFormFields,
    ApplicationListItem,
    ApplicationRead,
    CandidateInfo,
    PdfProfileRead,
    ScreeningResultRead,
    ScreeningSummary,
)
from app.services import application_service
from app.services.application_service import ApplicationError
from app.services.screening_service import assess_qualification

router = APIRouter(prefix="/api/applications", tags=["applications"])

DbSession = Annotated[Session, Depends(get_db)]
FormJobId = Annotated[uuid.UUID, Form(...)]
FormFullName = Annotated[str, Form(..., min_length=1, max_length=200)]
FormEmail = Annotated[str, Form(..., min_length=3, max_length=320)]
FormPhone = Annotated[str | None, Form(max_length=40)]
FormLocation = Annotated[str | None, Form(max_length=200)]
FormLinkedin = Annotated[str | None, Form(max_length=500)]
FormCv = Annotated[UploadFile, File(...)]


@router.post("", response_model=ApplicationRead, status_code=201)
async def create_application(
    db: DbSession,
    job_id: FormJobId,
    full_name: FormFullName,
    email: FormEmail,
    cv: FormCv,
    phone: FormPhone = None,
    location: FormLocation = None,
    linkedin_url: FormLinkedin = None,
) -> ApplicationRead:
    form = ApplicationFormFields(
        job_id=job_id,
        full_name=full_name,
        email=email,
        phone=phone,
        location=location,
        linkedin_url=linkedin_url,
    )
    cv_bytes = await cv.read()
    try:
        application = application_service.submit_application(
            db,
            form=form,
            cv_filename=cv.filename or "cv.pdf",
            cv_content_type=cv.content_type or "",
            cv_bytes=cv_bytes,
        )
    except ApplicationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    return ApplicationRead.model_validate(application)


@router.get("", response_model=list[ApplicationListItem])
def list_applications(
    db: DbSession,
    limit: int = 100,
) -> list[ApplicationListItem]:
    rows = application_service.list_applications_with_details(db, limit=limit)
    items: list[ApplicationListItem] = []
    for application, job, candidate, screening in rows:
        candidate_name = candidate.full_name
        candidate_email = candidate.email
        screening_summary = None
        if screening is not None:
            verdict = assess_qualification(screening.total_score, job.score_weights)
            screening_summary = ScreeningSummary(
                total_score=screening.total_score,
                max_score=verdict["max_score"],
                passing_score=verdict["passing_score"],
                is_qualified=verdict["is_qualified"],
                classification=verdict["classification"],
            )
        items.append(
            ApplicationListItem(
                id=application.id,
                status=application.status,
                applied_at=application.applied_at,
                job_title=job.title,
                candidate_name=candidate_name,
                candidate_email=candidate_email,
                cv_storage_path=application.cv_storage_path,
                screening=screening_summary,
            )
        )
    return items


@router.get("/{application_id}", response_model=ApplicationDetail)
def get_application(
    db: DbSession,
    application_id: uuid.UUID,
) -> ApplicationDetail:
    row = application_service.get_application_detail(db, application_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found")
    application, job, candidate = row

    application_service.ensure_application_screened(
        db,
        application=application,
        job=job,
    )

    form_profile: CandidateProfileForm | None = profile_repository.get_form_profile(
        db, application_id
    )
    pdf_profile: CandidateProfilePdf | None = profile_repository.get_pdf_profile(
        db, application_id
    )

    screening = screening_repository.get_by_application(db, application_id)
    screening_read = None
    if screening is not None:
        verdict = assess_qualification(screening.total_score, job.score_weights)
        screening_read = ScreeningResultRead(
            total_score=screening.total_score,
            max_score=verdict["max_score"],
            passing_score=verdict["passing_score"],
            is_qualified=verdict["is_qualified"],
            classification=verdict["classification"],
            breakdown=screening.breakdown,
            evidence=screening.evidence,
            ai_advice=screening.ai_advice,
            created_at=screening.created_at,
        )

    return ApplicationDetail(
        id=application.id,
        job_id=application.job_id,
        job_title=job.title,
        candidate=CandidateInfo(
            full_name=candidate.full_name,
            email=candidate.email,
            phone=candidate.phone,
            location=candidate.location,
            linkedin_url=candidate.linkedin_url,
        ),
        status=application.status,
        cv_storage_path=application.cv_storage_path,
        applied_at=application.applied_at,
        form_data=form_profile.form_data if form_profile else None,
        pdf_profile=PdfProfileRead(
            extracted_data=pdf_profile.extracted_data,
            provenance=pdf_profile.provenance,
            extraction_status=pdf_profile.extraction_status,
            alignment_check=pdf_profile.alignment_check,
            created_at=pdf_profile.created_at,
        )
        if pdf_profile
        else None,
        screening=screening_read,
    )
