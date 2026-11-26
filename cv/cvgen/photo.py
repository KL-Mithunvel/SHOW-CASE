"""Crop the application photo to the passport ratio. Used by both renderers."""
from __future__ import annotations

import io
from pathlib import Path

from PIL import Image

from .model import CVError


def cropped_photo(path: Path, w_mm: float, h_mm: float) -> io.BytesIO:
    """Crop the photo to the w:h ratio (35x45 by default) and return JPEG bytes.

    A too-wide photo is trimmed equally on both sides; a too-tall one is trimmed
    at the bottom only, so the head stays in frame.
    """
    if not path.is_file():
        raise CVError(f"photo not found: {path}")
    img = Image.open(path).convert("RGB")
    target = w_mm / h_mm
    width, height = img.size
    if width / height > target:
        new_w = round(height * target)
        left = (width - new_w) // 2
        img = img.crop((left, 0, left + new_w, height))
    else:
        img = img.crop((0, 0, width, round(width / target)))
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=92)
    buf.seek(0)
    return buf
