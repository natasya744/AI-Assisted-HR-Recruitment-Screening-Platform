import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import (
    application_repository,
    audit_repository,
    candidate_repository,
    hr_decision_repository,
    profile_repository,
    screening_repository,
)
from app.schemas.hr_decision import DecisionRead, DecisionRequest
from app.services import application_service, storage_service
from app.services.screening_service import assess_qualification

router = APIRouter(prefix="/api/hr", tags=["hr"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("/applications", response_model=list[dict])
def list_hr_applications(
    db: DbSession,
    job_id: uuid.UUID | None = None,
    status: str | None = None,
    min_score: int | None = None,
    applied_at_date: str | None = None,
    limit: int = 100,
):
    rows = application_service.list_applications_with_details(db, limit=limit)
    items: list[dict] = []
    for application, job, candidate, screening in rows:
        if job_id is not None and application.job_id != job_id:
            continue
        if status is not None and application.status != status:
            continue
        if applied_at_date is not None:
            dt = date.fromisoformat(applied_at_date)
            a = application.applied_at
            if a is None or a.date() != dt:
                continue

        screening_summary = None
        if screening is not None:
            verdict = assess_qualification(screening.total_score, job.score_weights)
            screening_summary = {
                "total_score": screening.total_score,
                "max_score": verdict["max_score"],
                "passing_score": verdict["passing_score"],
                "is_qualified": verdict["is_qualified"],
                "classification": verdict["classification"],
            }
            if min_score is not None and screening.total_score < min_score:
                continue

        items.append({
            "id": str(application.id),
            "status": application.status,
            "applied_at": application.applied_at.isoformat(),
            "job_title": job.title,
            "job_id": str(job.id),
            "cv_storage_path": application.cv_storage_path,
            "candidate_name": candidate.full_name,
            "candidate_email": candidate.email,
            "screening": screening_summary,
        })
    return items


@router.get("/applications/{application_id}")
def get_hr_application_detail(
    application_id: uuid.UUID,
    db: DbSession,
):
    row = application_service.get_application_detail(db, application_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found")
    application, job, candidate = row

    application_service.ensure_application_screened(db, application=application, job=job)

    pdf_profile = profile_repository.get_pdf_profile(db, application_id)
    screening = screening_repository.get_by_application(db, application_id)
    history = audit_repository.list_for_application(db, application_id)

    screening_read = None
    if screening is not None:
        verdict = assess_qualification(screening.total_score, job.score_weights)
        screening_read = {
            "total_score": screening.total_score,
            "max_score": verdict["max_score"],
            "passing_score": verdict["passing_score"],
            "is_qualified": verdict["is_qualified"],
            "classification": verdict["classification"],
            "breakdown": screening.breakdown,
            "evidence": screening.evidence,
            "ai_advice": screening.ai_advice,
            "created_at": screening.created_at.isoformat(),
        }

    pdf_profile_read = None
    if pdf_profile is not None:
        pdf_profile_read = {
            "extracted_data": pdf_profile.extracted_data,
            "provenance": pdf_profile.provenance,
            "extraction_status": pdf_profile.extraction_status,
            "alignment_check": pdf_profile.alignment_check,
            "created_at": pdf_profile.created_at.isoformat(),
        }

    return {
        "application": {
            "id": str(application.id),
            "job_id": str(application.job_id),
            "job_title": job.title,
            "status": application.status,
            "cv_storage_path": application.cv_storage_path,
            "applied_at": application.applied_at.isoformat(),
        },
        "candidate": {
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": candidate.phone,
            "location": candidate.location,
            "linkedin_url": candidate.linkedin_url,
        },
        "screening": screening_read,
        "pdf_profile": pdf_profile_read,
        "history": [
            {
                "event_type": e.event_type,
                "payload": e.payload,
                "created_at": e.created_at.isoformat(),
            }
            for e in history
        ],
    }


@router.post(
    "/applications/{application_id}/decision",
    response_model=DecisionRead,
    status_code=201,
)
def make_decision(
    application_id: uuid.UUID,
    body: DecisionRequest,
    db: DbSession,
):
    existing = hr_decision_repository.get_by_application(db, application_id)
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail=(
                f"A decision already exists for this application "
                f"({existing.decision}). Decisions are terminal."
            ),
        )

    application = application_repository.get(db, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    decision = body.decision

    application.status = decision
    db.flush()

    hr_decision = hr_decision_repository.create(
        db,
        application_id=application_id,
        decision=decision,
        reviewer_email=body.reviewer_email,
        notes=body.notes,
    )

    audit_repository.append(
        db,
        application_id=application_id,
        event_type=f"DECISION_{decision}",
        payload={
            "decision": decision,
            "reviewer_email": body.reviewer_email,
            "notes": body.notes,
            "previous_status": "HR_REVIEW",
        },
    )

    db.commit()

    return DecisionRead(
        id=str(hr_decision.id),
        application_id=str(hr_decision.application_id),
        decision=hr_decision.decision,
        reviewer_email=hr_decision.reviewer_email,
        notes=hr_decision.notes,
        decided_at=hr_decision.decided_at,
    )


@router.delete("/applications/{application_id}", status_code=204)
def delete_application(application_id: uuid.UUID, db: DbSession) -> None:
    application = application_repository.get(db, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")

    cv_storage_path = application.cv_storage_path
    if cv_storage_path:
        storage_service.delete_cv(cv_storage_path)

    candidate_id = application.candidate_id
    application_repository.delete(db, application_id)

    if candidate_repository.count_by_candidate_id(db, candidate_id) == 0:
        candidate_repository.delete(db, candidate_id)

    audit_repository.append(
        db,
        application_id=application_id,
        event_type="APPLICATION_DELETED",
        payload={"cv_storage_path": cv_storage_path},
    )
    db.commit()