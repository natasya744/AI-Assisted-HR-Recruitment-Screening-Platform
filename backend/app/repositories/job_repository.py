import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Job
from app.schemas.job import JobCreate


def create(db: Session, data: JobCreate) -> Job:
    job = Job(
        title=data.title,
        description=data.description,
        min_experience_years=data.min_experience_years,
        required_skills=data.required_skills,
        education_requirements=data.education_requirements,
        score_weights=data.score_weights,
        is_open=True,
    )
    db.add(job)
    db.flush()
    return job


def get(db: Session, job_id: uuid.UUID) -> Job | None:
    return db.get(Job, job_id)


def list_open(db: Session) -> list[Job]:
    stmt = select(Job).where(Job.is_open.is_(True)).order_by(Job.title)
    return list(db.execute(stmt).scalars())
