"""
Audio tool endpoints: convert format.
"""

from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException

from utils.file_helpers import save_upload_file, validate_extension, human_readable_size
from utils.cleanup import remove_files_silently
from utils.schemas import ProcessedFileResponse
from services import video_service  # FFmpeg helpers live here; reused for audio too
from services.video_service import FFmpegError

router = APIRouter()

BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

AUDIO_EXTENSIONS = [".mp3", ".wav", ".aac"]


def _build_download_response(output_path: Path, message: str) -> ProcessedFileResponse:
    size = output_path.stat().st_size
    return ProcessedFileResponse(
        message=message,
        download_url=f"/outputs/{output_path.name}",
        filename=output_path.name,
        size_bytes=size,
        size_readable=human_readable_size(size),
    )


@router.post("/convert", response_model=ProcessedFileResponse)
async def convert_audio_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_format: str = Form(...),  # 'mp3' | 'wav' | 'aac'
):
    validate_extension(file.filename, AUDIO_EXTENSIONS)

    target_format = target_format.lower().lstrip(".")
    if target_format not in ("mp3", "wav", "aac"):
        raise HTTPException(status_code=400, detail="target_format must be mp3, wav, or aac")

    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        output_path = OUTPUT_DIR / f"{saved_path.stem}.{target_format}"
        video_service.convert_audio(saved_path, output_path)

        background_tasks.add_task(remove_files_silently, [saved_path])

        return _build_download_response(output_path, f"Converted to {target_format.upper()}")
    except FFmpegError as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to convert audio: {str(e)}")