# Backend App — AI-Assisted HR Recruitment Screening

## How It Works (Current Flow)

1. **HR creates a job** — `POST /api/jobs` with title, description, requirements, score weights
2. **Candidate applies** — `POST /api/applications` (multipart: name, email, job_id, PDF CV)
3. **System stores CV** — PDF → Supabase Storage (`candidate-cvs` bucket, private)
4. **Form snapshot saved** — Candidate's declared data → `candidate_profiles_form` (immutable ground truth)
5. **PDF extracted** — `document_service.pdf_to_text()` + OpenAI `resume_extractor` → structured `CandidateProfileExtracted`
6. **Deterministic screening** — Rule-based scoring (skills, experience, education, certifications) from `job.score_weights`
7. **AI advisor (optional)** — GPT-5-mini evaluates profile vs job description, outputs per-requirement assessments
8. **HR reviews** — Dashboard shows score, breakdown, evidence, AI advisor flags
9. **HR decides** — `POST /api/hr/applications/{id}/decision` (approve/reject, irreversible, audited)

---

## Implemented (Phases 0–4)

| Area | Status |
|------|--------|
| Project scaffold (FastAPI + React + health check) | ✅ |
| Supabase Postgres + private Storage bucket | ✅ |
| Alembic migrations (8 tables) | ✅ |
| Models: jobs, candidates, applications, form/PDF profiles, screening, HR decisions, audit log | ✅ |
| Repositories for all tables | ✅ |
| Job CRUD + Application intake (PDF validation, storage, form snapshot) | ✅ |
| PDF → text (pypdf) + markdown/chunks (docling) | ✅ |
| AI extraction: prompt + schema + OpenAI provider (sealed in `app/providers/`) | ✅ |
| AI screening advisor: prompt + schema + provider + `ai_advice` column | ✅ |
| Job free-text `description` field for AI context | ✅ |
| Deterministic screening service (skills/experience/education/certs) | ✅ |

---

## Next Steps (In Order)

| Phase | Task | Key Files to Touch |
|-------|------|-------------------|
| **4.3–4.4** | Wire extraction into intake flow: on submit → extract → validate → merge with provenance → alignment check vs form → persist `candidate_profiles_pdf` + set status `SCREENING` / `MANUAL_REVIEW` | `application_service.py`, `document_service.py`, new validation/merge logic, `profile_repository.py` |
| **4.5** | Frontend: display extracted profile (skills, experience, education) on detail view | `frontend/src/pages/hr/Review.tsx` |
| **5** | Deterministic screening engine: produce score + breakdown + evidence snippets; persist `screening_results`; status → `HR_REVIEW` | `screening_service.py`, `screening_repository.py` |
| **5.4** | Frontend: score panel with expandable breakdown + evidence | `frontend/src/pages/hr/Review.tsx` |
| **6** | HR dashboard: applications table (filter/sort), detail tabs (Profile / Screening / History), approve/reject with confirm | `hr` routes, new dashboard components |
| **7** | Email notifications on decision (file transport MVP) | `email_service.py`, `audit_repository.py` |
| **8** | Excel export (`openpyxl`) | `export_service.py`, export route, frontend button |
| **9** | Supabase Auth on `/api/hr/*` + `/api/exports/*`, security pass, full e2e walkthrough | middleware, config, frontend auth |

---

## Run Locally

```bash
# Terminal 1 — Backend
cd backend
uv run uvicorn app.main:app --reload --port 8001

# Terminal 2 — Frontend
cd frontend
pnpm dev
```

- Backend: `http://localhost:8001` (health: `/health`)
- Frontend: `http://localhost:5174`
- API base: `VITE_API_BASE_URL=http://localhost:8001`

---

## Key Architectural Boundaries

- **Config** → only `app/core/config.py` (Pydantic Settings)
- **OpenAI SDK** → only `app/providers/*.py`
- **Storage** → Supabase `candidate-cvs` bucket (private); DB stores paths only
- **Validation** → Pydantic schemas at every boundary
- **Provenance** → every extracted field tagged `ai`/`deterministic`/`manual`