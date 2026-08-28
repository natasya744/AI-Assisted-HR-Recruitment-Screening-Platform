# HR Screening Backend

FastAPI application for AI-Assisted HR Recruitment Screening Platform.

## Quick Start

```bash
# Install dependencies (locked versions)
uv sync --locked

# Run development server (port 8001)
uv run uvicorn app.main:app --reload --port 8001
```

## Rerun Script

A helper script to restart the server after changes (useful if auto-reload misses something):

```bash
# Make executable once
chmod +x scripts/dev-server.sh

# Run
./scripts/dev-server.sh
```

Or run directly:
```bash
uv run uvicorn app.main:app --reload --port 8001
```

## Common Commands

```bash
# Check code style
uv run ruff check app

# Add dependency (exact version, pinned)
uv add package-name==x.y.z

# Update lockfile after pyproject.toml changes
uv lock
```

## Environment

Copy `.env.example` to `.env` and fill in values:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `DATABASE_URL` (defaults to SQLite)

## IPython/Jupyter

```bash
# Start kernel from backend dir (recommended)
uv run ipython

# Or from project root with project flag
uv run --project backend ipython
```