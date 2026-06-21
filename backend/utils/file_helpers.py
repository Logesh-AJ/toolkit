"""
Shared file-handling utilities: safe filenames, validation, cleanup helpers.
"""

import os
import re
import uuid
from pathlib import Path
from typing import Iterable

from fastapi import UploadFile, HTTPException

MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def safe_filename(filename: str) -> str:
    """
    Strip path components and unsafe characters from a filename.
    Prevents path traversal (e.g. '../../etc/passwd').
    """
    # Keep only the basename — drop any directory components
    name = os.path.basename(filename)
    # Replace anything that isn't alphanumeric, dot, dash, or underscore
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    # Avoid empty or dot-only names
    if not name or name.strip(".") == "":
        name = "file"
    return name


def generate_unique_path(directory: Path, original_filename: str) -> Path:
    """
    Build a unique, safe path inside `directory` for an uploaded/output file.
    Format: <uuid>_<safe-original-name>
    """
    clean_name = safe_filename(original_filename)
    unique_name = f"{uuid.uuid4().hex}_{clean_name}"
    return directory / unique_name


def validate_extension(filename: str, allowed_extensions: Iterable[str]) -> str:
    """
    Validate the file extension against an allowed list (case-insensitive).
    Returns the lowercase extension (with leading dot) if valid.
    Raises HTTPException(400) otherwise.
    """
    ext = Path(filename).suffix.lower()
    allowed = {e.lower() for e in allowed_extensions}
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed types: {', '.join(sorted(allowed))}",
        )
    return ext


async def save_upload_file(upload_file: UploadFile, directory: Path) -> Path:
    """
    Stream an UploadFile to disk under `directory` with a safe unique name.
    Enforces MAX_FILE_SIZE_MB. Returns the saved Path.
    """
    dest_path = generate_unique_path(directory, upload_file.filename or "upload")

    size = 0
    chunk_size = 1024 * 1024  # 1MB chunks

    with open(dest_path, "wb") as out_file:
        while True:
            chunk = await upload_file.read(chunk_size)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_FILE_SIZE_BYTES:
                out_file.close()
                dest_path.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds maximum size of {MAX_FILE_SIZE_MB}MB",
                )
            out_file.write(chunk)

    await upload_file.close()

    if size == 0:
        dest_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    return dest_path


def human_readable_size(num_bytes: int) -> str:
    """Convert a byte count into a human-readable string (e.g. '4.20 MB')."""
    size = float(num_bytes)
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.2f} {unit}"
        size /= 1024
    return f"{size:.2f} TB"