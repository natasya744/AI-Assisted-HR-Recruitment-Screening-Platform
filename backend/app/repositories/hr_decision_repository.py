import uuid

from sqlalchemy.orm import Session

from app.models import HRDecision


def get_by_application(
    db: Session, application_id: uuid.UUID
) -> HRDecision | None:
    return (
        db.query(HRDecision)
        .filter(HRDecision.application_id == application_id)
        .first()
    )


def create(
    db: Session,
    *,
    application_id: uuid.UUID,
    decision: str,
    reviewer_email: str,
    notes: str | None = None,
) -> HRDecision:
    entry = HRDecision(
        application_id=application_id,
        decision=decision,
        reviewer_email=reviewer_email,
        notes=notes,
    )
    db.add(entry)
    db.flush()
    return entry
