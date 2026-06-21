"""
QR code generation endpoint.
"""

from pathlib import Path
import uuid

from fastapi import APIRouter, Form, HTTPException, BackgroundTasks

from utils.file_helpers import human_readable_size
from utils.cleanup import remove_files_silently
from utils.schemas import ProcessedFileResponse
from services import qr_service

router = APIRouter()

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "outputs"

MAX_DATA_LENGTH = 2000  # QR codes degrade badly with too much data


@router.post("/generate", response_model=ProcessedFileResponse)
async def generate_qr_endpoint(
    background_tasks: BackgroundTasks,
    data: str = Form(...),
    fill_color: str = Form("black"),
    back_color: str = Form("white"),
):
    data = data.strip()
    if not data:
        raise HTTPException(status_code=400, detail="Please provide text or a URL to encode")
    if len(data) > MAX_DATA_LENGTH:
        raise HTTPException(status_code=400, detail=f"Data too long (max {MAX_DATA_LENGTH} characters)")

    try:
        output_path = OUTPUT_DIR / f"qrcode_{uuid.uuid4().hex[:8]}.png"
        qr_service.generate_qr_code(data, output_path, fill_color=fill_color, back_color=back_color)

        size = output_path.stat().st_size
        return ProcessedFileResponse(
            message="QR code generated",
            download_url=f"/outputs/{output_path.name}",
            filename=output_path.name,
            size_bytes=size,
            size_readable=human_readable_size(size),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate QR code: {str(e)}")