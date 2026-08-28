from pydantic import BaseModel, Field


class RequirementAssessment(BaseModel):
    requirement: str = Field(description="The qualification or condition being assessed")
    category: str = Field(
        description="One of: REQUIRED, PREFERRED, RESPONSIBILITY, OTHER_CONDITION"
    )
    status: str = Field(
        description="One of: YES, NO, PARTIAL_MATCH, NOT_FOUND"
    )
    evidence: str = Field(description="Exact text from the CV supporting this assessment")
    reason: str = Field(description="Short explanation of the assessment")


class AdvisorOutput(BaseModel):
    overall_classification: str = Field(
        description=(
            "One of: QUALIFIED, NOT_QUALIFIED, "
            "POTENTIALLY_QUALIFIED, INSUFFICIENT_INFORMATION"
        )
    )
    per_requirement: list[RequirementAssessment] = Field(
        description="Assessment of each qualification from the job description"
    )
    additional_qualifications: list[str] = Field(
        default_factory=list,
        description="Qualifications the job requires but are not verifiable from the CV",
    )
    advisor_confidence: str = Field(
        description="One of: HIGH, MEDIUM, LOW"
    )
