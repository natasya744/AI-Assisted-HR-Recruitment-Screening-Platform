# Build-Along Teaching Guide — AI-Assisted HR Recruitment Screening Platform

This guide documents every completed slice, explaining what was built, why, exact commands, observable results, and checkpoints.

---

## Phase 0 — Project Foundation

### Slice 0.1: Project Directory Restructuring
- **Outcome**: Established canonical lowercase folder naming (`backend/`, `frontend/`, `docs/`) and cleaned up document filenames (`docs/architecture.md`).
- **Why**: Eliminates cross-platform case-sensitivity issues and keeps directory references aligned with `AGENTS.md`.

### Slice 0.2: Backend Application Skeleton & Configuration
- **Outcome**: Created the core FastAPI backend skeleton:
  - [`backend/app/core/config.py`](../backend/app/core/config.py): Pydantic Settings model reading environment variables (`.env`). Acts as the single configuration boundary.
  - [`backend/app/main.py`](../backend/app/main.py): FastAPI app with CORS middleware, health check endpoint (`GET /health`), and root info (`GET /`).
  - [`backend/app/db/base.py`](../backend/app/db/base.py): SQLAlchemy 2.0 `DeclarativeBase`.
  - [`backend/app/db/session.py`](../backend/app/db/session.py): Database engine, sessionmaker, and `get_db()` dependency generator.
- **Why**: Enforces boundary separation where configuration is strictly accessed via `config.py` and database sessions are managed cleanly per request.
- **Exact Commands to Run**:
  ```bash
  cd backend
  uv run uvicorn app.main:app --reload
  ```
- **Observable Result**:
  Visiting `http://localhost:8000/health` returns:
  ```json
  {
    "status": "ok",
    "app": "AI-Assisted HR Recruitment Screening Platform",
    "environment": "development"
  }
  ```
- **Checkpoint**: Backend skeleton is established with clean imports and strict configuration boundaries.
