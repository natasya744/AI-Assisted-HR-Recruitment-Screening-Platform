import re
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _clean_string_list(v: Any) -> list[str]:
    if v is None:
        return []
    if isinstance(v, str):
        raw_items = [v]
    elif isinstance(v, (list, tuple, set)):
        raw_items = list(v)
    else:
        return []

    result: list[str] = []
    seen: set[str] = set()
    for item in raw_items:
        if not isinstance(item, str):
            item = str(item)
        for part in re.split(r"[,\n\r]+", item):
            cleaned = re.sub(r"\s+", " ", part).strip()
            if cleaned:
                key = cleaned.lower()
                if key not in seen:
                    seen.add(key)
                    result.append(cleaned)
    return result


class JobCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None)
    min_experience_years: int = Field(default=0, ge=0, le=50)
    required_skills: list[str] = Field(default_factory=list)
    education_requirements: list[str] = Field(default_factory=list)
    score_weights: dict[str, float] = Field(default_factory=dict)

    @field_validator("title", mode="before")
    @classmethod
    def _sanitize_title(cls, v: Any) -> str:
        if isinstance(v, str):
            return re.sub(r"\s+", " ", v).strip()
        return v

    @field_validator("description", mode="before")
    @classmethod
    def _sanitize_description(cls, v: Any) -> str | None:
        if isinstance(v, str):
            cleaned = v.strip()
            return cleaned if cleaned else None
        return v

    @field_validator("required_skills", mode="before")
    @classmethod
    def _sanitize_skills(cls, v: Any) -> list[str]:
        return _clean_string_list(v)

    @field_validator("education_requirements", mode="before")
    @classmethod
    def _sanitize_education(cls, v: Any) -> list[str]:
        return _clean_string_list(v)

    @field_validator("score_weights", mode="before")
    @classmethod
    def _sanitize_weights(cls, v: Any) -> dict[str, float]:
        if not isinstance(v, dict):
            return {}
        cleaned: dict[str, float] = {}
        for key, val in v.items():
            if isinstance(key, str):
                try:
                    num_val = float(val)
                    if num_val >= 0:
                        cleaned[key.strip().lower()] = num_val
                except (ValueError, TypeError):
                    continue
        return cleaned


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
