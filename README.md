# AI-Assisted HR Recruitment Screening Platform

An AI-assisted recruitment platform that reduces repetitive HR work during candidate screening.

The system accepts applications through a website, processes candidate documents, extracts structured information using AI, calculates a transparent screening score, and presents the results to HR. HR remains responsible for the final decision; the system then notifies the candidate by email based on that decision.

> **Core principle: AI assists the recruitment process. It never controls it.**

---

## Documentation

| Document | Purpose |
|---|---|
| [`docs/client-brief.md`](docs/client-brief.md) | The *why* — business problems, the ten gaps, and expected value (Main Source of Truth for business) |
| [`docs/architecture.md`](docs/architecture.md) | The *how* — diagrams, state machine, module responsibilities, locked technical decisions |
| [`docs/todos.md`](docs/todos.md) | Build plan, phase-by-phase, plus the decision log |
| [`docs/guides/`](docs/guides/) | Setup walkthroughs: backend, frontend, Supabase, Excel export |
| [`AGENTS.md`](AGENTS.md), [`backend/AGENTS.md`](backend/AGENTS.md), [`frontend/AGENTS.md`](frontend/AGENTS.md) | Rules for AI coding agents: boundaries, dependency policy, verification |

One fact lives in one place. If a section belongs in `docs/`, this file links to it instead of duplicating it.

---

## Stack

- **Backend:** Python 3.12+, FastAPI, Pydantic v2 + pydantic-settings, SQLAlchemy 2, Alembic, uv
- **Database & storage:** Supabase PostgreSQL + Supabase Storage (private CV bucket; DB holds references, never binaries)
- **AI:** OpenAI SDK behind adapter boundaries (CV extraction only — deterministic rules do all scoring)
- **Auth:** Supabase email auth for the HR dashboard (public application form is unauthenticated)
- **Frontend:** Vite + React + TypeScript (strict) + Tailwind CSS + shadcn/ui + React Router, pnpm
- **Export:** openpyxl (`.xlsx` streaming export)
- **Docs:** see links above

See [`docs/architecture.md`](docs/architecture.md#11-locked-technical-decisions) for the locked decisions and rationale.

---

## Quick start

Backend:

```bash
cd backend
uv sync --locked
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 9000
```

Frontend:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev -- --port 9001
```

Setup guides live in [`docs/guides/`](docs/guides/). The MVP build order and verification policy are in [`docs/todos.md`](docs/todos.md) and [`AGENTS.md`](AGENTS.md).