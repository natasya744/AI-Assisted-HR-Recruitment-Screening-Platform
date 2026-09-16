import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.core.security import get_current_hr_user
from app.db.session import get_db
from app.services import export_service

router = APIRouter(
    prefix="/api/exports", tags=["exports"],
    dependencies=[Depends(get_current_hr_user)],
)

DbSession = Annotated[Session, Depends(get_db)]

XLSX_MEDIA_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


@router.get("/applications")
def export_applications(
    db: DbSession,
    job_id: uuid.UUID | None = None,
    status: str | None = None,
    min_score: int | None = None,
    applied_at_date: str | None = None,
    limit: int = 100,
) -> Response:
    content = export_service.build_applications_workbook(
        db,
        job_id=job_id,
        status=status,
        min_score=min_score,
        applied_at_date=applied_at_date,
        limit=limit,
    )
    return Response(
        content=content,
        media_type=XLSX_MEDIA_TYPE,
        headers={
            "Content-Disposition": 'attachment; filename="applications.xlsx"',
        },
    )