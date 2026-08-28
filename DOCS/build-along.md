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