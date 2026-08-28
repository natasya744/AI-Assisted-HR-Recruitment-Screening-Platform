#!/usr/bin/env python3
"""Test docling PDF→markdown conversion with the sample CV."""

from pathlib import Path

from app.services.document_service import pdf_to_chunks, pdf_to_markdown

SAMPLES_DIR = Path(__file__).resolve().parent.parent.parent / "samples"
PDF_PATH = SAMPLES_DIR / "Natasya_AI_Specialist_AutoGroup_Resume.pdf"


def main():
    pdf_path = PDF_PATH
    if not pdf_path.exists():
        print(f"Sample PDF not found: {pdf_path}")
        return

    print(f"Processing: {pdf_path.name}")
    print("=" * 60)

    # --- Export to markdown ---
    print("\n>>> pdf_to_markdown()\n")
    md = pdf_to_markdown(str(pdf_path))
    print(md)

    # --- Chunks ---
    print("\n" + "=" * 60)
    print(f">>> pdf_to_chunks() — {PDF_PATH.name}")
    print("=" * 60)
    chunks = pdf_to_chunks(str(pdf_path))
    for i, chunk in enumerate(chunks):
        print(f"\n--- Chunk {i + 1} ---")
        print(f"  meta: {chunk['meta']}")
        print(f"  text ({len(chunk['text'])} chars): {chunk['text'][:300]}...")


if __name__ == "__main__":
    main()