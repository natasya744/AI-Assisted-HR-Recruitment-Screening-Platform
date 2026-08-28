import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, String, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("jobs.id", ondelete="RESTRICT", name="fk_applications_job_id_jobs")
    )
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(
            "candidates.id", ondelete="RESTRICT", name="fk_applications_candidate_id_candidates"
        )
    )
    status: Mapped[str] = mapped_column(
        String(50), default="APPLICATION_SUBMITTED", index=True
    )
    cv_storage_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cv_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
