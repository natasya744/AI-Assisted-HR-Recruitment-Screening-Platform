import re
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator


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


class EducationEntry(BaseModel):
    degree: str | None = Field(None, description="Degree or diploma name")
    institution: str | None = Field(None, description="School or university name")
    field: str | None = Field(None, description="Field or major of study")


class WorkExperienceEntry(BaseModel):
    title: str | None = Field(None, description="Job title / position")
    company: str | None = Field(None, description="Employer or company name")
    start_date: str | None = Field(None, description="Start date (month/year or year)")
    end_date: str | None = Field(None, description="End date (month/year, year, or 'Present')")


class CandidateProfileExtracted(BaseModel):
    full_name: str | None = Field(None, description="Candidate's full name")
    email: str | None = Field(None, description="Email address found on the CV")
    phone: str | None = Field(None, description="Phone number found on the CV")
    location: str | None = Field(None, description="City, region, or country")
    linkedin_url: str | None = Field(None, description="LinkedIn profile URL if present")
    github_url: str | None = Field(None, description="GitHub profile URL if present")
    portfolio_url: str | None = Field(
        None, description="Personal website, portfolio, or blog URL if present"
    )
    professional_summary: str | None = Field(
        None, description="Professional summary or objective statement"
    )
    skills: list[str] = Field(
        default_factory=list, description="List of technical and professional skills"
    )
    total_experience_years: int | None = Field(
        None, description="Total years of professional experience"
    )
    work_experience: list[WorkExperienceEntry] = Field(
        default_factory=list,
        description="Work history entries in chronological order",
    )
    education: list[EducationEntry] = Field(
        default_factory=list, description="Education history entries"
    )
    certifications: list[str] = Field(
        default_factory=list, description="Certifications or licenses listed"
    )
    languages: list[str] = Field(default_factory=list, description="Languages spoken")

    @field_validator("skills", "certifications", "languages", mode="before")
    @classmethod
    def _sanitize_string_lists(cls, v: Any) -> list[str]:
        return _clean_string_list(v)

    @model_validator(mode="before")
    @classmethod
    def _coerce_none_to_empty_list(cls, data: dict) -> dict:
        if isinstance(data, dict):
            for field in ("skills", "work_experience", "education", "certifications", "languages"):
                if data.get(field) is None:
                    data[field] = []
        return data
