# CLIENT BRIEF

# AI-Assisted HR Recruitment Screening Platform

## 1. Executive Summary

The organization currently relies heavily on manual HR processes when receiving and screening job applications.

When candidates apply, HR may need to:

1. Receive the application.
2. Open the candidate's CV.
3. Read the CV manually.
4. Identify skills and experience.
5. Compare the candidate against job requirements.
6. Record candidate information.
7. Determine whether the candidate should continue to the next stage.
8. Contact the candidate.
9. Maintain recruitment records.
10. Prepare reports or spreadsheets.

While each individual task may appear small, the total amount of repetitive work becomes significant when the number of applications increases.

The proposed system is an **AI-assisted HR recruitment screening platform** designed to reduce this repetitive workload.

The system will automatically process applications, extract structured information from CVs, calculate a transparent screening score based on predefined business rules, and present the results to HR.

HR remains responsible for the final approval or rejection decision.

After HR makes the decision, the system sends the appropriate email to the candidate.

---

# 2. Business Problem

The main business problem is not simply:

> "HR has too many CVs."

The deeper problem is:

> **HR spends valuable time performing repetitive information-processing tasks instead of focusing on higher-value recruitment activities.**

The recruitment process contains several activities that are repetitive, manual, and prone to inconsistency.

---

# 3. Business Gaps

## Gap 1 — Manual CV Screening

### Current Situation

HR receives candidate applications and needs to manually review CVs.

For every candidate, HR may need to search for:

- Education
- Work experience
- Years of experience
- Technical skills
- Previous positions
- Other qualifications

### Why This Takes Time

A CV is an unstructured document.

Different candidates may present information differently.

For example:

Candidate A:

    Python Developer
    5 years experience
    Python
    FastAPI
    PostgreSQL

Candidate B:

    Backend Engineer
    2019–2024
    Python
    REST APIs
    PostgreSQL

The HR employee needs to interpret both CVs and determine whether the information satisfies the job requirements.

When this is repeated across hundreds of applications, the manual effort becomes significant.

### Business Impact

Manual CV screening can result in:

- High administrative workload
- Slow screening
- Repetitive work
- Inconsistent evaluation
- Difficulty processing large application volumes

### Proposed Solution

Use AI to extract structured candidate information from the CV.

Example:

    CV
     ↓
    AI Extraction
     ↓
    Structured Candidate Profile

The system can produce:

    Experience: 5 years

    Skills:
    - Python
    - FastAPI
    - PostgreSQL

    Education:
    - Computer Science

The AI is used for information extraction, not final decision-making.

---

# 4. Business Gap 2 — Repetitive Data Entry

## Current Situation

HR may need to manually transfer information from CVs or application forms into spreadsheets or internal records.

For example:

    CV
      ↓
    HR reads CV
      ↓
    HR copies name
      ↓
    HR copies email
      ↓
    HR copies experience
      ↓
    HR copies skills
      ↓
    HR enters Excel

This process is repetitive.

## Why This Takes Time

The problem becomes larger as the number of candidates increases.

If HR processes:

    10 candidates

the effort may be manageable.

If HR processes:

    100 candidates

the administrative workload becomes significant.

If HR processes:

    500+ candidates

manual data entry becomes inefficient and increases the possibility of errors.

## Proposed Solution

Automatically convert application and CV information into structured database records.

The system becomes:

    Candidate
        ↓
    Application
        ↓
    Structured Data
        ↓
    Database

HR no longer needs to manually copy every piece of information.

---

# 5. Business Gap 3 — Inconsistent Screening

## Current Situation

Different HR employees may interpret candidate information differently.

For example:

HR Employee A may consider:

    4 years experience

as highly relevant.

Another reviewer may interpret the same experience differently depending on the job requirements.

## Why This Happens

Manual screening depends heavily on:

- Individual interpretation
- Attention to detail
- Experience
- Time available
- Candidate volume

This can create inconsistencies.

## Proposed Solution

Create predefined screening rules.

Example:

    Experience:
    5+ years = 30 points

    Required skills:
    5 points per matched skill

    Education:
    Matching degree = 20 points

The system calculates the score consistently.

---

# 6. Business Gap 4 — Lack of Transparent Screening Criteria

## Current Situation

A simple statement such as:

    "Candidate scored 85"

does not explain why.

This makes the screening result difficult to understand.

## Proposed Solution

The system should provide a score breakdown.

Example:

    Total Score: 85

    Experience: 30 / 30
    Skills:     25 / 30
    Education:  20 / 20
    Other:      10 / 20

HR can then understand how the score was generated.

The objective is not merely to produce a number.

The objective is to produce:

    Score
    +
    Explanation
    +
    Evidence

---

# 7. Business Gap 5 — HR Must Still Make the Decision

## Current Situation

Automation should not remove HR's responsibility for the final recruitment decision.

A high score does not necessarily mean that a candidate should automatically be accepted.

There may be information that cannot be evaluated automatically.

## Proposed Solution

