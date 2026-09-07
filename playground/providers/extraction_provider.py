"""AI resume extraction provider adapter for playground.

Invokes app.providers.resume_extractor.extract_resume().
Maintains strict type boundary: returns CandidateProfileExtracted and field-level provenance.
Includes graceful fallback to verified fixture if OpenAI quota is exhausted or offline.
"""

from __future__ import annotations

from app.ai.schemas.candidate_profile import CandidateProfileExtracted
from app.providers.resume_extractor import extract_resume
from playground.data.fixtures import FIXTURE_EXTRACTED_PROFILE


def extract_profile_with_provenance(
    cv_markdown: str,
    *,
    force_mock: bool = False,
) -> tuple[CandidateProfileExtracted, dict[str, str]]:
    """Extract structured profile from Markdown text with provenance tags.

    Args:
        cv_markdown: Markdown representation of the CV.
        force_mock: If True, bypasses OpenAI and uses validated fixture.

    Returns:
        tuple of (CandidateProfileExtracted, provenance_dict).
    """
    print("🤖 [ExtractionProvider] Calling resume extractor...")

    profile: CandidateProfileExtracted | None = None
    provenance_tag = "ai"

    if not force_mock:
        res = extract_resume(cv_markdown)
        if res.success and res.profile:
            profile = res.profile
            print("   ✅ Extracted successfully via live OpenAI model!")
        else:
            print(f"   ⚠️ Live extraction unavailable ({res.error}).")
            print("   🔁 Falling back to verified test fixture...")
            profile = FIXTURE_EXTRACTED_PROFILE
            provenance_tag = "fixture_ai"
    else:
        print("   ℹ️ Mock mode requested: using verified test fixture.")
        profile = FIXTURE_EXTRACTED_PROFILE
        provenance_tag = "fixture_ai"

    # Build provenance record matching candidate_profiles_pdf.provenance schema
    provenance = {
        "full_name": provenance_tag,
        "email": provenance_tag,
        "phone": provenance_tag,
        "location": provenance_tag,
        "linkedin_url": provenance_tag,
        "professional_summary": provenance_tag,
        "skills": provenance_tag,
        "total_experience_years": provenance_tag,
        "work_experience": provenance_tag,
        "education": provenance_tag,
        "certifications": provenance_tag,
        "languages": provenance_tag,
    }

    return profile, provenance
