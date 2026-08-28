import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CandidateProfileForm(Base):
    __tablename__ = "candidate_profiles_form"
    __table_args__ = (
        UniqueConstraint("application_id", name="uq_candidate_profiles_form_application_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "applications.id",
            ondelete="CASCADE",
            name="fk_candidate_profiles_form_application_id_applications",
        )
    )
    form_data: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
