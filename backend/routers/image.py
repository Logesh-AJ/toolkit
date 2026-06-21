"""
Image tool endpoints: remove background, compress, convert format,
resize/crop, document scanner.
"""

from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException
from typing import Optional

from utils.file_helpers import save_upload_file, validate_extension, human_readable_size
from utils.cleanup import remove_files_silently
from utils.schemas import ProcessedFileResponse, ImageDimensionsResponse
from services import image_service

router = APIRouter()

BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"]


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
# Remove Background
# ---------------------------------------------------------------------------

@router.post("/remove-background", response_model=ProcessedFileResponse)
async def remove_background_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    validate_extension(file.filename, IMAGE_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        output_path = OUTPUT_DIR / f"{saved_path.stem}_nobg.png"
        image_service.remove_background(saved_path, output_path)

        background_tasks.add_task(remove_files_silently, [saved_path])

        return _build_download_response(output_path, "Background removed")
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to remove background: {str(e)}")


# ---------------------------------------------------------------------------
# Compress Image
# ---------------------------------------------------------------------------

@router.post("/compress", response_model=ProcessedFileResponse)
async def compress_image_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    quality: int = Form(75),
):
    validate_extension(file.filename, IMAGE_EXTENSIONS)
    if not (1 <= quality <= 100):
        raise HTTPException(status_code=400, detail="Quality must be between 1 and 100")

    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        output_path = OUTPUT_DIR / f"compressed_{saved_path.name}"
        stats = image_service.compress_image(saved_path, output_path, quality=quality)

        background_tasks.add_task(remove_files_silently, [saved_path])

        reduction = stats["reduction_percent"]
        message = (
            f"Compressed by {reduction}% (from {human_readable_size(stats['original_size'])} "
            f"to {human_readable_size(stats['compressed_size'])})"
            if reduction > 0
            else "Compression complete"
        )

        return _build_download_response(output_path, message)
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to compress image: {str(e)}")


# ---------------------------------------------------------------------------
# Convert Image Format
# ---------------------------------------------------------------------------

@router.post("/convert", response_model=ProcessedFileResponse)
async def convert_image_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target_format: str = Form(...),  # 'jpg' | 'png' | 'webp'
):
    validate_extension(file.filename, IMAGE_EXTENSIONS)

    target_format = target_format.lower().lstrip(".")
    if target_format not in ("jpg", "jpeg", "png", "webp"):
        raise HTTPException(status_code=400, detail="target_format must be jpg, png, or webp")

    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        output_ext = ".jpg" if target_format in ("jpg", "jpeg") else f".{target_format}"
        output_path = OUTPUT_DIR / f"{saved_path.stem}{output_ext}"
        image_service.convert_image_format(saved_path, output_path)

        background_tasks.add_task(remove_files_silently, [saved_path])

        return _build_download_response(output_path, f"Converted to {output_ext.upper().lstrip('.')}")
    except ValueError as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to convert image: {str(e)}")


# ---------------------------------------------------------------------------
# Resize / Crop Image
# ---------------------------------------------------------------------------

@router.post("/resize", response_model=ImageDimensionsResponse)
async def resize_image_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    mode: str = Form("resize"),  # 'resize' | 'crop'
    width: Optional[int] = Form(None),
    height: Optional[int] = Form(None),
    left: Optional[int] = Form(None),
    top: Optional[int] = Form(None),
    right: Optional[int] = Form(None),
    bottom: Optional[int] = Form(None),
):
    validate_extension(file.filename, IMAGE_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        output_path = OUTPUT_DIR / f"{mode}_{saved_path.name}"

        if mode == "crop":
            if None in (left, top, right, bottom):
                raise HTTPException(status_code=400, detail="Crop mode requires left, top, right, bottom")
            final_w, final_h = image_service.crop_image(saved_path, output_path, left, top, right, bottom)
            message = f"Cropped to {final_w}×{final_h}"
        else:
            if not width and not height:
                raise HTTPException(status_code=400, detail="Resize mode requires width and/or height")
            final_w, final_h = image_service.resize_image(saved_path, output_path, width, height)
            message = f"Resized to {final_w}×{final_h}"

        background_tasks.add_task(remove_files_silently, [saved_path])

        size = output_path.stat().st_size
        return ImageDimensionsResponse(
            message=message,
            download_url=f"/outputs/{output_path.name}",
            filename=output_path.name,
            size_bytes=size,
            size_readable=human_readable_size(size),
            width=final_w,
            height=final_h,
        )
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to resize/crop image: {str(e)}")


# ---------------------------------------------------------------------------
# Document Scanner (photo -> flattened, enhanced PDF)
# ---------------------------------------------------------------------------

@router.post("/scan-to-pdf", response_model=ProcessedFileResponse)
async def scan_to_pdf_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    validate_extension(file.filename, IMAGE_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        scanned_image_path = OUTPUT_DIR / f"{saved_path.stem}_scanned.png"
        image_service.scan_document(saved_path, scanned_image_path)

        output_pdf_path = OUTPUT_DIR / f"{saved_path.stem}_scanned.pdf"
        image_service.image_to_pdf_single(scanned_image_path, output_pdf_path)

        background_tasks.add_task(remove_files_silently, [saved_path, scanned_image_path])

        return _build_download_response(output_pdf_path, "Document scanned and saved as PDF")
    except ValueError as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to scan document: {str(e)}")