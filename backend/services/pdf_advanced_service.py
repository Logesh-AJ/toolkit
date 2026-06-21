"""
Advanced PDF service functions: Word conversion, OCR, signing,
form filling, and password protect/unlock.
"""

import subprocess
from io import BytesIO
from pathlib import Path
from typing import List

import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from pypdf import PdfReader, PdfWriter
from pdf2docx import Converter


# ---------------------------------------------------------------------------
# PDF -> Word  (pdf2docx — reconstructs layout natively, no LibreOffice)
# ---------------------------------------------------------------------------

def convert_pdf_to_word(input_path: Path, output_path: Path) -> None:
    """
    Convert a PDF to an editable DOCX using pdf2docx, which parses text
    blocks, tables, and images directly from the PDF's layout rather than
    relying on a general-purpose office suite's import filter.
    """
    converter = Converter(str(input_path))
    try:
        converter.convert(str(output_path), start=0, end=None)
    finally:
        converter.close()

    if not output_path.exists() or output_path.stat().st_size == 0:
        raise RuntimeError("PDF to Word conversion produced an empty or missing file")


# ---------------------------------------------------------------------------
# Word -> PDF (via headless LibreOffice — unchanged, this direction works well)
# ---------------------------------------------------------------------------

def convert_with_libreoffice(input_path: Path, output_dir: Path, target_format: str) -> Path:
    """
    Use headless LibreOffice to convert between document formats.
    target_format examples: 'pdf', 'docx'
    Returns the path to the converted file.
    """
    result = subprocess.run(
        [
            "libreoffice", "--headless", "--norestore",
            "--convert-to", target_format,
            "--outdir", str(output_dir),
            str(input_path),
        ],
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode != 0:
        raise RuntimeError(f"LibreOffice conversion failed: {result.stderr.strip()}")

    expected_output = output_dir / f"{input_path.stem}.{target_format}"
    if not expected_output.exists():
        raise RuntimeError("LibreOffice did not produce the expected output file")

    return expected_output


# ---------------------------------------------------------------------------
# OCR
# ---------------------------------------------------------------------------

def ocr_pdf(input_path: Path, dpi: int = 200) -> dict:
    """
    Run OCR on every page of a PDF (handles scanned/image-based PDFs).
    Returns extracted text and page count.
    """
    doc = fitz.open(str(input_path))
    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    full_text = []
    for i, page in enumerate(doc):
        native_text = page.get_text().strip()
        if native_text:
            full_text.append(f"--- Page {i + 1} ---\n{native_text}")
            continue

        pix = page.get_pixmap(matrix=matrix)
        img_bytes = pix.tobytes("png")
        image = Image.open(BytesIO(img_bytes))
        ocr_text = pytesseract.image_to_string(image)
        full_text.append(f"--- Page {i + 1} (OCR) ---\n{ocr_text.strip()}")

    page_count = doc.page_count
    doc.close()

    return {
        "text": "\n\n".join(full_text),
        "page_count": page_count,
    }


def ocr_image(input_path: Path) -> str:
    """Run OCR on a single image file."""
    image = Image.open(input_path)
    return pytesseract.image_to_string(image).strip()


# ---------------------------------------------------------------------------
# Sign PDF (stamp a signature image onto a page)
# ---------------------------------------------------------------------------

def sign_pdf(
    input_path: Path,
    signature_image_path: Path,
    output_path: Path,
    page_number: int = 1,
    x: float = 50,
    y: float = 50,
    width: float = 150,
    height: float = 60,
) -> None:
    doc = fitz.open(str(input_path))

    if page_number < 1 or page_number > doc.page_count:
        doc.close()
        raise ValueError(f"Page {page_number} does not exist (PDF has {doc.page_count} pages)")

    page = doc[page_number - 1]
    page_height = page.rect.height

    top_y = page_height - y - height
    rect = fitz.Rect(x, top_y, x + width, top_y + height)

    page.insert_image(rect, filename=str(signature_image_path))

    doc.save(str(output_path))
    doc.close()


# ---------------------------------------------------------------------------
# Fill PDF Forms (generic AcroForm filling)
# ---------------------------------------------------------------------------

def get_form_fields(input_path: Path) -> List[dict]:
    reader = PdfReader(str(input_path))
    fields = reader.get_fields()

    if not fields:
        return []

    type_map = {"/Tx": "text", "/Btn": "checkbox", "/Ch": "choice", "/Sig": "signature"}
    result = []

    for field_id, field in fields.items():
        field_type_raw = field.get("/FT")
        field_type = type_map.get(str(field_type_raw), "text")

        entry = {
            "field_id": field_id,
            "type": field_type,
            "value": str(field.get("/V", "")) if field.get("/V") else "",
        }

        if field_type == "choice":
            options = field.get("/Opt")
            if options:
                entry["options"] = [str(opt) for opt in options]

        result.append(entry)

    return result


def fill_form(input_path: Path, output_path: Path, field_values: dict) -> None:
    reader = PdfReader(str(input_path))
    writer = PdfWriter()
    writer.append(reader)

    for page in writer.pages:
        writer.update_page_form_field_values(page, field_values)

    with open(output_path, "wb") as f:
        writer.write(f)


# ---------------------------------------------------------------------------
# Password Protect / Unlock
# ---------------------------------------------------------------------------

def protect_pdf(input_path: Path, output_path: Path, password: str) -> None:
    reader = PdfReader(str(input_path))
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)

    writer.encrypt(user_password=password, owner_password=None)

    with open(output_path, "wb") as f:
        writer.write(f)


def unlock_pdf(input_path: Path, output_path: Path, password: str) -> None:
    reader = PdfReader(str(input_path))

    if reader.is_encrypted:
        success = reader.decrypt(password)
        if success == 0:
            raise ValueError("Incorrect password")

    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)