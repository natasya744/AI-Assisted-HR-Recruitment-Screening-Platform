"""AI screening advisor provider adapter for playground.

Invokes app.providers.screening_advisor.get_screening_advice().
Evaluates job requirements with strict evidence-based classifications
(YES, NO, PARTIAL_MATCH, NOT_FOUND).
"""

from __future__ import annotations

from typing import Any

from app.ai.schemas.candidate_profile import CandidateProfileExtracted
from app.providers.screening_advisor import get_screening_advice
from playground.data.fixtures import FIXTURE_SCREENING_ADVICE


def get_screening_advice_dossier(
    job: dict[str, Any],
    profile: CandidateProfileExtracted,
    *,
    force_mock: bool = False,
) -> dict[str, Any]:
    """Obtain AI qualification advice assessing the profile against the job.

    Args:
        job: Dictionary with title, description, and requirement fields.
        profile: Extracted candidate profile instance.
        force_mock: If True, bypasses OpenAI and uses validated fixture.

    Returns:
        Structured advisor dictionary matching AdvisorOutput schema.
    """
    print("💡 [AdvisorProvider] Calling screening advisor...")

    job_title = job.get("title", "")
    job_desc = job.get("description") or (
        f"Required skills: {', '.join(job.get('required_skills', []))}\n"
        f"Min experience: {job.get('min_experience_years', 0)} years\n"
        f"Education: {', '.join(job.get('education_requirements', []))}"
    )
    profile_json = profile.model_dump_json(indent=2, exclude_none=True)

    if not force_mock:
        res = get_screening_advice(
            job_title=job_title,
            job_description=job_desc,
            candidate_profile=profile_json,
        )
        if res.success and res.advice:
            print("   ✅ Live screening advice received successfully!")
            return res.advice.model_dump()
        else:
            print(f"   ⚠️ Live advisor unavailable ({res.error}).")
            print("   🔁 Falling back to verified test fixture...")

    return FIXTURE_SCREENING_ADVICE.model_dump()
