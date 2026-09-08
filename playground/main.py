"""Modular CLI entrypoint for testing recruitment screening components."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add repository root and backend to sys.path
_REPO_ROOT = Path(__file__).resolve().parent.parent
_BACKEND_DIR = _REPO_ROOT / "backend"
for _p in [str(_REPO_ROOT), str(_BACKEND_DIR)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from playground.config import (  # noqa: E402
    DEFAULT_MD_PATH,
    DEFAULT_OUTPUT_MD,
    DEFAULT_PDF_PATH,
    settings,
)
from playground.data.fixtures import (  # noqa: E402
    DEFAULT_FORM_DATA,
    DEFAULT_SAMPLE_JOB,
    FIXTURE_EXTRACTED_PROFILE,
)
from playground.pipeline import run_screening_pipeline  # noqa: E402
from playground.providers.advisor_provider import get_screening_advice_dossier  # noqa: E402
from playground.providers.extraction_provider import extract_profile_with_provenance  # noqa: E402
from playground.services.alignment_service import check_profile_alignment  # noqa: E402
from playground.services.document_service import (  # noqa: E402
    convert_pdf_to_markdown,
    load_markdown,
)
from playground.services.scoring_service import calculate_deterministic_score  # noqa: E402
from playground.services.validation_service import run_validation_pipeline  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Modular Playground for AI-Assisted HR Recruitment Screening Platform",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    subparsers = parser.add_subparsers(
        dest="command", help="Module or stage to execute"
    )

    # Command: all
    sub_all = subparsers.add_parser(
        "all", help="Execute the complete end-to-end screening pipeline"
    )
    sub_all.add_argument(
        "--use-pdf",
        action="store_true",
        help="Start from PDF conversion rather than pre-converted markdown",
    )
    sub_all.add_argument(
        "--pdf", type=str, default=str(DEFAULT_PDF_PATH), help="PDF path"
    )
    sub_all.add_argument(
        "--md", type=str, default=str(DEFAULT_MD_PATH), help="Markdown path"
    )
    sub_all.add_argument(
        "--out",
        type=str,
        default=str(DEFAULT_OUTPUT_MD),
        help="Output markdown path if using PDF",
    )
    sub_all.add_argument(
        "--mock", action="store_true", help="Force offline fixtures for AI steps"
    )

    # Command: convert
    sub_conv = subparsers.add_parser(
        "convert", help="Convert PDF to Markdown via Docling"
    )
    sub_conv.add_argument(
        "--pdf", type=str, default=str(DEFAULT_PDF_PATH), help="PDF path"
    )
    sub_conv.add_argument(
        "--out", type=str, default=str(DEFAULT_OUTPUT_MD), help="Output path"
    )

    # Command: extract
    sub_ext = subparsers.add_parser(
        "extract", help="Extract structured profile from Markdown"
    )
    sub_ext.add_argument(
        "--md", type=str, default=str(DEFAULT_MD_PATH), help="Markdown path"
    )
    sub_ext.add_argument("--mock", action="store_true", help="Force offline fixture")

    # Command: align
    subparsers.add_parser(
        "align", help="Run anti-hallucination alignment check (Form vs PDF)"
    )

    # Command: score
    subparsers.add_parser("score", help="Run deterministic rule-based scoring math")

    # Command: advise
    sub_advise = subparsers.add_parser("advise", help="Run AI qualification advisor")
    sub_advise.add_argument("--mock", action="store_true", help="Force offline fixture")

    # Command: validate
    sub_validate = subparsers.add_parser(
        "validate", help="Run validation pipeline (bounds + merge + provenance)"
    )
    sub_validate.add_argument(
        "--fixture",
        action="store_true",
        default=True,
        help="Use fixture profile (default)",
    )
    sub_validate.add_argument(
        "--md", type=str, help="Extract from Markdown first, then validate"
    )

    args = parser.parse_args()

    # Default to 'all' if no subcommand provided
    command = args.command or "all"

    print(
        f"\n[Playground] Mode: {command} | Configured Model: {settings.OPENAI_CHAT_MODEL}"
    )

    if command == "convert":
        print("--- Testing Module: Document Processing (PDF -> Markdown) ---")
        out_path = Path(args.out)
        convert_pdf_to_markdown(args.pdf, output_path=out_path)
        print(f"✅ Conversion complete. Markdown saved to: {out_path}\n")

    elif command == "extract":
        print("--- Testing Module: Resume Extraction ---")
        content = load_markdown(args.md)
        profile, _ = extract_profile_with_provenance(content, force_mock=args.mock)
        print("\nStructured Profile Extracted:")
        print(profile.model_dump_json(indent=2))

    elif command == "align":
        print("--- Testing Module: Anti-Hallucination Alignment ---")
        profile = FIXTURE_EXTRACTED_PROFILE
        res = check_profile_alignment(DEFAULT_FORM_DATA, profile)
        print("\nAlignment Check Results:")
        for field, detail in res["fields"].items():
            sym = "✅" if detail["status"] == "MATCH" else "⚠️"
            form_v = detail["form_value"]
            pdf_v = detail["pdf_value"]
            print(
                f"  {sym} {field:12}: {detail['status']} (Form: '{form_v}' | PDF: '{pdf_v}')"
            )
        print(f"\nHas Mismatches: {res['has_mismatch']}\n")

    elif command == "score":
        print("--- Testing Module: Deterministic Scoring Engine ---")
        profile = FIXTURE_EXTRACTED_PROFILE
        score_res = calculate_deterministic_score(DEFAULT_SAMPLE_JOB, profile)
        print(f"\nTotal Score: {score_res['total_score']} / {score_res['max_score']}")
        print("Category Breakdown:")
        for cat, data in score_res["breakdown"].items():
            print(f"  • {cat:12}: {data['score']} / {data['max']}")
        print(f"\nMatched Skills: {score_res['evidence']['matched_skills']}")
        print(f"Missing Skills: {score_res['evidence']['missing_skills']}\n")

    elif command == "advise":
        print("--- Testing Module: AI Screening Advisor ---")
        profile = FIXTURE_EXTRACTED_PROFILE
        advice = get_screening_advice_dossier(
            DEFAULT_SAMPLE_JOB, profile, force_mock=args.mock
        )
        verdict = advice.get("overall_classification")
        conf = advice.get("advisor_confidence")
        print(f"\nClassification: {verdict} (Confidence: {conf})")
        print("Requirements Assessment:")
        for req in advice.get("per_requirement", []):
            sym = "✅" if req["status"] in ("YES", "MATCH") else "⚠️"
            print(f"  {sym} [{req['status']}] {req['requirement']}")
            print(f"     Evidence: {req['evidence']}")
            print(f"     Reason:   {req['reason']}")
        print()

    elif command == "validate":
        print("--- Testing Module: Validation Pipeline (Phase 4.3) ---")

        if args.md:
            content = load_markdown(args.md)
            profile, raw_prov = extract_profile_with_provenance(
                content, force_mock=False
            )
            print(f"   Extracted profile via live AI: {profile.full_name}")
        else:
            profile = FIXTURE_EXTRACTED_PROFILE
            raw_prov = {
                f: "fixture_ai"
                for f in [
                    "full_name",
                    "email",
                    "phone",
                    "location",
                    "linkedin_url",
                    "professional_summary",
                    "skills",
                    "total_experience_years",
                    "work_experience",
                    "education",
                    "certifications",
                    "languages",
                ]
            }
            print(f"   Using fixture profile: {profile.full_name}")

        validated = run_validation_pipeline(profile, raw_prov, DEFAULT_FORM_DATA)
        fp = validated["field_provenance"]
        warnings = validated["business_warnings"]
        alignment = validated["alignment_check"]

        print("\n   📋 Field-Level Provenance:")
        for field in sorted(fp):
            tag = fp[field]
            sym = (
                "🧠"
                if tag == "ai"
                else "⚙️"
                if tag == "deterministic"
                else "⬜"
                if tag == "missing"
                else "🔧"
            )
            print(f"      {sym} {field:30} → {tag}")

        print(f"\n   ⚠️ Business Warnings ({len(warnings)}):")
        if warnings:
            for w in warnings:
                print(f"      • {w}")
        else:
            print("      (none — clean)")

        print("\n   🔄 Alignment:")
        if alignment:
            for field, detail in alignment["fields"].items():
                sym = "✅" if detail["status"] == "MATCH" else "⚠️"
                print(f"      {sym} {field:12}: {detail['status']}")
            print(f"      Has Mismatch: {alignment['has_mismatch']}")
        print()

    elif command == "all":
        input_file = (
            Path(args.pdf) if getattr(args, "use_pdf", False) else Path(args.md)
        )
        out_file = Path(args.out) if getattr(args, "use_pdf", False) else None
        force_mock = getattr(args, "mock", False)

        run_screening_pipeline(
            cv_source_path=input_file,
            job=DEFAULT_SAMPLE_JOB,
            form_data=DEFAULT_FORM_DATA,
            force_mock=force_mock,
            output_md_path=out_file,
        )


if __name__ == "__main__":
    main()
