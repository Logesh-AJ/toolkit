"""
PDF processing service functions.
Each function takes input path(s) and an output path, performs the operation,
and returns metadata about the result. No FastAPI/HTTP concerns live here.
"""

from pathlib import Path
from typing import List

import fitz  # PyMuPDF
from pypdf import PdfReader, PdfWriter


def merge_pdfs(input_paths: List[Path], output_path: Path) -> int:
    """Merge multiple PDFs in order into a single output PDF. Returns page count."""
    writer = PdfWriter()
    for path in input_paths:
        reader = PdfReader(str(path))
        for page in reader.pages:
            writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)

    return len(writer.pages)


def split_pdf(input_path: Path, output_dir: Path, base_name: str) -> List[Path]:
    """
    Split a PDF into one file per page.
    Returns a list of output file paths in page order.
    """
    reader = PdfReader(str(input_path))
    output_paths = []

    for i, page in enumerate(reader.pages):
        writer = PdfWriter()
        writer.add_page(page)
        out_path = output_dir / f"{base_name}_page_{i + 1}.pdf"
        with open(out_path, "wb") as f:
            writer.write(f)
        output_paths.append(out_path)

    return output_paths


def compress_pdf(input_path: Path, output_path: Path, image_quality: int = 60) -> dict:
    """
    Compress a PDF by downsampling/recompressing embedded images via PyMuPDF
    and enabling stream compression. Returns before/after size info.
    """
    original_size = input_path.stat().st_size

    doc = fitz.open(str(input_path))

    for page in doc:
        image_list = page.get_images(full=True)
        for img in image_list:
            xref = img[0]
            try:
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]

                pix = fitz.Pixmap(image_bytes)
                if pix.n - pix.alpha >= 4:
                    pix = fitz.Pixmap(fitz.csRGB, pix)

                new_bytes = pix.tobytes("jpeg", jpg_quality=image_quality)

                doc.update_stream(xref, new_bytes)
                pix = None
            except Exception:
                continue

    doc.save(str(output_path), garbage=4, deflate=True, clean=True)
    doc.close()

    compressed_size = output_path.stat().st_size

    return {
        "original_size": original_size,
        "compressed_size": compressed_size,
        "reduction_percent": round((1 - compressed_size / original_size) * 100, 1) if original_size else 0,
    }


def pdf_to_jpg(input_path: Path, output_dir: Path, base_name: str, dpi: int = 150) -> List[Path]:
    """
    Render each PDF page to a JPG image.
    Returns a list of output image paths in page order.
    """
    doc = fitz.open(str(input_path))
    output_paths = []

    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=matrix)
        out_path = output_dir / f"{base_name}_page_{i + 1}.jpg"
        pix.save(str(out_path))
        output_paths.append(out_path)

    doc.close()
    return output_paths


def images_to_pdf(input_paths: List[Path], output_path: Path) -> int:
    """
    Combine one or more images into a single PDF (one image per page).
    Returns page count.
    """
    doc = fitz.open()

    for img_path in input_paths:
        img_doc = fitz.open(str(img_path))
        pdf_bytes = img_doc.convert_to_pdf()
        img_pdf = fitz.open("pdf", pdf_bytes)
        doc.insert_pdf(img_pdf)
        img_doc.close()
        img_pdf.close()

    doc.save(str(output_path))
    page_count = doc.page_count
    doc.close()

    return page_count


def get_page_count(input_path: Path) -> int:
    """Return the number of pages in a PDF (used by Reorder/Delete to render a UI list)."""
    reader = PdfReader(str(input_path))
    return len(reader.pages)


def reorder_pdf(input_path: Path, output_path: Path, page_order: List[int]) -> int:
    """
    Rebuild a PDF using only the given 1-indexed page numbers, in the given order.
    Pages omitted from page_order are deleted; pages can also be repeated or
    reordered freely. Returns the final page count.

    Example: page_order=[3, 1, 1] on a 5-page PDF keeps page 3, then page 1 twice,
    dropping pages 2, 4, 5 — this is exactly "reorder + delete" in one operation.
    """
    reader = PdfReader(str(input_path))
    total_pages = len(reader.pages)

    if not page_order:
        raise ValueError("page_order cannot be empty")

    for page_num in page_order:
        if page_num < 1 or page_num > total_pages:
            raise ValueError(f"Page {page_num} does not exist (PDF has {total_pages} pages)")

    writer = PdfWriter()
    for page_num in page_order:
        writer.add_page(reader.pages[page_num - 1])

    with open(output_path, "wb") as f:
        writer.write(f)

    return len(writer.pages)