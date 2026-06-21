"""
Helpers for registering files for delayed deletion (e.g. after a request
completes) via FastAPI BackgroundTasks, in addition to the periodic
sweep already running in main.py's lifespan.
"""

import os
from pathlib import Path


def remove_file_silently(path: str | Path) -> None:
    """Delete a file if it exists; never raises."""
    try:
        p = Path(path)
        if p.exists() and p.is_file():
            p.unlink()
    except Exception:
        pass


def remove_files_silently(paths: list[str | Path]) -> None:
    for p in paths:
        remove_file_silently(p)