# Project Structure

```
app/
├── ai
│   ├── prompts
│   │   ├── __init__.py
│   │   ├── resume_extraction.py
│   │   └── screening_advisor.py
│   ├── schemas
│   │   ├── __init__.py
│   │   ├── ai_advice.py
│   │   └── candidate_profile.py
│   └── __init__.py
├── api
│   ├── routes
│   │   ├── __init__.py
│   │   ├── applications.py
│   │   └── jobs.py
│   └── __init__.py
├── core
│   ├── __init__.py
│   └── config.py
├── db
│   ├── __init__.py
│   ├── base.py
│   └── session.py
├── models
│   ├── __init__.py
│   ├── application.py
│   ├── audit_log.py
│   ├── candidate_profile_form.py
│   ├── candidate_profile_pdf.py
│   ├── candidate.py
│   ├── hr_decision.py
│   ├── job.py
│   └── screening.py
├── providers
│   ├── __init__.py
│   ├── resume_extractor.py
│   └── screening_advisor.py
├── repositories
│   ├── __init__.py
│   ├── application_repository.py
│   ├── audit_repository.py
│   ├── candidate_repository.py
│   ├── job_repository.py
│   ├── profile_repository.py
│   └── screening_repository.py
├── schemas
│   ├── __init__.py
│   ├── application.py
│   └── job.py
├── services
│   ├── __init__.py
│   ├── application_service.py
│   ├── document_service.py
│   ├── job_service.py
│   ├── screening_service.py
│   └── storage_service.py
├── __init__.py
├── main.py
└── README.md
```
