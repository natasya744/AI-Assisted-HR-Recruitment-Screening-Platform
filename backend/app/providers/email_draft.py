import instructor

from app.ai.prompts.email_draft import (
    EMAIL_DRAFT_SYSTEM_PROMPT,
    EMAIL_DRAFT_USER_PROMPT,
)
from app.ai.schemas.email_draft import EmailDraftOutput
from app.core.config import settings

_client = instructor.from_provider(
    f"openai/{settings.OPENAI_CHAT_MODEL}",
    api_key=settings.OPENAI_API_KEY,
)


class EmailDraftResult:
    def __init__(
        self,
        *,
        draft: EmailDraftOutput | None,
        success: bool,
        error: str | None = None,
    ) -> None:
        self.draft = draft
        self.success = success
        self.error = error


def generate_email_draft(
    candidate_name: str,
    job_title: str,
    classification: str,
    concise_summary: str | None,
    hr_advice: str | None,
) -> EmailDraftResult:
    user_prompt = EMAIL_DRAFT_USER_PROMPT.format(
        candidate_name=candidate_name,
        job_title=job_title,
        classification=classification,
        concise_summary=concise_summary or "No summary available.",
        hr_advice=hr_advice or "No specific advice available.",
    )

    try:
        draft = _client.create(
            response_model=EmailDraftOutput,
            messages=[
                {"role": "system", "content": EMAIL_DRAFT_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=1,
        )
    except Exception as exc:
        return EmailDraftResult(draft=None, success=False, error=str(exc))

    if draft is None:
        return EmailDraftResult(
            draft=None, success=False, error="empty response from model"
        )

    return EmailDraftResult(draft=draft, success=True)