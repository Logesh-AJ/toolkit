"""
PDF tool endpoints: merge, split, compress, pdf-to-jpg, images-to-pdf.
"""

import zipfile
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException

from utils.file_helpers import (
    save_upload_file,
    validate_extension,
    human_readable_size,
)
from utils.cleanup import remove_files_silently
from utils.schemas import ProcessedFileResponse
from services import pdf_service

router = APIRouter()

BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

PDF_EXTENSIONS = [".pdf"]
IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"]


def _build_download_response(output_path: Path, message: str) -> ProcessedFileResponse:
    size = output_path.stat().st_size
    return ProcessedFileResponse(
        message=message,
        download_url=f"/outputs/{output_path.name}",
        filename=output_path.name,
        size_bytes=size,
        size_readable=human_readable_size(size),
    )


def _zip_outputs(paths: List[Path], zip_name: str) -> Path:
    """Bundle multiple output files into a single downloadable ZIP."""
    zip_path = OUTPUT_DIR / zip_name
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for p in paths:
            zf.write(p, arcname=p.name)
    return zip_path


# ---------------------------------------------------------------------------
# Merge PDFs
# ---------------------------------------------------------------------------

@router.post("/merge", response_model=ProcessedFileResponse)
async def merge_pdfs_endpoint(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least 2 PDF files to merge")

    saved_paths = []
    try:
        for f in files:
            validate_extension(f.filename, PDF_EXTENSIONS)
            saved_paths.append(await save_upload_file(f, UPLOAD_DIR))

        output_path = OUTPUT_DIR / f"merged_{saved_paths[0].stem}.pdf"
        page_count = pdf_service.merge_pdfs(saved_paths, output_path)

        background_tasks.add_task(remove_files_silently, saved_paths)

        return _build_download_response(
            output_path, f"Merged {len(files)} files into a {page_count}-page PDF"
        )
    except HTTPException:
        remove_files_silently(saved_paths)
        raise
    except Exception as e:
        remove_files_silently(saved_paths)
        raise HTTPException(status_code=500, detail=f"Failed to merge PDFs: {str(e)}")


# ---------------------------------------------------------------------------
# Split PDF
# ---------------------------------------------------------------------------

@router.post("/split", response_model=ProcessedFileResponse)
async def split_pdf_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    validate_extension(file.filename, PDF_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        base_name = saved_path.stem
        output_paths = pdf_service.split_pdf(saved_path, OUTPUT_DIR, base_name)

        if not output_paths:
            raise HTTPException(status_code=400, detail="PDF has no pages to split")

        zip_path = _zip_outputs(output_paths, f"{base_name}_split.zip")

        background_tasks.add_task(remove_files_silently, [saved_path, *output_paths])

        return _build_download_response(
            zip_path, f"Split PDF into {len(output_paths)} separate pages"
        )
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to split PDF: {str(e)}")


# ---------------------------------------------------------------------------
# Compress PDF
# ---------------------------------------------------------------------------

@router.post("/compress", response_model=ProcessedFileResponse)
async def compress_pdf_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    validate_extension(file.filename, PDF_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        output_path = OUTPUT_DIR / f"compressed_{saved_path.name}"
        stats = pdf_service.compress_pdf(saved_path, output_path)

        background_tasks.add_task(remove_files_silently, [saved_path])

        reduction = stats["reduction_percent"]
        message = (
            f"Compressed by {reduction}% (from {human_readable_size(stats['original_size'])} "
            f"to {human_readable_size(stats['compressed_size'])})"
            if reduction > 0
            else "Compression complete (file was already optimized)"
        )

        return _build_download_response(output_path, message)
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to compress PDF: {str(e)}")


# ---------------------------------------------------------------------------
# PDF to JPG
# ---------------------------------------------------------------------------

@router.post("/to-jpg", response_model=ProcessedFileResponse)
async def pdf_to_jpg_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    validate_extension(file.filename, PDF_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        base_name = saved_path.stem
        output_paths = pdf_service.pdf_to_jpg(saved_path, OUTPUT_DIR, base_name)

        if not output_paths:
            raise HTTPException(status_code=400, detail="PDF has no pages to convert")

        if len(output_paths) == 1:
            result_path = output_paths[0]
            message = "Converted 1 page to JPG"
        else:
            result_path = _zip_outputs(output_paths, f"{base_name}_images.zip")
            message = f"Converted {len(output_paths)} pages to JPG"

        background_tasks.add_task(remove_files_silently, [saved_path, *output_paths])

        return _build_download_response(result_path, message)
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to convert PDF: {str(e)}")


# ---------------------------------------------------------------------------
# Images to PDF
# ---------------------------------------------------------------------------

@router.post("/from-images", response_model=ProcessedFileResponse)
async def images_to_pdf_endpoint(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
):
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least 1 image")

    saved_paths = []
    try:
        for f in files:
            validate_extension(f.filename, IMAGE_EXTENSIONS)
            saved_paths.append(await save_upload_file(f, UPLOAD_DIR))

        output_path = OUTPUT_DIR / f"images_{saved_paths[0].stem}.pdf"
        page_count = pdf_service.images_to_pdf(saved_paths, output_path)

        background_tasks.add_task(remove_files_silently, saved_paths)

        return _build_download_response(
            output_path, f"Combined {len(files)} images into a {page_count}-page PDF"
        )
    except HTTPException:
        remove_files_silently(saved_paths)
        raise
    except Exception as e:
        remove_files_silently(saved_paths)
        raise HTTPException(status_code=500, detail=f"Failed to create PDF: {str(e)}")