import json
import uuid

from sqlalchemy.orm import Session

from app.ai.schemas.candidate_profile import CandidateProfileExtracted
from app.models import Job, ScreeningResult
from app.providers.screening_advisor import get_screening_advice


class ScreeningError(Exception):
    pass


def run_deterministic_screening(
    db: Session,
    *,
    application_id: uuid.UUID,
    job: Job,
    profile: CandidateProfileExtracted,
) -> ScreeningResult:
    skills = set(s.lower() for s in (profile.skills or []))
    required = set(s.lower() for s in (job.required_skills or []))
    matched = skills & required
    skill_score = 0
    if required:
        skill_ratio = len(matched) / len(required)
        skill_weight = job.score_weights.get("skills", 30)
        skill_score = round(skill_ratio * skill_weight)

    exp_years = profile.total_experience_years or 0
    exp_weight = job.score_weights.get("experience", 30)
    exp_score = exp_weight if exp_years >= job.min_experience_years else 0

    edu_weight = job.score_weights.get("education", 20)
    edu_match = _matches_any_education(
        profile.education or [], job.education_requirements
    )
    edu_score = edu_weight if edu_match else 0

    other_weight = job.score_weights.get("other", 20)
    other_score = other_weight if profile.certifications else 0

    total = skill_score + exp_score + edu_score + other_score

    result = ScreeningResult(
        application_id=application_id,
        total_score=total,
        breakdown={
            "skills": {"score": skill_score, "max": skill_weight, "matched": list(matched)},
            "experience": {"score": exp_score, "max": exp_weight, "years": exp_years},
            "education": {"score": edu_score, "max": edu_weight},
            "other": {"score": other_score, "max": other_weight},
        },
        evidence={
            "matched_skills": list(matched),
            "missing_skills": list(required - matched),
            "experience_years": exp_years,
            "min_required_experience": job.min_experience_years,
            "education_requirements": job.education_requirements,
            "certifications": profile.certifications,
        },
    )
    db.add(result)
    db.flush()
    return result


def run_ai_advisor(
    *,
    job: Job,
    profile: CandidateProfileExtracted,
    profile_json: str | None = None,
) -> dict:
    if profile_json is None:
        profile_json = profile.model_dump_json(indent=2, exclude_none=True)

    job_description_lines = [
        f"Required skills: {', '.join(job.required_skills)}",
        f"Min experience: {job.min_experience_years} years",
        f"Education: {', '.join(job.education_requirements)}",
        f"Score weights: {json.dumps(job.score_weights)}",
    ]

    result = get_screening_advice(
        job_title=job.title,
        job_description="\n".join(job_description_lines),
        candidate_profile=profile_json,
    )

    if result.success and result.advice:
        return result.advice.model_dump()
    return {
        "overall_classification": "INSUFFICIENT_INFORMATION",
        "per_requirement": [],
        "additional_qualifications": [],
        "advisor_confidence": "LOW",
        "error": result.error,
    }


def _matches_any_education(
    education_list: list,
    requirements: list[str],
) -> bool:
    requirement_lower = [r.lower() for r in requirements]
    for edu in education_list:
        text = " ".join(
            str(v) for v in (edu.get("degree", "") if isinstance(edu, dict) else (edu.degree or ""))
        ).lower()
        if any(req in text for req in requirement_lower):
            return True
    return False
