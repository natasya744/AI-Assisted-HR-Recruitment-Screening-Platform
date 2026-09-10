from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator

VALID_DECISIONS = {"APPROVED", "REJECTED"}


class DecisionRequest(BaseModel):
    decision: str
    reviewer_email: str
    notes: str | None = None

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, value: str) -> str:
        upper = value.upper()
        if upper not in VALID_DECISIONS:
            raise ValueError(f"decision must be one of {VALID_DECISIONS}")
        return upper

    @field_validator("reviewer_email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized:
            raise ValueError("invalid email address")
        return normalized


class DecisionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    application_id: str
    decision: str
    reviewer_email: str
    notes: str | None
    decided_at: datetime


class HistoryEntry(BaseModel):
    event_type: str
    payload: dict[str, Any]
    created_at: datetime


class HrDossierResponse(BaseModel):
    application: dict[str, Any]
    candidate: dict[str, Any]
    screening: dict[str, Any] | None
    history: list[HistoryEntry]