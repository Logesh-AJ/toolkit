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


class FormField(BaseModel):
    field_id: str
    type: str
    value: str = ""
    options: Optional[List[str]] = None


class FormFieldsResponse(BaseModel):
    """Response listing the fillable fields detected in a PDF."""
    success: bool = True
    has_fields: bool
    fields: List[FormField] = []
    upload_token: Optional[str] = None


class ImageDimensionsResponse(ProcessedFileResponse):
    """Extends the standard file response with final width/height (resize/crop)."""
    width: int
    height: int


class MediaInfoResponse(BaseModel):
    """Response for video/audio duration probing (used by the Trim tool)."""
    success: bool = True
    duration_seconds: float
    upload_token: str


class PageCountResponse(BaseModel):
    """Response for PDF page-count inspection (used by the Reorder/Delete tool)."""
    success: bool = True
    page_count: int
    upload_token: str