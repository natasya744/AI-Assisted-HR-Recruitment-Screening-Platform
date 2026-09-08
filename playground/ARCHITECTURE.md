# Screening Pipeline — Architecture Flow Diagram

```mermaid
flowchart TD
    subgraph SAMPLES["📁 samples/"]
        PDF["CV PDF"]
        MD["pre-converted Markdown"]
    end

    subgraph SERVICES["🔧 Services Layer"]
        DS["document_service<br/>convert_pdf_to_markdown"]
        EP["extraction_provider<br/>Markdown → CandidateProfileExtracted"]
        VS["validation_service<br/>Business bounds + deterministic merge<br/>+ field-level provenance"]
        AS["alignment_service<br/>Form vs PDF identity check<br/>Mismatches flagged, never auto-corrected"]
        SS["scoring_service<br/>Deterministic rule-based scoring 0-100"]
    end

    subgraph PROVIDERS["🤖 Providers Layer"]
        RA["resume_extractor<br/>OpenAI chat.completions"]
        SA["screening_advisor<br/>OpenAI chat.completions"]
    end

    subgraph PROMPTS["📝 Prompts"]
        RP["resume_extraction.py<br/>SYSTEM + USER prompt"]
        SP["screening_advisor.py<br/>SYSTEM + USER prompt"]
    end

    subgraph SCHEMAS["📐 Pydantic Schemas"]
        CPE["CandidateProfileExtracted"]
        AO["AdvisorOutput"]
    end

    subgraph DB["🗄️ Database"]
        JOB["jobs"]
        APP["applications"]
        CPF["candidate_profiles_form"]
        CPP["candidate_profiles_pdf"]
        SCR["screening_results"]
        HRD["hr_decisions"]
        AUD["audit_log"]
    end

    subgraph FRONTEND["🌐 Frontend React"]
        AF["ApplyForm.tsx"]
        HD["HR Dashboard"]
        RD["Review.tsx"]
    end

    %% Document Processing
    PDF -->|OCR via Docling| DS
    MD -->|load text| DS
    DS -->|markdown| EP

    %% AI Extraction
    EP -->|cv_markdown| RA
    RP -.->|prompt| RA
    RA -->|CandidateProfileExtracted| CPE
    RA -->|raw provenance| VS

    %% Validation Pipeline
    VS -->|validated profile| CPE
    VS -->|field_provenance| AS

    %% Alignment
    AS -->|alignment_check| CPF
    CPF -.->|form_data| AS

    %% Scoring
    CPE -->|profile| SS
    JOB -->|score_weights| SS
    SS -->|score + evidence| SCR

    %% AI Advisor
    CPE -->|profile_json| SA
    JOB -->|job_title, description| SA
    SP -.->|prompt| SA
    SA -->|AdvisorOutput| AO

    %% Dossier Assembly
    CPE -->|"extracted_pdf_profile"| DOSS["📦 Dossier"]
    CPF -->|"candidate_form"| DOSS
    VS -->|"field_provenance<br/>business_warnings"| DOSS
    AS -->|"alignment_check"| DOSS
    SS -->|"deterministic_screening"| DOSS
    SA -->|"ai_advice"| DOSS

    %% Persistence
    DOSS -->|"profile_repository.create_pdf_profile"| CPP
    CPP -.->|"application_id"| APP
    SS -->|"persist"| SCR
    APP -->|"status: SCREENING /<br/>DOCUMENT_PROCESSING_FAILED →<br/>MANUAL_REVIEW"| DB

    %% Frontend API calls
    AF -->|"POST /api/jobs"| JOB
    AF -->|"POST /api/applications"| APP
    AF -->|"GET /api/jobs"| JOB
    HD -->|"GET /api/hr/applications"| DOSS
    RD -->|"POST /api/hr/applications/{id}/decision"| HRD
    HRD -->|"audit event"| AUD

    %% Styling
    style SAMPLES fill:#e8f5e9,stroke:#2e7d32
    style SERVICES fill:#e3f2fd,stroke:#1565c0
    style PROVIDERS fill:#fff3e0,stroke:#e65100
    style PROMPTS fill:#f3e5f5,stroke:#7b1fa2
    style SCHEMAS fill:#fce4ec,stroke:#c62828
    style DB fill:#e0f7fa,stroke:#00695c
    style FRONTEND fill:#f1f8e9,stroke:#33691e
```

---

## Legend

| Color | Layer |
|---|---|
| 🟢 Green | Input sources (`samples/`) |
| 🔵 Blue | Services (pure business logic) |
| 🟠 Orange | Providers (OpenAI SDK boundary) |
| 🟣 Purple | AI prompts |
| 🔴 Pink | Pydantic schemas |
| 🩵 Cyan | Database |
| 🟢 Light green | Frontend (React) |

## Key Design Decisions

1. **Providers stop at `app/providers/`** — OpenAI SDK types never leak into services or downstream code.
2. **Validation pipeline sits between extraction and alignment** — business bounds catch impossible values before identity checks run.
3. **Field-level provenance** — each extracted field is tagged `ai`, `deterministic`, or `missing`. Deterministic fills come from date math on work_experience entries.
4. **Alignment never auto-corrects** — mismatches are flagged for HR review. Form ground truth and PDF profile stay separate.
5. **Status machine** — `APPLICATION_SUBMITTED` → `SCREENING` on success, `DOCUMENT_PROCESSING_FAILED` → `MANUAL_REVIEW` on broken PDF.
