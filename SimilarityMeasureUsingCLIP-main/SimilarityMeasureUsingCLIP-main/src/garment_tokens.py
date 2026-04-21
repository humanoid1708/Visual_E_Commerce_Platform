"""Normalize Myntra `products` strings for garment-type matching."""

from __future__ import annotations

import re
from typing import FrozenSet

# Order matters: first match wins (coarse buckets)
FAMILY_KEYWORDS: tuple[tuple[str, str], ...] = (
    ("anarkali", "kurta"),
    ("kurti", "kurta"),
    ("kurta", "kurta"),
    ("lehenga", "lehenga"),
    ("saree", "saree"),
    ("sari", "saree"),
    ("dress", "dress"),
    ("gown", "dress"),
    ("maxi", "dress"),
    ("top", "top"),
    ("shirt", "shirt"),
    ("t-shirt", "top"),
    ("tshirt", "top"),
    ("tee", "top"),
    ("jeans", "jeans"),
    ("skirt", "skirt"),
    ("palazzo", "palazzo"),
    ("trouser", "trouser"),
    ("churidar", "churidar"),
    ("dupatta", "dupatta"),
    ("shrug", "shrug"),
    ("jacket", "jacket"),
    ("blazer", "jacket"),
    ("suit", "suit"),
    ("set", "set"),
    ("kurta set", "kurta_set"),
    ("material", "dress_material"),
    ("unstitched", "dress_material"),
)


def _clean_token(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r"\s+", " ", s)
    return s


def product_tokens(products: str | float | None) -> FrozenSet[str]:
    """Comma-separated product list -> normalized tokens + coarse family tags."""
    if products is None or (isinstance(products, float) and str(products) == "nan"):
        return frozenset()
    s = str(products).strip()
    if not s:
        return frozenset()
    parts = [_clean_token(p) for p in s.split(",") if _clean_token(p)]
    out: set[str] = set(parts)
    for p in parts:
        for needle, fam in FAMILY_KEYWORDS:
            if needle in p:
                out.add(fam)
                break
    return frozenset(out)


def garment_family(products: str | float | None) -> str | None:
    """Single coarse bucket from full products + name text."""
    if products is None or (isinstance(products, float) and str(products) == "nan"):
        text = ""
    else:
        text = str(products).lower()
    for needle, fam in FAMILY_KEYWORDS:
        if needle in text:
            return fam
    return None


def family_from_tokens(tokens: FrozenSet[str]) -> str | None:
    joined = " ".join(sorted(tokens)).lower()
    for needle, fam in FAMILY_KEYWORDS:
        if needle in joined:
            return fam
    return None


def type_similarity(q_tokens: FrozenSet[str], c_tokens: FrozenSet[str]) -> float:
    """Jaccard on token sets + bonus if same garment family."""
    if not q_tokens or not c_tokens:
        return 0.5
    inter = q_tokens & c_tokens
    union = q_tokens | c_tokens
    j = len(inter) / len(union) if union else 0.0
    fq, fc = family_from_tokens(q_tokens), family_from_tokens(c_tokens)
    if fq and fc and fq == fc:
        j = max(j, 0.55)
    return float(min(1.0, j))


def type_compatible(
    q_tokens: FrozenSet[str],
    q_family: str | None,
    c_tokens: FrozenSet[str],
    c_family: str | None,
    min_jaccard: float = 0.08,
) -> bool:
    """Reject obvious category mismatches when metadata exists."""
    if not q_tokens:
        return True
    if not c_tokens:
        return False
    inter = q_tokens & c_tokens
    if len(inter) >= 1:
        return True
    j = len(inter) / len(q_tokens | c_tokens) if (q_tokens | c_tokens) else 0.0
    if j >= min_jaccard:
        return True
    if q_family and c_family and q_family == c_family:
        return True
    return False
