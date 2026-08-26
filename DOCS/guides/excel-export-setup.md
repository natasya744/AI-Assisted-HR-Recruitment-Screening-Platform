# Excel Export Setup (openpyxl)

Step-by-step guide for wiring `.xlsx` export into the backend's `export_service.py`.

## 1. What openpyxl is (and why there is no key)

`openpyxl` is a **pure-Python library** that reads and writes Excel `.xlsx` files on your own machine. It is not a hosted service, so there is **no API key, no signup, and no credentials** — nothing to copy.

| | |
|---|---|
| Package | `openpyxl` |
| Approved pin | **`openpyxl==3.1.5`** (recorded in `docs/todos.md`) |
| Runtime | Runs inside the FastAPI backend process |
| Network | None — works offline |

> You only need credentials if you later switch to a *hosted* export/generator service (not the plan). The approved approach is local `openpyxl`.

## 2. Add the dependency (backend)

From `backend/`:

```bash
cd backend
uv add "openpyxl==3.1.5"
uv sync --locked
```

This updates `backend/pyproject.toml` and `backend/uv.lock`. Commit both. Do **not** use `openpyxl` in the frontend — export happens on the server.

Verify it resolved:

```bash
uv run --locked --no-sync python -c "import openpyxl; print(openpyxl.__version__)"
# 3.1.5
```

## 3. Minimum usage in `export_service.py`

```python
import io

from openpyxl import Workbook


def build_applications_workbook(rows: list[dict]) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "Applications"

    columns = [
        "Candidate Name", "Email", "Position", "Applied At",
        "Screening Score", "Screening Decision", "HR Decision", "Decision At",
    ]
    ws.append(columns)

    for r in rows:
        ws.append([
            r.get("name"), r.get("email"), r.get("position"),
            r.get("applied_at"), r.get("score"), r.get("screening_decision"),
            r.get("hr_decision"), r.get("decision_at"),
        ])

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
```

The export service builds rows from Postgres (`screening_results`, `applications`, `hr_decisions`) and returns workbook bytes. It performs **no AI** and **never calls the network** — pure deterministic reporting.

## 4. Serve it from FastAPI (Phase 8 route)

```python
from fastapi import APIRouter, Response

router = APIRouter(prefix="/api/exports", tags=["exports"])


@router.get("/applications")
def export_applications() -> Response:
    data = export_service.build_rows()
    content = build_applications_workbook(data)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="applications.xlsx"'},
    )
```

The correct media type is `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` — using `application/octet-stream` also works but gives less helpful file handling in the browser.

## 5. Where columns come from

| Excel column | Source table |
|---|---|
| Candidate Name / Email | `candidates` |
| Position | `jobs` |
| Applied At | `applications` |
| Screening Score / Decision | `screening_results` |
| HR Decision / Decision At | `hr_decisions` |

See the ER diagram in [`docs/architecture.md`](architecture.md#9-data-model).

## 6. Verify (demo-oriented)

- Open the downloaded file in Excel / Numbers / LibreOffice and confirm headers + rows match the HR dashboard.
- Confirm a filtered export by job returns only that job's applicants.

## Troubleshooting

- **Nothing downloads** → check the route is under `/api/exports` and the media type string is exactly as above.
- **Imported module not found** → re-run `uv sync --locked` (the package install registers `openpyxl`).
- **Empty workbook** → confirm `rows` from `export_service.build_rows()` is non-empty before writing.