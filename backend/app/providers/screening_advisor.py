import instructor

from app.ai.prompts.screening_advisor import (
    SCREENING_ADVISOR_SYSTEM_PROMPT,
    SCREENING_ADVISOR_USER_PROMPT,
)
from app.ai.schemas.ai_advice import AdvisorOutput
from app.core.config import settings

_client = instructor.from_provider(
    f"openai/{settings.OPENAI_CHAT_MODEL}",
    api_key=settings.OPENAI_API_KEY,
)


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
    user_prompt = SCREENING_ADVISOR_USER_PROMPT.format(
        job_title=job_title,
        job_description=job_description,
        candidate_profile=candidate_profile,
    )

    try:
        advice = _client.create(
            response_model=AdvisorOutput,
            messages=[
                {"role": "system", "content": SCREENING_ADVISOR_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=1,
        )
    except Exception as exc:
        return ScreeningAdviceResult(advice=None, success=False, error=str(exc))

    if advice is None:
        return ScreeningAdviceResult(
            advice=None, success=False, error="empty response from model"
        )

    return ScreeningAdviceResult(advice=advice, success=True)
