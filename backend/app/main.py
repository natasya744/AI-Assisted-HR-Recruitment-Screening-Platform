from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for AI-Assisted HR Recruitment Screening Platform",
    version="0.1.0",
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
def health_check() -> dict[str, str]:
    """Health check endpoint for system uptime monitoring and initial connectivity verification."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }


@app.get("/", tags=["System"])
def root() -> dict[str, str]:
    """Root metadata endpoint."""
    return {
        "message": "Welcome to the AI-Assisted HR Recruitment Screening Platform API",
        "docs_url": "/docs",
        "health_url": "/health",
    }
