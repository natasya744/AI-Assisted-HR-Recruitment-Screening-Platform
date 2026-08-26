# Backend setup

This project uses a separate Python + FastAPI backend because the server is responsible for AI extraction, document processing, deterministic screening, and data access. Keeping this logic behind a dedicated API keeps the frontend focused on the user experience while the backend owns orchestration, grounding, and persistence.

## Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (dependency + environment manager)
- A Supabase project (see [supabase-setup.md](supabase-setup.md)) with `.env` configured (see below)

## Dependencies

All dependencies are pinned **exactly** in `backend/pyproject.toml` and committed in `backend/uv.lock`.

Current direct dependencies:

- `fastapi` — HTTP framework
- `uvicorn` — ASGI server
- `pydantic` + `pydantic-settings` — validation + config boundary
- `sqlalchemy` — ORM/DB access
- `python-multipart` — file upload parsing
- `openai` — CV extraction (isolated behind adapter boundaries in `app/providers/`)
- `ruff` (dev) — linting

Planned additions, added with permission at the slice that needs them:

- `alembic` — DB migrations (Phase 2)
- Supabase Python client — Storage upload/download (Phase 3)
- PDF text extraction (`pypdf` candidate) — Phase 4
- `openpyxl` — Excel export (Phase 8, **already approved**, pin `openpyxl==3.1.5`)
- `structlog` — structured logging
- `httpx` — outbound HTTP for email transport

**No pydantic-ai, no pgvector, no embedding models.** This is a document-scoring platform, not a vector/RAG app. Do not add a dependency from the guides unless it is listed above and approved.

### Adding a dependency

```bash
cd backend
uv add "<package>==<exact.version>"
uv sync --locked
```

Commit `uv.lock` with every dependency change. Keep `add-bounds = "exact"` and `exclude-newer = "7 days"` under `[tool.uv]`.

## Environment configuration

Copy the template and fill in real values (never commit `.env`):

```bash
cp .env.example .env
```

See [how to configure keys](backend-setup.md#environment-keys) for where each value comes from.

## Database migrations

Alembic owns all schema changes against Supabase Postgres. SQLAlchemy models describe the app tables; Alembic applies them.

Initialize Alembic once from `backend/`:

```bash
uv run alembic init alembic
```

Configure `alembic/env.py` to import the app metadata and read the **direct** connection URL from `app.config.settings`. Use the direct/session connection (host `db.<ref>.supabase.co`), not the transaction pooler, for migrations.

After changing SQLAlchemy models:

```bash
uv run alembic revision --autogenerate -m "add screening tables"
uv run alembic upgrade head
```

Always review generated migrations before applying.

## Run

```bash
cd backend
uv sync --locked
uv run alembic upgrade head
uv run uvicorn app.main:app --reload
```

`backend/app` is installed as an editable package by `uv sync`, so `from app... import ...` works from uvicorn, scripts, and Jupyter kernels using the backend venv.

## Verify

```bash
uv run --locked --no-sync ruff check app scripts
```

## Environment keys

| Key | Where to get it | Used for |
|---|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Supabase client (Storage + auth) |
| `SUPABASE_ANON_KEY` | Same page → `anon` public key | Supabase client init |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` secret key | Server-only Storage access — never in the frontend |
| `DATABASE_URL` | Project Settings → Database → **direct** connection string | SQLAlchemy runtime + Alembic |
| `OPENAI_API_KEY` | platform.openai.com → API keys | CV extraction |
| `OPENAI_CHAT_MODEL` | Your choice (e.g. `gpt-4o-mini`) | Extraction model |
| `ALLOWED_ORIGINS` | Your frontend URL(s), comma-separated | CORS |
| `EMAIL_TRANSPORT` / `EMAIL_OUT_DIR` | Local choice | Email transport (Phase 7) |