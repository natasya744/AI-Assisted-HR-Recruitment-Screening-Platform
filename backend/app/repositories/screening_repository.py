import uuid

from sqlalchemy.orm import Session

from app.models import ScreeningResult


def get_by_application(
    db: Session, application_id: uuid.UUID
) -> ScreeningResult | None:
    return (
        db.query(ScreeningResult)
        .filter(ScreeningResult.application_id == application_id)
        .first()
    )


def update_ai_advice(
    db: Session,
    application_id: uuid.UUID,
    ai_advice: dict,
) -> None:
    result = get_by_application(db, application_id)
    if result is not None:
        result.ai_advice = ai_advice
        db.flush()
