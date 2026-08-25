# AI-Assisted HR Recruitment Screening Platform

Read `docs/client-brief.md`, `docs/architecture.md`, and `docs/build-along.md` before changing the project.

## Stack

- Backend: Python 3.12+, uv, FastAPI, Pydantic v2, SQLAlchemy 2, SQLite, Supebase, PostgressSQL
- Frontend: Vite, React, TypeScript strict, Tailwind CSS, pnpm.
- Verification: Ruff for backend; TypeScript, ESLint, production build, explicit live evaluators, and a manual browser walkthrough for the complete flow.

## Boundaries

- OpenAI SDK types stop in the provider adapters under `backend/app/providers/`, including document review, GL suggestion, and correction-email drafting.
- The document reviewer receives the original PDF returns classification plus provider-independent structured fields. Document Intelligence remains primary; deterministic merging only fills its missing fields and exposes provenance.
- Once those modules are introduced, settings are read only through `backend/app/config.py` and `frontend/src/lib/env.ts`.


## Dependencies

- Never add a dependency without asking Tasya first.
- Every dependency must earn its place. If only a small function is needed, propose implementing that function locally instead.
- Never run `uv add`, `pip install`, or `pnpm add` without explicit approval.
- When proposing a package, give the exact pinned version and one sentence explaining why it is better than local code.
- Pin direct dependencies exactly and commit `backend/uv.lock` and `frontend/pnpm-lock.yaml`.
- Keep `[tool.uv] add-bounds = "exact"` and `exclude-newer = "7 days"` in `backend/pyproject.toml`.
- Keep `savePrefix: ""`, `minimumReleaseAge: 10080`, and `minimumReleaseAgeStrict: true` in `frontend/pnpm-workspace.yaml`.
- Install with `uv sync --locked` and `pnpm install --frozen-lockfile`.
- Commands that must only run the existing backend environment use `uv run --locked --no-sync`.
- A cooldown exception requires explicit approval, a package/version-specific scope, and an adjacent explanation.

## Teaching guide

Update `docs/build-along.md` in the same commit as every working slice. Include the outcome, why, exact commands, observable result, and checkpoint.

## Verification policy

- Do not add automated test suites, `tests/` directories, or `*.test.*` files to this end-to-end teaching project.
- Keep verification proportional and demo-oriented: verify locked installs on the starter; as code is added, lint the backend, type-check/lint/build the frontend, exercise the fictional corpus evaluators when cloud usage is intended, and manually walk through the user story in the browser.
- Keep deterministic business rules and provider boundaries explicit and easy to inspect even though they are not backed by a committed unit-test suite.
Candidate CVs and documents should be stored using:
- Supabase Storage, and the database should store references/metadata rather than unnecessarily storing binary document contents directly.

## Secrets and data

Never commit `.env`, or any sensitive key, uploaded the Cv pdf, private documents, or SQLite databases. Generated samples must contain only fictional data.
