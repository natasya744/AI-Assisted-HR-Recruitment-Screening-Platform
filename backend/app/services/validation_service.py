"""3-layer validation pipeline for AI-extracted candidate profiles.

Defends against hallucinated or malformed model output before anything is
persisted:

  1. Business-bounds validation — impossible/implausible values are flagged.
  2. Deterministic merge — missing fields are filled with derived values and
     every field receives a provenance tag (``ai`` / ``deterministic`` /
     ``manual`` / ``missing``).
  3. Alignment check — extracted identity fields are compared against the
     form-submitted ground truth. Mismatches are surfaced to HR, never
     auto-corrected.
"""

import re
from datetime import date
from typing import Any

from app.ai.schemas.candidate_profile import CandidateProfileExtracted, WorkExperienceEntry


def validate_business_bounds(profile: CandidateProfileExtracted) -> list[str]:
    """Return human-readable warnings for impossible or suspicious values.

    The profile is never mutated here; use ``deterministic_merge`` to repair
    structural gaps.
    """
    warnings: list[str] = []

    if profile.total_experience_years is not None:
        if profile.total_experience_years < 0:
            warnings.append("total_experience_years is negative")
        elif profile.total_experience_years > 50:
            warnings.append("total_experience_years exceeds 50 – possible parsing error")

    if not profile.full_name:
        warnings.append("full_name is empty or missing")

    if profile.email and "@" not in profile.email:
        warnings.append("email appears invalid (missing @)")

    if profile.skills:
        empty_skills = [s for s in profile.skills if not s.strip() or len(s.strip()) < 2]
        if empty_skills:
            warnings.append(f"skills list contains {len(empty_skills)} ambiguous entries")

    for i, exp in enumerate(profile.work_experience or []):
        if exp.title and not exp.company:
            warnings.append(f"work_experience[{i}] ('{exp.title}') has no company")
        if exp.company and not exp.title:
            warnings.append(f"work_experience[{i}] ('{exp.company}') has no title")

    for i, edu in enumerate(profile.education or []):
        if edu.degree and not edu.institution:
            warnings.append(f"education[{i}] ('{edu.degree}') has no institution")

    return warnings


def deterministic_merge(
    profile: CandidateProfileExtracted,
) -> tuple[CandidateProfileExtracted, dict[str, str]]:
    """Fill missing fields via deterministic rules and tag every field.

    Returns ``(mutated profile, field_provenance)`` where each field maps to
    one of ``ai`` / ``deterministic`` / ``missing``.
    """
    provenance: dict[str, str] = {}

    for identity_field in (
        "full_name",
        "email",
        "phone",
        "location",
        "linkedin_url",
        "professional_summary",
    ):
        val = getattr(profile, identity_field, None)
        provenance[identity_field] = "ai" if val is not None else "missing"

    if profile.skills:
        cleaned = sorted({s.strip() for s in profile.skills if s.strip() and len(s.strip()) >= 2})
        profile.skills = cleaned
        provenance["skills"] = "ai"
    else:
        provenance["skills"] = "missing"

    if profile.total_experience_years is not None and profile.total_experience_years > 0:
        provenance["total_experience_years"] = "ai"
    else:
        yrs = _estimate_total_years(profile.work_experience)
        if yrs is not None and yrs > 0:
            profile.total_experience_years = yrs
            provenance["total_experience_years"] = "deterministic"
        elif profile.total_experience_years is not None:
            provenance["total_experience_years"] = "ai"
        else:
            provenance["total_experience_years"] = "missing"

    if profile.work_experience:
        has_dates = any(
            bool(exp.start_date and exp.start_date.strip())
            or bool(exp.end_date and exp.end_date.strip())
            for exp in profile.work_experience
        )
        provenance["work_experience"] = "ai" if has_dates else "ai_approximate"
    else:
        provenance["work_experience"] = "missing"

    if profile.education:
        provenance["education"] = "ai"
    else:
        provenance["education"] = "missing"

    if profile.certifications:
        provenance["certifications"] = "ai"
    else:
        provenance["certifications"] = "missing"

    if profile.languages:
        provenance["languages"] = "ai"
    else:
        provenance["languages"] = "missing"

    return profile, provenance


