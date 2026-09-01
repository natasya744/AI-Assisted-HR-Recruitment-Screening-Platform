# Backend App — Module Map & How They Connect

```
backend/app/
├── main.py                    # FastAPI entry point, routes, CORS, health
├── core/                      # Single config boundary
├── db/                        # SQLAlchemy engine + session
├── models/                    # ORM tables (8 tables)
├── schemas/                   # Pydantic request/response contracts
├── repositories/              # Raw SQL/ORM queries (DB only)
├── services/                  # Business logic, orchestrate repos + providers
├── providers/                 # OpenAI SDK isolated here (only place)
├── ai/                        # AI schemas + prompts (no SDK)
└── api/routes/                # HTTP layer: parse → call service → return
```

---

## 1. `core/config.py` — Single Source of Truth

```python
# Reads .env once, exposes typed Settings
settings.OPENAI_API_KEY
settings.DATABASE_URL
settings.SUPABASE_STORAGE_BUCKET
```

**Used by:** Everything. No `os.getenv()` anywhere else.

---

## 2. `db/session.py` + `db/base.py` — DB Plumbing

```python
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def get_db():  # FastAPI dependency
    db = SessionLocal()
    try: yield db
    finally: db.close()
```

**Used by:** All repositories via `Depends(get_db)`.

---

## 3. `models/*.py` — SQLAlchemy Tables (8 Tables)

| Model | Table | Purpose |
|-------|-------|---------|
| `Job` | `jobs` | Job postings with skills, weights, description |
| `Candidate` | `candidates` | Person (email = unique) |
| `Application` | `applications` | Links candidate + job + CV storage path |
| `CandidateProfileForm` | `candidate_profiles_form` | **Ground truth** — what candidate typed |
| `CandidateProfilePdf` | `candidate_profiles_pdf` | **AI extraction** — what LLM read from PDF |
| `ScreeningResult` | `screening_results` | Deterministic score + AI advisor JSON |
| `HRDecision` | `hr_decisions` | Human review outcome |
| `AuditLog` | `audit_logs` | Immutable event trail |

**Key design:** Form & PDF profiles are **separate tables** — enables alignment check (anti-hallucination).

---

## 4. `schemas/*.py` — API Contracts (Pydantic)

```python
# schemas/job.py
class JobCreate(BaseModel):
    title: str
    required_skills: list[str]
    score_weights: dict[str, float]

class JobRead(JobCreate):
    id: UUID
    created_at: datetime
```

**Used by:** Routes (request/response validation), services (typed data passing).

---

## 5. `repositories/*.py` — Pure DB Operations

```python
# job_repository.py
def create(db, data: JobCreate) -> Job: ...
def get(db, job_id: UUID) -> Job | None: ...
def list_open(db) -> list[Job]: ...

# candidate_repository.py
def get_by_email(db, email) -> Candidate | None: ...
def create(db, **kwargs) -> Candidate: ...
```

**Rule:** No business logic. Only `SELECT/INSERT/UPDATE`. Services call these.

---

## 6. `providers/*.py` — Only Place OpenAI SDK Lives

```python
# resume_extractor.py
def extract_resume(cv_text: str) -> ExtractionResult:
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(...)
    return ExtractionResult(profile=CandidateProfileExtracted(...), success=True)
```

**Boundary:** Rest of app sees only `CandidateProfileExtracted` (Pydantic), never `openai` types.

---

## 7. `ai/schemas/*.py` + `ai/prompts/*.py` — AI Data Shapes & Prompts

```python
# ai/schemas/candidate_profile.py
class CandidateProfileExtracted(BaseModel):
    skills: list[str]
    total_experience_years: int | None
    work_experience: list[WorkExperienceEntry]
    ...

# ai/prompts/resume_extraction.py
RESUME_EXTRACTION_SYSTEM_PROMPT = "Extract... Rules: 1. No hallucination..."
```

**Used by:** Providers import prompts; services import schemas.

---

## 8. `services/*.py` — Business Logic Orchestrators

| Service | Responsibility |
|---------|----------------|
| `application_service.py` | Submit application: validate PDF → upload to Supabase → upsert candidate → create application → snapshot form profile → audit log (all in 1 transaction) |
| `document_service.py` | `pdf_to_text()` (pypdf), `pdf_to_markdown()` (docling), `pdf_to_chunks()` |
| `screening_service.py` | `run_deterministic_scoring()` (rule math) + `run_ai_advisor()` (calls provider) |
| `job_service.py` | Create/list jobs, ensure storage bucket |
| `storage_service.py` | Supabase upload/download URLs |

**Example flow in `application_service.submit_application()`:**

```python
1. _validate_cv(pdf_bytes)           # magic bytes, size, type
2. storage_service.upload_cv_bytes() # Supabase Storage
3. candidate_repository.get_by_email() / create()
4. application_repository.create()   # DB row
5. profile_repository.create_form_profile()  # snapshot
6. audit_repository.append()         # audit trail
7. db.commit()                       # atomic
```

---

## 9. `api/routes/*.py` — HTTP Thin Layer

```python
# applications.py
@router.post("", response_model=ApplicationRead)
async def create_application(
    db: DbSession,
    job_id: FormJobId,
    full_name: FormFullName,
    email: FormEmail,
    cv: FormCv,  # UploadFile
):
    form = ApplicationFormFields(...)  # validated
    cv_bytes = await cv.read()
    application = application_service.submit_application(db, form=form, cv_bytes=cv_bytes)
    return ApplicationRead.model_validate(application)
```

**Does:** Parse multipart/form, validate via schemas, call **one** service, return response model.

---

## How a Request Flows End-to-End

```
POST /api/applications (multipart: job_id, name, email, CV.pdf)
         │
         ▼
api/routes/applications.py          # Parse form, validate schemas
         │
         ▼
services/application_service.py     # Orchestrate: validate → storage → repos → audit
         │
         ├─▶ storage_service.upload_cv_bytes()          # Supabase
         ├─▶ candidate_repository.get_by_email/create() # DB
         ├─▶ application_repository.create()            # DB
         ├─▶ profile_repository.create_form_profile()   # DB (ground truth)
         └─▶ audit_repository.append()                  # DB
         │
         ▼
        201 Created {id, status: "APPLICATION_SUBMITTED"}

--- Later: HR triggers screening ---
         │
         ▼
services/screening_service.py
         │
         ├─▶ document_service.pdf_to_text(cv_bytes)     # pypdf
         ├─▶ providers/resume_extractor.extract_resume()# OpenAI → structured
         ├─▶ run_deterministic_scoring(profile, job)    # Math
         ├─▶ providers/screening_advisor.get_screening_advice() # OpenAI
         └─▶ screening_repository.create()/update()     # DB
```

---

## Key Principles in This Codebase

| Principle | Enforced By |
|-----------|-------------|
| **Config only via `config.py`** | No `os.getenv` in app code |
| **OpenAI SDK only in `providers/`** | Linter would catch imports elsewhere |
| **DB only in `repositories/`** | Services don't write raw SQL |
| **Routes = thin** | One service call per endpoint |
| **Form ≠ PDF profiles** | Two tables, alignment check later |
| **Deterministic = source of truth** | AI advisor is advisory only |