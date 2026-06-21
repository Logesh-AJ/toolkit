"""
PDF tool endpoints: merge, split, compress, pdf-to-jpg, images-to-pdf,
pdf-to-word, word-to-pdf, ocr, sign, fill forms, protect, unlock,
page-count, reorder/delete pages.
"""

import json
import zipfile
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException

from utils.file_helpers import (
    save_upload_file,
    validate_extension,
    human_readable_size,
)
from utils.cleanup import remove_files_silently
from utils.schemas import (
    ProcessedFileResponse,
    TextExtractionResponse,
    FormFieldsResponse,
    PageCountResponse,
)
from services import pdf_service, pdf_advanced_service

router = APIRouter()

BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "outputs"

PDF_EXTENSIONS = [".pdf"]
IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"]
WORD_EXTENSIONS = [".doc", ".docx"]
SIGNATURE_EXTENSIONS = [".png", ".jpg", ".jpeg"]


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


# ---------------------------------------------------------------------------
# PDF to Word
# ---------------------------------------------------------------------------

@router.post("/to-word", response_model=ProcessedFileResponse)
async def pdf_to_word_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    validate_extension(file.filename, PDF_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        output_path = OUTPUT_DIR / f"{saved_path.stem}.docx"
        pdf_advanced_service.convert_pdf_to_word(saved_path, output_path)

        background_tasks.add_task(remove_files_silently, [saved_path])

        return _build_download_response(output_path, "Converted PDF to an editable Word document")
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to convert PDF to Word: {str(e)}")


# ---------------------------------------------------------------------------
# Word to PDF
# ---------------------------------------------------------------------------

@router.post("/from-word", response_model=ProcessedFileResponse)
async def word_to_pdf_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    validate_extension(file.filename, WORD_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        converted_path = pdf_advanced_service.convert_with_libreoffice(
            saved_path, OUTPUT_DIR, "pdf"
        )

        background_tasks.add_task(remove_files_silently, [saved_path])

        return _build_download_response(converted_path, "Converted Word document to PDF")
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to convert Word to PDF: {str(e)}")


# ---------------------------------------------------------------------------
# OCR
# ---------------------------------------------------------------------------

@router.post("/ocr", response_model=TextExtractionResponse)
async def ocr_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    validate_extension(file.filename, PDF_EXTENSIONS + IMAGE_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        ext = saved_path.suffix.lower()
        if ext == ".pdf":
            result = pdf_advanced_service.ocr_pdf(saved_path)
            text, page_count = result["text"], result["page_count"]
        else:
            text = pdf_advanced_service.ocr_image(saved_path)
            page_count = 1

        background_tasks.add_task(remove_files_silently, [saved_path])

        if not text.strip():
            return TextExtractionResponse(
                message="No text could be detected in this file",
                text="",
                page_count=page_count,
            )

        return TextExtractionResponse(
            message=f"Extracted text from {page_count} page(s)",
            text=text,
            page_count=page_count,
        )
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")


# ---------------------------------------------------------------------------
# Sign PDF
# ---------------------------------------------------------------------------

@router.post("/sign", response_model=ProcessedFileResponse)
async def sign_pdf_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    signature: UploadFile = File(...),
    page_number: int = Form(1),
    x: float = Form(50),
    y: float = Form(50),
    width: float = Form(150),
    height: float = Form(60),
):
    validate_extension(file.filename, PDF_EXTENSIONS)
    validate_extension(signature.filename, SIGNATURE_EXTENSIONS)

    saved_path = await save_upload_file(file, UPLOAD_DIR)
    signature_path = await save_upload_file(signature, UPLOAD_DIR)

    try:
        output_path = OUTPUT_DIR / f"signed_{saved_path.name}"
        pdf_advanced_service.sign_pdf(
            saved_path, signature_path, output_path,
            page_number=page_number, x=x, y=y, width=width, height=height,
        )

        background_tasks.add_task(remove_files_silently, [saved_path, signature_path])

        return _build_download_response(output_path, "Signature added to PDF")
    except ValueError as e:
        remove_files_silently([saved_path, signature_path])
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        remove_files_silently([saved_path, signature_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path, signature_path])
        raise HTTPException(status_code=500, detail=f"Failed to sign PDF: {str(e)}")


# ---------------------------------------------------------------------------
# Fill PDF Forms — Step 1: inspect fields
# ---------------------------------------------------------------------------

@router.post("/fill/inspect", response_model=FormFieldsResponse)
async def inspect_form_fields_endpoint(file: UploadFile = File(...)):
    validate_extension(file.filename, PDF_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        fields = pdf_advanced_service.get_form_fields(saved_path)
        return FormFieldsResponse(
            has_fields=len(fields) > 0,
            fields=fields,
            upload_token=saved_path.name,
        )
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to inspect PDF form: {str(e)}")


# ---------------------------------------------------------------------------
# Fill PDF Forms — Step 2: submit values
# ---------------------------------------------------------------------------

@router.post("/fill", response_model=ProcessedFileResponse)
async def fill_form_endpoint(
    background_tasks: BackgroundTasks,
    upload_token: str = Form(...),
    field_values: str = Form(...),
):
    saved_path = UPLOAD_DIR / upload_token

    if not saved_path.exists() or saved_path.parent != UPLOAD_DIR:
        raise HTTPException(status_code=400, detail="Upload session expired, please re-upload the PDF")

    try:
        try:
            values = json.loads(field_values)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="field_values must be valid JSON")

        output_path = OUTPUT_DIR / f"filled_{saved_path.name}"
        pdf_advanced_service.fill_form(saved_path, output_path, values)

        background_tasks.add_task(remove_files_silently, [saved_path])

        return _build_download_response(output_path, "Form filled successfully")
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to fill form: {str(e)}")


# ---------------------------------------------------------------------------
# Password Protect PDF
# ---------------------------------------------------------------------------

@router.post("/protect", response_model=ProcessedFileResponse)
async def protect_pdf_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: str = Form(...),
):
    validate_extension(file.filename, PDF_EXTENSIONS)
    if len(password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        output_path = OUTPUT_DIR / f"protected_{saved_path.name}"
        pdf_advanced_service.protect_pdf(saved_path, output_path, password)

        background_tasks.add_task(remove_files_silently, [saved_path])

        return _build_download_response(output_path, "PDF is now password protected")
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to protect PDF: {str(e)}")


# ---------------------------------------------------------------------------
# Unlock PDF
# ---------------------------------------------------------------------------

@router.post("/unlock", response_model=ProcessedFileResponse)
async def unlock_pdf_endpoint(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: str = Form(...),
):
    validate_extension(file.filename, PDF_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        output_path = OUTPUT_DIR / f"unlocked_{saved_path.name}"
        pdf_advanced_service.unlock_pdf(saved_path, output_path, password)

        background_tasks.add_task(remove_files_silently, [saved_path])

        return _build_download_response(output_path, "Password removed from PDF")
    except ValueError as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to unlock PDF: {str(e)}")


# ---------------------------------------------------------------------------
# Page Count (used to render the Reorder/Delete page picker)
# ---------------------------------------------------------------------------

@router.post("/page-count", response_model=PageCountResponse)
async def page_count_endpoint(file: UploadFile = File(...)):
    validate_extension(file.filename, PDF_EXTENSIONS)
    saved_path = await save_upload_file(file, UPLOAD_DIR)

    try:
        count = pdf_service.get_page_count(saved_path)
        # Keep the file around — /reorder will reference it by upload_token
        return PageCountResponse(page_count=count, upload_token=saved_path.name)
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to read PDF: {str(e)}")


# ---------------------------------------------------------------------------
# Reorder / Delete Pages
# ---------------------------------------------------------------------------

@router.post("/reorder", response_model=ProcessedFileResponse)
async def reorder_pdf_endpoint(
    background_tasks: BackgroundTasks,
    upload_token: str = Form(...),
    page_order: str = Form(...),  # JSON array string, e.g. "[3,1,2]"
):
    saved_path = UPLOAD_DIR / upload_token

    if not saved_path.exists() or saved_path.parent != UPLOAD_DIR:
        raise HTTPException(status_code=400, detail="Upload session expired, please re-upload the PDF")

    try:
        try:
            order = json.loads(page_order)
            if not isinstance(order, list) or not all(isinstance(n, int) for n in order):
                raise ValueError
        except (json.JSONDecodeError, ValueError):
            raise HTTPException(status_code=400, detail="page_order must be a JSON array of integers")

        output_path = OUTPUT_DIR / f"reordered_{saved_path.name}"
        final_count = pdf_service.reorder_pdf(saved_path, output_path, order)

        background_tasks.add_task(remove_files_silently, [saved_path])

        return _build_download_response(output_path, f"Saved a {final_count}-page PDF")
    except ValueError as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        remove_files_silently([saved_path])
        raise
    except Exception as e:
        remove_files_silently([saved_path])
        raise HTTPException(status_code=500, detail=f"Failed to reorder PDF: {str(e)}")