import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class JobCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None)
    min_experience_years: int = Field(default=0, ge=0, le=50)
    required_skills: list[str] = Field(default_factory=list)
    education_requirements: list[str] = Field(default_factory=list)
    score_weights: dict[str, float] = Field(default_factory=dict)


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str | None = None
    min_experience_years: int
    required_skills: list[str]
    education_requirements: list[str]
    score_weights: dict[str, float]
    is_open: bool
    created_at: datetime | None = None