def check_profile_alignment(
    form_data: dict[str, Any],
    profile: CandidateProfileExtracted,
) -> dict[str, Any]:
    """Compare form ground truth against the extracted PDF profile.

    Mismatches are flagged for HR inspection; values are never overwritten.
    Per-field status is one of: MATCH, MISMATCH, MISSING_IN_FORM,
    MISSING_IN_PDF, EMPTY.
    """
    fields_to_check = ["full_name", "email", "phone", "location", "linkedin_url"]
    field_results: dict[str, dict[str, Any]] = {}
    mismatches = 0

    for field in fields_to_check:
        form_val = str(form_data.get(field) or "").strip().lower()
        pdf_val = str(getattr(profile, field, None) or "").strip().lower()

        if not form_val and not pdf_val:
            status = "EMPTY"
        elif not form_val:
            status = "MISSING_IN_FORM"
        elif not pdf_val:
            status = "MISSING_IN_PDF"
        elif form_val == pdf_val or form_val in pdf_val or pdf_val in form_val:
            status = "MATCH"
        else:
            status = "MISMATCH"
            mismatches += 1

        field_results[field] = {
            "status": status,
            "form_value": form_data.get(field),
            "pdf_value": getattr(profile, field, None),
        }

    return {
        "fields": field_results,
        "has_mismatch": mismatches > 0,
        "mismatch_count": mismatches,
    }


def run_validation_pipeline(
    profile: CandidateProfileExtracted,
    form_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run the full validation pipeline.

    1. Business-bounds validation
    2. Deterministic merge with field-level provenance
    3. Alignment check (identity fields vs form ground truth)

    Returns a dict shaped for persistence into ``candidate_profiles_pdf``.
    """
    warnings = validate_business_bounds(profile)

    validated_profile, field_provenance = deterministic_merge(profile)

    alignment = None
    if form_data is not None:
        alignment = check_profile_alignment(form_data, validated_profile)

    return {
        "profile": validated_profile,
        "field_provenance": field_provenance,
        "business_warnings": warnings,
        "alignment_check": alignment,
    }


def _parse_year_month(date_str: str | None) -> tuple[int, int] | None:
    if not date_str:
        return None
    cleaned = date_str.strip().lower()
    if cleaned in ("present", "now", "current", "ongoing", "sekarang"):
        today = date.today()
        return (today.year, today.month)

    year_match = re.search(r"\b(19\d\d|20\d\d)\b", date_str)
    if not year_match:
        return None
    year = int(year_match.group(1))

    month = 1
    num_match = re.search(r"\b(0?[1-9]|1[0-2])[\/\-](19\d\d|20\d\d)\b", date_str)
    if num_match:
        month = int(num_match.group(1))
    else:
        num_match2 = re.search(r"\b(19\d\d|20\d\d)[\/\-](0?[1-9]|1[0-2])\b", date_str)
        if num_match2:
            month = int(num_match2.group(2))
        else:
            month_map = {
                "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "mei": 5,
                "jun": 6, "jul": 7, "aug": 8, "agu": 8, "sep": 9, "oct": 10,
                "okt": 10, "nov": 11, "dec": 12, "des": 12,
            }
            for prefix, m_val in month_map.items():
                if prefix in cleaned:
                    month = m_val
                    break
    return (year, month)


def _estimate_total_years(work_experience: list[WorkExperienceEntry]) -> int | None:
    """Best-effort estimate of total experience years from date ranges."""
    total_months = 0
    has_any_date = False

    for exp in work_experience or []:
        start_parsed = _parse_year_month(exp.start_date)
        end_parsed = _parse_year_month(exp.end_date)

        if not start_parsed and not end_parsed:
            continue

        if start_parsed and end_parsed:
            has_any_date = True
            start_y, start_m = start_parsed
            end_y, end_m = end_parsed
            months = (end_y - start_y) * 12 + (end_m - start_m)
            total_months += max(1, months)
        elif start_parsed:
            has_any_date = True
            total_months += 12

    if not has_any_date or total_months <= 0:
        return None

    return max(1, round(total_months / 12))