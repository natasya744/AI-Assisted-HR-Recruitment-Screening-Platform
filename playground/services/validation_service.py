"""Validation pipeline for playground — Phase 4.3.

Provides:
  1. Business-bounds validation (impossible/outlier values flagged as warnings).
  2. Deterministic merge — fills missing AI fields with derived values,
     producing field-level provenance tags.
  3. Alignment check (delegates to alignment_service for identity fields).

Provenance tags per field: ai, deterministic, manual, or missing.
"""

from __future__ import annotations

from datetime import date
from typing import Any

from app.ai.schemas.candidate_profile import CandidateProfileExtracted, WorkExperienceEntry
from playground.services.alignment_service import check_profile_alignment


def validate_business_bounds(
    profile: CandidateProfileExtracted,
) -> list[str]:
    """Check extracted data for impossible or suspicious values.

    Returns a list of human-readable warnings.  Does NOT mutate the profile
    (use *deterministic_merge* to fix structural issues).
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
            warnings.append(
                f"work_experience[{i}] ('{exp.title}') has no company"
            )
        if exp.company and not exp.title:
            warnings.append(
                f"work_experience[{i}] ('{exp.company}') has no title"
            )

    for i, edu in enumerate(profile.education or []):
        if edu.degree and not edu.institution:
            warnings.append(
                f"education[{i}] ('{edu.degree}') has no institution"
            )

    return warnings


def deterministic_merge(
    profile: CandidateProfileExtracted,
) -> tuple[CandidateProfileExtracted, dict[str, str]]:
    """Fill missing fields via deterministic rules; produce field-level provenance.

    Each field receives one of: ``ai``, ``deterministic``, or ``missing``.

    Returns (mutated profile, field_provenance_dict).
    """
    provenance: dict[str, str] = {}

    # --- Identity fields ---------------------------------------------------
    for identity_field in ("full_name", "email", "phone", "location",
                           "linkedin_url", "professional_summary"):
        val = getattr(profile, identity_field, None)
        provenance[identity_field] = "ai" if val is not None else "missing"

    # --- Skills ------------------------------------------------------------
    if profile.skills:
        cleaned = sorted({s.strip() for s in profile.skills if s.strip() and len(s.strip()) >= 2})
        profile.skills = cleaned
        provenance["skills"] = "ai"
    else:
        provenance["skills"] = "missing"

    # --- Total experience years --------------------------------------------
    if profile.total_experience_years is not None:
        provenance["total_experience_years"] = "ai"
    else:
        yrs = _estimate_total_years(profile.work_experience)
        if yrs is not None:
            profile.total_experience_years = yrs
            provenance["total_experience_years"] = "deterministic"
        else:
            provenance["total_experience_years"] = "missing"

    # --- Work experience ---------------------------------------------------
    if profile.work_experience:
        has_dates = any(
            bool(exp.start_date and exp.start_date.strip())
            or bool(exp.end_date and exp.end_date.strip())
            for exp in profile.work_experience
        )
        provenance["work_experience"] = "ai" if has_dates else "ai_approximate"
    else:
        provenance["work_experience"] = "missing"

    # --- Education ---------------------------------------------------------
    if profile.education:
        provenance["education"] = "ai"
    else:
        provenance["education"] = "missing"

    # --- Certifications ----------------------------------------------------
    if profile.certifications:
        provenance["certifications"] = "ai"
    else:
        provenance["certifications"] = "missing"

    # --- Languages ---------------------------------------------------------
    if profile.languages:
        provenance["languages"] = "ai"
    else:
        provenance["languages"] = "missing"

    return profile, provenance


def run_validation_pipeline(
    profile: CandidateProfileExtracted,
    extraction_provenance: dict[str, str] | None = None,
    form_data: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run the full Phase 4.3 validation pipeline.

    1. Business-bounds validation
    2. Deterministic merge with field-level provenance
    3. Alignment check (identity fields vs form ground truth)

    Returns a result dict matching the ``candidate_profiles_pdf`` model shape.
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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _estimate_total_years(work_experience: list[WorkExperienceEntry]) -> int | None:
    """Best-effort estimate of total experience years from date ranges.

    Returns ``None`` if no date info is available to derive a value.
    """
    total_months = 0
    has_any_date = False

    for exp in work_experience:
        start = (exp.start_date or "").strip()
        end = (exp.end_date or "").strip()
        if not start and not end:
            continue

        try:
            start_year = int(start[:4])
        except (ValueError, IndexError):
            continue

        has_any_date = True
        if end.lower() == "present":
            end_year = date.today().year
        else:
            try:
                end_year = int(end[:4])
            except (ValueError, IndexError):
                end_year = start_year

        total_months += max(0, (end_year - start_year) * 12)

    if not has_any_date or total_months <= 0:
        return None

    return max(1, round(total_months / 12))