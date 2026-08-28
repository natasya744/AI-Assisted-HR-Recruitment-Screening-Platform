import json

from openai import OpenAI
from pydantic import ValidationError

from app.ai.prompts.resume_extraction import (
    RESUME_EXTRACTION_SYSTEM_PROMPT,
    RESUME_EXTRACTION_USER_PROMPT,
)
from app.ai.schemas.candidate_profile import CandidateProfileExtracted
from app.core.config import settings

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


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
    client = _get_client()
    user_prompt = RESUME_EXTRACTION_USER_PROMPT.format(cv_text=cv_text)

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": RESUME_EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
    except Exception as exc:
        return ExtractionResult(profile=None, success=False, error=str(exc))

    content = response.choices[0].message.content
    if not content:
        return ExtractionResult(profile=None, success=False, error="empty response from model")

    try:
        raw = json.loads(content)
    except json.JSONDecodeError as exc:
        return ExtractionResult(profile=None, success=False, error=f"invalid JSON: {exc}")

    try:
        profile = CandidateProfileExtracted.model_validate(raw)
    except ValidationError as exc:
        return ExtractionResult(
            profile=None, success=False, error=f"schema validation failed: {exc}"
        )

    return ExtractionResult(profile=profile, success=True)
