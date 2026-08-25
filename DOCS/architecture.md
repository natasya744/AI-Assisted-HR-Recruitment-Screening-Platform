# ARCHITECTURE.md

# AI-Assisted HR Recruitment Screening Platform

## 1. Purpose

This document is the **authoritative engineering architecture** for the HR recruitment screening platform.

It exists to prevent:

- Uncontrolled AI behavior
- Hallucinated candidate information reaching HR
- Invalid workflow transitions
- Accidental automation of consequential decisions
- Unclear module responsibilities
- Inconsistent screening logic
- Data corruption and fragmented records

Any developer or AI coding agent working on this project MUST follow this document.
If a proposed implementation conflicts with it, the implementation is reconsidered before coding.

Business rationale lives in `client-brief.md`. This doc explains *what the system is* and *why it is shaped this way*, so both are readable in one place.

---

## 2. The Core Principle

> **AI assists the recruitment process. It never controls it.**

Concretely:

| Concern | Owner |
|---|---|
| Extracting skills/experience from unstructured CV text | AI (OpenAI) |
| Deciding whether extraction output is trustworthy | Deterministic validation code |
| Scoring candidates against job requirements | Deterministic screening engine |
| Approving or rejecting a candidate | HR (human-in-the-loop) |
| Triggering emails to candidates | System, only after an HR decision |
| State transitions, permissions, persistence | Application code |

The AI has exactly one job: convert unstructured CV text into structured data.
It cannot change application status, cannot compute scores, and cannot contact anyone.

---

## 3. How the System Solves the Business Problems

Each of the 10 business gaps identified in `client-brief.md` maps directly to a concrete architectural subsystem:

```mermaid
graph TD
    classDef gap fill:#FFE4E6,stroke:#F43F5E,stroke-width:2px,color:#881337;
    classDef solution fill:#E0E7FF,stroke:#6366F1,stroke-width:2px,color:#312E81;
    classDef outcome fill:#DCFCE7,stroke:#22C55E,stroke-width:2px,color:#14532D;

    subgraph BusinessGaps["10 Core Business Gaps"]
        G1["Gap 1: Manual CV Reading"]:::gap
        G2["Gap 2: Repetitive Data Entry"]:::gap
        G3["Gap 3: Inconsistent Screening"]:::gap
        G4["Gap 4: Opaque Scoring Criteria"]:::gap
        G5["Gap 5: HR Accountability & Authority"]:::gap
        G6["Gap 6: Manual Email Communication"]:::gap
        G7["Gap 7: Fragmented Data"]:::gap
        G8["Gap 8: Manual Excel Reports"]:::gap
        G9["Gap 9: Lack of Traceability"]:::gap
        G10["Gap 10: AI Hallucination & Risk"]:::gap
    end

    subgraph ArchitectureEngine["Architectural Solution & Subsystems"]
        S1["Document Service + OpenAI Adapter"]:::solution
        S2["Application Intake & Schema Auto-Mapping"]:::solution
        S3["Deterministic Rule-Based Screening Engine"]:::solution
        S4["Score Breakdown & Evidence Extractor"]:::solution
        S5["Human-in-the-Loop Decision Gate"]:::solution
        S6["Event-Driven Candidate Email Service"]:::solution
        S7["Supabase PostgreSQL Central Source of Truth"]:::solution
        S8["Automated Excel Export Service"]:::solution
        S9["Append-Only Audit Log Subsystem"]:::solution
        S10["3-Layer Validation & Provenance Engine"]:::solution
    end

    subgraph BusinessValue["Business Value Delivered"]
        V1["90% Time Saved in Initial Review"]:::outcome
        V2["Zero Manual Profile Typing"]:::outcome
        V3["100% Objective & Fair Evaluation"]:::outcome
        V4["Auditable, Explainable Decisions"]:::outcome
        V5["Human Keeps Total Governance"]:::outcome
        V6["Instant, Professional Candidate Updates"]:::outcome
        V7["Unified Centralized Records"]:::outcome
        V8["One-Click Stakeholder Reporting"]:::outcome
        V9["Complete Legal & Operational Traceability"]:::outcome
        V10["Zero Hallucinations in Database"]:::outcome
    end

    G1 --> S1 --> V1
    G2 --> S2 --> V2
    G3 --> S3 --> V3
    G4 --> S4 --> V4
    G5 --> S5 --> V5
    G6 --> S6 --> V6
    G7 --> S7 --> V7
    G8 --> S8 --> V8
    G9 --> S9 --> V9
    G10 --> S10 --> V10
```

