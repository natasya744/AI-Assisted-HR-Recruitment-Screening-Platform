from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Supabase ---
    SUPABASE_URL: str = "https://your-project-ref.supabase.co"
    SUPABASE_ANON_KEY: str = "your-anon-public-key"
    SUPABASE_SERVICE_ROLE_KEY: str = "your-service-role-secret-key"
    SUPABASE_STORAGE_BUCKET: str = "candidate-cvs"

    # --- Postgres ---
    DATABASE_URL: str = "postgresql+psycopg://postgres:password@db.your-project-ref.supabase.co:5432/postgres"

    # --- OpenAI ---
    OPENAI_API_KEY: str = "sk-your-openai-api-key"
    OPENAI_CHAT_MODEL: str = "gpt-5-mini"

    # --- Email ---
    EMAIL_TRANSPORT: str = "file"
    EMAIL_OUT_DIR: str = "./data/outbound-emails"

    # --- Server ---
    ALLOWED_ORIGINS: str = "http://localhost:5174"


settings = Settings()