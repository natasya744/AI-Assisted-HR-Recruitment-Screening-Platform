"""Sample inputs, ground-truth form data, and offline fallback fixtures."""

from __future__ import annotations

from typing import Any

from app.ai.schemas.ai_advice import AdvisorOutput, RequirementAssessment
from app.ai.schemas.candidate_profile import (
    CandidateProfileExtracted,
    EducationEntry,
    WorkExperienceEntry,
)

# 1. Sample job posting (mirrors Job model & schemas/job.py)
DEFAULT_SAMPLE_JOB: dict[str, Any] = {
    "title": "AI Implementation & Automation Specialist",
    "description": (
        "We are looking for an AI Implementation & Automation Specialist to deploy end-to-end "
        "AI workflows and CRM integrations for automotive sales operations.\n\n"
        "Requirements:\n"
        "- 3+ years experience in AI or automation engineering\n"
        "- Hands-on proficiency with n8n, OpenAI / Azure AI APIs, and Python/REST integrations\n"
        "- Experience integrating CRM/DMS systems (HubSpot, Salesforce, or dealer systems)\n"
        "- Bachelor degree in Public Administration, Computer Science, or related field\n"
        "- Fluent in English (professional proficiency) and Indonesian\n"
        "- Certifications in workflow automation or enterprise AI preferred"
    ),
    "required_skills": ["OpenAI", "n8n", "Azure AI", "REST API", "CRM"],
    "min_experience_years": 3,
    "education_requirements": ["Bachelor"],
    "score_weights": {
        "skills": 40,
        "experience": 30,
        "education": 15,
        "other": 15,
    },
}

# 2. Candidate form submission (Ground Truth - what candidate entered in the intake form)
DEFAULT_FORM_DATA: dict[str, str] = {
    "full_name": "Natasya",
    "email": "Putrianastasya744@gmail.com",
    "phone": "+6285184516184",
    "location": "Jakarta, Indonesia",
    "linkedin_url": "https://linkedin.com/in/natasya-ai",
    "github_portfolio_url": "https://github.com/natasya744",
}

# 3. High-fidelity extracted profile fixture matching sample CV
FIXTURE_EXTRACTED_PROFILE = CandidateProfileExtracted(
    full_name="Natasya",
    email="Putrianastasya744@gmail.com",
    phone="+6285184516184",
    location="Jakarta, Indonesia",
    linkedin_url="https://linkedin.com/in/natasya-ai",
    github_portfolio_url="https://github.com/natasya744",
    professional_summary=(
        "Results-driven AI Implementation & Automation Specialist with extensive experience "
        "bridging emerging AI technologies and high-volume sales operations."
    ),
    skills=[
        "Azure AI",
        "OpenAI",
        "RAG Knowledge Base Architecture",
        "AI Agent Deployment",
        "Prompt Engineering",
        "n8n",
        "Webhooks",
        "REST API",
        "CRM",
        "DMS Integrations",
        "Salesforce",
        "HubSpot",
    ],
    total_experience_years=4,
    work_experience=[
        WorkExperienceEntry(
            title="AI Implementation & Automation Specialist",
            company="Independent Consulting",
            start_date="2023",
            end_date="Present",
        ),
        WorkExperienceEntry(
            title="Lead Automation & AI Systems Engineer",
            company="OpenClaw",
            start_date="2021",
            end_date="2023",
        ),
        WorkExperienceEntry(
            title="Automation & Solutions Consultant",
            company="konsultankuAi",
            start_date="2020",
            end_date="2021",
        ),
    ],
    education=[
        EducationEntry(
            degree="Bachelor's Degree (S1)",
            institution="STIAP University",
            field="Public Administration",
        )
    ],
    certifications=[
        "Advanced Certification in n8n Workflow Automation",
        "API Integration Architecture",
        "Enterprise AI Implementation",
    ],
    languages=["English: C2", "Indonesian: C1"],
)

# 4. Fallback AI screening advice fixture
FIXTURE_SCREENING_ADVICE = AdvisorOutput(
    overall_classification="QUALIFIED",
    per_requirement=[
        RequirementAssessment(
            requirement="3+ years experience in AI or automation engineering",
            category="REQUIRED",
            status="YES",
            evidence=(
                "4 years of professional experience across "
                "Independent Consulting, OpenClaw, and konsultankuAi."
            ),
            reason="Candidate exceeds the minimum 3 years requirement.",
        ),
        RequirementAssessment(
            requirement=(
                "Hands-on proficiency with n8n, OpenAI / Azure AI APIs, "
                "and REST integrations"
            ),
            category="REQUIRED",
            status="YES",
            evidence=(
                "Engineered workflows using n8n and advanced LLM integration; "
                "Azure AI / OpenAI Integration."
            ),
            reason="Direct match for all listed automation tools and APIs.",
        ),
        RequirementAssessment(
            requirement="Experience integrating CRM/DMS systems (HubSpot, Salesforce)",
            category="REQUIRED",
            status="YES",
            evidence="CRM & DMS Integrations (HubSpot, Salesforce, Dealer Systems).",
            reason="Explicit experience with both target systems.",
        ),
        RequirementAssessment(
            requirement=(
                "Bachelor degree in Public Administration, Computer Science, "
                "or related field"
            ),
            category="REQUIRED",
            status="YES",
            evidence="Bachelor's Degree (S1) in Public Administration from STIAP University.",
            reason="Matches the Public Administration degree requirement.",
        ),
    ],
    additional_qualifications=[
        "Advanced Certifications in n8n Workflow Automation and Enterprise AI",
        "Fluent in English (C2) and Indonesian (C1)",
    ],
    advisor_confidence="HIGH",
)
