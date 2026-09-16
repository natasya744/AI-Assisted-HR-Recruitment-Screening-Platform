from fastapi import APIRouter, Depends

from app.core.security import get_current_hr_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me")
def get_current_user(
    email: str = Depends(get_current_hr_user),
):
    return {"email": email}