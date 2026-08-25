# Backend agent instructions

Read [../AGENTS.md](../AGENTS.md) first. The root file contains the project-wide product boundaries, dependency policy, teaching rules, and verification policy. This file adds backend-specific conventions.

## Stack

- Python 3.12+
- FastAPI + uvicorn
- Pydantic v2 + pydantic-settings
- httpx for outbound HTTP
- pytest for tests
- Supabase Python client (DB + auth)
- SQLAlchemy models + Alembic migrations for database schema changes
- OpenAI SDK for LLM
- structlog for logging
- uv for dependency + project management

The stack is locked unless Dave explicitly approves a change.

## Layout

The starter branch intentionally contains only `app/.gitkeep`. Create the implementation during the build using these boundaries:

#  Core Python Modules

The backend should be organized into clear modules.

Recommended:

    app/
    ├── main.py
    │
    ├── api/
    │   ├── routes/
    │   │   ├── applications.py
    │   │   ├── candidates.py
    │   │   ├── screening.py
    │   │   ├── hr.py
    │   │   └── exports.py
    │   │
    │   └── dependencies.py
    │
    ├── core/
    │   ├── config.py
    │   ├── security.py
    │   └── logging.py
    │
    ├── models/
    │   ├── candidate.py
    │   ├── application.py
    │   ├── job.py
    │   ├── candidate_profile.py
    │   ├── screening.py
    │   ├── hr_decision.py
    │   └── audit_log.py
    │
    ├── schemas/
    │   ├── candidate.py
    │   ├── application.py
    │   ├── job.py
    │   ├── screening.py
    │   └── hr_decision.py
    │
    ├── services/
    │   ├── application_service.py
    │   ├── document_service.py
    │   ├── screening_service.py
    │   ├── hr_service.py
    │   ├── email_service.py
    │   ├── export_service.py
    │   └── audit_service.py
    │
    ├── ai/
    │   ├── agents/
    │   │   └── resume_extraction.py
    │   │
    │   ├── prompts/
    │   │   └── resume_extraction.py
    │   │
    │   └── schemas/
    │       └── candidate_profile.py
    │
    ├── repositories/
    │   ├── candidate_repository.py
    │   ├── application_repository.py
    │   ├── screening_repository.py
    │   └── audit_repository.py
    │
    └── db/
        ├── session.py
        └── base.py

Do not create empty architectural layers before the tutorial reaches them.

## Boundaries and code style

- Routes own HTTP parsing, response models, and status-code translation.
- Services orchestrate the user workflow and depend on explicit interfaces.
- Repositories own SQLAlchemy and SQLite access.
- Provider adapters are the only modules allowed to expose third-party SDK types.
- Deterministic validation and reconciliation remain separate from AI extraction or generation.
- Keep public functions typed and modules focused. Prefer dataclasses, enums, `pathlib`, and other standard-library capabilities over helper packages.
- Validate files, HTTP input, provider output, and database writes at their boundaries. Do not repeatedly validate trusted internal calls.

# Backend Testing

Use:

    pytest

Recommended categories:

    tests/
    ├── unit/
    ├── integration/
    ├── e2e/
    └── ai_evaluation/

## Configuration

- `app/config.py` is the only backend configuration boundary.
- Provider endpoints, deployments, and credentials are read through its Pydantic `Settings` model.
- Fixed tutorial policy belongs in its immutable application configuration, not environment variables.
- Never call `os.getenv`, read `os.environ`, or call `load_dotenv` in application modules or scripts.
- Fail clearly when required provider configuration is absent. Do not hide configuration failures behind silent fallbacks.
- Never commit `.env`, or any keys, uploaded documents, SQLite databases, or generated runtime data.

## Dependencies

- Never add a dependency without Tasya's explicit approval.
- Use exact direct versions and commit `uv.lock` with every approved dependency change.
- Keep `add-bounds = "exact"` and `exclude-newer = "7 days"` under `[tool.uv]`.
- Install with `uv sync --locked`.
- Commands that must use the existing environment run through `uv run --locked --no-sync`.
- Prefer a small local function when a dependency would only replace a few clear standard-library lines.

## Verification

The starter has no backend implementation. Verify it only with:

```bash
uv sync --locked
```

As implementation is added, keep the documented backend check green:

```bash
uv run --locked --no-sync ruff check app scripts
```

# Responsibility of Each Module

## `api/`

Handles HTTP.

Responsibilities:

- Request parsing
- Authentication
- Authorization
- Calling services
- Returning responses

Routes should be thin.

Bad:

```python
@app.post("/applications")
def create_application():
    # database logic
    # AI logic
    # screening logic
    # email logic
