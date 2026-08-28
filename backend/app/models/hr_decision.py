import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HRDecision(Base):
    __tablename__ = "hr_decisions"
    __table_args__ = (
        UniqueConstraint("application_id", name="uq_hr_decisions_application_id"),
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
            name="fk_hr_decisions_application_id_applications",
        )
    )
    decision: Mapped[str] = mapped_column(String(20))
    reviewer_email: Mapped[str] = mapped_column(String(320))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
