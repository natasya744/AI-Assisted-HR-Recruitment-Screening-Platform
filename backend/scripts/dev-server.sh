#!/usr/bin/env bash
# Dev server runner for HR Screening Backend
# Restarts FastAPI with uvicorn on port 8001

set -euo pipefail

cd "$(dirname "$0")/.."

echo "Starting FastAPI server on port 8001..."
echo "Press Ctrl+C to stop"
echo ""

uv run uvicorn app.main:app --reload --port 8001