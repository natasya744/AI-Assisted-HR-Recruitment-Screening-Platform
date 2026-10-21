# Stack — AI-Assisted HR Recruitment Screening Platform

## Frontend

| Layer | Technology |
|---|---|
| Language | TypeScript (strict mode) |
| Framework | React 19 |
| Build tool | Vite |
| Package manager | pnpm (locked via `pnpm-lock.yaml`) |
| Styling | Tailwind CSS 4 |
| UI components | shadcn/ui |
| Routing | React Router 6 |
| Auth | `@supabase/supabase-js` (email only) |
| HTTP client | Native `fetch` via `src/lib/http.ts` |
| Linting | oxlint |
| Type checking | `tsc --noEmit` |

## Backend

| Layer | Technology |
|---|---|
| Language | Python 3.12+ |
| Framework | FastAPI |
| ASGI Server | uvicorn |
| Validation | Pydantic v2 + pydantic-settings |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Database | Supabase PostgreSQL |
| Storage | Supabase private bucket (`candidate-cvs`) |
| Auth | Supabase email auth |
| AI Provider | OpenAI SDK (`openai==2.45.0`) |
| LLM Helper | `instructor` |
| PDF Parsing | `docling` (markdown/chunks) + `pypdf` (plain text) |
| Excel Export | `openpyxl` + `pandas` |
| Email | `EmailService` interface (console/file transport for MVP) |
| Logging | `structlog` |
| Linting | ruff |
| Testing | pytest |
| Package manager | uv (locked via `uv.lock`) |

## Infrastructure

| Service | Role |
|---|---|
| **Supabase** | PostgreSQL database, private Storage bucket, email auth |
| **OpenAI** | Sole AI provider — CV extraction and screening advisory |
| **Supabase Storage** | Private bucket for candidate CV PDFs |

## Key Architectural Boundaries

- **Provider adapters** (`backend/app/providers/`) are the only place OpenAI SDK types are exposed
- **`app/core/config.py`** is the single configuration boundary
- **Supabase Postgres** is the single source of truth; binaries live in Storage, DB holds paths/metadata
- **AI extracts only** — deterministic rules engine handles scoring; HR makes final decisions
