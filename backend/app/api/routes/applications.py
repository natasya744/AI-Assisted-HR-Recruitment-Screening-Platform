import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.application import ApplicationFormFields, ApplicationListItem, ApplicationRead
from app.services import application_service
from app.services.application_service import ApplicationError

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
    return [
        ApplicationListItem(
            id=application.id,
            status=application.status,
            applied_at=application.applied_at,
            job_title=job_title,
            candidate_name=candidate_name,
            candidate_email=candidate_email,
        )
        for application, job_title, candidate_name, candidate_email in rows
    ]
