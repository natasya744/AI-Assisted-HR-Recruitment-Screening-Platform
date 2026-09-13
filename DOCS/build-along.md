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

---

### Slice 4.3: AI Screening Advisor — Prompt, Schema, Provider & Service
- **Outcome**: Added an advisory screening layer alongside the deterministic screening engine. The AI advisor evaluates the extracted profile against job requirements and flags which qualifications are verified, missing, or unverifiable. The deterministic engine remains the authoritative score source; the advisor output is purely informational for HR.
  - [`backend/app/core/config.py`](../backend/app/core/config.py): Changed `OPENAI_CHAT_MODEL` to `gpt-5-mini`.
  - [`backend/app/models/screening.py`](../backend/app/models/screening.py): Added `ai_advice JSONB` column to `ScreeningResult`.
  - [`backend/alembic/versions/0002_add_ai_advice_to_screening.py`](../backend/alembic/versions/0002_add_ai_advice_to_screening.py): Migration 0002 adds the column.
  - [`backend/app/ai/schemas/ai_advice.py`](../backend/app/ai/schemas/ai_advice.py): `RequirementAssessment` (requirement, category, status, evidence, reason) + `AdvisorOutput` (overall_classification, per_requirement, additional_qualifications, advisor_confidence).
  - [`backend/app/ai/prompts/screening_advisor.py`](../backend/app/ai/prompts/screening_advisor.py): Concise 10-rule prompt — no hallucination, evidence-based assessments, strict YES/NO/PARTIAL_MATCH/NOT_FOUND.
  - [`backend/app/providers/screening_advisor.py`](../backend/app/providers/screening_advisor.py): `get_screening_advice(job_title, job_description, candidate_profile)` returns `ScreeningAdviceResult` (advice, success, error). OpenAI SDK types sealed here.
  - [`backend/app/services/screening_service.py`](../backend/app/services/screening_service.py): `run_deterministic_screening()` — rule-based scoring (skills match, experience years, education, certifications) with configurable weights from `job.score_weights`. `run_ai_advisor()` — callable separately, returns the advisor dict for storage.
  - [`backend/app/repositories/screening_repository.py`](../backend/app/repositories/screening_repository.py): `get_by_application()` and `update_ai_advice()` for the `screening_results` table.
- **Why**: The architectural principle "AI assists, never controls" is preserved — the deterministic engine is the authoritative source of truth for scores. The AI advisor provides per-requirement evidence and confidence flags to help HR make informed decisions. Both are stored in `screening_results` and surfaced on the HR dashboard.
- **Exact Commands**:
  ```bash
  cd backend
  # Migrate
  uv run alembic upgrade head

  # Verify lint
  uv run --locked --no-sync ruff check app/ai app/providers app/services app/repositories
  ```
- **Observable Result**: Migration 0002 applies cleanly. `screening_results` table now has an `ai_advice` JSONB column (default `{}`).
- **Verification**:
  ```bash
  uv run --locked --no-sync ruff check app/ai app/providers app/services app/repositories
  ```
- **Checkpoint**: AI screening advisor is fully wired — deterministic scoring runs synchronously, advisor runs separately (async or on-demand), both are stored per application. HR dashboard can render deterministic score + evidence + advisor per-requirement assessment.

---

### Slice 4.4: Job Description Free-Text Field
- **Outcome**: Added a free-text `description` column to the `jobs` table so HR can paste the full job posting. The AI advisor reads this rich text instead of the assembled structured fields, giving it full context (responsibilities, preferred qualifications, work arrangement, etc.). The structured fields (`required_skills`, `education_requirements`, `min_experience_years`, `score_weights`) remain for the deterministic screening engine.
  - [`backend/alembic/versions/0003_add_job_description.py`](../backend/alembic/versions/0003_add_job_description.py): Migration adds `description TEXT` column to `jobs`.
  - [`backend/app/models/job.py`](../backend/app/models/job.py): Added `description: Mapped[str | None] = mapped_column(Text, nullable=True)`.
  - [`backend/app/schemas/job.py`](../backend/app/schemas/job.py): Added `description: str | None` to both `JobCreate` and `JobRead`.
  - [`backend/app/repositories/job_repository.py`](../backend/app/repositories/job_repository.py): Passes `data.description` when creating a job.
  - [`backend/app/services/screening_service.py`](../backend/app/services/screening_service.py): `run_ai_advisor()` now uses `job.description` if present; falls back to structured-field assembly for backward compatibility.
- **Why**: A full job description gives the AI advisor much richer context — it can evaluate against responsibilities, preferred qualifications, soft skills, work arrangements, and other details that structured fields can't capture. The deterministic engine still uses structured fields for reproducible scoring.
- **Exact Commands**:
  ```bash
  cd backend
  uv run alembic upgrade head
  |
  Create a job with description:
  curl -X POST http://localhost:8001/api/jobs \
    -H "Content-Type: application/json" \
    -d '{"title": "Administration Staff", "description": "We are looking for an Administration Staff to manage office operations.\\n\\nRequired:\\n- Bachelor degree in any field\\n- 2+ years admin experience\\n- Microsoft Office proficiency\\n- English B2 or higher\\n- SAP experience preferred\\n- Strong organizational skills", "min_experience_years": 2, "required_skills": ["Microsoft Office", "SAP"], "education_requirements": ["Bachelor"], "score_weights": {"skills": 30, "experience": 30, "education": 20, "other": 20}}'
  ```
