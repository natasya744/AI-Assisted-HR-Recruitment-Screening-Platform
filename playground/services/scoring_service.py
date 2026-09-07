"""Deterministic rule-based screening service for playground.

Calculates mathematically explainable, reproducible scores from Job requirements
and CandidateProfileExtracted data.
Zero AI hallucinations: strictly weighted arithmetic.
"""

from __future__ import annotations

from typing import Any

from app.ai.schemas.candidate_profile import CandidateProfileExtracted


def calculate_deterministic_score(
    job: dict[str, Any],
    profile: CandidateProfileExtracted,
) -> dict[str, Any]:
    """Calculate deterministic screening score, breakdown, and evidence.

    Args:
        job: Dictionary or object with required_skills, min_experience_years,
             education_requirements, score_weights.
        profile: CandidateProfileExtracted instance.

    Returns:
        Dictionary containing total_score, breakdown, and evidence.
    """
    weights = job.get(
        "score_weights",
        {"skills": 30, "experience": 30, "education": 20, "other": 20},
    )

    profile_skills = {s.strip().lower() for s in (profile.skills or [])}
    required_skills = {s.strip().lower() for s in (job.get("required_skills") or [])}

    # 1. Skills Category
    matched_skills = profile_skills & required_skills
    missing_skills = required_skills - profile_skills
    skills_weight = weights.get("skills", 30)
    skills_score = (
        round((len(matched_skills) / len(required_skills)) * skills_weight)
        if required_skills
        else 0
    )

    # 2. Experience Category
    exp_years = profile.total_experience_years or 0
    min_years = job.get("min_experience_years", 0)
    exp_weight = weights.get("experience", 30)
    exp_score = exp_weight if exp_years >= min_years else 0

    # 3. Education Category
    edu_weight = weights.get("education", 20)
    job_edu_reqs = [r.lower() for r in job.get("education_requirements", [])]
    edu_matched = False
    for edu in profile.education or []:
        degree_str = f"{edu.degree or ''} {edu.field or ''}".lower()
        if any(req in degree_str for req in job_edu_reqs):
            edu_matched = True
            break
    edu_score = edu_weight if edu_matched else 0

    # 4. Other / Certifications Category
    other_weight = weights.get("other", 20)
    other_score = other_weight if profile.certifications else 0

    total_score = skills_score + exp_score + edu_score + other_score

    return {
        "total_score": total_score,
        "max_score": 100,
        "breakdown": {
            "skills": {
                "score": skills_score,
                "max": skills_weight,
                "matched": sorted(matched_skills),
            },
            "experience": {
                "score": exp_score,
                "max": exp_weight,
                "years": exp_years,
                "required_min": min_years,
            },
            "education": {
                "score": edu_score,
                "max": edu_weight,
                "matched": edu_matched,
            },
            "other": {
                "score": other_score,
                "max": other_weight,
                "has_certifications": bool(profile.certifications),
            },
        },
        "evidence": {
            "matched_skills": sorted(matched_skills),
            "missing_skills": sorted(missing_skills),
            "experience_years": exp_years,
            "min_required_experience": min_years,
            "education_entries": [e.model_dump() for e in profile.education],
            "certifications": profile.certifications,
        },
    }
