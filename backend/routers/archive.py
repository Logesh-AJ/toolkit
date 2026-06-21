"""
Archive tool endpoints: ZIP creation (multi-file), ZIP/RAR extraction.
"""

import shutil
import uuid
import zipfile
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException

from utils.file_helpers import save_upload_file, validate_extension, human_readable_size
from utils.cleanup import remove_files_silently
from utils.schemas import ProcessedFileResponse
from services import archive_service

router = APIRouter()

BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

ARCHIVE_EXTENSIONS = [".zip", ".rar"]


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
# Create ZIP from one or more uploaded files (any type)
# ---------------------------------------------------------------------------

@router.post("/zip", response_model=ProcessedFileResponse)
async def zip_files_endpoint(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
):
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least 1 file")

    saved_paths = []
    try:
        for f in files:
            # No extension restriction — any file type can go into a ZIP
            saved_paths.append(await save_upload_file(f, UPLOAD_DIR))

        zip_name = f"archive_{uuid.uuid4().hex[:8]}.zip"
        output_path = OUTPUT_DIR / zip_name
        count = archive_service.create_zip(saved_paths, output_path)

        background_tasks.add_task(remove_files_silently, saved_paths)

        return _build_download_response(output_path, f"Zipped {count} file(s)")
    except HTTPException:
        remove_files_silently(saved_paths)
        raise
    except Exception as e:
        remove_files_silently(saved_paths)
        raise HTTPException(status_code=500, detail=f"Failed to create ZIP: {str(e)}")


# ---------------------------------------------------------------------------
# Extract ZIP or RAR
# ---------------------------------------------------------------------------

@router.post("/unzip", response_model=ProcessedFileResponse)
async def unzip_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    validate_extension(file.filename, ARCHIVE_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    # Extract into a unique subfolder of outputs/ to avoid filename collisions
    extract_dir = OUTPUT_DIR / f"extracted_{uuid.uuid4().hex[:8]}"
    extract_dir.mkdir(exist_ok=True)

    try:
        extracted_files = archive_service.extract_archive(saved_path, extract_dir)

        if not extracted_files:
            raise HTTPException(status_code=400, detail="Archive is empty or could not be extracted")

        # Re-bundle extracted contents into a single ZIP for one-click download
        result_zip = OUTPUT_DIR / f"{extract_dir.name}.zip"
        with zipfile.ZipFile(result_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in extracted_files:
                zf.write(f, arcname=f.relative_to(extract_dir))

        background_tasks.add_task(remove_files_silently, [saved_path])
        background_tasks.add_task(shutil.rmtree, extract_dir, True)

        return _build_download_response(
            result_zip, f"Extracted {len(extracted_files)} file(s)"
        )
    except HTTPException:
        remove_files_silently([saved_path])
        shutil.rmtree(extract_dir, ignore_errors=True)
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        shutil.rmtree(extract_dir, ignore_errors=True)
        detail = str(e)
        if "rar" in detail.lower() and ("not found" in detail.lower() or "unrar" in detail.lower()):
            detail = "RAR extraction requires the 'unrar' tool, which is unavailable in this environment"
        raise HTTPException(status_code=500, detail=f"Failed to extract archive: {detail}")
    