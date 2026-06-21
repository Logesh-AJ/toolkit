"""
Shared Pydantic response models used across all tool routers.
Keeping these consistent gives the frontend one predictable response shape.
"""

from typing import Optional, List
from pydantic import BaseModel


class ProcessedFileResponse(BaseModel):
    """Standard response returned after a successful single-file operation."""
    success: bool = True
    message: str
    download_url: str
    filename: str
    size_bytes: int
    size_readable: str


class MultiFileResponse(BaseModel):
    """Standard response for operations that produce multiple output files (e.g. split, PDF-to-JPG)."""
    success: bool = True
    message: str
    files: List[ProcessedFileResponse]


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None


class TextExtractionResponse(BaseModel):
    """Response for OCR / text-extraction style endpoints."""
    success: bool = True
    message: str
    text: str
    page_count: Optional[int] = None