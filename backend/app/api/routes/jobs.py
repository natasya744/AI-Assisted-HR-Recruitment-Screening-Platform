import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_hr_user
from app.db.session import get_db
from app.repositories import application_repository, job_repository
from app.schemas.job import JobCreate, JobRead, PublicJobRead
from app.services import job_service

router = APIRouter(prefix="/api/jobs", tags=["jobs"])
public_router = APIRouter(prefix="/api/public/jobs", tags=["public-jobs"])

DbSession = Annotated[Session, Depends(get_db)]
HrUser = Annotated[str, Depends(get_current_hr_user)]


@router.post("", response_model=JobRead, status_code=201)
def create_job(
    data: JobCreate,
    db: DbSession,
    _hr: HrUser,
) -> JobRead:
    job = job_service.create_job(db, data)
    db.commit()
    db.refresh(job)
    return JobRead.model_validate(job)


@router.get("", response_model=list[JobRead])
def list_jobs(db: DbSession, _hr: HrUser) -> list[JobRead]:
    jobs = job_service.list_open_jobs(db)
    return [JobRead.model_validate(job) for job in jobs]


@router.get("/{job_id}", response_model=JobRead)
def get_job(job_id: uuid.UUID, db: DbSession, _hr: HrUser) -> JobRead:
    job = job_repository.get(db, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobRead.model_validate(job)


@router.put("/{job_id}", response_model=JobRead)
def update_job(
    job_id: uuid.UUID,
    data: JobCreate,
    db: DbSession,
    _hr: HrUser,
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


@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: uuid.UUID, db: DbSession, _hr: HrUser) -> None:
    if application_repository.count_by_job_id(db, job_id) > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a job that has applications. Delete applications first.",
        )
    job_repository.delete(db, job_id)
    db.commit()


@public_router.get("", response_model=list[PublicJobRead])
def list_public_jobs(db: DbSession) -> list[PublicJobRead]:
    jobs = job_service.list_open_jobs(db)
    return [PublicJobRead.model_validate(job) for job in jobs]


@public_router.get("/{job_id}", response_model=PublicJobRead)
def get_public_job(job_id: uuid.UUID, db: DbSession) -> PublicJobRead:
    job = job_repository.get(db, job_id)
    if job is None or not job.is_open:
        raise HTTPException(status_code=404, detail="Job not found")
    return PublicJobRead.model_validate(job)