- **Observable Result**: Migration 0003 applies cleanly. `POST /api/jobs` accepts `description` in the body. The AI advisor receives the full description text when evaluating candidates against this job.
- **Verification**:
  ```bash
  uv run --locked --no-sync ruff check app alembic
  ```
- **Checkpoint**: Jobs now carry a full free-text description. When HR creates a job and pastes the complete posting, the AI advisor evaluates candidates against it. Existing jobs without a description still work — the advisor falls back to structured fields.

---

### Slice 4.5: Modular Testing Playground & Pipeline Verification
- **Outcome**: Created a modular testing playground in `playground/` reflecting the backend application architecture:
  - [`playground/config.py`](../playground/config.py): Environment paths and settings boundary.
  - [`playground/data/fixtures.py`](../playground/data/fixtures.py): Sample job criteria, candidate form ground truth, and validated offline fixtures.
  - [`playground/services/document_service.py`](../playground/services/document_service.py): PDF-to-Markdown conversion using Docling and Markdown file loader.
  - [`playground/services/alignment_service.py`](../playground/services/alignment_service.py): Anti-hallucination check comparing form submission against extracted PDF data.
  - [`playground/services/scoring_service.py`](../playground/services/scoring_service.py): Deterministic rule-based math and breakdown scoring.
  - [`playground/providers/extraction_provider.py`](../playground/providers/extraction_provider.py): Resume extractor adapter with provenance tracking and fallback.
  - [`playground/providers/advisor_provider.py`](../playground/providers/advisor_provider.py): Screening advisor adapter with requirement evaluations.
  - [`playground/pipeline.py`](../playground/pipeline.py): End-to-end pipeline orchestrator connecting intake $\rightarrow$ extraction $\rightarrow$ alignment $\rightarrow$ scoring $\rightarrow$ advice.
  - [`playground/main.py`](../playground/main.py): Modular CLI runner with commands for each individual module (`convert`, `extract`, `align`, `score`, `advise`, `all`).
- **Why**: Allows isolated, unit-style and end-to-end testing of each processing layer before persisting to the database or rendering on the frontend, while verifying how all modules communicate.
- **Exact Commands**:
  ```bash
  # Convert PDF to Markdown only
  uv run --directory backend --locked --no-sync python ../playground/main.py convert --pdf ../samples/Natasya_AI_Specialist_AutoGroup_Resume.pdf

  # Run Anti-Hallucination Alignment Check
  uv run --directory backend --locked --no-sync python ../playground/main.py align

  # Run Deterministic Rule-Based Scoring Engine
  uv run --directory backend --locked --no-sync python ../playground/main.py score

  # Run Full End-to-End Pipeline
  uv run --directory backend --locked --no-sync python ../playground/main.py all
  ```
- **Observable Result**:
  - `convert` extracts clean Markdown from `Natasya_AI_Specialist_AutoGroup_Resume.pdf` via Docling.
  - `align` checks all 5 identity fields between form and PDF without auto-correcting.
  - `score` computes exact mathematical score breakdown (100/100).
  - `all` orchestrates the complete flow from intake to final screening dossier.
  - `uv run --directory backend --locked --no-sync ruff check ../playground app` passes with 0 errors.
- **Checkpoint**: All processing modules are isolated, modular, and verified to communicate as designed. Ready to wire directly into backend routes and services.

---

### Slice 4.6: Wire Processing into the Application Flow (4.4)
- **Outcome**: A submitted application is now processed synchronously inside the intake request: PDF text → AI extraction → 3-layer validation → persisted `candidate_profiles_pdf` → status `SCREENING`. Failures route to `DOCUMENT_PROCESSING_FAILED` with an empty failed profile row + audit entry so HR can inspect.
  - [`backend/app/services/validation_service.py`](../backend/app/services/validation_service.py): Ported the playground's Phase 4.3 pipeline into the real service layer — `validate_business_bounds()`, `deterministic_merge()` (field-level provenance tags), `check_profile_alignment()` (form ground truth vs PDF, MISMATCH is never auto-corrected), `run_validation_pipeline()`.
  - [`backend/app/services/application_service.py`](../backend/app/services/application_service.py): `submit_application()` now calls `process_application()` after the `APPLICATION_SUBMITTED` commit — `document_service.pdf_to_text()` → `resume_extractor.extract_resume()` → `run_validation_pipeline()` → `profile_repository.create_pdf_profile()`; status → `SCREENING`, audit `EXTRACTED`. Any failure → `_mark_processing_failed()` → status `DOCUMENT_PROCESSING_FAILED`, audit `DOCUMENT_PROCESSING_FAILED` with the error, empty failed profile.
  - [`backend/app/repositories/application_repository.py`](../backend/app/repositories/application_repository.py): `get_with_job_and_candidate()` for the detail view.
  - [`backend/app/schemas/application.py`](../backend/app/schemas/application.py): `CandidateInfo`, `PdfProfileRead`, `ApplicationDetail` response models.
  - [`backend/app/api/routes/applications.py`](../backend/app/api/routes/applications.py): `GET /api/applications/{id}` returns the dossier (application + candidate + form snapshot + pdf profile with provenance + alignment check).
