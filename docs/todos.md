# Build Plan — AI-Assisted HR Recruitment Screening Platform

Ordered, slice-by-slice implementation plan. Each phase ends in a working, verifiable increment.
Follows `client-brief.md` (MVP scope) and `architecture.md` (system boundaries).

Ground rules for every slice:
- No new dependency without approval (exact pins, commit lockfiles).
- Update `docs/build-along.md` in the same commit as every working slice.
- Verify each slice: backend → `uv sync --locked` + `uv run --locked --no-sync ruff check app scripts`; frontend → typecheck + lint + build; plus manual browser walkthrough of the slice's user story.
- Fictional data only. Never commit `.env`, keys, uploaded CVs, or databases.

---

## Phase 0 — Project Foundation

- [x] **0.1** Restructure to canonical layout: rename `Backend/` → `backend/`, `Frontend/` → `frontend/`, `DOCS/` → `docs/` (AGENTS.md references lowercase paths); move `Architecture .md` → `docs/architecture.md` (fix space-in-name).
- [ ] **0.2** Scaffold backend `app/` skeleton: `main.py` (FastAPI app, health endpoint), `core/config.py` (Pydantic Settings — the only config boundary), `db/session.py`, `db/base.py`.
- [ ] **0.3** Scaffold frontend with Vite + React + TypeScript strict + Tailwind CSS; add `src/lib/env.ts` as the only frontend env boundary; set up pnpm with locked install (`savePrefix: ""`, `minimumReleaseAge` rules in `pnpm-workspace.yaml`).
- [ ] **0.4** Create `frontend/src/lib/api.ts` typed client pointing at the FastAPI health endpoint; verify end-to-end (backend running, frontend fetches `/health`).
- [ ] **Checkpoint:** both apps boot, lint clean, health check works from browser.

## Phase 1 — Supabase Setup (Database + Storage)

- [ ] **1.1** Create Supabase project per `docs/guides/supabase-setup.md`; collect URL / anon key / service_role key / direct connection string into `.env` (gitignored) wired through `config.py`.
- [ ] **1.2** Set up Alembic in the backend against Supabase Postgres (session pooler for runtime, direct connection for migrations).
- [ ] **1.3** Create private Storage bucket for candidate CVs (e.g. `candidate-cvs`); confirm service-role-only access policy.
- [ ] **Checkpoint:** `alembic upgrade head` succeeds against an empty schema; a test upload/delete round-trips via Storage.

## Phase 2 — Data Model & Migrations

- [ ] **2.1** SQLAlchemy models + Alembic migration: `jobs` (position, requirements: min years, required skills, education, weights).
- [ ] **2.2** Models: `candidates` (name, email, contact info) and `applications` (job FK, candidate FK, status enum, storage path/metadata reference — never binary content in DB).
- [ ] **2.3** Models: `candidate_profiles` (AI-extracted structured profile + provenance fields), `screening_results` (score, breakdown JSON, evidence JSON).
- [ ] **2.4** Models: `hr_decisions` (approve/reject, reviewer, decided_at, notes) and `audit_log` (event type, application FK, timestamp, payload snapshot).
- [ ] **Checkpoint:** single migration applies cleanly; models round-trip via a quick script.

## Phase 3 — Application Intake (Upload Workflow)

- [ ] **3.1** Schemas: job create/read, application create/read (`schemas/` layer).
- [ ] **3.2** Repositories: candidate, application, job (`repositories/` layer owning SQLAlchemy access).
- [ ] **3.3** Services: `application_service.py` — create candidate+application, validate PDF (type/size), upload CV to Supabase Storage, store only path/metadata in DB.
- [ ] **3.4** Routes: `POST /api/jobs`, `GET /api/jobs`, `POST /api/applications` (multipart upload), `GET /api/applications`; thin routes, status-code translation only.
- [ ] **3.5** Frontend: public application form — pick job, enter name/email, attach CV PDF, submit with success/error states.
- [ ] **Checkpoint:** submit a fictional CV through the browser → row appears in DB, file lands in Storage.

## Phase 4 — Document Processing & AI Extraction

