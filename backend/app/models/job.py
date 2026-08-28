import uuid
from typing import Any

from sqlalchemy import Boolean, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    title: Mapped[str] = mapped_column(String(200))
    min_experience_years: Mapped[int] = mapped_column(Integer, default=0)
    required_skills: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    education_requirements: Mapped[list[Any]] = mapped_column(JSONB, default=list)
    score_weights: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    is_open: Mapped[bool] = mapped_column(Boolean, default=True)
