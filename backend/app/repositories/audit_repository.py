import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AuditLog


def append(
    db: Session,
    *,
    application_id: uuid.UUID,
    event_type: str,
    payload: dict[str, Any] | None = None,
) -> AuditLog:
    entry = AuditLog(
        application_id=application_id,
        event_type=event_type,
        payload=payload or {},
    )
    db.add(entry)
    db.flush()
    return entry


def list_for_application(db: Session, application_id: uuid.UUID) -> list[AuditLog]:
    stmt = (
        select(AuditLog)
        .where(AuditLog.application_id == application_id)
        .order_by(AuditLog.created_at)
    )
    return list(db.execute(stmt).scalars())