- **Why**: Phase 4.1–4.3 built the primitives; this slice connects them to the real intake endpoint so candidates actually reach `SCREENING` automatically, or `MANUAL_REVIEW` when the document is unreadable.
- **Exact Commands**:
  ```bash
  cd backend
  uv run --locked --no-sync ruff check app scripts

  # Valid fictional CV → status SCREENING
  curl -X POST http://localhost:8001/api/applications \
    -F "job_id=<job-id>" -F "full_name=Natasha Putri" -F "email=natasha.putri@example.com" \
    -F "cv=@samples/Natasya_AI_Specialist_AutoGroup_Resume.pdf;type=application/pdf"

  # Truncated PDF (passes magic-byte check, unreadable) → status DOCUMENT_PROCESSING_FAILED
  printf '%%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%%%EOF' > /tmp/broken.pdf
  curl -X POST http://localhost:8001/api/applications \
    -F "job_id=<job-id>" -F "full_name=Broken Sally" -F "email=broken.sally@example.com" \
    -F "cv=@/tmp/broken.pdf;type=application/pdf"

  curl http://localhost:8001/api/applications/<id>   # dossier JSON
  ```
- **Observable Result**: Valid CV returns `201` with `status: SCREENING`; the detail JSON carries `pdf_profile.extracted_data` (skills/work/education), per-field `provenance` (`ai`/`deterministic`/`missing`), and `alignment_check` (email/name/phone MISMATCH flags). A truncated PDF returns `201` with `status: DOCUMENT_PROCESSING_FAILED` and an empty failed profile. `audit_logs` gains `EXTRACTED` (success) or `DOCUMENT_PROCESSING_FAILED` (with `error`) rows.
- **Verification**: `uv run --locked --no-sync ruff check app scripts` clean; live curl walkthrough of both paths.

### Slice 4.7: Frontend Profile Detail View (4.5)
- **Outcome**: The HR review page (`/hr/review/:id`) now shows the extracted profile with provenance markers, an alignment-mismatch callout, and a distinct manual-review state; the dashboard lists clickable applications.
  - [`frontend/src/lib/types.ts`](../frontend/src/lib/types.ts): `ApplicationListItem`, `CandidateInfo`, `WorkExperience`, `Education`, `ExtractedProfile`, `ProfileProvenance`, `AlignmentCheck`, `PdfProfile`, `ApplicationDetail`.
  - [`frontend/src/lib/errors.ts`](../frontend/src/lib/errors.ts): Extracted the shared `getErrorMessage()` used by all pages.
  - [`frontend/src/components/StatusBadge.tsx`](../frontend/src/components/StatusBadge.tsx): status pill (colour per state).
  - [`frontend/src/components/ProvenanceBadge.tsx`](../frontend/src/components/ProvenanceBadge.tsx): provenance pill (`AI` / `Derived` / `AI approx` / `Missing`).
  - [`frontend/src/pages/hr/Review.tsx`](../frontend/src/pages/hr/Review.tsx): detail view — header with name/job/status, alignment mismatch callout, provenance legend, then Extracted profile / Summary / Skills / Work experience / Education / Certifications / Languages sections (each showing field-level provenance badges). `DOCUMENT_PROCESSING_FAILED` → "manual review required" callout + "No extracted profile" placeholder.
  - [`frontend/src/pages/hr/Dashboard.tsx`](../frontend/src/pages/hr/Dashboard.tsx): applications table (candidate, job, applied date, status badge) with rows linking to the review page.
  - [`frontend/src/pages/apply/ApplyForm.tsx`](../frontend/src/pages/apply/ApplyForm.tsx): now imports the shared error helper.
- **Why**: This is exactly what HR needs to trust the AI output — the field origins (`provenance`) and the flag when an extracted identity field disagrees with what the candidate typed.
- **Exact Commands**:
  ```bash
  cd frontend
  pnpm tsc --noEmit && pnpm lint && pnpm build
  pnpm dev   # then open http://localhost:5174/hr → click a SCREENING row
  ```
- **Observable Result**: `/hr` shows the applications table with status badges; clicking a `SCREENING` application opens the profile detail with the extracted name/skills/work/education, per-field provenance pills, and the amber alignment callout listing mismatch details (form vs PDF). Clicking a `DOCUMENT_PROCESSING_FAILED` application shows the "manual review required" red callout.
- **Verification**: `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build` all pass; Playwright walkthrough of the checkpoint — 14/14 checks (dashboard lists rows, provenance legend, skills/work/education sections with counts, alignment mismatch surfaced, failed-status manual-review view, public apply page still renders).

- **Checkpoint (Phase 4)**: A fictional CV → structured profile with provenance markers (`SCREENING`); a broken PDF → `DOCUMENT_PROCESSING_FAILED` with a manual-review callout. Both verified live through the browser.

