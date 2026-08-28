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
- **Port**: Backend runs on `8001` (non-default, avoids conflicts with other projects).
- **Exact Commands to Run**:
  ```bash
  cd backend
  uv run uvicorn app.main:app --reload --port 8001
  ```
- **Observable Result**:
  Visiting `http://localhost:8001/health` returns:
  ```json
  {
    "status": "ok",
    "app": "AI-Assisted HR Recruitment Screening Platform",
    "environment": "development"
  }
  ```
- **Checkpoint**: Backend skeleton is established with clean imports and strict configuration boundaries. Ruff passes: `uv run --locked --no-sync ruff check app` → all checks pass.

### Slice 0.3: Frontend API Client, Page Shells & Backend Integration
- **Outcome**: Wired the frontend to communicate with the backend:
  - [`frontend/src/lib/http.ts`](../frontend/src/lib/http.ts): Thin `fetch` wrapper with `ApiError` type (includes `isNetworkError` flag), timeout via `AbortController`, typed error parsing.
  - [`frontend/src/lib/api.ts`](../frontend/src/lib/api.ts): Singleton `api` object with `get/post/put/patch/delete` — reads `env.apiBaseUrl`, delegates to `http.ts`.
  - [`frontend/src/pages/Home.tsx`](../frontend/src/pages/Home.tsx): Landing page with links to Apply and HR Dashboard.
  - [`frontend/src/pages/apply/ApplyForm.tsx`](../frontend/src/pages/apply/ApplyForm.tsx): Public candidate form placeholder.
  - [`frontend/src/pages/hr/Dashboard.tsx`](../frontend/src/pages/hr/Dashboard.tsx): HR dashboard placeholder.
  - [`frontend/src/pages/hr/Review.tsx`](../frontend/src/pages/hr/Review.tsx): Individual candidate review placeholder.
  - [`frontend/src/components/Layout.tsx`](../frontend/src/components/Layout.tsx): App shell with header/nav and `<Outlet />`.
  - [`frontend/src/App.tsx`](../frontend/src/App.tsx): React Router with all routes: `/`, `/apply`, `/hr`, `/hr/review/:id`.
- **Port**: Frontend dev server on `5174` (non-default). Backend API expected at `localhost:8001`.
- **Exact Commands to Run**:
  ```bash
  # Terminal 1 — Backend
  cd backend
  uv run uvicorn app.main:app --reload --port 8001

  # Terminal 2 — Frontend
  cd frontend
  pnpm dev
  ```
- **Observable Result**:
  - Frontend at `http://localhost:5174` loads with navigation, links to Apply and HR Dashboard.
  - All routes render placeholder content without errors.
  - Backend `GET http://localhost:8001/health` returns 200.
  - Verification commands all pass:
    - `uv run --locked --no-sync ruff check app` (backend lint)
    - `pnpm typecheck` (frontend TypeScript)
    - `pnpm lint` (frontend ESLint)
    - `pnpm build` (production build)
- **Checkpoint**: Frontend and backend are scaffolded, can talk to each other via `VITE_API_BASE_URL=http://localhost:8001`, and all verification gates are green.

### Files created (backend)
- `backend/app/__init__.py`
- `backend/app/main.py`
- `backend/app/core/__init__.py`
- `backend/app/core/config.py`
- `backend/app/db/__init__.py`
- `backend/app/db/base.py`
- `backend/app/db/session.py`

### Files created (frontend)
- `frontend/src/lib/http.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/pages/Home.tsx`
- `frontend/src/pages/apply/ApplyForm.tsx`
- `frontend/src/pages/hr/Dashboard.tsx`
- `frontend/src/pages/hr/Review.tsx`
- `frontend/src/components/Layout.tsx`

### Files modified
- `frontend/src/App.tsx` — replaced scaffold placeholder with React Router routing
- `frontend/vite.config.ts` — changed dev server port to 5174
- `frontend/.env` — `VITE_API_BASE_URL` → `http://localhost:8001`
- `frontend/.env.example` — updated port reference
- `backend/.env` — `ALLOWED_ORIGINS` → `http://localhost:5174`
- `backend/.env.example` — updated port reference

---

## Phase 1 — Database & Storage

### Slice 1.3: Alembic Migrations
- **Outcome**: Added Alembic (already in `pyproject.toml` as `alembic==1.19.1`) and configured it to read `DATABASE_URL` from `app.core.config.Settings` instead of a hardcoded URL.
  - [`backend/alembic/env.py`](../backend/alembic/env.py): Imports `settings` and `Base.metadata` from the app. `run_migrations_online` uses `create_engine(settings.DATABASE_URL)`.
  - [`backend/alembic/script.py.mako`](../backend/alembic/script.py.mako): Default template.
- **Why**: Alembic is the standard schema-migration tool for SQLAlchemy, used for all schema changes per the architecture document. Reading the URL from `config.py` enforces the single-config-boundary rule.
- **Exact Commands**:
  ```bash
  cd backend
  alembic init alembic
  # then edited alembic/env.py to import settings + Base
  alembic check
  ```
- **Observable Result**:
  ```
  INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
  INFO  [alembic.runtime.migration] Will assume transactional DDL.
  ...
  No new upgrade operations detected.
  ```
