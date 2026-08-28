from sqlalchemy.orm import Session

from app.repositories import job_repository
from app.schemas.job import JobCreate
from app.services import storage_service


def create_job(db: Session, data: JobCreate):
    return job_repository.create(db, data)


def list_open_jobs(db: Session):
    return job_repository.list_open(db)


def ensure_storage_ready() -> str:
    return storage_service.ensure_candidate_cvs_bucket()
