import instructor

from app.ai.prompts.resume_extraction import (
    RESUME_EXTRACTION_SYSTEM_PROMPT,
    RESUME_EXTRACTION_USER_PROMPT,
)
from app.ai.schemas.candidate_profile import CandidateProfileExtracted
from app.core.config import settings

_client = instructor.from_provider(
    f"openai/{settings.OPENAI_CHAT_MODEL}",
    api_key=settings.OPENAI_API_KEY,
)


class ExtractionResult:
    def __init__(
        self,
        *,
        profile: CandidateProfileExtracted | None,
        success: bool,
        error: str | None = None,
    ) -> None:
        self.profile = profile
        self.success = success
        self.error = error


def extract_resume(cv_text: str) -> ExtractionResult:
    user_prompt = RESUME_EXTRACTION_USER_PROMPT.format(cv_text=cv_text)

    try:
        profile = _client.create(
            response_model=CandidateProfileExtracted,
            messages=[
                {"role": "system", "content": RESUME_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=1,
        )
    except Exception as exc:
        return ExtractionResult(profile=None, success=False, error=str(exc))

    if profile is None:
        return ExtractionResult(
            profile=None, success=False, error="empty response from model"
        )

    return ExtractionResult(profile=profile, success=True)
