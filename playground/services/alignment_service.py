"""Anti-hallucination alignment service for playground.

Compares candidate-submitted form ground truth against AI-extracted PDF data.
Per architecture design:
- Mismatches are flagged for HR inspection.
- Values are never silently overwritten or auto-corrected.
- Status is one of: MATCH, MISMATCH, MISSING_IN_FORM, MISSING_IN_PDF, EMPTY.
"""

from __future__ import annotations

from typing import Any

from app.ai.schemas.candidate_profile import CandidateProfileExtracted


def check_profile_alignment(
    form_data: dict[str, Any],
    profile: CandidateProfileExtracted,
) -> dict[str, Any]:
    """Compare Form Ground Truth against Extracted PDF Profile.

    Args:
        form_data: Dictionary of candidate-submitted form fields.
        profile: CandidateProfileExtracted instance from PDF extraction.

    Returns:
        Structured alignment dictionary matching candidate_profiles_pdf.alignment_check.
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
