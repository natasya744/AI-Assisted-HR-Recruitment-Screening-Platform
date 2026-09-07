"""Screening pipeline orchestrator for playground.

Orchestrates communication across services and providers:
  1. Document Processing: PDF -> Markdown (via DocumentService) or load pre-converted
  2. AI Extraction: Markdown -> CandidateProfileExtracted (via ExtractionProvider)
  3. Validation Pipeline: business bounds, deterministic merge, field-level provenance
  4. Anti-Hallucination: Form Ground Truth vs. PDF Profile (via AlignmentService)
  5. Deterministic Scoring: Rule-based mathematical scoring (via ScoringService)
  6. AI Advice: Requirement-level assessment (via AdvisorProvider)
  7. Consolidated Dossier: Assembles final candidate dossier matching database models
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from playground.providers.advisor_provider import get_screening_advice_dossier
from playground.providers.extraction_provider import extract_profile_with_provenance
from playground.services.alignment_service import check_profile_alignment
from playground.services.document_service import convert_pdf_to_markdown, load_markdown
from playground.services.scoring_service import calculate_deterministic_score
from playground.services.validation_service import run_validation_pipeline


def run_screening_pipeline(
    cv_source_path: str | Path,
    job: dict[str, Any],
    form_data: dict[str, Any],
    *,
    force_mock: bool = False,
    output_md_path: str | Path | None = None,
) -> dict[str, Any]:
    """Execute the full end-to-end recruitment screening pipeline.

    Args:
        cv_source_path: Path to PDF or pre-converted Markdown file.
        job: Job configuration dictionary.
        form_data: Candidate form submission (ground truth).
        force_mock: If True, uses offline fixtures for AI steps.
        output_md_path: Optional path to write converted markdown if input is PDF.

    Returns:
        Complete screening dossier dictionary.
    """
    path = Path(cv_source_path)
    is_pdf = path.suffix.lower() == ".pdf"

    print("\n" + "=" * 75)
    print("🚀 EXECUTING RECRUITMENT SCREENING PIPELINE")
    print(f"   Input:     {path.name} ({'PDF document' if is_pdf else 'Markdown'})")
    print(f"   Job Title: {job['title']}")
    print(f"   Candidate: {form_data.get('full_name')} <{form_data.get('email')}>")
    print("=" * 75 + "\n")

    # --- Stage 1: Document Processing ---
    if is_pdf:
        markdown_text = convert_pdf_to_markdown(path, output_path=output_md_path)
    else:
        markdown_text = load_markdown(path)

    print(f"   Markdown ready: {len(markdown_text)} characters\n")

    # --- Stage 2: AI Profile Extraction ---
    profile, provenance = extract_profile_with_provenance(markdown_text, force_mock=force_mock)
    skills_preview = ", ".join(profile.skills[:5])
    print(f"   Extracted Name:       {profile.full_name}")
    print(f"   Extracted Skills:     {len(profile.skills)} skills ({skills_preview}...)")
    print(
        f"   Extracted Experience: {profile.total_experience_years} years "
        f"across {len(profile.work_experience)} jobs"
    )
    edu_degree = profile.education[0].degree if profile.education else "N/A"
    print(f"   Extracted Education:  {edu_degree}\n")

    # --- Stage 2.5: Validation Pipeline (business bounds + deterministic merge + provenance) ---
    validated = run_validation_pipeline(profile, provenance, form_data)
    profile = validated["profile"]
    field_provenance = validated["field_provenance"]
    business_warnings = validated["business_warnings"]
    alignment = validated["alignment_check"]

    print(f"   🔍 Validation Pipeline:")
    if business_warnings:
        print(f"      ⚠️ Business Bounds: {len(business_warnings)} warning(s)")
        for w in business_warnings:
            print(f"         • {w}")
    else:
        print(f"      ✅ Business Bounds: clean")
    print(f"      📋 Field Provenance (source tags):")
    sorted_fields = sorted(field_provenance.items(), key=lambda x: x[0])
    for field, tag in sorted_fields:
        sym = "🧠" if tag == "ai" else "⚙️" if tag == "deterministic" else "🔧" if tag == "manual" else "⬜"
        print(f"         {sym} {field:30} → {tag}")
    print(f"      ✅ Alignment: {'ALL MATCHED' if not alignment or not alignment['has_mismatch'] else 'MISMATCH FLAGGED FOR HR'}")
    print()

    # --- Stage 5: Deterministic Rule-Based Scoring ---
    scoring = calculate_deterministic_score(job, profile)
    bd = scoring["breakdown"]
    print(f"   DETERMINISTIC SCORE: {scoring['total_score']} / {scoring['max_score']}")
    matched_str = ", ".join(bd["skills"]["matched"])
    print(f"   • Skills Match:     {bd['skills']['score']} / {bd['skills']['max']}")
    print(f"                       (Matched: {matched_str})")
    print(
        f"   • Experience Match: {bd['experience']['score']} / {bd['experience']['max']} "
        f"({bd['experience']['years']} yrs vs min {bd['experience']['required_min']})"
    )
    print(
        f"   • Education Match:  {bd['education']['score']} / {bd['education']['max']} "
        f"(Matched: {bd['education']['matched']})"
    )
    print(
        f"   • Other/Certs:      {bd['other']['score']} / {bd['other']['max']} "
        f"(Present: {bd['other']['has_certifications']})\n"
    )

    # --- Stage 6: AI Screening Advisor ---
    advice = get_screening_advice_dossier(job, profile, force_mock=force_mock)
    verdict = advice.get("overall_classification")
    conf = advice.get("advisor_confidence")
    print(f"   Advisor Verdict:    {verdict} (Confidence: {conf})")
    for req in advice.get("per_requirement", []):
        is_yes = req["status"] == "YES"
        is_partial = req["status"] == "PARTIAL_MATCH"
        sym = "✅" if is_yes else ("⚠️" if is_partial else "❌")
        r_text = req["requirement"][:45]
        print(f"   {sym} [{req['status']:13}] {r_text}... -> {req['reason']}")
    print()

    # --- Stage 7: Consolidated Dossier ---
    dossier = {
        "job": {"title": job["title"]},
        "candidate_form": form_data,
        "extracted_pdf_profile": profile.model_dump(),
        "provenance": provenance,
        "field_provenance": field_provenance,
        "business_warnings": business_warnings,
        "alignment_check": alignment,
        "deterministic_screening": scoring,
        "ai_advice": advice,
    }

    print("=" * 75)
    print("✨ SCREENING DOSSIER READY: All modules communicated successfully.")
    print("=" * 75 + "\n")
    return dossier
