"""
Precompute CLIP + color + pattern embeddings and product metadata for retrieval.

Usage:
  python build_index.py
  python build_index.py --clip-batch 64 --max-images 1000
"""

from __future__ import annotations

import argparse
import pickle
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image
from tqdm import tqdm

from src.clip_embedder import CLIPEmbedder
from src.color_pattern_embedder import embed_pil


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--csv",
        type=Path,
        default=Path(__file__).resolve().parent / "dataset" / "Fashion Dataset v2.csv",
    )
    parser.add_argument(
        "--images-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "dataset" / "images",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "artifacts",
    )
    parser.add_argument("--max-images", type=int, default=None)
    parser.add_argument("--clip-batch", type=int, default=64)
    args = parser.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(args.csv, encoding="utf-8")
    if "p_id" not in df.columns or "products" not in df.columns:
        raise SystemExit("CSV must contain 'p_id' and 'products'.")

    pid_to_products = df.drop_duplicates("p_id").set_index("p_id")["products"].to_dict()

    rows: list[tuple[int, Path]] = []
    for pid in sorted(df["p_id"].dropna().astype(int).unique()):
        p = args.images_dir / f"{pid}.jpg"
        if p.is_file():
            rows.append((pid, p))
    if args.max_images is not None:
        rows = rows[: args.max_images]

    if not rows:
        raise SystemExit(f"No images found under {args.images_dir}.")

    clip_e = CLIPEmbedder()
    clip_rows: list[np.ndarray] = []
    color_rows: list[np.ndarray] = []
    pattern_rows: list[np.ndarray] = []
    p_ids: list[int] = []
    products_map: dict[int, str] = {}

    bs = max(1, args.clip_batch)
    for start in tqdm(range(0, len(rows), bs), desc="CLIP + color/pattern batches"):
        chunk = rows[start : start + bs]
        imgs: list[Image.Image] = []
        chunk_pids: list[int] = []
        for pid, path in chunk:
            try:
                imgs.append(Image.open(path).convert("RGB"))
                chunk_pids.append(pid)
            except OSError:
                continue
        if not imgs:
            continue
        ce = clip_e.embed_batch(imgs)
        with ThreadPoolExecutor(max_workers=8) as ex:
            cp_list = list(ex.map(embed_pil, imgs))
        for i, pid in enumerate(chunk_pids):
            c, p = cp_list[i]
            clip_rows.append(ce[i])
            color_rows.append(c)
            pattern_rows.append(p)
            p_ids.append(pid)
            raw = pid_to_products.get(pid)
            if raw is None or pd.isna(raw):
                products_map[pid] = ""
            else:
                products_map[pid] = str(raw)

    if not p_ids:
        raise SystemExit("No valid images embedded.")

    clip_emb = np.stack(clip_rows, axis=0).astype(np.float32)
    color_emb = np.stack(color_rows, axis=0).astype(np.float32)
    pattern_emb = np.stack(pattern_rows, axis=0).astype(np.float32)
    p_ids_arr = np.array(p_ids, dtype=np.int64)

    np.save(args.out_dir / "clip_embeddings.npy", clip_emb)
    np.save(args.out_dir / "color_embeddings.npy", color_emb)
    np.save(args.out_dir / "pattern_embeddings.npy", pattern_emb)
    np.save(args.out_dir / "p_ids.npy", p_ids_arr)
    with open(args.out_dir / "pid_to_products.pkl", "wb") as f:
        pickle.dump(products_map, f)

    meta = df[df["p_id"].isin(p_ids)].drop_duplicates(subset=["p_id"], keep="first")
    meta.to_csv(args.out_dir / "metadata.csv", index=False)

    print(
        f"Saved {len(p_ids)} items: CLIP {clip_emb.shape[1]}, "
        f"color {color_emb.shape[1]}, pattern {pattern_emb.shape[1]} -> {args.out_dir}"
    )


if __name__ == "__main__":
    main()