| # | Business Gap | Problem in Manual Process | Architectural Answer | Business Impact |
|---|---|---|---|---|
| 1 | **Manual CV Reading** | Hundreds of unstructured CV formats take hours to read | `DocumentService` + OpenAI extraction → structured candidate profile | 90% reduction in initial reading time |
| 2 | **Repetitive Data Entry** | Typing names, emails, and experience into spreadsheets | Public intake form automatically seeds normalized DB records | Eliminates data entry errors & backlog |
| 3 | **Inconsistent Screening** | Different recruiters use subjective criteria | Deterministic screening engine evaluates candidates against strict job criteria | 100% repeatable, fair evaluation |
| 4 | **Opaque Scoring** | A score like "85" has no explanation | Persistent score breakdown (earned/max points per category) + evidence | Explainable decisions backed by exact citations |
| 5 | **HR Accountability** | Risk of AI making unauthorized hiring/rejection | Hard decision gate: AI cannot alter status; only authorized HR can approve/reject | Human judgment and accountability preserved |
| 6 | **Manual Candidate Emails** | Drafting individual emails is time-consuming | `EmailService` automatically drafts/sends notification only after HR decision | Instant, consistent candidate feedback |
| 7 | **Fragmented Data** | Resumes in inboxes, notes in files, scores in sheets | Supabase PostgreSQL single source of truth + private bucket storage | Centralized, secure talent repository |
| 8 | **Manual Reporting** | Hours spent consolidating spreadsheets for management | Streaming Excel export endpoint (`/exports/applications`) from DB | Instant reporting with up-to-date data |
| 9 | **Lack of Traceability** | No historical record of who evaluated what and when | Append-only `audit_log` records every transition, payload, and reviewer | Complete operational & compliance trail |
| 10 | **AI Unreliability** | LLMs can hallucinate qualifications or make errors | 3-Layer validation (Pydantic → business bounds → deterministic merge + provenance) | Zero unverified AI data enters screening |

---

## 4. System Boundary

**In scope:**

    Candidate application → Document processing → AI extraction
    → 3-Layer Validation → Screening → HR review → HR decision → Email → Reporting → Audit

**Explicitly out of scope** (future phases, require new approval):

Interview scheduling · Calendar management · WhatsApp communication · Meeting creation · Automatic hiring/rejection · Candidate pipeline analytics

---

## 5. High-Level Component Architecture

