from pydantic import BaseModel, Field


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
    languages: list[str] = Field(
        default_factory=list, description="Languages spoken"
    )
