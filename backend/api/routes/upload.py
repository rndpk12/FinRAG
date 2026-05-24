from fastapi import APIRouter, UploadFile, File
import shutil
import os

from backend.ingest.ingest import ingest

router = APIRouter()

UPLOAD_DIR = "backend/data/financial_reports"

# Create upload directory if not exists
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Run ingestion pipeline
    ingest()

    return {
        "message": "PDF uploaded and indexed successfully",
        "filename": file.filename
    }