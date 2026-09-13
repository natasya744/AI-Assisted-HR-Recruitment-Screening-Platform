import re
import uuid

from sqlalchemy.orm import Session

from app.ai.schemas.candidate_profile import CandidateProfileExtracted
from app.models import Job, ScreeningResult
from app.providers.screening_advisor import get_screening_advice
from app.repositories import hr_decision_repository, screening_repository


def _normalize_skill(s: str) -> str:
    """Normalize skill string for resilient matching."""
    s = s.lower().strip()
    s = re.sub(r"[\-_/]+", " ", s)
    s = re.sub(r"[^\w\s]", "", s)
    tokens = s.split()
    normalized_tokens = []
    for t in tokens:
        if t.endswith("ing") and len(t) > 4:
            t = t[:-3]
        elif t.endswith("ies") and len(t) > 4:
            t = t[:-3] + "y"
        elif t.endswith("s") and len(t) > 3 and not t.endswith("ss"):
            t = t[:-1]
        normalized_tokens.append(t)
    return " ".join(normalized_tokens)


def _is_skill_matched(
    required_skill: str,
    candidate_skills: list[str],
    extended_corpus: str,
) -> bool:
    req_clean = required_skill.strip().lower()
    req_norm = _normalize_skill(required_skill)
    req_tokens = set(req_norm.split())

    # 1. Direct or normalized match against candidate extracted skills
    for c_skill in candidate_skills:
        c_clean = c_skill.strip().lower()
        if req_clean == c_clean:
            return True
        c_norm = _normalize_skill(c_skill)
        if req_norm == c_norm:
            return True
        # Token subset match (e.g. "prompt engineer" matches "advanced prompt engineering")
        c_tokens = set(c_norm.split())
        if req_tokens and req_tokens.issubset(c_tokens):
            return True
        if c_tokens and c_tokens.issubset(req_tokens) and len(c_tokens) >= 2:
            return True

    # 2. Check exact phrase or word in extended CV corpus
    if len(req_clean) >= 2:
        pattern = rf"\b{re.escape(req_clean)}\b"
        if re.search(pattern, extended_corpus, re.IGNORECASE):
            return True

    return False


class ScreeningError(Exception):
    pass


def assess_qualification(total_score: int, score_weights: dict) -> dict:
    """Derive a transparent qualified / not-qualified verdict from a score.

    The maximum achievable score is the sum of the job's ``score_weights``.
    A candidate is considered qualified when they reach 60% of that maximum.
    Everything is computed deterministically and surfaced to HR so the reason
    for the verdict is always inspectable.
    """
    weights = score_weights or {"skills": 30, "experience": 30, "education": 20, "other": 20}
    max_score = round(sum(float(v) for v in weights.values()))
    if max_score <= 0:
        max_score = 100
    passing_score = round(max_score * 0.6)
    is_qualified = total_score >= passing_score
    return {
        "max_score": max_score,
        "passing_score": passing_score,
        "is_qualified": is_qualified,
        "classification": "QUALIFIED" if is_qualified else "NOT_QUALIFIED",
    }


