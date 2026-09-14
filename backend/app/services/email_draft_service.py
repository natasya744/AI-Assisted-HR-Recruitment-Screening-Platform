import uuid

from sqlalchemy.orm import Session

from app.providers.email_draft import generate_email_draft as provider_generate
from app.repositories import application_repository, screening_repository


class EmailDraftError(Exception):
    pass


class EmailDraftRead:
    def __init__(
        self,
        *,
        email_subject: str,
        email_body: str,
    ) -> None:
        self.email_subject = email_subject
        self.email_body = email_body


def generate_email_draft(
    db: Session,
    application_id: uuid.UUID,
) -> EmailDraftRead:
    application = application_repository.get(db, application_id)
    if application is None:
        raise EmailDraftError("Application not found")

    screening = screening_repository.get_by_application(db, application_id)
    if screening is None:
        raise EmailDraftError(
            "No screening result found for this application. "
            "Please ensure the candidate has been screened first."
        )

    row = application_repository.get_with_job_and_candidate(db, application_id)
    if row is None:
        raise EmailDraftError("Application data not found")
    _application, job, candidate = row

    ai_advice = screening.ai_advice or {}
    classification = ai_advice.get("overall_classification", "INSUFFICIENT_INFORMATION")
    concise_summary = ai_advice.get("concise_summary")
    hr_advice = ai_advice.get("hr_advice")

    result = provider_generate(
        candidate_name=candidate.full_name,
        job_title=job.title,
        classification=classification,
        concise_summary=concise_summary,
        hr_advice=hr_advice,
    )

    if not result.success or result.draft is None:
        raise EmailDraftError(result.error or "Failed to generate email draft")

    return EmailDraftRead(
        email_subject=result.draft.email_subject,
        email_body=result.draft.email_body,
    )