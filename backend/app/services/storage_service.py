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

    existing = client.storage.get_bucket(bucket_name)
    if existing:
        return bucket_name

    client.storage.create_bucket(
        id=bucket_name,
        options={"public": False},
    )
    return bucket_name


SUPABASE_URL = settings.SUPABASE_URL


def get_public_url(path: str) -> str:
    base = f"{SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_STORAGE_BUCKET}/{path}"
    return base


def get_authenticated_url(path: str) -> str:
    client = get_storage_client()
    return client.storage.from_(settings.SUPABASE_STORAGE_BUCKET).get_public_url(path)
