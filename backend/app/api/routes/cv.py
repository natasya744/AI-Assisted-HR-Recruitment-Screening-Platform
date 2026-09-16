import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_hr_user
from app.db.session import get_db
from app.repositories import application_repository
from app.services.storage_service import get_storage_client

router = APIRouter(prefix="/api/cv", tags=["cv"], dependencies=[Depends(get_current_hr_user)])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("/{application_id}")
def get_cv(application_id: uuid.UUID, db: DbSession) -> Response:
    application = application_repository.get(db, application_id)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    if not application.cv_storage_path:
        raise HTTPException(status_code=404, detail="No CV file for this application")

    client = get_storage_client()
    try:
        data = client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).download(
            application.cv_storage_path
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve CV from storage: {exc}",
        ) from exc

    filename = application.cv_storage_path.split("/")[-1]
    return Response(
        content=data,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
        },
    )