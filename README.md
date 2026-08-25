# AI-Assisted HR Recruitment System

An AI-assisted recruitment platform designed to reduce repetitive HR work during candidate screening.

The system accepts applications through a website, processes candidate documents, extracts structured information using AI, calculates a transparent screening score, and presents the results to HR.

HR remains responsible for the final decision.

The system can then send an email to the candidate based on the HR decision.

---

# 1. Project Goal

The purpose of this application is to reduce manual HR recruitment work while keeping the recruitment process:

- Reliable
- Deterministic
- Auditable
- Secure
- Human-controlled
- Easy to maintain

The system should automate repetitive data processing, not replace HR decision-making.

---

# 2. Core Workflow

The complete workflow is:

Candidate
    ↓
Website Application
    ↓
Application Validation
    ↓
Database
    ↓
CV / Document Processing
    ↓
AI Extraction
    ↓
Pydantic Validation
    ↓
Business Validation
    ↓
Screening Engine
    ↓
Screening Score
    ↓
HR Dashboard
    ↓
HR Decision
    ├── REJECTED
    │      ↓
    │   Rejection Email
    │
    └── APPROVED
           ↓
       Approval Email

The workflow ends after the approval/rejection email is sent.

---

# 3. Important Scope

## Included

- Candidate application website
- Candidate data collection
- CV/document upload
- Document storage
- AI-assisted CV extraction
- Structured candidate profile
- Pydantic validation
- Deterministic screening
- Candidate scoring
- HR dashboard
- HR approval/rejection
- Email notifications
- Excel export
- Audit logs
- Authentication
- Role-based authorization
- Error handling
- AI evaluation
- Testing

## Explicitly NOT Included

The first version must NOT implement:

- WhatsApp
- Google Calendar
- Interview scheduling
- Automatic interview dates
- Automatic meeting creation
- Automatic interview invitations
- Automatic hiring decisions
- Automatic candidate rejection by AI
- Automatic candidate approval by AI

These features are outside the current project scope.

---

# 4. Architecture Philosophy

The most important principle:

> AI assists the recruitment process. It does not control the recruitment process.

The application code controls:

- State transitions
- Validation
- Scoring
- Permissions
- HR decisions
- Email triggering
- Database updates

AI is used only where language understanding is required.

For example:

Good AI task:

    Extract skills from a CV.

Bad AI task:

    Decide whether the candidate should be hired.

---

# 5. Technology Stack

## Backend

- Python
- FastAPI
- Pydantic
- Pydantic AI
- SQLAlchemy
- Alembic

## Database

- Supabase
- PostgreSQL

## Storage

- Supabase Storage

## Frontend

Recommended:

- Next.js
- TypeScript

## Email

Use a transactional email provider.

The email provider should be isolated behind an application service so that the provider can be replaced later.

## Export

- pandas
- openpyxl

## Testing

- pytest

## Deployment

- Docker

---

# 6. Recommended Repository Structure

Use a modular monolith initially.

Do NOT start with microservices.

Recommended structure:

    project/
    │
    ├── app/
    │   ├── main.py
    │   │
    │   ├── api/
    │   │   ├── routes/
    │   │   │   ├── applications.py
    │   │   │   ├── candidates.py
    │   │   │   ├── screening.py
    │   │   │   ├── hr.py
    │   │   │   └── exports.py
    │   │   │
    │   │   └── dependencies.py
    │   │
    │   ├── core/
    │   │   ├── config.py
    │   │   ├── security.py
    │   │   └── logging.py
    │   │
    │   ├── models/
    │   │   ├── candidate.py
    │   │   ├── application.py
    │   │   ├── job.py
    │   │   ├── screening.py
    │   │   ├── hr_decision.py
    │   │   └── audit_log.py
    │   │
    │   ├── schemas/
    │   │   ├── candidate.py
    │   │   ├── application.py
    │   │   ├── screening.py
    │   │   └── hr_decision.py
    │   │
    │   ├── services/
    │   │   ├── application_service.py
    │   │   ├── candidate_service.py
    │   │   ├── document_service.py
    │   │   ├── screening_service.py
    │   │   ├── hr_service.py
    │   │   ├── email_service.py
    │   │   ├── export_service.py
    │   │   └── audit_service.py
    │   │
    │   ├── ai/
    │   │   ├── agents/
    │   │   │   └── resume_extraction.py
    │   │   ├── prompts/
    │   │   │   └── resume_extraction.py
    │   │   └── schemas/
    │   │       └── candidate_profile.py
    │   │
    │   ├── repositories/
    │   │   ├── candidate_repository.py
    │   │   ├── application_repository.py
    │   │   └── screening_repository.py
    │   │
    │   └── db/
    │       ├── session.py
    │       └── base.py
    │
    ├── alembic/
    │   └── versions/
    │
    ├── tests/
    │   ├── unit/
    │   ├── integration/
    │   ├── e2e/
    │   └── ai_evaluation/
    │
    ├── frontend/
    │
    ├── .env.example
    ├── docker-compose.yml
    ├── pyproject.toml
    ├── alembic.ini
    ├── ARCHITECTURE.md
    └── README.md

---

# 7. Development Order

Do not build everything at once.

Build the system in the following order.

---

## Phase 1 — Project Foundation

Implement:

- FastAPI
- Pydantic
- SQLAlchemy
- Alembic
- Supabase PostgreSQL
- Environment configuration
- Logging
- Basic testing

Goal:

The backend can start and connect safely to PostgreSQL.

---

## Phase 2 — Database Models

Create:

- Job
- Candidate
- Application
- ScreeningResult
- HRDecision
- AuditLog

Do not create unnecessary tables before they are needed.

Run database changes through Alembic.

Never manually modify production schema.

---

## Phase 3 — Candidate Application

Implement:

    POST /applications

The API should:

1. Validate input.
2. Create candidate.
3. Create application.
4. Store uploaded document reference.
5. Set application status.

Initial status:

    APPLICATION_SUBMITTED

---

# 8. Candidate Status

Use explicit states.

    APPLICATION_SUBMITTED
            ↓
        VALIDATING
            ↓
        SCREENING
            ↓
        HR_REVIEW
            ↓
       ┌────┴────┐
       ↓         ↓
    REJECTED   APPROVED

Do not create arbitrary status values.

---

# 9. Document Processing

After the application is stored:

1. Verify document type.
2. Verify file size.
3. Store the document securely.
4. Extract text.
5. Validate extracted text.
6. Send only the required text to the AI extraction layer.

If document extraction fails:

    DOCUMENT_PROCESSING_FAILED
            ↓
       MANUAL_REVIEW

Never silently continue.

---

# 10. AI CV Extraction

The AI receives a narrow task:

> Extract information explicitly supported by the candidate's CV.

The AI must return structured data.

Example:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "skills": [
    "Python",
    "FastAPI",
    "PostgreSQL"
  ],
  "experience_years": 4,
  "education": [
    "Bachelor of Computer Science"
  ]
}