---

## Phase 4.8 — Wire Deterministic Screening + HR Qualification Summary

### Slice 4.8: Screening result & qualified/not-qualified verdict end-to-end
- **Outcome**: The automatic flow now produces a transparent screening verdict, and the HR UI surfaces it. Previously the `screening_results` row was **never created** (the scoring engine existed but was not called), so the dashboard could only show extractions.
  - [`backend/app/services/application_service.py`](../backend/app/services/application_service.py): `process_application()` now runs `run_deterministic_screening()` after a successful extraction — persists `screening_results`, moves status to `HR_REVIEW`, and appends a `SCREENED` audit entry.
  - [`backend/app/services/screening_service.py`](../backend/app/services/screening_service.py): added `assess_qualification(total_score, score_weights)` → `{max_score, passing_score, is_qualified, classification}`. Verdict = reach > 60% of the summed score weights (no new schema column; derived deterministically at read time).
  - [`backend/app/schemas/application.py`](../backend/app/schemas/application.py): added `ScreeningSummary` (list) + `ScreeningResultRead` (detail); `ApplicationListItem` and `ApplicationDetail` now carry `screening`.
  - [`backend/app/repositories/application_repository.py`](../backend/app/repositories/application_repository.py): `list_with_details()` outer-joins `ScreeningResult` and returns the `Job`/`Candidate` models so the list endpoint can compute the verdict. No migration required.
  - [`backend/app/api/routes/applications.py`](../backend/app/api/routes/applications.py): list & detail routes build the verdict from `total_score` + `job.score_weights` and return the screening summary/result.
- **Why**: The client-brief's Gap 3/4 (inconsistent screening + opaque scores) requires a **score + breakdown + why**, and the architecture's Step 7 says "score computed" before review. Without wiring the engine, HR had nothing to review. The verdict is derived (never stored differently per call) so it is inspectable and reproducible.
- **Exact Commands**:
  ```bash
  cd backend
  uv run --locked --no-sync ruff check app scripts
  uv run uvicorn app.main:app --reload --port 8001

  cd frontend
  pnpm dev
  ```
- **Observable Result**:
  - A freshly submitted application now returns `status: HR_REVIEW` and the detail JSON has `screening: {total_score, max_score, passing_score, is_qualified, classification, breakdown, evidence}`.
  - `GET /api/applications` returns a `screening` summary per row (`{total_score, max_score, passing_score, is_qualified, classification}`).
  - Frontend `/hr` dashboard: stat cards (Total / Qualified / Not qualified), and a clean, proportional table with Candidate, Job, Score (progress bar + `score/max`), Verdict badge (Qualified / Not qualified), Status, and Applied date.
  - Frontend `/hr/review/:id`: a "Screening result" card sits between the header and the extracted profile — big score, threshold bar, per-category breakdown bars (Skills/Experience/Education/Other), and a "Why this verdict" block listing matched/missing skills, experience vs minimum, and certifications.
- **Verification**:
  ```bash
  uv run --locked --no-sync ruff check app scripts   # clean
  pnpm tsc --noEmit && pnpm lint && pnpm build        # all green
  ```
- **Checkpoint**: Extraction and screening are now both part of the intake flow; HR can see *why* a candidate is qualified or not in one place. Pre-existing rows created before this slice have no `screening_results` row and show as "Not screened" until reprocessed.

### Slice 4.9: Phase 5 close-out — recompute guard + expandable score panel
- **Outcome**: Completed the remaining Phase 5 checklist items.
  - [`backend/app/services/screening_service.py`](../backend/app/services/screening_service.py): `run_deterministic_screening()` now refuses to recompute once an `HRDecision` exists for the application — raises `ScreeningError` instead of silently overwriting (blocks re-scoring after an HR decision).
  - [`backend/app/repositories/hr_decision_repository.py`](../backend/app/repositories/hr_decision_repository.py): new `get_by_application()` used by the guard.
  - [`frontend/src/components/ui/collapsible.tsx`](../frontend/src/components/ui/collapsible.tsx): shadcn-style `Collapsible` / `CollapsibleTrigger` / `CollapsibleContent` wrapping `@base-ui/react/collapsible` (already a dependency — no new package).
  - [`frontend/src/components/ScreeningSummaryCard.tsx`](../frontend/src/components/ScreeningSummaryCard.tsx): the score panel is now **expandable** — total score + verdict + threshold bar stay visible, and the per-category breakdown + "Why this verdict" evidence collapse/expand behind a toggle (default open so HR still sees the reason at a glance).
- **Why**: 5.3 keeps the audit/state invariants (a decision is terminal; the score behind it must not change). 5.4 gives HR the transparent "score + breakdown + evidence" without crowding the page.
- **Exact Commands**:
  ```bash
  cd backend && uv run --locked --no-sync ruff check app scripts
  cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm build
  ```
