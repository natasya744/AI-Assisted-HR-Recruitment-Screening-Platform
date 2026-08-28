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

---

## Phase 2 — Database Models (Separate Tables Design)

### Slice 2.1–2.5: Core Tables with Form/PDF Separation
- **Outcome**: Eight tables created through a single Alembic migration, with the architecture's key design principle applied: form-submitted data (ground truth) and AI-extracted PDF data live in **separate, aligned tables**.
  - `backend/app/models/`: `job.py`, `candidate.py` (now with phone/location/linkedin contact fields), `application.py`, `candidate_profile_form.py`, `candidate_profile_pdf.py`, `screening.py`, `hr_decision.py`, `audit_log.py`.
  - `candidate_profiles_form` stores an immutable JSONB snapshot of exactly what the candidate typed.
  - `candidate_profiles_pdf` stores AI extraction with `provenance` tags and an `alignment_check` JSONB recording per-field comparison against the form ground truth. Mismatches are flagged for HR — never auto-corrected.
  - `backend/alembic/versions/0001_create_core_tables.py`: constraint names match the `Base` naming convention so future autogenerate diffs stay stable.
  - `backend/app/repositories/`: `job_repository.py`, `candidate_repository.py`, `application_repository.py`, `profile_repository.py`, `audit_repository.py`.
- **Why**: The form is the candidate's own claim; the PDF extraction is the AI's reading of the same person. Keeping them in separate tables lets validation compare the two sources directly, which is the anti-hallucination guard. One-to-one from `applications` (unique `application_id` FK) keeps every row traceable to one application.
- **Exact Commands**:
  ```bash
  cd backend
  uv run --locked --no-sync ruff check app alembic
  uv run alembic upgrade head
  ```
- **Observable Result**: `Running upgrade -> 0001` and all eight tables (`jobs`, `candidates`, `applications`, `candidate_profiles_form`, `candidate_profiles_pdf`, `screening_results`, `hr_decisions`, `audit_logs`) exist in Supabase `public` schema.
- **Checkpoint**: Migration applies cleanly against the live Supabase project; table list verified via `information_schema`.

---

## Phase 3 — Application Intake

### Slice 3.1–3.4: Submit → Store → Snapshot
- **Outcome**: A candidate can apply through the website; the CV lands in the private bucket; the DB records candidate + application + form snapshot + audit entry.
  - `backend/app/schemas/`: `JobCreate`/`JobRead`, `ApplicationFormFields` (with local email regex + empty-string-to-None normalization — no new dependency), `ApplicationRead`, `ApplicationListItem`.
  - `backend/app/services/application_service.py`: PDF validation (content type, `.pdf` extension, `%PDF-` magic bytes, 10 MB cap, filename sanitization), storage upload under `{application_id}/{filename}`, candidate upsert by email, `candidate_profiles_form` snapshot, `APPLICATION_SUBMITTED` audit entry — all in one transaction with rollback on failure.
  - `backend/app/services/storage_service.py`: `upload_cv_bytes()` + fixed `ensure_candidate_cvs_bucket()` (supabase-py raises 404 instead of returning empty on `get_bucket`).
  - `backend/app/api/routes/`: `POST/GET /api/jobs`, `POST/GET /api/applications` (multipart via `Annotated` Form/File params).
  - `frontend/src/lib/types.ts` + `frontend/src/pages/apply/ApplyForm.tsx`: real public form — job dropdown from the API, contact fields, PDF attachment with client-side type/size checks, success screen with application reference, typed error handling.
- **Why**: This is the workflow entry point. The form snapshot is what makes the later alignment check possible: without an immutable record of what the candidate claimed, there is nothing to compare the AI extraction against.
- **Exact Commands**:
  ```bash
  # Terminal 1 — Backend
  cd backend && uv run --locked --no-sync uvicorn app.main:app --port 8001

  # Terminal 2 — Frontend
  cd frontend && pnpm dev

  # Verify
  uv run --locked --no-sync ruff check app scripts
  pnpm tsc --noEmit && pnpm lint && pnpm build
  ```
- **Observable Result**:
  - `POST /api/applications` with the fictional sample CV returns `201` with `status: APPLICATION_SUBMITTED`; the PDF appears in the private `candidate-cvs` bucket; `candidate_profiles_form` holds the exact form values; `audit_logs` has `APPLICATION_SUBMITTED`.
  - Rejects: wrong file type → `400`, unknown job → `404`, oversized file → `413`.
  - Browser walkthrough: job dropdown auto-populated, form submitted, success screen shown, second application visible in `GET /api/applications`.
