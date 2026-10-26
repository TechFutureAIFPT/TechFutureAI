"""Offline CPU OCR; never sends uploaded documents to a cloud vision API."""
from __future__ import annotations

import io
from functools import lru_cache


@lru_cache(maxsize=1)
def _engine():
    from rapidocr_onnxruntime import RapidOCR
    return RapidOCR(intra_op_num_threads=2, inter_op_num_threads=2)


def extract_image(image_bytes: bytes) -> str:
    import numpy as np
    from PIL import Image
    with Image.open(io.BytesIO(image_bytes)) as image:
        if image.width * image.height > 40_000_000:
            raise ValueError("Image exceeds local OCR pixel budget")
        pixels = np.asarray(image.convert("RGB"))[:, :, ::-1].copy()
    results, _ = _engine()(pixels)
    return "\n".join(str(row[1]) for row in results or [] if len(row) >= 3 and float(row[2]) >= 0.5)