Create a Human-in-the-Loop approval stage.

The workflow becomes:

    Automated Screening
          ↓
    HR Review
          ↓
       ┌──┴──┐
       ↓     ↓
    Reject  Approve

The system provides information.

HR makes the decision.

---

# 8. Business Gap 6 — Manual Candidate Communication

## Current Situation

After HR decides whether a candidate is approved or rejected, HR may need to manually send an email.

This creates another repetitive administrative task.

## Proposed Solution

Automate the email after the HR decision.

### Rejection

    HR
     ↓
    Reject
     ↓
    System
     ↓
    Rejection Email

### Approval

    HR
     ↓
    Approve
     ↓
    System
     ↓
    Approval Email

The email is triggered only after the HR decision.

The AI does not decide who receives an approval or rejection email.

---

# 9. Business Gap 7 — Recruitment Data Management

## Current Situation

Candidate information can become distributed across:

- CV files
- Emails
- Excel spreadsheets
- Application forms
- HR notes

This can make recruitment information difficult to manage.

## Proposed Solution

Use PostgreSQL as the central source of truth.

The system stores:

- Candidate
- Application
- Job
- Extracted profile
- Screening result
- HR decision
- Audit history

The database becomes the authoritative source.

---

# 10. Business Gap 8 — Reporting Requires Manual Work

## Current Situation

HR may need to prepare spreadsheets for:

- Candidate lists
- Screening results
- Approved candidates
- Rejected candidates
- Recruitment statistics

This can require manually consolidating information.

## Proposed Solution

Provide an Excel export.

The system can generate:

    Database
       ↓
    Export
       ↓
    Excel

Example columns:

    Candidate Name
    Email
    Position
    Application Date
    Screening Score
    Screening Decision
    HR Decision
    Decision Date

Excel is a reporting format.

It is NOT the primary database.

---

# 11. Business Gap 9 — Lack of Auditability

## Current Situation

When recruitment is handled manually, it can be difficult to answer questions such as:

- When did the candidate apply?
- When was the candidate screened?
- What score did they receive?
- Which screening rules were used?
- Who approved the candidate?
- Who rejected the candidate?
- When was the email sent?

## Proposed Solution

Create an audit trail.

Example:

    Application Created
          ↓
    CV Processed
          ↓
    AI Extraction Completed
          ↓
    Screening Completed
          ↓
    HR Approved
          ↓
    Approval Email Sent

This provides traceability.

---

# 12. Business Gap 10 — AI Reliability

## Problem

Using AI without controls introduces risks such as:

- Hallucinated candidate information
- Incorrect extraction
- Unsupported assumptions
- Inconsistent outputs
- AI making decisions outside its responsibility

For an HR system, this is unacceptable.

## Proposed Solution

The system uses multiple validation layers.

    CV
     ↓
    AI
     ↓
    Pydantic Validation
     ↓
    Business Validation
     ↓
    Deterministic Screening
     ↓
    HR Review

The AI cannot directly change recruitment decisions.

---

# 13. Why AI Is Used

AI is useful because CVs are unstructured.

Traditional software is good at processing:

    Structured Data

For example:

    {
        "experience_years": 5,
        "skills": ["Python", "FastAPI"]
    }

But CVs look more like:

    "Software engineer with more than five years
    of experience developing backend applications..."

AI helps convert the unstructured information into structured data.

Therefore:

> **AI is primarily an extraction and interpretation layer.**

The deterministic application logic remains responsible for business decisions.

---

# 14. Business Process Before Automation

A simplified manual process:

    Candidate
       ↓
    Application
       ↓
    HR Opens CV
       ↓
    HR Reads CV
       ↓
    HR Extracts Information
       ↓
    HR Compares Requirements
       ↓
    HR Records Information
       ↓
    HR Makes Decision
       ↓
    HR Sends Email
       ↓
    HR Updates Spreadsheet

This process contains many manual steps.

---

# 15. Business Process After Automation

The proposed process:

    Candidate
       ↓
    Website Application
       ↓
    Automatic Validation
       ↓
    CV Processing
       ↓
    AI Information Extraction
       ↓
    Automatic Screening
       ↓
    Screening Score
       ↓
    HR Review
       ↓
    HR Approves / Rejects
       ↓
    Automatic Email
       ↓
    Database + Audit Log
       ↓
    Excel Export When Needed

The system removes repetitive administrative work while preserving human control.

---

# 16. Expected Business Benefits

## Time Reduction

HR spends less time:

- Reading every CV from scratch
- Copying information
- Entering repetitive data
- Calculating screening scores
- Sending repetitive emails
- Preparing reports

---

## Increased Processing Capacity

HR can potentially process a larger number of applications without increasing administrative workload proportionally.

---

## Consistent Screening

Predefined screening rules ensure that candidates are evaluated against the same criteria.

---

## Better Visibility

HR can see:

- Candidate information
- Screening score
- Score breakdown
- Evidence
- HR decision
- Audit history

in one system.

---

## Reduced Administrative Errors

