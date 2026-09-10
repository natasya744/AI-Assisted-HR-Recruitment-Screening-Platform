import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.repositories import job_repository
from app.schemas.job import JobCreate, JobRead
from app.services import job_service

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

DbSession = Annotated[Session, Depends(get_db)]


@router.post("", response_model=JobRead, status_code=201)
def create_job(
    data: JobCreate,
    db: DbSession,
) -> JobRead:
    job = job_service.create_job(db, data)
    db.commit()
    db.refresh(job)
    return JobRead.model_validate(job)


@router.get("", response_model=list[JobRead])
def list_jobs(db: DbSession) -> list[JobRead]:
    jobs = job_service.list_open_jobs(db)
    return [JobRead.model_validate(job) for job in jobs]


@router.get("/{job_id}", response_model=JobRead)
def get_job(job_id: uuid.UUID, db: DbSession) -> JobRead:
    job = job_repository.get(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobRead.model_validate(job)


@router.put("/{job_id}", response_model=JobRead)
def update_job(
    job_id: uuid.UUID,
    data: JobCreate,
    db: DbSession,
) -> JobRead:
    job = job_repository.get(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    job.title = data.title
    job.description = data.description
    job.min_experience_years = data.min_experience_years
    job.required_skills = data.required_skills
    job.education_requirements = data.education_requirements
    job.score_weights = data.score_weights
    db.commit()
    db.refresh(job)
    return JobRead.model_validate(job)