```mermaid
flowchart TB
    subgraph ClientTier["Client Tier (Browser)"]
        CAND["Candidate Application Form<br/>(Public React Portal)"]
        HRUI["HR Management Dashboard<br/>(Authenticated React SPA)"]
    end

    subgraph APITier["FastAPI Application Boundary"]
        API["FastAPI Routing Layer<br/>(Pydantic Request/Response Validation)"]
        
        subgraph CoreServices["Business Logic & Domain Services"]
            APP_SVC["Application Service<br/>(Intake & Upload Orchestration)"]
            DOC_SVC["Document Service<br/>(PDF Parsing & Text Extraction)"]
            SCR_SVC["Screening Engine<br/>(Deterministic Scoring & Rules)"]
            DEC_SVC["Decision Service<br/>(HR Gate & State Transition Machine)"]
            MAIL_SVC["Email Service<br/>(Event-Driven Notifications)"]
            EXP_SVC["Export Service<br/>(Excel/XLSX Generator)"]
            AUDIT_SVC["Audit Subsystem<br/>(Append-Only Event Logger)"]
        end

        subgraph AIAdapterTier["AI Provider Adapter (Isolated)"]
            AI_ADAPTER["OpenAI Provider Adapter<br/>(Prompts & Strict JSON Schema)"]
            VAL_ENGINE["3-Layer Validation Pipeline<br/>(Pydantic + Business Rules + Merge)"]
        end

        subgraph RepoTier["Persistence Layer"]
            REPO["SQLAlchemy 2.0 Repositories"]
        end
    end

    subgraph ExternalServices["External Systems & Storage"]
        OPENAI_API["OpenAI API<br/>(Structured Extraction Only)"]
        subgraph SupabaseCloud["Supabase Infrastructure"]
            PG_DB[("PostgreSQL Database<br/>Single Source of Truth")]
            PRIVATE_STORAGE["Private Storage Bucket<br/>(Candidate CV PDFs)"]
        end
    end

    CAND -->|"1. Submit Application + CV"| API
    HRUI -->|"6. Review & Decide"| API
    
    API --> APP_SVC
    API --> DEC_SVC
    API --> EXP_SVC
    
    APP_SVC --> DOC_SVC
    APP_SVC --> REPO
    APP_SVC --> PRIVATE_STORAGE
    
    DOC_SVC --> AI_ADAPTER
    AI_ADAPTER <-->|"Extract JSON"| OPENAI_API
    AI_ADAPTER --> VAL_ENGINE
    VAL_ENGINE --> SCR_SVC
    
    SCR_SVC --> REPO
    DEC_SVC --> MAIL_SVC
    DEC_SVC --> REPO
    
    APP_SVC --> AUDIT_SVC
    DEC_SVC --> AUDIT_SVC
    AUDIT_SVC --> REPO
    
    REPO --> PG_DB
    EXP_SVC --> REPO
```

---

## 6. End-to-End Flow, Step by Step

The complete life of one application, from submission to closure:

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate
    participant FE as Frontend Portal
    participant API as FastAPI Backend
    participant Storage as Supabase Storage
    participant DocSvc as Document Service
    participant OpenAI as OpenAI Adapter
    participant Val as 3-Layer Validation
    participant Screen as Screening Engine
    participant DB as PostgreSQL DB
    actor HR as HR Reviewer
    participant Email as Email Service
    participant Audit as Audit Log

    Candidate->>FE: Fill form (job, name, email) + upload CV.pdf
    FE->>API: POST /api/applications (multipart/form-data)
    API->>API: Validate file type (.pdf) and max file size
    API->>Storage: Store CV in private bucket ('candidate-cvs')
    Storage-->>API: cv_storage_path
    API->>DB: Insert Candidate + Application (Status: APPLICATION_SUBMITTED)
    API->>Audit: Record 'APPLICATION_CREATED' event

    API->>DocSvc: Read CV binary from storage & extract raw text
    alt PDF extraction fails (corrupt / unreadable)
        DocSvc-->>API: Extraction Error
        API->>DB: Update status to DOCUMENT_PROCESSING_FAILED
        API->>Audit: Record 'DOCUMENT_PROCESSING_FAILED'
        Note over API,DB: Routed to manual review queue; never silently dropped.
    else Extraction succeeds
        DocSvc-->>API: Extracted raw CV text
        API->>OpenAI: Request candidate structured extraction
        OpenAI-->>Val: Raw JSON output
        Val->>Val: Layer 1: Pydantic schema validation
        Val->>Val: Layer 2: Business sanity rules (experience, skills)
        Val->>Val: Layer 3: Deterministic merge + provenance tagging
        Val-->>API: Validated CandidateProfile
        API->>DB: Insert CandidateProfile (Status: SCREENING)
        API->>Audit: Record 'EXTRACTION_COMPLETED'
    end

    API->>Screen: Score CandidateProfile against Job requirements
    Screen->>Screen: Calculate Experience + Skill Match + Education Points
    Screen-->>API: ScreeningResult (Total score, Breakdown, Evidence citations)
    API->>DB: Insert ScreeningResult (Status: HR_REVIEW)
    API->>Audit: Record 'SCREENING_COMPLETED'

    HR->>FE: Open HR Dashboard & inspect candidate dossier
    FE->>API: GET /api/hr/applications/{id}
    API-->>FE: Return Profile + Score Breakdown + Evidence + Audit Trail
    
    HR->>FE: Click Approve or Reject (with reviewer notes)
    FE->>API: POST /api/hr/applications/{id}/decision {decision, notes}
    API->>API: Enforce state machine (terminal state check)
    API->>DB: Insert HRDecision, Update status to APPROVED / REJECTED
    API->>Audit: Record 'HR_DECIDED' event

    API->>Email: Trigger notification workflow
    Email-->>Candidate: Dispatch Approval / Rejection Email
    API->>Audit: Record 'EMAIL_SENT' event with rendered snapshot

    Note over HR,API: At any time, HR can trigger GET /api/exports/applications to generate an Excel spreadsheet.
