from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the application read from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General App Settings
    APP_NAME: str = "AI-Assisted HR Recruitment Screening Platform"
    APP_ENV: str = "development"
    DEBUG: bool = False

    # CORS Settings
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_CV_BUCKET: str = "candidate-cvs"

    # PostgreSQL Database Connection
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/postgres"

    # OpenAI Configuration
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"


settings = Settings()
