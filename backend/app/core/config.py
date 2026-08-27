from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration and environment boundary.

    All environment variables and settings must be accessed strictly
    through this class. Never call os.getenv or load_dotenv outside this module.
    """

    PROJECT_NAME: str = "AI-Assisted HR Recruitment Screening Platform"
    ENVIRONMENT: str = "development"

    # Supabase credentials (for DB & Auth)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Database URL
    DATABASE_URL: str = "sqlite:///./app.db"

    # OpenAI settings
    OPENAI_API_KEY: str = ""
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"

    # Outbound email settings (Phase 7)
    EMAIL_TRANSPORT: str = "file"
    EMAIL_OUT_DIR: str = "./data/outbound-emails"

    # CORS Allowed Origins (comma-separated list of origins)
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:9001,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated allowed origins into a list of cleaned strings."""
        if not self.ALLOWED_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached instance of application settings."""
    return Settings()


settings = get_settings()