- **Observable Result**: `ruff` clean; `tsc`/`lint`/`build` green. On the review page the "Screening result" card collapses/expands its breakdown + evidence; attempting to re-score a decided application raises a clear error instead of overwriting.
- **Verification**: backend lint + frontend typecheck/lint/build all pass (no automated test suites per policy).
- **Checkpoint**: Phase 5 is functionally complete. Remaining: the Phase 5 checkpoint (a strong vs weak CV showing visibly different scores) is a live-browser/cloud verification that needs Supabase + OpenAI credentials, and belongs with the Phase 9 end-to-end walkthrough.

---

## Phase 5 Fix — Screening Verdict Always Surfaces

### Slice 4.10: Screening failure isolation + backfill + always-visible reason
- **Outcome**: Fixed the case where HR clicked an application and only saw the extracted profile with **no qualification reason**.
  - **Root cause found**: in `process_application`, `screening_service.run_deterministic_screening()` sat inside the same `try/except Exception` as extraction. Any screening exception (including the recompute-guard `ScreeningError`) triggered `db.rollback()` → `_mark_processing_failed()` → `DOCUMENT_PROCESSING_FAILED` with **no `screening_results` row**, so `detail.screening` was always `null` and the frontend rendered nothing.
  - [`backend/app/services/application_service.py`](../backend/app/services/application_service.py): `process_application()` now commits extraction first (status `SCREENING`), then runs screening in its own `try`. A `ScreeningError` is ignored; any other failure persists a zero-score **fallback** result so a verdict always exists.
  - [`backend/app/services/screening_service.py`](../backend/app/services/screening_service.py): added `create_fallback_screening()` (score 0, error in `evidence`, `screening_failed: true`) and `screen_application()` (recompute/backfill from stored `extracted_data`, respects the HR-decision guard).
  - [`backend/app/services/application_service.py`](../backend/app/services/application_service.py): added `ensure_application_screened()` — called by the detail route so pre-existing rows created before screening was wired get a verdict computed on first open.
  - [`backend/app/api/routes/applications.py`](../backend/app/api/routes/applications.py): `GET /api/applications/{id}` now backfills screening before building the response.
  - [`frontend/src/components/ScreeningSummaryCard.tsx`](../frontend/src/components/ScreeningSummaryCard.tsx): removed the collapsible wrapper — the **score breakdown and "Why this verdict"** (matched/missing skills, experience, certifications) are now always visible; a failed-screening error block is shown when applicable.
  - [`frontend/src/pages/hr/Dashboard.tsx`](../frontend/src/pages/hr/Dashboard.tsx): column widths rebalanced and job titles clamped so rows look proportional at any width.
- **Why**: The whole point of the deterministic engine is transparent, explainable results. A single broad `except` silently deleted that explanation for whole application cohorts; the fix guarantees HR always sees *a* verdict and the reason behind it.
- **Exact Commands**:
  - `cd backend && uv run --locked --no-sync ruff check app scripts`
  - `cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm build`
- **Observable Result**: opening any application with a completed extraction now shows the "Screening result" card with a verdict, the threshold bar, per-category breakdown, and the reason block. Pre-existing rows backfill on first open. A scoring-engine failure yields a red "Screening error" note instead of silently losing the row.
- **Verification**: backend lint, `tsc`, `lint`, `build` all green.
- **Checkpoint**: HR always sees *why* a candidate is (or is not) qualified, in the same screen as the extracted profile.

---

## Phase 6 — HR Dashboard & Decision Gate

### Slice 6.1–6.4: Filtered HR routes, decision endpoint, audit events, frontend decision UI
- **Outcome**: HR can filter/sort applications, view a dossier with tabs, and make terminal approve/reject decisions that lock the state and are audited.
  - **6.1** — [`backend/app/api/routes/hr.py`](../backend/app/api/routes/hr.py): `GET /api/hr/applications` with optional `job_id`, `status`, `min_score` query filters; `GET /api/hr/applications/{id}` returns the dossier (application, candidate, screening, pdf_profile, audit history).
  - **6.2** — `POST /api/hr/applications/{id}/decision` enforces the state machine: validates `APPROVED`/`REJECTED`, checks no prior decision exists (409 Conflict), updates application status, creates an `HRDecision` row. The `hr_decisions` table has a `UNIQUE(application_id)` constraint enforcing one decision per application.
  - **6.4** — Every decision triggers a `DECISION_APPROVED` or `DECISION_REJECTED` audit event via `audit_repository.append()`, recording reviewer, notes, and previous status.
  - **6.3** — Frontend:
    - [`frontend/src/pages/hr/Dashboard.tsx`](../frontend/src/pages/hr/Dashboard.tsx): filter bar (job dropdown, status dropdown, min score input) sourcing data from `/api/hr/applications`. Stat cards include a "Decided" counter.
    - [`frontend/src/pages/hr/Review.tsx`](../frontend/src/pages/hr/Review.tsx): three tabs — Profile (existing extraction view), Screening (score breakdown), History (timeline of audit events with labels). Approve/Reject buttons at the bottom with a confirmation dialog (`ConfirmDialog.tsx`) warning the decision is terminal.
    - [`frontend/src/components/ConfirmDialog.tsx`](../frontend/src/components/ConfirmDialog.tsx): lightweight modal with approve/reject variant styling.
