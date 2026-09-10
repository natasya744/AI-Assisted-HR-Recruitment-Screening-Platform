import io
import uuid
from datetime import datetime, timedelta

from openpyxl import Workbook
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Application, Candidate, HRDecision, Job, ScreeningResult
from app.services.screening_service import assess_qualification


def build_applications_workbook(
    db: Session,
    *,
    job_id: uuid.UUID | None = None,
    status: str | None = None,
    min_score: int | None = None,
    applied_at_date: str | None = None,
    limit: int = 100,
) -> bytes:
    stmt = (
        select(Application, Job, Candidate, ScreeningResult, HRDecision)
        .join(Job, Application.job_id == Job.id)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .outerjoin(ScreeningResult, ScreeningResult.application_id == Application.id)
        .outerjoin(HRDecision, HRDecision.application_id == Application.id)
        .order_by(Application.applied_at.desc())
        .limit(limit)
    )
    if applied_at_date is not None:
        dt = datetime.strptime(applied_at_date, "%Y-%m-%d")
        stmt = stmt.where(
            Application.applied_at >= dt,
            Application.applied_at < dt + timedelta(days=1),
        )
    rows = list(db.execute(stmt).all())

    wb = Workbook()
    ws = wb.active
    ws.title = "Applications"

    columns = [
        "Candidate Name", "Email", "Position", "Applied At",
        "Screening Score", "Max Score", "Screening Decision",
        "HR Decision", "Decision At",
    ]
    ws.append(columns)

    for application, job, candidate, screening, hr_decision in rows:
        if job_id is not None and application.job_id != job_id:
            continue
        if status is not None and application.status != status:
            continue

        total_score = screening.total_score if screening is not None else None
        max_score = None
        classification = None
        if screening is not None:
            verdict = assess_qualification(screening.total_score, job.score_weights)
            max_score = verdict["max_score"]
            classification = verdict["classification"]
            if min_score is not None and screening.total_score < min_score:
                continue

        ws.append([
            candidate.full_name,
            candidate.email,
            job.title,
            _fmt_dt(application.applied_at),
            total_score,
            max_score,
            classification,
            hr_decision.decision if hr_decision is not None else None,
            _fmt_dt(hr_decision.decided_at) if hr_decision is not None else None,
        ])

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def _fmt_dt(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.isoformat()