Automation reduces manual copying and repetitive data entry.

---

## Faster Candidate Communication

Once HR makes a decision, the corresponding email can be sent automatically.

---

# 17. Important Business Principle

The objective is NOT:

> Replace HR with AI.

The objective is:

> **Remove repetitive administrative work so HR can spend more time on human judgment and recruitment activities that actually require human involvement.**

---

# 18. Before vs After

| Process | Current | Proposed |
|---|---|---|
| Application collection | Manual/website | Website |
| Candidate data entry | Manual | Automated |
| CV reading | Manual | AI-assisted |
| Information extraction | Manual | AI-assisted |
| Screening calculation | Manual | Automated |
| Screening consistency | Variable | Rule-based |
| Final decision | HR | HR |
| Candidate approval email | Manual | Automated |
| Candidate rejection email | Manual | Automated |
| Database | Potentially fragmented | Centralized |
| Reporting | Manual | Excel export |
| Audit trail | Limited | Automated |

---

# 19. What the System Does NOT Do

The system intentionally does NOT:

- Automatically hire candidates.
- Automatically reject candidates without HR approval.
- Automatically approve candidates without HR approval.
- Schedule interviews.
- Manage calendars.
- Send WhatsApp messages.
- Automatically choose interview dates.
- Create meetings.
- Replace HR judgment.

These limitations are intentional.

They reduce system complexity and reduce the risk of uncontrolled automation.

---

# 20. Success Criteria

The project should be considered successful when HR can:

1. Receive candidate applications through the website.
2. See structured candidate information.
3. Review AI-extracted candidate data.
4. See a transparent screening score.
5. Understand why the candidate received the score.
6. Approve or reject the candidate.
7. Automatically notify the candidate through email.
8. Export recruitment information to Excel.
9. Review the history of important actions.

---

# 21. Example Business Scenario

Imagine a job opening receives:

    300 applications

### Without the system

HR may need to:

    Open 300 CVs
       ↓
    Read 300 CVs
       ↓
    Identify skills
       ↓
    Check experience
       ↓
    Compare requirements
       ↓
    Record information
       ↓
    Calculate scores
       ↓
    Contact candidates

This creates a large amount of repetitive administrative work.

### With the system

    300 Applications
          ↓
    Automatic Processing
          ↓
    Structured Candidate Profiles
          ↓
    Screening Scores
          ↓
    HR Reviews Results
          ↓
    HR Approves / Rejects
          ↓
    Automatic Email

HR's time is concentrated on reviewing candidates rather than repeatedly processing raw information.

---

# 22. Business Value

The primary value proposition is:

> **Reduce HR's repetitive recruitment administration while improving consistency, visibility, and processing speed.**

The system creates value through three major mechanisms:

### 1. Automation

Reduce repetitive manual tasks.

### 2. Standardization

Apply consistent screening rules.

### 3. Human-in-the-Loop

Keep HR responsible for consequential decisions.

---

# 23. Project Scope

## MVP

The MVP should focus on:

    Application
    +
    CV Processing
    +
    AI Extraction
    +
    Screening
    +
    HR Review
    +
    HR Approval/Rejection
    +
    Email
    +
    Excel Export
    +
    Audit Log

The MVP should NOT attempt to become a complete HR management system.

---

# 24. Future Possibilities

Future functionality may include:

- More advanced recruitment analytics
- Additional communication channels
- Interview management
- Calendar integrations
- Candidate pipeline management
- Recruitment analytics dashboards
- Job recommendation
- Candidate search
- Advanced reporting

These should be considered future phases.

They should not be implemented in the MVP unless explicitly approved as new requirements.

---

# 25. Business Requirement Summary

The system must solve the following core problems:

    Manual CV Screening
            ↓
    AI-assisted extraction

    Manual Data Entry
            ↓
    Automatic structured data

    Inconsistent Screening
            ↓
    Deterministic screening rules

    Unclear Screening Results
            ↓
    Score + Breakdown + Evidence

    Manual HR Decision Process
            ↓
    HR Dashboard + Approval Gate

    Manual Candidate Communication
            ↓
    Automated Email

    Fragmented Recruitment Data
            ↓
    Centralized PostgreSQL database

    Manual Reporting
            ↓
    Excel Export

    Poor Traceability
            ↓
    Audit Logs

---

# 26. Final Business Workflow

```mermaid
flowchart TD

    A[Candidate] --> B[Website Application]

    B --> C[Automatic Validation]

    C --> D[Candidate Database]

    D --> E[CV Processing]

    E --> F[AI Extraction]

    F --> G[Structured Candidate Data]

    G --> H[Screening Rules]

    H --> I[Screening Score]

    I --> J[HR Dashboard]

    J --> K{HR Decision}

    K -->|Approve| L[APPROVED]

    K -->|Reject| M[REJECTED]

    L --> N[Approval Email]

    M --> O[Rejection Email]

    N --> P[Audit Log]

    O --> P

    D --> Q[Excel Export]