from storage3.utils import StorageException
from supabase import create_client

from app.core.config import settings


def get_storage_client():
    client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
    )
    return client


def ensure_candidate_cvs_bucket() -> str:
    client = get_storage_client()
    bucket_name = settings.SUPABASE_STORAGE_BUCKET

    try:
        client.storage.get_bucket(bucket_name)
        return bucket_name
    except StorageException as exc:
        if not _is_missing_bucket(exc):
            raise
    client.storage.create_bucket(
        id=bucket_name,
        options={"public": False},
    )
    return bucket_name


def _is_missing_bucket(exc: Exception) -> bool:
    for arg in exc.args:
        status = getattr(arg, "status", None)
        message = str(arg).lower()
        if status == 404 or "bucket not found" in message or "not found" in message:
            return True
    if "bucket not found" in str(exc).lower() or "not found" in str(exc).lower():
        return True
    return False


SUPABASE_URL = settings.SUPABASE_URL


def upload_cv_bytes(path: str, data: bytes) -> None:
    client = get_storage_client()
    client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).upload(
        path,
        data,
        {"content-type": "application/pdf", "upsert": False},
    )


def get_public_url(path: str) -> str:
    base = f"{SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_STORAGE_BUCKET}/{path}"
    return base


def get_authenticated_url(path: str) -> str:
    client = get_storage_client()
    return client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(path)