- [ ] **4.1** `services/document_service.py`: fetch CV from Storage, extract text from PDF (choose library with Tasya's approval — e.g. pinned `pypdf` vs local extraction).
- [ ] **4.2** Provider adapter under `app/providers/`: OpenAI SDK types stop here. Resume-extraction prompt in `ai/prompts/resume_extraction.py`; output schema in `ai/schemas/candidate_profile.py`.
- [ ] **4.3** Validation pipeline: raw LLM output → Pydantic validation → business validation (sanity bounds on years/skills) → deterministic merge with Document Intelligence-style primary source; missing fields filled deterministically with explicit provenance.
- [ ] **4.4** Wire into application flow: on upload, run processing → persist `candidate_profiles` with extraction status; handle failures gracefully (retryable vs rejected).
- [ ] **4.5** Frontend: show extracted profile (experience, skills, education) on the application detail view.
- [ ] **Checkpoint:** upload the fictional sample CV → structured profile appears with correct fields and provenance markers.

## Phase 5 — Deterministic Screening Engine

- [ ] **5.1** `services/screening_service.py`: pure, rule-based scoring against job requirements — experience points, per-skill match points, education match, configurable weights. No AI involvement.
- [ ] **5.2** Produce score + full breakdown (per-category earned/max) + evidence (which skill matched where, which requirement triggered what).
- [ ] **5.3** Persist `screening_results`; recompute allowed only until HR decision is recorded.
- [ ] **5.4** Frontend: score display with expandable breakdown and evidence on the application detail view.
- [ ] **Checkpoint:** two fictional CVs (strong/weak fit) produce visibly different, explainable scores.

## Phase 6 — HR Dashboard & Decision Gate

- [ ] **6.1** Routes: `GET /api/hr/applications` (list with filters by job/status/score), `GET /api/hr/applications/{id}` (full dossier: profile + screening + audit history).
- [ ] **6.2** Routes: `POST /api/hr/applications/{id}/decision` (approve/reject + reviewer identity); enforce state machine — one final decision per application, no transitions after decision.
- [ ] **6.3** Frontend: HR dashboard — applications table (sortable/filterable), detail page with tabs (Profile / Screening / History), approve & reject actions with confirmation step.
- [ ] **6.4** Audit events emitted at every stage transition (application created, CV processed, extraction completed, screening completed, HR decided).
- [ ] **Checkpoint:** full human-in-the-loop flow works: review dossier → decide → decision persisted, immutable, audited.

## Phase 7 — Candidate Email Notification

- [ ] **7.1** `services/email_service.py`: draft approval/rejection emails only after HR decision; provider adapter isolates any SDK types.
- [ ] **7.2** Optional AI-assisted email drafting stays behind deterministic guardrails (tone/name insertion only — never alters the decision or facts).
- [ ] **7.3** Record email-sent event in audit log; store rendered copy for reference.
- [ ] **7.4** For MVP/dev: send-to-console/file transport behind config flag; real SMTP/provider only when Tasya approves the dependency.
- [ ] **Checkpoint:** approving a candidate produces the correct email draft logged + audit entry; same for rejection.

## Phase 8 — Excel Export & Reporting

- [ ] **8.1** `services/export_service.py`: generate `.xlsx` from applications (name, email, position, applied date, score, screening outcome, HR decision, decision date). **Approved: `openpyxl==3.1.5`** (pure-Python xlsx writer, no transitive deps; pandas not needed — build rows directly).
- [ ] **8.2** Route: `GET /api/exports/applications?job_id=...` streaming file response.
- [ ] **8.3** Frontend: export button on HR dashboard (optionally filtered by job).
- [ ] **Checkpoint:** export opens in Excel/Numbers with correct columns and rows matching the dashboard.

## Phase 9 — Hardening & Final Verification

- [ ] **9.1** Error handling pass: consistent API error responses, friendly frontend error/empty states, logging via structlog.
- [ ] **9.2** Security pass: no secrets in client bundle, service_role only server-side, Storage bucket private, input validation on all boundaries.
- [ ] **9.3** Full end-to-end walkthrough with the fictional corpus: apply → extract → screen → review → decide → email → export → inspect audit trail.
- [ ] **9.4** Final checks green: `ruff check`, frontend typecheck/lint/build, fresh `uv sync --locked` + `pnpm install --frozen-lockfile` from clean checkout.
- [ ] **9.5** Finish `docs/build-along.md` teaching guide covering every slice.

---

## Explicitly Out of Scope (do not build)

Interview scheduling, calendars, WhatsApp/meetings, auto-hire/auto-reject, candidate pipeline analytics, advanced dashboards — future phases only if approved as new requirements.

## Decisions Log

| # | Topic | Decision | Status |
|---|-------|----------|--------|
| 1 | **PDF Text Extraction** | Python-based text extraction (`pypdf == 4.3.1` vs local extractor) to extract plain text from uploaded CV PDFs before sending to OpenAI | Under Review |
| 2 | **Email Delivery Provider** | Pluggable transport: Console/file for local dev; choice between Resend, SendGrid, or SMTP for prod | Under Review |
| 3 | **Excel Writer Library** | Pinned `openpyxl == 3.1.5` for streaming `.xlsx` exports in Phase 8 | **Approved** |
| 4 | **HR Dashboard Auth** | Supabase Email / Password Auth for HR recruiters (public portal remains unauthenticated) | **Approved** |