def run_deterministic_screening(
    db: Session,
    *,
    application_id: uuid.UUID,
    job: Job,
    profile: CandidateProfileExtracted,
) -> ScreeningResult:
    if hr_decision_repository.get_by_application(db, application_id) is not None:
        raise ScreeningError(
            "Cannot recompute screening after an HR decision has been made"
        )

    candidate_skills = [s for s in (profile.skills or []) if s]
    extended_corpus = " ".join([
        *candidate_skills,
        profile.professional_summary or "",
        *(f"{e.title or ''} {e.company or ''}" for e in (profile.work_experience or [])),
        *(profile.certifications or []),
    ]).lower()

    matched: list[str] = []
    missing: list[str] = []
    for req in (job.required_skills or []):
        if _is_skill_matched(req, candidate_skills, extended_corpus):
            matched.append(req)
        else:
            missing.append(req)

    skill_weight = job.score_weights.get("skills", 30)
    required_count = len(job.required_skills or [])
    skill_score = 0
    if required_count > 0:
        skill_ratio = len(matched) / required_count
        skill_score = round(skill_ratio * skill_weight)

    exp_years = profile.total_experience_years or 0
    exp_weight = job.score_weights.get("experience", 30)
    exp_score = exp_weight if exp_years >= job.min_experience_years else 0

    edu_weight = job.score_weights.get("education", 20)
    edu_match = _matches_any_education(
        profile.education or [], job.education_requirements or []
    )
    edu_score = edu_weight if edu_match else 0

    other_weight = job.score_weights.get("other", 20)
    other_score = other_weight if profile.certifications else 0

    total = skill_score + exp_score + edu_score + other_score

    result = ScreeningResult(
        application_id=application_id,
        total_score=total,
        breakdown={
            "skills": {"score": skill_score, "max": skill_weight, "matched": matched},
            "experience": {"score": exp_score, "max": exp_weight, "years": exp_years},
            "education": {"score": edu_score, "max": edu_weight},
            "other": {"score": other_score, "max": other_weight},
        },
        evidence={
            "matched_skills": matched,
            "missing_skills": missing,
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

    # Assemble structured and unambiguous requirements to ground the AI model
    requirements_parts: list[str] = []
    if job.required_skills:
        requirements_parts.append(f"Required Skills: {', '.join(job.required_skills)}")
    if job.min_experience_years > 0:
        requirements_parts.append(
            f"Minimum Professional Experience: {job.min_experience_years} years"
        )
    if job.education_requirements:
        requirements_parts.append(
            f"Education Requirements: {', '.join(job.education_requirements)}"
        )

    structured_section = "\n".join(requirements_parts)

    if job.description:
        if structured_section:
            job_description = (
                f"### Structured Criteria:\n{structured_section}\n\n"
                f"### Full Role Description:\n{job.description}"
            )
        else:
            job_description = job.description
    else:
        job_description = structured_section or "No specific criteria or description provided."

    result = get_screening_advice(
        job_title=job.title,
        job_description=job_description,
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


def create_fallback_screening(
    db: Session,
    *,
    application_id: uuid.UUID,
    job: Job,
    error: str,
) -> ScreeningResult:
    """Create a zero-score ScreeningResult when the scoring engine itself fails.

    This ensures HR always sees a verdict (even if the verdict is "no score
    could be computed") rather than missing data and confusion.
    """
    weights = job.score_weights or {"skills": 30, "experience": 30, "education": 20, "other": 20}
    breakdown = {
        "skills": {"score": 0, "max": weights.get("skills", 30), "matched": []},
        "experience": {"score": 0, "max": weights.get("experience", 30), "years": 0},
        "education": {"score": 0, "max": weights.get("education", 20)},
        "other": {"score": 0, "max": weights.get("other", 20)},
    }
    evidence = {
        "error": error,
        "matched_skills": [],
        "missing_skills": job.required_skills or [],
        "experience_years": 0,
        "min_required_experience": job.min_experience_years,
        "education_requirements": job.education_requirements or [],
        "certifications": [],
        "screening_failed": True,
    }
    result = ScreeningResult(
        application_id=application_id,
        total_score=0,
        breakdown=breakdown,
        evidence=evidence,
    )
    db.add(result)
    db.flush()
    return result


def screen_application(
    db: Session,
    *,
    application_id: uuid.UUID,
    job: Job,
    extracted_data: dict,
) -> ScreeningResult:
    """Return the existing screening result, or compute one from stored data.

    This is the backfill / recompute entry point: it checks the ``rcg`` guard
    (an ``HRDecision`` exists → raises ``ScreeningError``), then reconstructs a
    ``CandidateProfileExtracted`` from the stored JSON and runs the
    deterministic engine.
    """
    existing = screening_repository.get_by_application(db, application_id)
    if existing is not None:
        return existing

    profile = CandidateProfileExtracted.model_validate(extracted_data)
    screening_result = run_deterministic_screening(
        db,
        application_id=application_id,
        job=job,
        profile=profile,
    )

    advice = run_ai_advisor(
        job=job,
        profile=profile,
    )
    screening_result.ai_advice = advice
    db.flush()

    return screening_result


def _matches_any_education(
    education_list: list,
    requirements: list[str],
) -> bool:
    if not requirements:
        return True
    requirement_lower = [r.strip().lower() for r in requirements if r.strip()]
    if not requirement_lower:
        return True

    for edu in education_list:
        if isinstance(edu, dict):
            degree = str(edu.get("degree") or "")
            field = str(edu.get("field") or "")
            inst = str(edu.get("institution") or "")
        else:
            degree = str(getattr(edu, "degree", "") or "")
            field = str(getattr(edu, "field", "") or "")
            inst = str(getattr(edu, "institution", "") or "")

        full_text = f"{degree} {field} {inst}".lower()
        if not full_text.strip():
            continue

        for req in requirement_lower:
            if req in full_text:
                return True
            # Common degree equivalencies
            bachelor_terms = ("bachelor", "bachelor's", "s1", "sarjana", "undergraduate")
            bachelor_aliases = (
                "bachelor", "s1", "sarjana", "b.sc", "b.s.", "b.tech", "s.kom", "s.t.",
                "undergraduate",
            )
            if any(term in req for term in bachelor_terms):
                if any(term in full_text for term in bachelor_aliases):
                    return True

            master_terms = ("master", "master's", "s2", "magister", "postgraduate")
            master_aliases = (
                "master", "s2", "magister", "m.sc", "m.s.", "postgraduate", "m.kom",
            )
            if any(term in req for term in master_terms):
                if any(term in full_text for term in master_aliases):
                    return True

            if any(term in req for term in ("diploma", "d3", "associate")):
                if any(term in full_text for term in ("diploma", "d3", "associate", "a.md")):
                    return True

    return False


