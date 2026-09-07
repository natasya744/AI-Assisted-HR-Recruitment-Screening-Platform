"""Document processing service for playground.

Responsible for converting PDF to Markdown (via Docling in app.services.document_service)
and reading markdown files for testing.
"""

from __future__ import annotations

from pathlib import Path

from app.services.document_service import pdf_to_markdown


def convert_pdf_to_markdown(
    pdf_path: str | Path,
    output_path: str | Path | None = None,
) -> str:
    """Convert a PDF document into clean Markdown using Docling.

    Args:
        pdf_path: Path to the input PDF file.
        output_path: Optional path to save the generated Markdown.

    Returns:
        The markdown string.
    """
    path = Path(pdf_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF file not found: {path}")

    print(f"📄 [DocumentService] Converting PDF to Markdown: {path.name}...")
    md_content = pdf_to_markdown(str(path))

    if output_path:
        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(md_content, encoding="utf-8")
        print(f"💾 [DocumentService] Saved output to: {out_file}")

    return md_content


def load_markdown(md_path: str | Path) -> str:
    """Load an existing Markdown file directly (fast path without OCR/Docling).

    Args:
        md_path: Path to the markdown file.

    Returns:
        The markdown string.
    """
    path = Path(md_path)
    if not path.exists():
        raise FileNotFoundError(f"Markdown file not found: {path}")

    print(f"📖 [DocumentService] Reading Markdown file: {path.name}")
    return path.read_text(encoding="utf-8")
