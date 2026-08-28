from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title="AI-Assisted HR Recruitment Screening Platform",
    version="0.1.0",
)

allowed_origins = [
    origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "app": "AI-Assisted HR Recruitment Screening Platform",
        "environment": "development",
    }


@app.get("/")
def root():
    return {
        "app": app.title,
        "version": app.version,
    }
