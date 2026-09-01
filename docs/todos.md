# Implementation Guide — AI-Assisted HR Recruitment Screening Platform

This file is our build order: the best path from an empty repo to a working system.
Each phase is a **working, verifiable slice** — do not move on until its checkpoint passes.

**How to use this guide:** do the phases in order. Check the box as you finish. Read `docs/architecture.md` first if you haven't — this file executes that design.

---

## Ground Rules (every slice)

1. **No dependency without approval.** Exact pin, one-line reason, commit the lockfile.
2. **Verify each slice** before moving on:
   - Backend → `uv sync --locked` then `uv run --locked --no-sync ruff check app scripts`
   - Frontend → `pnpm tsc --noEmit` and `pnpm lint`
   - Then walk the slice's user story in the browser.
3. **Fictional data only.** Never commit `.env`, keys, uploaded CVs, or databases.
4. **Update this checklist** as you complete items (tick the box).

---

# Phase 0 — Project Foundation

**Goal:** both apps boot and talk to each other over a health endpoint.

- [x] **0.1** Folders are already canonical: `backend/`, `frontend/`, `docs/`. `docs/architecture.md` and `docs/client-brief.md` define the design and the *why*. *(done)*
- [x] **0.2** Backend scaffold: `app/main.py` (FastAPI + `/health`), `app/core/config.py` (Pydantic Settings — only config boundary), `app/db/session.py`, `app/db/base.py`, `app/.gitkeep` replaced by real modules.
- [x] **0.3** Spend `OPENAI_API_KEY`, etc. via `config.py` from `backend/.env` (copy from `.env.example`). Never `os.getenv` outside `config.py`.
- [x] **0.4** Frontend scaffold: `frontend/` Vite + React + TS strict + Tailwind + React Router. Add `src/lib/env.ts` (validates `VITE_*` at boot) and `src/lib/api.ts`/`http.ts` (fetch client to `VITE_API_BASE_URL`).
- [ x **0.5** `GET /health` wired; frontend calls it on load.
- [x] **Checkpoint:** backend boots, frontend boots, health check succeeds in the browser. Both lint clean.

---

# Phase 1 — Supabase Setup

**Goal:** Postgres + private storage bucket are configured and reachable.

- [x] **1.1** Create a Supabase project (see `docs/guides/supabase-setup.md`).
- [x] **1.2** Collect `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (direct/session, not pooler) into `backend/.env`.
- [x] **1.3** Add Alembic to the backend (**approval needed** for the dep). Configure `alembic/env.py` to read `DATABASE_URL` from `config.py`.
- [x] **1.4** Create private Storage bucket `candidate-cvs` (no public access).
- [x] **Checkpoint:** `uv run alembic upgrade head` succeeds against an empty schema; an authenticated Storage upload+download round-trips from a script.

---

# Phase 2 — Database Models

**Goal:** schema created through Alembic; repositories can persist.

- [x] **2.1** SQLAlchemy models + first migration: `jobs` (title, `min_experience_years`, `required_skills`, `education_requirements`, `score_weights`, `is_open`).
- [x] **2.2** Models: `candidates` (name, email) and `applications` (job FK, candidate FK, `status`, `cv_storage_path`, `cv_metadata`, `applied_at`).
- [x] **2.3** Models: `candidate_profiles_form` (form-submitted ground-truth snapshot), `candidate_profiles_pdf` (extracted data + provenance + `alignment_check` vs form), `screening_results` (score, breakdown, evidence).
- [x] **2.4** Models: `hr_decisions` and `audit_log`.
- [x] **2.5** Repositories: `candidate_repository.py`, `application_repository.py`, `screening_repository.py`, `audit_repository.py`.
- [x] **Checkpoint:** one migration applies cleanly; every model round-trips via a quick `uv run python` script.

---

# Phase 3 — Application Intake

**Goal:** a candidate can submit; the CV lands in Storage; the record lands in the DB.

- [x] **3.1** Schemas (`app/schemas/`): job create/read, application create/read.
- [x] **3.2** `application_service.py`: validate PDF type + size, upload to Storage, insert candidate + application, set status `APPLICATION_SUBMITTED`.
- [x] **3.3** Routes: `POST /api/jobs`, `GET /api/jobs`, `POST /api/applications` (multipart), `GET /api/applications`.
- [x] **3.4** Frontend public form: pick job, name/email, attach PDF, submit, success/error states.
- [x] **Checkpoint:** upload a fictional CV → row + Storage object created, `SUBMITTED`.

---

# Phase 4 — Document Processing & AI Extraction

**Goal:** a CV's text becomes a validated structured profile.

- [x] **4.1** PDF text extraction (**approval needed**: proposed `pypdf==4.3.1` vs local) in `document_service.py`.
- [x] **4.2** Adapter under `app/providers/`: extraction prompt (`ai/prompts/resume_extraction.py`) + output schema (`ai/schemas/candidate_profile.py`). OpenAI SDK types stop here.
- [ ] **4.3** Validation pipeline: Pydantic → business bounds → deterministic merge with provenance tags (`ai`/`deterministic`/`manual`) → alignment check of extracted identity fields against the form ground truth (mismatches recorded, HR-facing, never auto-corrected).
- [ ] **4.4** Wire into the flow: on submit, process → validate → persist `candidate_profiles_pdf`; status → `SCREENING`, or `DOCUMENT_PROCESSING_FAILED` → `MANUAL_REVIEW` on failure.
- [ ] **4.5** Frontend: show extracted profile (skills, experience, education) on the detail view.
- [ ] **Checkpoint:** fictional CV → structured profile appears with provenance markers; a broken PDF routes to manual review.

---

# Phase 5 — Deterministic Screening

**Goal:** an explainable, reproducible score.

- [ ] **5.1** `screening_service.py`: pure rule-based scoring (experience points, per-skill match, education match) from `score_weights`. Zero AI.
- [ ] **5.2** Produce total score + per-category breakdown + evidence (matched snippets).
- [ ] **5.3** Persist `screening_results`; status → `HR_REVIEW`. Block recompute after an HR decision.
- [ ] **5.4** Frontend: score panel with expandable breakdown + evidence.
- [ ] **Checkpoint:** a strong and a weak CV get visibly different, explainable scores.

---

# Phase 6 — HR Dashboard & Decision Gate

**Goal:** HR reviews and decides; the state locks.

- [ ] **6.1** Routes: `GET /api/hr/applications` (filter by job/status/score), `GET /api/hr/applications/{id}` (dossier: profile + screening + history).
- [ ] **6.2** Route: `POST /api/hr/applications/{id}/decision` — enforce the state machine (approve/reject, terminal, one decision).
- [ ] **6.3** Frontend: applications table (sort/filter) and a detail page with tabs (Profile / Screening / History) + approve/reject with confirm.
- [ ] **6.4** Audit event on every stage transition (created, processed, extracted, screened, decided).
- [ ] **Checkpoint:** full loop works: review → decide → decision persisted, irreversible, audited.
- [ ] *(Auth comes in Phase 9 — this slice can run unprotected for now.)*

---

# Phase 7 — Candidate Email

**Goal:** notification fires only after an HR decision.

- [ ] **7.1** `email_service.py`: draft approval/rejection email; transport behind a `EmailTransport` interface.
- [ ] **7.2** MVP transport: console/file (`EMAIL_TRANSPORT=file`, `EMAIL_OUT_DIR`) — no external service yet.
- [ ] **7.3** Trigger on decision; log the rendered copy to `audit_log` (`EMAILED`).
- [ ] **Checkpoint:** approving/rejecting produces the correct email file + audit entry.

---

# Phase 8 — Excel Export

**Goal:** HR downloads `.xlsx` from Postgres.

- [ ] **8.1** Add **`openpyxl==3.1.5`** *(approved)* to the backend; `export_service.py` builds a workbook from the DB (name, email, position, applied, score, screening decision, HR decision, decision date).
- [ ] **8.2** Route `GET /api/exports/applications` returning `spreadsheetml.sheet` with a download header.
- [ ] **8.3** Frontend: export button (optionally filtered by job).
- [ ] **Checkpoint:** file opens in Excel/Numbers; columns match the dashboard. See `docs/guides/excel-export-setup.md`.

---

# Phase 9 — Auth & Hardening

**Goal:** locked-down, production-credible vertical slice.

- [ ] **9.1** Supabase email auth for HR routes: protect `api/hr/*` and `api/exports/*` with a JWT bearer (supabase-js + backend guard). Public `/applications` stays open.
- [ ] **9.2** Error handling: consistent API error shape, friendly empty/error states, structured logging.
- [ ] **9.3** Security pass: no secrets in the client, `service_role` server-only, bucket private, input validated at every boundary.
- [ ] **9.4** Full end-to-end walkthrough of the fictional corpus: apply → extract → screen → review → decide → email → export → inspect audit trail.
- [ ] **9.5** Finish `docs/build-along.md` teaching guide covering every slice.
- [ ] **Checkpoint:** all checks green from a clean `uv sync --locked` + `pnpm install --frozen-lockfile`.

---

# Ready Now vs. Needs Approval

**Can start immediately (no new deps):** Phase 0, and most of Phases 2–3 (models, repos, intake) once Alembic/Supabase are wired.

**Needs approval before starting:**
- [ ] **Wait:** Alembic (Phase 1.3) — proposed to add
- [ ] **Wait:** PDF extraction (Phase 4.1) — `pypdf==4.3.1` proposed
- [ ] **Approved:** `openpyxl==3.1.5` (Phase 8.1)

---

## Explicity Out of Scope

Interview scheduling, calendars, WhatsApp/meetings, auto-hire/auto-reject, pipeline analytics, advanced dashboards — future phases only if you approve new requirements.