```

---

## 7. Application State Machine

Statuses are explicit and transitions are strictly enforced in code. Arbitrary or backward state transitions are forbidden.

```mermaid
stateDiagram-v2
    [*] --> APPLICATION_SUBMITTED : Candidate submits form & CV PDF
    
    APPLICATION_SUBMITTED --> VALIDATING : Fetch CV from storage & parse text
    
    VALIDATING --> SCREENING : CV parsed & structured profile validated
    VALIDATING --> DOCUMENT_PROCESSING_FAILED : Corrupted, unreadable, or encrypted PDF
    
    DOCUMENT_PROCESSING_FAILED --> MANUAL_REVIEW : Flagged for manual HR inspection
    
    SCREENING --> HR_REVIEW : Deterministic screening score computed
    
    HR_REVIEW --> APPROVED : HR explicitly approves candidate
    HR_REVIEW --> REJECTED : HR explicitly rejects candidate
    
    MANUAL_REVIEW --> APPROVED : HR manually reviews & approves
    MANUAL_REVIEW --> REJECTED : HR manually reviews & rejects
    
    APPROVED --> [*] : Terminal State (Email sent, immutable)
    REJECTED --> [*] : Terminal State (Email sent, immutable)
```

**State Transition Invariants:**
1. `APPROVED` and `REJECTED` are strictly terminal. Once decided, the state is locked forever.
2. An application can never bypass the `HR_REVIEW` or `MANUAL_REVIEW` gate to reach `APPROVED` or `REJECTED`.
3. Every state transition automatically writes a corresponding row to `audit_log`.

---

## 8. AI Reliability: 3-Layer Validation Pipeline

To eliminate hallucination and guarantee data integrity (Business Gap 10):

```mermaid
flowchart TD
    RAW["Raw LLM Output (JSON String)"] --> L1{"Layer 1: Schema Validation<br/>(Strict Pydantic Model)"}
    
    L1 -- "Schema Mismatch / Malformed JSON" --> RETRY{"Retry Extraction Once?"}
    RETRY -- Yes --> RAW
    RETRY -- No / Failed --> FAIL["Mark as DOCUMENT_PROCESSING_FAILED<br/>Route to HR MANUAL_REVIEW"]
    
    L1 -- "Valid JSON & Types" --> L2{"Layer 2: Business Sanity Rules<br/>(Plausibility Checks)"}
    
    L2 -- "Negative Years / Future Dates / Empty Data" --> FAIL
    
    L2 -- "Passed Plausibility" --> L3["Layer 3: Deterministic Merge<br/>& Field-Level Provenance Engine"]
    
    L3 --> PROFILE["Validated CandidateProfile<br/>(Tagged with: 'ai', 'deterministic', 'manual')"]
    
    PROFILE --> SCREEN["Deterministic Screening Engine<br/>(100% Rule-Based, Zero AI)"]

    classDef success fill:#DCFCE7,stroke:#22C55E,stroke-width:2px,color:#14532D;
    classDef failure fill:#FFE4E6,stroke:#F43F5E,stroke-width:2px,color:#881337;
    classDef process fill:#E0E7FF,stroke:#6366F1,stroke-width:2px,color:#312E81;
    
    class PROFILE,SCREEN success;
    class FAIL failure;
    class RAW,L3 process;
