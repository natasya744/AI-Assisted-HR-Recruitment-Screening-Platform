"""Playground configuration and path setup."""

from __future__ import annotations

import sys
from pathlib import Path

# Resolve base directories
PLAYGROUND_DIR = Path(__file__).resolve().parent
REPO_ROOT = PLAYGROUND_DIR.parent
BACKEND_DIR = REPO_ROOT / "backend"
SAMPLES_DIR = REPO_ROOT / "samples"

# Auto-detect backend virtualenv site-packages if running with system python
venv_lib = BACKEND_DIR / ".venv" / "lib"
if venv_lib.exists():
    for site_pkg in venv_lib.glob("python*/site-packages"):
        if str(site_pkg) not in sys.path:
            sys.path.insert(0, str(site_pkg))

# Ensure backend directory and repo root are in sys.path
for base_path in [BACKEND_DIR, REPO_ROOT]:
    if str(base_path) not in sys.path:
        sys.path.insert(0, str(base_path))

# Default file paths
DEFAULT_PDF_PATH = SAMPLES_DIR / "Natasya_AI_Specialist_AutoGroup_Resume.pdf"
DEFAULT_MD_PATH = SAMPLES_DIR / "Natasya_AI_Specialist_AutoGroup_Resume.md"
DEFAULT_OUTPUT_MD = PLAYGROUND_DIR / "output_resume.md"

# Single configuration boundary: delegate directly to app.core.config
from app.core.config import settings  # noqa: E402

__all__ = [
    "PLAYGROUND_DIR",
    "REPO_ROOT",
    "BACKEND_DIR",
    "SAMPLES_DIR",
    "DEFAULT_PDF_PATH",
    "DEFAULT_MD_PATH",
    "DEFAULT_OUTPUT_MD",
    "settings",
]
