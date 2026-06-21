"""
Image processing service functions: background removal, compression,
format conversion, resize/crop, and document scanning.
"""

from pathlib import Path
from typing import Optional, Tuple

import cv2
import numpy as np
from PIL import Image
from rembg import remove as rembg_remove


# ---------------------------------------------------------------------------
# Remove Background
# ---------------------------------------------------------------------------

def remove_background(input_path: Path, output_path: Path) -> None:
    """
    Remove the background from an image using rembg (U2Net model).
    Output is always saved as PNG to preserve transparency.
    """
    with open(input_path, "rb") as f:
        input_bytes = f.read()

    output_bytes = rembg_remove(input_bytes)

    with open(output_path, "wb") as f:
        f.write(output_bytes)


# ---------------------------------------------------------------------------
# Compress Image
# ---------------------------------------------------------------------------

def compress_image(input_path: Path, output_path: Path, quality: int = 75) -> dict:
    """
    Re-encode an image at a lower quality to reduce file size.
    Preserves the original format where possible (JPEG/WEBP support quality;
    PNG uses optimize + compression level instead).
    """
    original_size = input_path.stat().st_size

    img = Image.open(input_path)
    ext = output_path.suffix.lower()

    if ext in (".jpg", ".jpeg"):
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(output_path, "JPEG", quality=quality, optimize=True)
    elif ext == ".webp":
        img.save(output_path, "WEBP", quality=quality)
    elif ext == ".png":
        img.save(output_path, "PNG", optimize=True, compress_level=9)
    else:
        img.save(output_path, quality=quality, optimize=True)

    compressed_size = output_path.stat().st_size

    return {
        "original_size": original_size,
        "compressed_size": compressed_size,
        "reduction_percent": round((1 - compressed_size / original_size) * 100, 1) if original_size else 0,
    }


# ---------------------------------------------------------------------------
# Convert Image Format
# ---------------------------------------------------------------------------

FORMAT_MAP = {
    ".jpg": "JPEG",
    ".jpeg": "JPEG",
    ".png": "PNG",
    ".webp": "WEBP",
}


def convert_image_format(input_path: Path, output_path: Path) -> None:
    """Convert an image to a different format based on output_path's extension."""
    target_ext = output_path.suffix.lower()
    pil_format = FORMAT_MAP.get(target_ext)

    if not pil_format:
        raise ValueError(f"Unsupported target format: {target_ext}")

    img = Image.open(input_path)

    # JPEG doesn't support alpha channels — flatten onto white
    if pil_format == "JPEG" and img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1])
        img = background

    img.save(output_path, pil_format)


# ---------------------------------------------------------------------------
# Resize / Crop Image
# ---------------------------------------------------------------------------

def resize_image(
    input_path: Path,
    output_path: Path,
    width: Optional[int] = None,
    height: Optional[int] = None,
    maintain_aspect: bool = True,
) -> Tuple[int, int]:
    """
    Resize an image. If maintain_aspect is True and only one dimension is
    given, the other is calculated proportionally.
    Returns the final (width, height).
    """
    img = Image.open(input_path)
    orig_w, orig_h = img.size

    if maintain_aspect:
        if width and not height:
            height = round(orig_h * (width / orig_w))
        elif height and not width:
            width = round(orig_w * (height / orig_h))
        elif width and height:
            # Fit within box while preserving aspect ratio
            ratio = min(width / orig_w, height / orig_h)
            width, height = round(orig_w * ratio), round(orig_h * ratio)

    width = width or orig_w
    height = height or orig_h

    resized = img.resize((width, height), Image.LANCZOS)
    resized.save(output_path)

    return width, height


def crop_image(
    input_path: Path,
    output_path: Path,
    left: int,
    top: int,
    right: int,
    bottom: int,
) -> Tuple[int, int]:
    """Crop an image to the given box (pixel coordinates). Returns final size."""
    img = Image.open(input_path)
    cropped = img.crop((left, top, right, bottom))
    cropped.save(output_path)
    return cropped.size


# ---------------------------------------------------------------------------
# Document Scanner (photo of a document -> clean perspective-corrected PDF)
# ---------------------------------------------------------------------------

def _order_points(pts: np.ndarray) -> np.ndarray:
    """Order 4 points as top-left, top-right, bottom-right, bottom-left."""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def _four_point_transform(image: np.ndarray, pts: np.ndarray) -> np.ndarray:
    rect = _order_points(pts)
    (tl, tr, br, bl) = rect

    width_a = np.linalg.norm(br - bl)
    width_b = np.linalg.norm(tr - tl)
    max_width = max(int(width_a), int(width_b))

    height_a = np.linalg.norm(tr - br)
    height_b = np.linalg.norm(tl - bl)
    max_height = max(int(height_a), int(height_b))

    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1],
    ], dtype="float32")

    matrix = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, matrix, (max_width, max_height))
    return warped


def scan_document(input_path: Path, output_path: Path) -> None:
    """
    Detect a document's edges in a photo, apply a perspective transform
    to make it look flat/scanned, enhance contrast, and save as PNG.
    Falls back to the original image (lightly enhanced) if no clear
    quadrilateral document edge is found.
    """
    image = cv2.imread(str(input_path))
    if image is None:
        raise ValueError("Could not read the uploaded image")

    orig = image.copy()
    ratio = image.shape[0] / 500.0
    resized = cv2.resize(image, (int(image.shape[1] / ratio), 500))

    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 150)

    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

    doc_contour = None
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            doc_contour = approx
            break

    if doc_contour is not None:
        warped = _four_point_transform(orig, doc_contour.reshape(4, 2) * ratio)
    else:
        # Fallback: no quadrilateral found, use the original image as-is
        warped = orig

    # Enhance: grayscale + adaptive threshold for a "scanned" look
    warped_gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
    enhanced = cv2.adaptiveThreshold(
        warped_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 12
    )

    cv2.imwrite(str(output_path), enhanced)


def image_to_pdf_single(input_path: Path, output_path: Path) -> None:
    """Wrap a single image (e.g. a scanned document) into a one-page PDF."""
    img = Image.open(input_path)
    if img.mode != "RGB":
        img = img.convert("RGB")
    img.save(output_path, "PDF")