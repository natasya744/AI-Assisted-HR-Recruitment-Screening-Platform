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
