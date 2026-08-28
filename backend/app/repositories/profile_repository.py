import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CandidateProfileForm, CandidateProfilePdf


def create_form_profile(
    db: Session,
    *,
    application_id: uuid.UUID,
    form_data: dict[str, Any],
) -> CandidateProfileForm:
    profile = CandidateProfileForm(application_id=application_id, form_data=form_data)
    db.add(profile)
    db.flush()
    return profile


def get_form_profile(
    db: Session, application_id: uuid.UUID
) -> CandidateProfileForm | None:
    stmt = select(CandidateProfileForm).where(
        CandidateProfileForm.application_id == application_id
    )
    return db.execute(stmt).scalar_one_or_none()


def create_pdf_profile(
    db: Session,
    *,
    application_id: uuid.UUID,
    extracted_data: dict[str, Any],
    provenance: dict[str, Any],
    extraction_status: str,
    alignment_check: dict[str, Any],
) -> CandidateProfilePdf:
    profile = CandidateProfilePdf(
        application_id=application_id,
        extracted_data=extracted_data,
        provenance=provenance,
        extraction_status=extraction_status,
        alignment_check=alignment_check,
    )
    db.add(profile)
    db.flush()
    return profile


def get_pdf_profile(
    db: Session, application_id: uuid.UUID
) -> CandidateProfilePdf | None:
    stmt = select(CandidateProfilePdf).where(
        CandidateProfilePdf.application_id == application_id
    )
    return db.execute(stmt).scalar_one_or_none()
