
import csv
import io
import math

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="DataPilot AI API",
    description="Backend API for DataPilot AI",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = 10 * 1024 * 1024


@app.get("/")
def root():
    return {"message": "Welcome to DataPilot AI API", "status": "running"}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "DataPilot AI API"}


@app.post("/api/analyze-csv")
async def analyze_csv(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "Please upload a CSV file.")

    content = await file.read(MAX_FILE_SIZE + 1)

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(413, "CSV must be 10 MB or smaller.")

    if not content:
        raise HTTPException(400, "The uploaded file is empty.")

    try:
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text))
        headers = reader.fieldnames

        if not headers or not any((h or "").strip() for h in headers):
            raise HTTPException(400, "The CSV has no header row.")

        headers = [(h or "").strip() for h in headers]

        if any(not h for h in headers):
            raise HTTPException(400, "Every column needs a name.")

        if len(set(headers)) != len(headers):
            raise HTTPException(400, "Column names must be unique.")

        rows = []
        for row in reader:
            if None in row:
                raise HTTPException(
                    400, "Some rows contain more values than the header."
                )
            rows.append({
                key: (value or "").strip()
                for key, value in row.items()
            })

    except HTTPException:
        raise
    except (UnicodeDecodeError, csv.Error, ValueError):
        raise HTTPException(
            400, "Could not read this CSV. Check its encoding and format."
        )

    if not rows:
        raise HTTPException(400, "The CSV contains no data rows.")

    columns = []
    numeric_columns = []

    for name in headers:
        values = [row.get(name, "") for row in rows]
        present = [value for value in values if value != ""]
        numbers = []

        for value in present:
            try:
                number = float(value)
                if not math.isfinite(number):
                    break
                numbers.append(number)
            except ValueError:
                break

        is_numeric = bool(present) and len(numbers) == len(present)

        summary = {
            "name": name,
            "type": "numeric" if is_numeric else "text",
            "missing": len(rows) - len(present),
            "unique": len(set(present)),
        }

        if is_numeric:
            numeric_columns.append(name)
            summary["mean"] = round(sum(numbers) / len(numbers), 2)
            summary["min"] = min(numbers)
            summary["max"] = max(numbers)

        columns.append(summary)

    total_cells = len(rows) * len(headers)
    missing_cells = sum(column["missing"] for column in columns)

    insights = [
        f"Your dataset contains {len(rows):,} rows and {len(headers)} columns."
    ]

    if missing_cells:
        insights.append(
            f"{missing_cells:,} cells are empty. Review missing values "
            "before relying on the results."
        )
    else:
        insights.append("No empty cells were found in the dataset.")

    if numeric_columns:
        insights.append(
            f"Numeric analysis is available for: {', '.join(numeric_columns)}."
        )
    else:
        insights.append(
            "No numeric columns were detected. Check whether numbers "
            "are stored as text."
        )

    return {
        "filename": file.filename,
        "rows": len(rows),
        "column_count": len(headers),
        "total_cells": total_cells,
        "missing_cells": missing_cells,
        "completeness_percent": round(
            100 * (total_cells - missing_cells) / total_cells, 2
        ),
        "columns": columns,
        "preview": rows[:10],
        "insights": insights,
    }
