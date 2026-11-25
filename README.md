# AI-Assisted HR Recruitment Screening Platform

An AI-assisted recruitment platform that reduces repetitive HR work during candidate screening.

The system accepts applications through a website, processes candidate documents, extracts structured information using AI, calculates a transparent screening score, and presents the results to HR. HR remains responsible for the final decision; the system then prepares the candidate email based on that decision.

> **Core principle: AI assists the recruitment process. It never controls it.**

---

## The core of the application

This section explains what the platform actually does and why it exists, in plain language. The authoritative engineering detail lives in [`docs/architecture.md`](docs/architecture.md); this is the reader-oriented overview.

### The problem it solves

A job opening can attract hundreds of applications. For each one, an HR employee traditionally has to open the CV, read it, find skills and experience, compare them against the job requirements, copy the details into a spreadsheet, calculate a score, decide who moves forward, and write an email. None of those steps is difficult on its own — but repeated 300 times they consume most of the recruiter's day and produce inconsistent results, because every person interprets a CV slightly differently.

The real problem is therefore **not** "HR has too many CVs". It is:

> HR spends valuable time on repetitive information-processing instead of on the human judgment that recruitment actually needs.

This platform automates the information-processing and leaves the judgment with HR. It turns an unstructured PDF into structured, verifiable data, scores it with rules anyone can inspect, and keeps a complete record of what happened — while the approval or rejection is always a human decision.

### The central design idea: reading and deciding are separate jobs

The most important thing to understand is that the AI is given exactly **one** job: read a CV and turn it into structured data. It cannot move an application forward, cannot calculate the official score, and cannot contact a candidate.

| Concern | Who owns it |
|---|---|
| Turning unstructured CV text into structured fields (skills, experience, education) | AI (OpenAI), behind a provider adapter |
| Deciding whether that extracted data is trustworthy | Deterministic validation code |
| Scoring the candidate against the job's requirements | Deterministic rules engine — zero AI |
| Explaining the score | Score breakdown + evidence, stored with the result |
| Approving or rejecting the candidate | HR only — a hard, terminal decision gate |
| Preparing the candidate email | System, derived from the HR decision, for HR to review and send |
| State transitions, permissions, persistence, audit history | Application code |

That boundary is the whole point. AI is used because CVs are unstructured — a sentence like *"five years building backend services"* is easy for a person and hard for a traditional database. But once the text has been converted into numbers and fields, everything consequential is handled by ordinary, inspectable code.

### The life of one application, end to end

1. **Apply** — a candidate fills in a public form (name, email, job) and uploads a PDF CV. The form is intentionally the starting point: it is the candidate's own claim about who they are.
2. **Validate and store** — the API checks the fields and the file (PDF type, size, magic bytes), uploads the PDF to a **private** Supabase Storage bucket, and saves only the path and metadata in the database — never the binary.
3. **Snapshot the form** — exactly what the candidate typed is stored immutably in its own table. This becomes the "ground truth" used later to detect extraction errors.
4. **Read the CV** — the document service converts the PDF into plain text.
5. **Extract with AI** — a narrow prompt with a strict JSON schema asks the AI only for structured fields: skills, roles, dates, education, certifications, languages.
6. **Validate the extraction (3 layers)** — the output is checked before anything is trusted:
   - **Schema** — Pydantic rejects malformed or wrongly typed output (one retry is allowed).
   - **Business sanity** — implausible values (e.g. 90 years of experience) are rejected, not silently adjusted.
   - **Deterministic merge + alignment** — missing fields are filled by local parsing, every field gets a provenance tag (`ai` / `deterministic` / `manual`), and extracted identity fields are compared against the form. A mismatch is **flagged for HR, never auto-corrected**.
7. **Score deterministically** — the rules engine compares the validated profile with the job's requirements (skills, experience, education, certifications), using the job's own score weights. It produces a total score, a per-category breakdown, and the evidence behind each number. A candidate is "qualified" when the score clears a transparent threshold (60% of the maximum possible score). The same input always produces the same score.
8. **Add an advisory assessment** — a separate AI advisor reviews the full job description and explains, per requirement, whether it is verified, missing, or unverifiable. It also writes a one-sentence "why this verdict" summary and a recommendation for HR. This is **advice only** — it informs HR but never changes the official score or outcome.
9. **Review** — HR opens a dossier containing the extracted profile (with provenance badges and mismatch warnings), the score card with breakdown and evidence, the AI summary, the original CV PDF, and the full audit history.
10. **Decide** — HR clicks Approve or Reject. This is a hard state-machine gate: a decision is terminal, irreversible, and can only be made once. No automation can reach this state on its own.
11. **Notify and record** — the decision determines which candidate email draft is prepared, and every step (submitted, extracted, screened, decided, emailed) is appended to an audit log with who, what, when, and a payload snapshot.

At any point HR can export the current view — with filters applied — to Excel, and open the original uploaded CV in its own viewer page.

### Why the results can be trusted

Four details make this more than a "CV + prompt" demo:

- **Two independent sources of truth.** The form and the PDF are stored separately so the system can compare them. If the AI reads a different email address than the candidate typed, HR sees a mismatch warning instead of a silently wrong profile.
- **Provenance on every field.** HR can see whether a value came from the AI, from deterministic parsing, or from manual entry. Trust is visible, not assumed.
- **Explainable, reproducible scores.** There is no single opaque number. Every score comes with a threshold, a category breakdown, and matched/missing evidence. The engine contains no AI, so it is deterministic and auditable.
- **A terminal human gate and an audit trail.** The workflow forbids skipping review, going backwards, or deciding twice. Every transition is logged, so the question "who approved this, and when?" always has an answer.

### What the system deliberately does NOT do

Automation is bounded on purpose. The platform does **not** automatically hire or reject anyone, schedule interviews, manage calendars, send messages outside the defined email flow, or replace HR judgment. These are excluded to keep the system simple and to keep consequential decisions with people.

### Where to go deeper

- [`docs/client-brief.md`](docs/client-brief.md) — the 10 business gaps, before/after workflow, and expected value.
- [`docs/architecture.md`](docs/architecture.md) — component diagram, state machine, validation pipeline, and data model.
- [`docs/build-along.md`](docs/build-along.md) — each implemented slice with commands, observable results, and checkpoints.

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
uv run uvicorn app.main:app --reload --port 8001
```

Frontend:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Setup guides live in [`docs/guides/`](docs/guides/). The MVP build order and verification policy are in [`docs/todos.md`](docs/todos.md) and [`AGENTS.md`](AGENTS.md).