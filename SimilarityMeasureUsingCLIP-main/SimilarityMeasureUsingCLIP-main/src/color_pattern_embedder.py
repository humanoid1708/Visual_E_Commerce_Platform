"""
Image descriptors focused on clothing color (Lab + H–S) and print/texture (LBP + gradient).

Similarity = COLOR_WEIGHT * cos(color) + PATTERN_WEIGHT * cos(pattern).
"""

from __future__ import annotations

import numpy as np
from PIL import Image
from skimage.color import rgb2gray, rgb2hsv, rgb2lab
from skimage.feature import local_binary_pattern
from skimage.filters import sobel

# Emphasize color vs pattern (sum need not be 1 for display; weights are normalized below)
COLOR_WEIGHT = 0.62
PATTERN_WEIGHT = 0.38

# Focus on garment area; reduces background at borders
CENTER_CROP_FRAC = 0.88

# Downscale before histograms / LBP (major speedup; keeps color/texture signal)
MAX_SIDE = 160

# Histogram sizes
LAB_AB_BINS = 28  # 28x28 on a*, b*
HS_BINS = 32  # 32x32 on H x S
LBP_P = 8
LBP_R = 2.5
# uniform LBP for P=8 yields values in 0..9 (10 bins)
LBP_BINS = 10
GRAD_BINS = 28


def _to_float_rgb(img: Image.Image) -> np.ndarray:
    arr = np.asarray(img.convert("RGB"), dtype=np.float64) / 255.0
    return np.clip(arr, 0.0, 1.0)


def _resize_max_side(rgb: np.ndarray, max_side: int = MAX_SIDE) -> np.ndarray:
    h, w = rgb.shape[:2]
    m = max(h, w)
    if m <= max_side:
        return rgb
    scale = max_side / float(m)
    nh, nw = max(1, int(round(h * scale))), max(1, int(round(w * scale)))
    from skimage.transform import resize

    return resize(rgb, (nh, nw), preserve_range=True, anti_aliasing=True).astype(np.float64)


def _center_crop(arr: np.ndarray, frac: float = CENTER_CROP_FRAC) -> np.ndarray:
    h, w = arr.shape[:2]
    ch, cw = max(1, int(h * frac)), max(1, int(w * frac))
    y0 = (h - ch) // 2
    x0 = (w - cw) // 2
    return arr[y0 : y0 + ch, x0 : x0 + cw]


def _l2_normalize(v: np.ndarray) -> np.ndarray:
    n = float(np.linalg.norm(v))
    if n < 1e-12:
        return v
    return (v / n).astype(np.float32)


def color_descriptor(rgb: np.ndarray) -> np.ndarray:
    """Lab a*b* 2D hist + H–S 2D hist (captures hue/saturation of prints)."""
    lab = rgb2lab(rgb)
    a = lab[:, :, 1].ravel()
    b = lab[:, :, 2].ravel()
    h_ab, _, _ = np.histogram2d(
        a,
        b,
        bins=LAB_AB_BINS,
        range=[[-128.0, 128.0], [-128.0, 128.0]],
        density=True,
    )

    hsv = rgb2hsv(rgb)
    H = hsv[:, :, 0].ravel()
    S = hsv[:, :, 1].ravel()
    # Weight hue by saturation so grey pixels do not dominate hue bins
    w = np.clip(S, 0.05, 1.0)
    h_hs, _, _ = np.histogram2d(
        H,
        S,
        bins=HS_BINS,
        range=((0.0, 1.0), (0.0, 1.0)),
        weights=w,
        density=True,
    )

    v = np.concatenate([h_ab.ravel(), h_hs.ravel()]).astype(np.float64)
    return _l2_normalize(v)


def pattern_descriptor(rgb: np.ndarray) -> np.ndarray:
    """Local binary pattern (texture/print) + Sobel magnitude (edges/motifs)."""
    gray = rgb2gray(rgb)
    gray_u8 = (np.clip(gray, 0.0, 1.0) * 255.0).astype(np.uint8)
    lbp = local_binary_pattern(gray_u8, P=LBP_P, R=LBP_R, method="uniform")
    lbp_hist, _ = np.histogram(
        lbp.ravel(),
        bins=LBP_BINS,
        range=(0.0, 10.0),
        density=True,
    )

    mag = np.abs(sobel(gray.astype(np.float64)))
    mag = mag / (float(np.max(mag)) + 1e-8)
    gh, _ = np.histogram(mag.ravel(), bins=GRAD_BINS, range=(0.0, 1.0), density=True)

    v = np.concatenate([lbp_hist.astype(np.float64), gh.astype(np.float64)])
    return _l2_normalize(v)


def embed_pil(img: Image.Image) -> tuple[np.ndarray, np.ndarray]:
    rgb = _to_float_rgb(img)
    rgb = _center_crop(rgb)
    rgb = _resize_max_side(rgb)
    return color_descriptor(rgb), pattern_descriptor(rgb)


def weighted_similarity(
    qc: np.ndarray,
    qp: np.ndarray,
    color_matrix: np.ndarray,
    pattern_matrix: np.ndarray,
) -> np.ndarray:
    """Cosine sim is dot product when rows are L2-normalized."""
    wc = COLOR_WEIGHT
    wp = PATTERN_WEIGHT
    s = wc + wp
    wc, wp = wc / s, wp / s
    return wc * (color_matrix @ qc) + wp * (pattern_matrix @ qp)
