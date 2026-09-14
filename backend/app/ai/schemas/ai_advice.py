from pydantic import BaseModel, Field, model_validator


class RequirementAssessment(BaseModel):
    requirement: str = Field(description="The qualification or condition being assessed")
    category: str = Field(
        description="One of: REQUIRED, PREFERRED, RESPONSIBILITY, OTHER_CONDITION"
    )
    status: str = Field(
        description="One of: MATCH, PARTIAL_MATCH, NOT_MATCH, NOT_FOUND, CONFLICTING_INFORMATION"
    )
    evidence: str | None = Field(
        default=None,
        description="Exact text from the CV supporting this assessment, or null if no evidence",
    )
    reason: str = Field(description="Short explanation of the assessment")


class AdvisorOutput(BaseModel):
    overall_classification: str = Field(
        description=(
            "One of: QUALIFIED, NOT_QUALIFIED, POTENTIALLY_QUALIFIED, INSUFFICIENT_INFORMATION"
        )
    )
    concise_summary: str | None = Field(
        default=None,
        description=(
            "One concise sentence explaining WHY the candidate is "
            "qualified or not qualified, based strictly on the evidence. "
            "Example: 'Meets all mandatory requirements — Python and 3+ years experience verified.'"
        ),
    )
    hr_advice: str | None = Field(
        default=None,
        description=(
            "A short, actionable recommendation for HR on the next step. "
            "Example: 'Proceed to interview' or "
            "'Request additional documentation on certifications'."
        ),
    )
    per_requirement: list[RequirementAssessment] = Field(
        description="Assessment of each qualification from the job description"
    )
    additional_qualifications: list[str] = Field(
        default_factory=list,
        description="Qualifications the job requires but are not verifiable from the CV",
    )
    advisor_confidence: str = Field(description="One of: HIGH, MEDIUM, LOW")

    @model_validator(mode="before")
    @classmethod
    def _normalize(cls, data: dict) -> dict:
        if not isinstance(data, dict):
            return data
        # per_requirement: flatten a category-keyed dict into a flat list
        pr = data.get("per_requirement")
        if isinstance(pr, dict):
            flat = []
            for items in pr.values():
                if isinstance(items, list):
                    flat.extend(items)
            data["per_requirement"] = flat
        # additional_qualifications: flatten a dict of lists into a flat list of strings
        aq = data.get("additional_qualifications")
        if isinstance(aq, dict):
            flat = []
            for items in aq.values():
                if isinstance(items, list):
                    flat.extend(str(x) for x in items)
            data["additional_qualifications"] = flat
        # advisor_confidence: coerce float/int to string
        conf = data.get("advisor_confidence")
        if isinstance(conf, (int, float)):
            data["advisor_confidence"] = str(conf)
        return data