- **Checkpoint**: Full loop verified live — row + Storage object + form snapshot + audit row, twice (API and browser).

---

## Phase 4 — Document Processing & AI Extraction

### Slice 4.1: pypdf Plain Text Extraction
- **Outcome**: Added `pdf_to_text()` to `document_service.py` using pypdf for fast, lightweight plain-text extraction — no model downloads, no OCR overhead.
  - [`backend/app/services/document_service.py`](../backend/app/services/document_service.py): New `pdf_to_text()` function accepts `str | Path | bytes`, uses `pypdf.PdfReader` to extract text from every page, returns newline-joined string.
  - Lives alongside existing docling `pdf_to_markdown()` and `pdf_to_chunks()` — not a replacement.
  - pypdf 5.4.0 was already approved and added to `pyproject.toml` dependencies.
- **Why**: Docling is great for hierarchical markdown extraction but is heavy (~30MB OCR model download on first run, slower). pypdf handles the common "just give me the raw text" case ~10× faster with zero setup.
- **Exact Commands**:
  ```bash
  cd backend
  uv run --locked --no-sync python -c "
  from app.services.document_service import pdf_to_text
  text = pdf_to_text('../samples/Natasya_AI_Specialist_AutoGroup_Resume.pdf')
  print(len(text))
  "
  ```
- **Observable Result**: `4226` characters of clean text extracted from the sample CV. Works with file paths and raw bytes.
- **Verification**:
  ```bash
  uv run --locked --no-sync ruff check app/services/document_service.py
  ```
- **Checkpoint**: `document_service.py` has three extraction modes: `pdf_to_text()` (pypdf, fast/plain), `pdf_to_markdown()` (docling, structured markdown), `pdf_to_chunks()` (docling + hierarchical chunks). All three pass through the same `str | Path | bytes` interface.

### Slice 4.2: Extraction Prompt, Output Schema & Provider Adapter
- **Outcome**: Created the structured extraction pipeline — prompt templates, Pydantic output schema, and the OpenAI provider adapter. All OpenAI SDK types are isolated within `app/providers/`.
  - [`backend/app/ai/schemas/candidate_profile.py`](../backend/app/ai/schemas/candidate_profile.py): `CandidateProfileExtracted` (top-level: name, email, phone, location, linkedin, summary, skills, experience years, certifications, languages) + `WorkExperienceEntry` (title, company, start/end date) + `EducationEntry` (degree, institution, field).
  - [`backend/app/ai/prompts/resume_extraction.py`](../backend/app/ai/prompts/resume_extraction.py): `RESUME_EXTRACTION_SYSTEM_PROMPT` — instructions + field list + 6 anti-hallucination rules; `RESUME_EXTRACTION_USER_PROMPT` — template with `{cv_text}` placeholder.
  - [`backend/app/providers/resume_extractor.py`](../backend/app/providers/resume_extractor.py): `extract_resume(cv_text)` → `ExtractionResult` (profile, success, error). Creates OpenAI client, calls chat completions with `response_format={"type": "json_object"}`, validates output through Pydantic. Catches HTTP/network errors, JSON decode errors, and schema validation errors — all return `ExtractionResult(success=False, error=...)`.
- **Why**: The boundary is strict: `providers/resume_extractor.py` is the only module that imports from `openai`. The rest of the app consumes `CandidateProfileExtracted` (a plain Pydantic model) and `ExtractionResult` — no SDK types leak beyond this file.
- **Exact Commands** (prerequisite: valid `OPENAI_API_KEY` in `backend/.env`):
  ```bash
  cd backend
  uv run --locked --no-sync python -c "
  from app.services.document_service import pdf_to_text
  from app.providers.resume_extractor import extract_resume
  text = pdf_to_text('../samples/Natasya_AI_Specialist_AutoGroup_Resume.pdf')
  result = extract_resume(text)
  if result.success:
      print(result.profile.model_dump_json(indent=2))
  else:
      print('Error:', result.error)
  "
  ```
- **Observable Result**: With a valid API key, the sample CV produces a complete `CandidateProfileExtracted` with name, email, phone, location, skills, experience, work history, education, and languages — all structured and validated. Without a key, returns `ExtractionResult(success=False, error=...)` cleanly.
- **Verification**:
  ```bash
  uv run --locked --no-sync ruff check app/ai app/providers
  ```
- **Checkpoint**: Extraction prompt, schema, and provider adapter are wired. OpenAI SDK types are sealed inside `app/providers/`. The pipeline `pdf_to_text()` → `extract_resume()` → `CandidateProfileExtracted` is operational and fails safely.