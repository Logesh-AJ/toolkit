"""
Archive service: ZIP creation, ZIP/RAR extraction.

Note: RAR is a proprietary format with no open-source encoder, so this
service can only EXTRACT .rar files, not create them. ZIP supports both
directions. This constraint is surfaced to the frontend explicitly.
"""

import zipfile
from pathlib import Path
from typing import List

import rarfile


def create_zip(input_paths: List[Path], output_path: Path) -> int:
    """
    Bundle one or more files into a ZIP archive.
    Returns the number of files included.
    """
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in input_paths:
            zf.write(path, arcname=path.name)
    return len(input_paths)


def extract_archive(input_path: Path, output_dir: Path) -> List[Path]:
    """
    Extract a ZIP or RAR archive into output_dir.
    Returns a list of extracted file paths (files only, not directories).
    """
    ext = input_path.suffix.lower()

    if ext == ".zip":
        with zipfile.ZipFile(input_path, "r") as zf:
            # Guard against path traversal in malicious archives
            safe_members = [
                m for m in zf.namelist()
                if not m.startswith("/") and ".." not in Path(m).parts
            ]
            zf.extractall(output_dir, members=safe_members)
    elif ext == ".rar":
        with rarfile.RarFile(input_path, "r") as rf:
            safe_members = [
                m for m in rf.namelist()
                if not m.startswith("/") and ".." not in Path(m).parts
            ]
            rf.extractall(output_dir, members=safe_members)
    else:
        raise ValueError(f"Unsupported archive format: {ext}")

    # Collect only files (skip directories) for the response
    extracted_files = [p for p in output_dir.rglob("*") if p.is_file()]
    return extracted_files