- **Why**: Phase 6 closes the HR workflow loop — applications flow from intake → screening → decision, with every transition audited. The decision gate is the terminal state in the state machine, ensuring no re-scoring or re-processing after decision.
- **Exact Commands**:
  ```bash
  # Backend
  cd backend && uv run --locked --no-sync ruff check app/api/routes/hr.py app/schemas/hr_decision.py app/repositories/hr_decision_repository.py
  uv run uvicorn app.main:app --reload --port 8001

  # Frontend
  cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm build
  pnpm dev
  ```
- **Observable Result**:
  - `GET /api/hr/applications?status=HR_REVIEW&min_score=50` returns filtered rows.
  - `POST /api/hr/applications/{id}/decision` with `{"decision": "APPROVED", "reviewer_email": "hr@example.com"}` returns `201`; a second call returns `409`.
  - `/hr/review/{id}` shows three tabs, decision buttons at the bottom, and history entries in the History tab.
  - `audit_logs` has `DECISION_APPROVED` / `DECISION_REJECTED` rows with full payloads.
- **Verification**:
  ```bash
  uv run --locked --no-sync ruff check app/api/routes/hr.py app/schemas/hr_decision.py app/repositories/hr_decision_repository.py app/main.py
  pnpm tsc --noEmit && pnpm lint && pnpm build
  ```
- **Checkpoint**: All new code lints/typechecks/builds clean. The decision endpoint enforces the state machine correctly (terminal, one decision, audited). The frontend has filterable dashboard and tabbed review with decision controls. Audit trail is complete through all stages.

---

## Phase 8 — Excel Export

### Slice 8.1–8.3: Download applications as `.xlsx`
- **Outcome**: HR can download the candidate application list as an Excel file from the dashboard. The backend builds the workbook from Postgres; the frontend fetches it as a binary blob and triggers a browser download.
  - [`backend/app/services/export_service.py`](../backend/app/services/export_service.py): `build_applications_workbook(db, job_id, status, min_score, limit)` — one query LEFT-JOINs `applications → jobs → candidates → screening_results → hr_decisions`, then writes an `openpyxl` workbook with columns: Candidate Name, Email, Position, Applied At, Screening Score, Max Score, Screening Decision (QUALIFIED / NOT_QUALIFIED), HR Decision, Decision At. Same filters as the HR dashboard. Returns file bytes. No AI, no network.
  - [`backend/app/api/routes/exports.py`](../backend/app/api/routes/exports.py): `GET /api/exports/applications` — accepts optional `job_id`, `status`, `min_score`, `limit`; returns the raw bytes as `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` with `Content-Disposition: attachment; filename="applications.xlsx"`.
  - [`backend/app/main.py`](../backend/app/main.py): registers the `exports` router.
  - [`frontend/src/lib/http.ts`](../frontend/src/lib/http.ts): refactored the shared fetch/error/timeout logic into `doFetch()`, then added `apiRequestBlob()` for binary responses (the old `apiRequest()` always called `response.json()` and could not download files).
  - [`frontend/src/lib/api.ts`](../frontend/src/lib/api.ts): added `api.exportBlob(path)` which hits the endpoint and returns a `Blob`.
  - [`frontend/src/pages/hr/Dashboard.tsx`](../frontend/src/pages/hr/Dashboard.tsx): "Export to Excel" button next to "Manage jobs". It sends the **currently active filters** (job / status / min score), turns the returned blob into a download via `URL.createObjectURL` + a temporary `<a download>` click, then revokes the object URL. A longer fetch timeout (60s) covers slow DB/excel builds; failures surface as an inline red banner.
- **Why**: HR needs a machine-readable record of every candidate and its screening outcome for external reporting / payroll / ATS sync. Generating the file on the server keeps the logic deterministic and reuses the already-installed `openpyxl`; no client-side Excel library or additional dependency is needed.
- **Exact Commands**:
  ```bash
  # Backend
  cd backend && uv run --locked --no-sync ruff check app
  uv run uvicorn app.main:app --reload --port 8001

  # Direct download
  curl -OJ "http://localhost:8001/api/exports/applications"

  # Frontend
  cd frontend && pnpm tsc --noEmit && pnpm lint
  pnpm dev
  ```
- **Observable Result**: `curl` saves `applications.xlsx`; opening it in Excel/Numbers shows headers matching the HR dashboard. In the browser, the dashboard's "Export to Excel" button downloads the same file, honoring the active job/status/min-score filters.
- **Verification**:
  ```bash
  cd backend && uv run --locked --no-sync ruff check app
  cd frontend && pnpm tsc --noEmit && pnpm lint
  ```
- **Checkpoint**: Phase 8 is functionally complete — export endpoint live, download works from the browser, columns match the dashboard, no new dependencies were added (`openpyxl` + `pandas` were already pinned in `pyproject.toml`).

---

## Phase 9 — Original CV PDF Viewer

### Slice 9.1: Backend Proxy Endpoint + Frontend CV Viewer

