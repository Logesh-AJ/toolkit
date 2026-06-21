"""
QR code generation service.
"""

from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_M


def generate_qr_code(
    data: str,
    output_path: Path,
    fill_color: str = "black",
    back_color: str = "white",
    box_size: int = 10,
) -> None:
    """
    Generate a QR code PNG encoding the given text/URL.
    """
    qr = qrcode.QRCode(
        version=None,  # auto-size based on data length
        error_correction=ERROR_CORRECT_M,
        box_size=box_size,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color=fill_color, back_color=back_color)
    img.save(output_path)