
---

# `ARCHITECTURE.md`

```markdown
# ARCHITECTURE.md

# AI-Assisted HR Recruitment Platform

## 1. Purpose

This document is the authoritative engineering architecture for the HR recruitment system.

It exists to prevent:

- Uncontrolled AI behavior
- Hallucinated candidate information
- Invalid workflow transitions
- Accidental automation
- Unclear responsibilities
- Inconsistent business logic
- Difficult debugging
- Data corruption

Any developer or AI coding agent working on this project MUST follow this document.

If a proposed implementation conflicts with this document, the implementation must be reconsidered before coding.

---

# 2. System Boundary

The system is responsible for:

    Candidate Application
    ↓
    Document Processing
    ↓
    AI Extraction
    ↓
    Screening
    ↓
    HR Review
    ↓
    HR Decision
    ↓
    Email
    ↓
    Reporting

The system is NOT responsible for:

    Interview Scheduling
    Calendar Management
    WhatsApp Communication
    Meeting Creation
    Automatic Hiring
    Automatic Interview Assignment

These are explicitly outside the current architecture.

---

# 3. Architecture Diagram

```mermaid
flowchart TD

    A[Candidate Website]

    A --> B[FastAPI API]

    B --> C[Pydantic Request Validation]

    C --> D[Application Service]

    D --> E[(Supabase PostgreSQL)]

    D --> F[Supabase Storage]

    F --> G[Document Processing]

    G --> H[AI Extraction]

    H --> I[Pydantic AI Output Validation]

    I --> J[Business Validation]

    J --> E

    E --> K[Deterministic Screening Engine]

    K --> L[Screening Result]

    L --> M[HR Dashboard]

    M --> N{HR Decision}

    N -->|Reject| O[REJECTED]

    N -->|Approve| P[APPROVED]

    O --> Q[Email Service]
    P --> Q

    Q --> R[Candidate Email]

    E --> S[Excel Export]

    E --> T[Audit Log]