- **Outcome**: HR can now view the original CV PDF from the dashboard. The bucket is private (per architecture rule), so a backend proxy endpoint serves the PDF bytes. The dashboard rows have a document icon button that opens the CV in a dedicated viewer page at a separate URL.

  - [`backend/app/api/routes/cv.py`](../backend/app/api/routes/cv.py): `GET /api/cv/{application_id}` — looks up `cv_storage_path` from the `applications` table, downloads the file from the private Supabase `candidate-cvs` bucket using the service-role client, and returns PDF bytes with `Content-Disposition: inline` so the browser renders it.
  - [`backend/app/main.py`](../backend/app/main.py): registered the `cv` router.
  - [`backend/app/schemas/application.py`](../backend/app/schemas/application.py): added `cv_storage_path: str | None` to `ApplicationListItem`.
  - [`backend/app/api/routes/hr.py`](../backend/app/api/routes/hr.py): `GET /api/hr/applications` list endpoint now includes `cv_storage_path` in each item.
  - [`frontend/src/lib/types.ts`](../frontend/src/lib/types.ts): added `cv_storage_path: string | null` to `ApplicationListItem`.
  - [`frontend/src/pages/hr/Dashboard.tsx`](../frontend/src/pages/hr/Dashboard.tsx): added a document icon button next to each candidate name (only shown when `cv_storage_path` is present). Clicking it opens `/hr/review/:id/cv` in a new tab. Uses `e.stopPropagation()` so the row-click navigation to the review page still works.
  - [`frontend/src/pages/hr/CvViewer.tsx`](../frontend/src/pages/hr/CvViewer.tsx): new page at `/hr/review/:id/cv`. Fetches and renders the PDF in an `<object>` tag. Shows a loading state, an error state with a download fallback, and a "Back to review" link. Includes a "Download PDF" button.
  - [`frontend/src/App.tsx`](../frontend/src/App.tsx): added `<Route path="/hr/review/:id/cv" element={<CvViewer />} />`.

- **Why**: The architecture document mandates *"The Storage bucket is private; CVs are served only through authenticated backend endpoints."* A proxy endpoint keeps the service-role key server-side and lets the frontend fetch the PDF through the same backend that enforces auth. A dedicated URL per the user request means HR can bookmark, open in a new tab, or print the CV independently.

- **Exact Commands**:
  ```bash
  cd backend && uv run --locked --no-sync ruff check app
  cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm build
  ```

- **Observable Result**: `ruff` clean, `tsc` clean, `lint` clean, `build` succeeds. On the HR dashboard, each row with a CV shows a document icon next to the candidate name; clicking it opens a full-page PDF viewer at `/hr/review/:id/cv` that renders the CV inline with a download button above.

- **Verification**: `cd backend && uv run --locked --no-sync ruff check app` passes; `cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm build` all green.

- **Checkpoint**: HR can view the original uploaded CV PDF from the dashboard with a single click, in a separate browser tab — no new dependencies, no exposed secrets, the private bucket stays private.

### Slice 9.2: Bug fixes — timeout, import, and list response

- **Outcome**: Fixed three bugs that prevented the application workflow from functioning end-to-end.

  - **Timeout fix** (`frontend/src/lib/http.ts`): increased `DEFAULT_TIMEOUT` from 15_000ms to 120_000ms. The backend pipeline (Supabase upload + PDF text extraction + OpenAI extraction + screening + AI advisor) takes 30–60+ seconds. A 15-second timeout caused every application submission to fail with "Cannot reach the server" on the frontend.
  - **ApplyForm timeout** (`frontend/src/pages/apply/ApplyForm.tsx`): added `{ timeout: 120_000 }` to the `api.post` call for the same reason.
  - **Import fix** (`backend/app/services/application_service.py`): changed `from app.models import application` to `from app.models import Application`. The `models/__init__.py` exports the `Application` **class**, not the `application` **module**. The original import shadowed the `application` parameter name used in function signatures, causing `NameError: name 'Application' is not defined` at runtime.
  - **List response fix** (`backend/app/api/routes/applications.py`): added `cv_storage_path=application.cv_storage_path` to the `ApplicationListItem` construction in `list_applications`, so the HR dashboard receives the storage path for each application.

- **Exact Commands**:
  ```bash
  cd backend && uv run --locked --no-sync ruff check app
  cd frontend && pnpm tsc --noEmit && pnpm lint && pnpm build
  ```

- **Verification**: All endpoints verified live — `POST /api/applications` returns `201` with `cv_storage_path`, `GET /api/hr/applications` includes `cv_storage_path`, `GET /api/cv/{id}` returns `200` with PDF bytes.

- **Checkpoint**: Application submission completes without timeout errors, the HR list includes CV paths, and the CV viewer page renders the original PDF from the private bucket.

---

## Phase 10 — Design System & Frontend UI Extension

### Slice 10.1: Full-Width Layout Frame & Cohesive UI Redesign

