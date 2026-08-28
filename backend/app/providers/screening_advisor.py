import json

from openai import OpenAI
from pydantic import ValidationError

from app.ai.prompts.screening_advisor import (
    SCREENING_ADVISOR_SYSTEM_PROMPT,
    SCREENING_ADVISOR_USER_PROMPT,
)
from app.ai.schemas.ai_advice import AdvisorOutput
from app.core.config import settings

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


class ScreeningAdviceResult:
    def __init__(
        self,
        *,
        advice: AdvisorOutput | None,
        success: bool,
        error: str | None = None,
    ) -> None:
        self.advice = advice
        self.success = success
        self.error = error


def get_screening_advice(
    job_title: str,
    job_description: str,
    candidate_profile: str,
) -> ScreeningAdviceResult:
    client = _get_client()
    user_prompt = SCREENING_ADVISOR_USER_PROMPT.format(
        job_title=job_title,
        job_description=job_description,
        candidate_profile=candidate_profile,
    )

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_CHAT_MODEL,
            messages=[
                {"role": "system", "content": SCREENING_ADVISOR_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
    except Exception as exc:
        return ScreeningAdviceResult(advice=None, success=False, error=str(exc))

    content = response.choices[0].message.content
    if not content:
        return ScreeningAdviceResult(
            advice=None, success=False, error="empty response from model"
        )

    try:
        raw = json.loads(content)
    except json.JSONDecodeError as exc:
        return ScreeningAdviceResult(
            advice=None, success=False, error=f"invalid JSON: {exc}"
        )

    try:
        advice = AdvisorOutput.model_validate(raw)
    except ValidationError as exc:
        return ScreeningAdviceResult(
            advice=None, success=False, error=f"schema validation failed: {exc}"
        )

    return ScreeningAdviceResult(advice=advice, success=True)