- **Note**: The DATABASE_URL in `.env` was changed from `postgresql://` to `postgresql+psycopg://` to match the installed `psycopg[binary]` driver (not `psycopg2`).
  - `backend/.env`, `backend/.env.example`, and the `config.py` default were all updated.
- **Checkpoint**: Alembic connects to Supabase Postgres, detects current state, and is ready for the first migration.

### Slice 1.4: Supabase Storage Bucket — `candidate-cvs`
- **Outcome**: Created the private Storage bucket infrastructure and frontend helpers.
  - [`backend/app/core/config.py`](../backend/app/core/config.py): Added `SUPABASE_STORAGE_BUCKET = "candidate-cvs"`.
  - [`backend/app/services/storage_service.py`](../backend/app/services/storage_service.py): `get_storage_client()`, `ensure_candidate_cvs_bucket()`, `get_public_url()`, `get_authenticated_url()`.
  - [`backend/scripts/setup_storage.py`](../backend/scripts/setup_storage.py): CLI script to create the bucket.
  - [`frontend/src/lib/supabase.ts`](../frontend/src/lib/supabase.ts): Supabase client initialized from `env.ts`.
  - [`frontend/src/lib/storage.ts`](../frontend/src/lib/storage.ts): `uploadCandidateCv()`, `getCvPublicUrl()`, `deleteCandidateCv()` helpers.
- **Why**: CV PDFs are stored in a private Supabase Storage bucket. The DB stores only the storage path + metadata, never the binary content. The service-role key (server-side) creates/manages the bucket; the anon key (frontend) is used for candidate uploads with bucket-level RLS in production.
- **Exact Commands to Run**:
  ```bash
  cd backend
  uv run python scripts/setup_storage.py
  ```
- **Observable Result**: `Storage bucket 'candidate-cvs' ready.  Bucket visibility: private`
- **Checkpoint**: Backend has storage service + setup script; frontend has Supabase client + upload/download helpers. Both compile and lint clean.

### Files created (Phase 1)
- `backend/alembic/env.py`
- `backend/alembic/script.py.mako`
- `backend/alembic/versions/.gitkeep`
- `backend/alembic/README`
- `backend/alembic.ini`
- `backend/app/services/__init__.py`
- `backend/app/services/storage_service.py`
- `backend/scripts/setup_storage.py`
- `frontend/src/lib/supabase.ts`
- `frontend/src/lib/storage.ts`

### Files modified (Phase 1)
- `backend/.env` — `DATABASE_URL` scheme changed to `postgresql+psycopg://`
- `backend/.env.example` — updated scheme and port
- `backend/app/core/config.py` — added `SUPABASE_STORAGE_BUCKET`, updated default DATABASE_URL scheme

---

### Slice 1.5: Docling PDF → Markdown Service
- **Outcome**: Added PDF-to-markdown conversion using docling with HierarchicalChunker, and verified it against the sample CV.
  - [`backend/pyproject.toml`](../backend/pyproject.toml): Moved `docling==2.121.0` from dev dependencies to main dependencies (needed at runtime).
  - [`backend/app/services/document_service.py`](../backend/app/services/document_service.py): `pdf_to_markdown()` and `pdf_to_chunks()` using lazy-initialized `DocumentConverter` + `HierarchicalChunker`. Supports both file paths and raw bytes.
  - [`backend/scripts/test_docling.py`](../backend/scripts/test_docling.py): Reads the sample CV from `samples/Natasya_AI_Specialist_AutoGroup_Resume.pdf`, converts to markdown, and prints hierarchical chunks.
- **Why**: Docling converts PDFs to clean markdown before sending to OpenAI for extraction. HierarchicalChunker preserves document structure (headings, sections) which is essential for accurate CV parsing.
- **Exact Commands**:
  ```bash
  cd backend
  uv run python scripts/test_docling.py
  ```
- **Observable Result**:
  ```
  Processing: Natasya_AI_Specialist_AutoGroup_Resume.pdf
  
  >>> pdf_to_markdown()
  
  ## NATASYA
  ## AI Specialist (Implementation & Automation)
  Jakarta, Indonesia | +6285184516184 | Putrianastasya744@gmail.com
  
  ## PROFESSIONAL SUMMARY
  Results-driven AI Implementation & Automation Specialist...
  
  ## CORE COMPETENCIES & TECHNICAL SKILLS
  - AI Implementation & Architecture: Azure AI / OpenAI Integration...
  - Workflow Automation & Tools: n8n Pipeline Engineering...
  ...
  
  >>> pdf_to_chunks() — 12 chunks with headings (PROFESSIONAL SUMMARY, CORE COMPETENCIES,
  PROFESSIONAL EXPERIENCE, EDUCATION, LANGUAGES) and per-chunk provenance metadata.
  ```
- **Note**: First run downloads RapidOCR models (~30MB) for OCR-based text extraction.
- **Checkpoint**: PDF-to-markdown pipeline works end-to-end. Ready for Phase 2 (upload endpoint + AI extraction).

### Files created (Phase 1.5)
- `backend/app/services/document_service.py`
- `backend/scripts/test_docling.py`

### Files modified (Phase 1.5)
- `backend/pyproject.toml` — moved docling to main deps
- `backend/uv.lock` — updated lockfile