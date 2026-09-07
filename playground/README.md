# Modular Screening Pipeline Playground

This playground provides a modular testing harness matching the **backend architecture** of the **AI-Assisted HR Recruitment Screening Platform**.

---

## Directory Structure (Mirrors Backend)

```
playground/
├── config.py                 # Paths & environment setup (mirrors backend/app/core/config.py)
├── data/
│   └── fixtures.py           # Sample Job, Candidate Form Data & fallback profile/advice fixtures
├── services/                 # Pure business logic (mirrors backend/app/services/)
│   ├── document_service.py   # PDF -> Markdown conversion via Docling & file loader
│   ├── alignment_service.py  # Anti-hallucination check (Form ground truth vs. PDF profile)
│   └── scoring_service.py    # Deterministic rule-based scoring math & breakdown
├── providers/                # External AI provider clients (mirrors backend/app/providers/)
│   ├── extraction_provider.py# Calls resume_extractor.py with provenance & fallback
│   └── advisor_provider.py   # Calls screening_advisor.py with fallback
├── pipeline.py               # Orchestrator (mirrors backend/app/services/application_service.py)
├── main.py                   # Modular CLI runner with subcommands
├── playground.py             # Backwards-compatible entrypoint
└── README.md                 # Documentation
```

---

## How Modules Communicate With Each Other

```
1. Document Processing (services/document_service.py)
   Takes PDF (e.g. Natasya_AI_Specialist_AutoGroup_Resume.pdf)
   ──▶ Outputs structured Markdown
         │
         ▼
2. AI Resume Extraction (providers/extraction_provider.py)
   Takes Markdown text
   ──▶ Calls app.providers.resume_extractor
   ──▶ Produces CandidateProfileExtracted + field-level provenance tags
         │
         ▼
3. Anti-Hallucination Alignment (services/alignment_service.py)
   Compares Form Ground Truth vs. Extracted PDF Profile
   ──▶ Flags per-field status (MATCH / MISMATCH / MISSING)
   ──▶ Never auto-corrects; flags differences for HR inspection
         │
         ├─────────────────────────────────────────┐
         ▼                                         ▼
4. Deterministic Scoring Engine              5. AI Screening Advisor
   (services/scoring_service.py)                (providers/advisor_provider.py)
   Evaluates skills, experience,                Evaluates qualifications against job desc,
   education, certs against weights             generates evidence quotes & reasons
   ──▶ Score (0-100), Breakdown, Evidence      ──▶ YES / NO / PARTIAL_MATCH per requirement
         │                                         │
         └────────────────────┬────────────────────┘
                              ▼
6. Consolidated Screening Dossier (pipeline.py)
   Assembles complete candidate evaluation payload ready for DB persistence & HR Dashboard review.
```

---

## Running Individual Modules

You can test each module in isolation:

### 1. Test Full Pipeline
```bash
uv run --directory backend --locked --no-sync python ../playground/main.py all
```
*Add `--use-pdf` to convert from raw PDF instead of pre-converted Markdown.*

### 2. Test Document Processing (PDF $\rightarrow$ Markdown)
```bash
uv run --directory backend --locked --no-sync python ../playground/main.py convert --pdf ../samples/Natasya_AI_Specialist_AutoGroup_Resume.pdf --out ../playground/output_resume.md
```

### 3. Test Resume Extraction
```bash
uv run --directory backend --locked --no-sync python ../playground/main.py extract --md ../samples/Natasya_AI_Specialist_AutoGroup_Resume.md
```

### 4. Test Form vs. PDF Alignment (Anti-Hallucination)
```bash
uv run --directory backend --locked --no-sync python ../playground/main.py align
```

### 5. Test Deterministic Rule-Based Scoring Math
```bash
uv run --directory backend --locked --no-sync python ../playground/main.py score
```

### 6. Test AI Screening Advisor
```bash
uv run --directory backend --locked --no-sync python ../playground/main.py advise
```
