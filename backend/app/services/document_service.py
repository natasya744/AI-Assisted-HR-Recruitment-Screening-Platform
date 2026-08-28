from io import BytesIO
from pathlib import Path

import pypdf
from docling.chunking import HierarchicalChunker
from docling.document_converter import DocumentConverter

_converter: DocumentConverter | None = None
_chunker: HierarchicalChunker | None = None


def _get_converter() -> DocumentConverter:
    global _converter
    if _converter is None:
        _converter = DocumentConverter()
    return _converter


def _get_chunker() -> HierarchicalChunker:
    global _chunker
    if _chunker is None:
        _chunker = HierarchicalChunker()
    return _chunker


def pdf_to_text(source: str | Path | bytes) -> str:
    if isinstance(source, bytes):
        reader = pypdf.PdfReader(BytesIO(source))
    else:
        reader = pypdf.PdfReader(source)
    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n".join(pages)


def pdf_to_markdown(source: str | Path | bytes) -> str:
    conv = _get_converter()
    if isinstance(source, bytes):
        result = conv.convert(BytesIO(source))
    else:
        result = conv.convert(source)
    return result.document.export_to_markdown()


def pdf_to_chunks(source: str | Path | bytes) -> list[dict]:
    conv = _get_converter()
    chunker = _get_chunker()
    if isinstance(source, bytes):
        result = conv.convert(BytesIO(source))
    else:
        result = conv.convert(source)

    chunks = list(chunker.chunk(result.document))
    output = []
    for chunk in chunks:
        entry = {"text": chunk.text}
        if hasattr(chunk.meta, "model_dump"):
            meta = chunk.meta.model_dump(exclude_none=True)
        else:
            meta = str(chunk.meta)
        entry["meta"] = meta
        output.append(entry)
    return output