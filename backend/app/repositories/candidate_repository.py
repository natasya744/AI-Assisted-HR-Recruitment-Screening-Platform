import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Application, Candidate


def get_by_email(db: Session, email: str) -> Candidate | None:
    stmt = select(Candidate).where(Candidate.email == email)
    return db.execute(stmt).scalar_one_or_none()


def get(db: Session, candidate_id: uuid.UUID) -> Candidate | None:
    return db.get(Candidate, candidate_id)


def create(
    db: Session,
    *,
    full_name: str,
    email: str,
    phone: str | None,
    location: str | None,
    linkedin_url: str | None,
) -> Candidate:
    candidate = Candidate(
        full_name=full_name,
        email=email,
        phone=phone,
        location=location,
        linkedin_url=linkedin_url,
    )
    db.add(candidate)
    db.flush()
    return candidate


def update_contact(
    db: Session,
    candidate: Candidate,
    *,
    full_name: str,
    phone: str | None,
    location: str | None,
    linkedin_url: str | None,
) -> Candidate:
    candidate.full_name = full_name
    candidate.phone = phone
    candidate.location = location
    candidate.linkedin_url = linkedin_url
    db.flush()
    return candidate


def count_by_candidate_id(db: Session, candidate_id: uuid.UUID) -> int:
    stmt = select(Application).where(Application.candidate_id == candidate_id)
    return len(db.execute(stmt).scalars().all())


def delete(db: Session, candidate_id: uuid.UUID) -> None:
    candidate = db.get(Candidate, candidate_id)
    if candidate is not None:
        db.delete(candidate)