```

- **Layer 1 — Pydantic:** Enforces exact schemas and strict types. Malformed LLM output never touches domain models.
- **Layer 2 — Business Rules:** Validates human sanity bounds (e.g. years of experience between 0 and 50, normalized education levels, non-empty skills).
- **Layer 3 — Deterministic Merge & Provenance:** Missing or partial fields are enriched by deterministic regex/keyword parsing directly from the CV text. Every single field tracks its provenance (`ai`, `deterministic`, or `manual`).

---

## 9. Data Model & Entity Relationships

PostgreSQL is the single source of truth. Binary files stay in Supabase Storage; the DB holds relational records, structured profiles, evidence JSON, and audit events.

```mermaid
erDiagram
    JOB ||--o{ APPLICATION : "receives"
    CANDIDATE ||--o{ APPLICATION : "submits"
    APPLICATION ||--o| CANDIDATE_PROFILE : "has extracted"
    APPLICATION ||--o| SCREENING_RESULT : "is scored by"
    APPLICATION ||--o| HR_DECISION : "is finalized by"
    APPLICATION ||--o{ AUDIT_LOG : "is traced by"

    JOB {
        uuid id PK
        string title
        string department
        int min_experience_years
        jsonb required_skills "list of skill strings"
        jsonb education_requirements "accepted degrees"
        jsonb score_weights "category weights (e.g. 40/40/20)"
        boolean is_open
        datetime created_at
    }

    CANDIDATE {
        uuid id PK
        string full_name
        string email
        string phone
        datetime created_at
    }

    APPLICATION {
        uuid id PK
        uuid job_id FK
        uuid candidate_id FK
        string status "Enum: SUBMITTED, SCREENING, HR_REVIEW, etc."
        string cv_storage_path "Path in Supabase Storage bucket"
        jsonb cv_metadata "File name, size, mime type, hash"
        datetime applied_at
    }

    CANDIDATE_PROFILE {
        uuid id PK
        uuid application_id FK
        jsonb extracted_data "Structured skills, experience, education"
        jsonb provenance "Field-level origin: ai | deterministic | manual"
        string extraction_status "SUCCESS | PARTIAL | FAILED"
        datetime created_at
    }

    SCREENING_RESULT {
        uuid id PK
        uuid application_id FK
        int total_score "0 to 100"
        jsonb breakdown "Score per category (earned / max)"
        jsonb evidence "Matched text snippets and citations"
        datetime scored_at
    }

    HR_DECISION {
        uuid id PK
        uuid application_id FK
        string decision "APPROVE | REJECT"
        string reviewer_email
        text notes
        datetime decided_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid application_id FK
        string event_type "APPLICATION_CREATED, HR_DECIDED, etc."
        jsonb payload "State diff snapshot & context"
        string actor "SYSTEM | CANDIDATE | HR_USER"
        datetime created_at
    }
```

---

## 10. Security & Privacy Architecture

```mermaid
graph TD
    subgraph PublicInternet["Public Internet"]
        CAND_USER["Candidate Browser"]
    end

    subgraph AuthenticatedZone["Authenticated HR Zone"]
        HR_USER["HR Recruiter Browser<br/>(Supabase JWT Auth)"]
    end

    subgraph BackendEnclave["Backend Protected Boundary (FastAPI)"]
        AUTH_GUARD["Authentication & RBAC Middleware"]
        VALIDATOR["Input Sanitization & Antivirus/MIME Check"]
        CORE_APP["Application Core Engine"]
        SEC_CFG["core/config.py (Zero Leaked Secrets)"]
    end

    subgraph IsolatedServices["Isolated Data & AI Providers"]
        SUPA_STORAGE[("Private Supabase Storage<br/>(No Public Access Policy)")]
        SUPA_DB[("Supabase PostgreSQL<br/>(Encrypted at Rest)")]
        OPENAI_EXT["OpenAI Provider Adapter<br/>(Ephemeral Processing Only)"]
    end

    CAND_USER -->|"POST /applications (Public Rate-Limited)"| VALIDATOR
    HR_USER -->|"Bearer Token"| AUTH_GUARD
    
    AUTH_GUARD --> CORE_APP
    VALIDATOR --> CORE_APP
    
    CORE_APP -->|"Service Role Key"| SUPA_STORAGE
    CORE_APP -->|"Encrypted Connection"| SUPA_DB
    CORE_APP -->|"No PII Leaks"| OPENAI_EXT
```

**Security Rules:**
1. `.env` and all keys are strictly gitignored. `service_role` key exists only server-side.
2. The Storage bucket is private; CV downloads happen through authenticated backend endpoints only.
3. Every API boundary validates input (file type, size, field schemas).
4. Uploaded CVs and databases are never committed; sample data must be fictional.
5. The audit log is append-only.

---

## 11. Module Responsibilities

Backend layout mirrors responsibility boundaries. Routes are thin; services orchestrate; repositories own SQL; provider adapters isolate third-party SDK types.

| Module | Owns | Must NOT |
|---|---|---|
| `api/routes/` | HTTP parsing, auth, response models, status codes | Contain business logic or SQL |
| `services/` | Workflow orchestration, state transitions | Talk to HTTP or write raw queries directly in routes |
| `repositories/` | All SQLAlchemy access | Know about HTTP or prompts |
| `ai/` + `providers/` | OpenAI prompts, adapters, extraction schemas | Leak SDK types beyond their boundary |
| `core/config.py` | The only place settings/env are read | Be bypassed by `os.getenv` elsewhere |
| `db/` | Session/engine setup | Own schema (that's Alembic) |
| `schemas/` | Pydantic request/response contracts | Duplicate model logic ad hoc |

Frontend (`frontend/`): React SPA (Vite, TypeScript strict, Tailwind, shadcn/ui, React Router). Talks only to the backend API through `src/lib/api.ts`; env vars read only via `src/lib/env.ts`.

---

## 12. Locked Technical Decisions

These are settled; changing any of them requires explicit re-approval:

1. **Extraction:** OpenAI as the sole AI provider, behind adapter interfaces in `app/providers/`. No separate document-intelligence service. Deterministic merging fills gaps and exposes provenance.
2. **Database:** Supabase Postgres everywhere (dev and prod), SQLAlchemy models, Alembic migrations. SQLite is not used.
3. **File storage:** Supabase Storage private bucket; DB stores path/metadata only, never binaries.
4. **Email:** `EmailService` interface with pluggable transport. MVP ships a console/file transport for development; a real transactional provider is added later without touching workflow code.
5. **Auth:** Supabase email auth for the HR side (no SSO); public application form requires no login.
6. **Export:** Excel generation from Postgres, isolated in `export_service.py`.
7. **Dependencies:** exact pins only, lockfiles committed, cooldown configs preserved, nothing added without Tasya's approval.
8. **No automated test suites** — verification is lint/typecheck/build plus demo-oriented walkthroughs of the fictional corpus.