- **Outcome**: Extended the frontend layout frame and elevated the design aesthetics across all application views:
  - [`frontend/src/index.css`](../frontend/src/index.css): Removed restrictive fixed-width `width: 1126px` and border box from `#root`. Replaced with full-width responsive modern layout, standard typography resets, and clean slate/indigo styling.
  - [`frontend/src/components/Layout.tsx`](../frontend/src/components/Layout.tsx): Built a sticky glassmorphism header (`backdrop-blur-md bg-white/85`), active navigation pill indicators with Lucide icons, live AI screening engine badge, wide container frame (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`), and responsive footer.
  - [`frontend/src/pages/Home.tsx`](../frontend/src/pages/Home.tsx): Transformed into a high-impact recruitment portal with hero section, equal-height portal cards for "Candidate Application", "HR Screening Dashboard", and "Job Management", plus architecture workflow feature highlights.
  - [`frontend/src/pages/apply/ApplyForm.tsx`](../frontend/src/pages/apply/ApplyForm.tsx): Upgraded public candidate form into an interactive card with drag-and-drop PDF dropzone, real-time validation, file preview, structured contact sections, and success timeline.
  - [`frontend/src/pages/hr/Dashboard.tsx`](../frontend/src/pages/hr/Dashboard.tsx): Redesigned recruiter dashboard with Lucide KPI metric cards, multi-parameter search & filter toolbar, candidate initial avatars, score progress bars, qualification & status badges, CV quick-view buttons, and Excel export.
  - [`frontend/src/pages/hr/Jobs.tsx`](../frontend/src/pages/hr/Jobs.tsx): Enhanced job management with modern cards, skills & education chips, interactive score weight allocation sliders (Skills %, Experience %, Education %, Other %), and modal dialog.
  - [`frontend/src/pages/hr/Review.tsx`](../frontend/src/pages/hr/Review.tsx): Extended candidate assessment page with tabbed views (Profile, AI Screening Report, Audit Trail), alignment discrepancy warnings, and candidate decision actions.

- **Why**: The starter layout had a fixed 1126px width with side borders, causing the interface to look boxed in on modern displays with unequal sizing between pages. Expanding the frame to full-width responsive layouts provides equal visual weight, enhanced readability, and a cohesive enterprise feel.

- **Exact Commands**:
  ```bash
  cd frontend && pnpm build && pnpm lint
  ```

- **Observable Result**:
  - Full-width modern interface across all pages on `http://localhost:5174`.
  - Cohesive layout and responsive sizing between "Create a job", "Apply for positions", and "HR Dashboard".
  - Clean TypeScript compilation and zero build errors.

- **Checkpoint**: Frontend frame is extended to full width with consistent, polished design tokens and seamless navigation.

### Slice 10.2: AI-Driven CV Extraction & Modular Screening Engine

- **Outcome**: Upgraded the resume extraction prompts and deterministic screening engine:
  - [`backend/app/ai/prompts/resume_extraction.py`](../backend/app/ai/prompts/resume_extraction.py): Enhanced system prompt to extract technical and professional skills comprehensively from all resume sections, calculate total experience duration across employment history, handle OCR/PDF formatting anomalies and human typos, and extract canonical industry terms alongside standard acronyms (e.g. Prompt Engineering, Retrieval-Augmented Generation / RAG, Large Language Models / LLM).
  - [`backend/app/ai/prompts/screening_advisor.py`](../backend/app/ai/prompts/screening_advisor.py): Clarified semantic alignment instructions so the AI advisor recognizes direct synonyms, acronyms, and phrasing variations (Prompt Optimization / Prompt Design, RAG, LLM, Analytical Thinking) while maintaining strict technology boundaries.
  - [`backend/app/providers/resume_extractor.py`](../backend/app/providers/resume_extractor.py): Kept extraction temperature at the model default (`1`) because `gpt-5-mini` rejects any other value (`Unsupported value: 'temperature' does not support 0.0`). Pinning `0.0` broke the whole intake flow with `DOCUMENT_PROCESSING_FAILED`.
  - [`backend/app/services/validation_service.py`](../backend/app/services/validation_service.py): Enhanced experience calculation fallback with robust regex-based date parsing (`_parse_year_month` supporting month names, `YYYY-MM`, `MM/YYYY`, `YYYY`, `Present`) to compute actual years from work history whenever direct year extraction is zero or missing.
  - [`backend/app/services/screening_service.py`](../backend/app/services/screening_service.py): Kept the engine clean and modular without hardcoding domain dictionaries — implemented generic string/token normalization (`_normalize_skill` and token subset matching) and fixed the character-splitting education matching bug in `_matches_any_education`.

- **Why**: Eliminates brittle hardcoded skill lists in Python code. Instead, the AI handles semantic understanding, normalization, and alignment from the job description and CV text, while the deterministic screening service remains generic, modular, and reliable.

- **Exact Commands**:
  ```bash
  cd backend && uv run --locked --no-sync ruff check .
  ```

- **Observable Result**:
  - `ruff` passes cleanly (`All checks passed!`).
  - Modular AI-driven extraction and semantic alignment link candidate credentials to job requirements accurately without hardcoded code lists.
  - Total experience years are properly calculated and scored.
  - Education matches correctly with degree equivalencies (Bachelor, Master, Diploma).

- **Checkpoint**: Deterministic screening engine is modular and domain-agnostic, while AI prompt engineering handles semantic normalization and alignment faithfully.