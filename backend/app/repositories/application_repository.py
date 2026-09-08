import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Application, Candidate, Job, ScreeningResult


def create(
    db: Session,
    *,
    application_id: uuid.UUID,
    job_id: uuid.UUID,
    candidate_id: uuid.UUID,
    cv_storage_path: str | None,
    cv_metadata: dict[str, Any] | None,
) -> Application:
    application = Application(
        id=application_id,
        job_id=job_id,
        candidate_id=candidate_id,
        cv_storage_path=cv_storage_path,
        cv_metadata=cv_metadata,
        status="APPLICATION_SUBMITTED",
    )
    db.add(application)
    db.flush()
    return application


def get(db: Session, application_id: uuid.UUID) -> Application | None:
    return db.get(Application, application_id)


def get_with_job_and_candidate(
    db: Session, application_id: uuid.UUID
) -> tuple[Application, Job, Candidate] | None:
    stmt = (
        select(Application, Job, Candidate)
        .join(Job, Application.job_id == Job.id)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .where(Application.id == application_id)
    )
    return db.execute(stmt).first()


def list_with_details(db: Session, limit: int = 100) -> list[Any]:
    stmt = (
        select(Application, Job, Candidate, ScreeningResult)
        .join(Job, Application.job_id == Job.id)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .outerjoin(ScreeningResult, ScreeningResult.application_id == Application.id)
        .order_by(Application.applied_at.desc())
        .limit(limit)
    )
    return list(db.execute(stmt).all())
