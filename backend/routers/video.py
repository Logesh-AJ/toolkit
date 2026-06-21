"""
Video tool endpoints: convert format, compress, trim, extract audio.
Also exposes a /probe endpoint used by the Trim tool to fetch duration
before the user picks a start/end range.
"""

from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException

from utils.file_helpers import save_upload_file, validate_extension, human_readable_size
from utils.cleanup import remove_files_silently
from utils.schemas import ProcessedFileResponse, MediaInfoResponse
from services import video_service
from services.video_service import FFmpegError

router = APIRouter()

BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv"]


def _build_download_response(output_path: Path, message: str) -> ProcessedFileResponse:
    size = output_path.stat().st_size
    return ProcessedFileResponse(
        message=message,
        download_url=f"/outputs/{output_path.name}",
        filename=output_path.name,
        size_bytes=size,
        size_readable=human_readable_size(size),
    )


# ---------------------------------------------------------------------------
# Probe duration (used before Trim)
# ---------------------------------------------------------------------------

@router.post("/probe", response_model=MediaInfoResponse)
async def probe_video_endpoint(file: UploadFile = File(...)):
    validate_extension(file.filename, VIDEO_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        duration = video_service.get_duration_seconds(saved_path)
        # Keep the file around — the Trim endpoint will reference it by upload_token
        return MediaInfoResponse(duration_seconds=duration, upload_token=saved_path.name)
    except FFmpegError as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=400, detail=f"Could not read video: {str(e)}")
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to probe video: {str(e)}")


# ---------------------------------------------------------------------------
# Convert Video Format
# ---------------------------------------------------------------------------

@router.post("/convert", response_model=ProcessedFileResponse)
async def convert_video_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_format: str = Form(...),  # 'mp4' | 'mov' | 'avi' | 'mkv'
):
    validate_extension(file.filename, VIDEO_EXTENSIONS)

    target_format = target_format.lower().lstrip(".")
    if target_format not in ("mp4", "mov", "avi", "mkv"):
        raise HTTPException(status_code=400, detail="target_format must be mp4, mov, avi, or mkv")

    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        output_path = OUTPUT_DIR / f"{saved_path.stem}.{target_format}"
        video_service.convert_video(saved_path, output_path)

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
        raise HTTPException(status_code=500, detail=f"Failed to convert video: {str(e)}")


# ---------------------------------------------------------------------------
# Compress Video
# ---------------------------------------------------------------------------

@router.post("/compress", response_model=ProcessedFileResponse)
async def compress_video_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    level: str = Form("medium"),  # 'low' | 'medium' | 'high'
):
    validate_extension(file.filename, VIDEO_EXTENSIONS)
    if level not in ("low", "medium", "high"):
        raise HTTPException(status_code=400, detail="level must be low, medium, or high")

    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        output_path = OUTPUT_DIR / f"compressed_{saved_path.name}"
        stats = video_service.compress_video(saved_path, output_path, level=level)

        background_tasks.add_task(remove_files_silently, [saved_path])

        reduction = stats["reduction_percent"]
        message = (
            f"Compressed by {reduction}% (from {human_readable_size(stats['original_size'])} "
            f"to {human_readable_size(stats['compressed_size'])})"
            if reduction > 0
            else "Compression complete"
        )

        return _build_download_response(output_path, message)
    except FFmpegError as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to compress video: {str(e)}")


# ---------------------------------------------------------------------------
# Trim / Cut Video
# ---------------------------------------------------------------------------

@router.post("/trim", response_model=ProcessedFileResponse)
async def trim_video_endpoint(
    background_tasks: BackgroundTasks,
    upload_token: str = Form(...),
    start_seconds: float = Form(...),
    end_seconds: float = Form(...),
):
    saved_path = UPLOAD_DIR / upload_token

    if not saved_path.exists() or saved_path.parent != UPLOAD_DIR:
        raise HTTPException(status_code=400, detail="Upload session expired, please re-upload the video")

    if end_seconds <= start_seconds:
        raise HTTPException(status_code=400, detail="end_seconds must be greater than start_seconds")
    if start_seconds < 0:
        raise HTTPException(status_code=400, detail="start_seconds cannot be negative")

    try:
        output_path = OUTPUT_DIR / f"trimmed_{saved_path.name}"
        video_service.trim_video(saved_path, output_path, start_seconds, end_seconds)

        background_tasks.add_task(remove_files_silently, [saved_path])

        return _build_download_response(
            output_path, f"Trimmed to {round(end_seconds - start_seconds, 1)}s clip"
        )
    except FFmpegError as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Trim failed: {str(e)}")
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to trim video: {str(e)}")


# ---------------------------------------------------------------------------
# Extract Audio
# ---------------------------------------------------------------------------

@router.post("/extract-audio", response_model=ProcessedFileResponse)
async def extract_audio_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    validate_extension(file.filename, VIDEO_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        output_path = OUTPUT_DIR / f"{saved_path.stem}.mp3"
        video_service.extract_audio(saved_path, output_path)

        background_tasks.add_task(remove_files_silently, [saved_path])

        return _build_download_response(output_path, "Audio extracted as MP3")
    except FFmpegError as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Audio extraction failed: {str(e)}")
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to extract audio: {str(e)}")