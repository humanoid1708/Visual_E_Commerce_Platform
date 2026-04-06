"""
Phase 2 — Image Setup
======================
Two modes:
  Mode A (default): Copy images from raw/images/ to images/ folder
                    (fast, no internet needed)
  Mode B: Download from CDN URLs in products_clean.csv
          (use if raw/images/ is missing or incomplete)

Run: python phase2_image_downloader.py
"""

import os
import shutil
import pandas as pd

INPUT_CSV  = "./products_clean.csv"
RAW_IMAGES = "./raw/images"
OUT_IMAGES = "./images"

def mode_a_copy():
    """Copy from raw/images/ to images/ — fast, no download needed"""
    os.makedirs(OUT_IMAGES, exist_ok=True)

    df = pd.read_csv(INPUT_CSV)
    product_ids = df['product_id'].astype(str).tolist()

    print(f"Copying images for {len(product_ids)} products from {RAW_IMAGES}/")

    copied  = 0
    missing = 0

    for pid in product_ids:
        src  = os.path.join(RAW_IMAGES, f"{pid}.jpg")
        dest = os.path.join(OUT_IMAGES, f"{pid}.jpg")

        if os.path.exists(dest):
            copied += 1
            continue

        if os.path.exists(src):
            shutil.copy2(src, dest)
            copied += 1
        else:
            missing += 1

    print(f"\nCopy complete")
    print(f"  Copied  : {copied}")
    print(f"  Missing : {missing}  (will use CDN URL fallback)")

def mode_b_download():
    """Download from CDN URLs — slower, needs internet"""
    import requests
    from tqdm import tqdm
    import time, random

    os.makedirs(OUT_IMAGES, exist_ok=True)
    df = pd.read_csv(INPUT_CSV)

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Referer": "https://www.myntra.com/",
    }

    success = 0
    failed  = 0

    with tqdm(total=len(df), unit="img") as pbar:
        for _, row in df.iterrows():
            pid  = str(row['product_id'])
            url  = str(row['image_url'])
            dest = os.path.join(OUT_IMAGES, f"{pid}.jpg")

            if os.path.exists(dest) and os.path.getsize(dest) > 2000:
                success += 1
                pbar.update(1)
                continue

            try:
                r = requests.get(url, headers=HEADERS, timeout=10, stream=True)
                if r.status_code == 200:
                    with open(dest, 'wb') as f:
                        for chunk in r.iter_content(8192):
                            f.write(chunk)
                    if os.path.getsize(dest) > 2000:
                        success += 1
                    else:
                        os.remove(dest)
                        failed += 1
                else:
                    failed += 1
            except Exception:
                failed += 1

            time.sleep(0.3 + random.uniform(0, 0.15))
            pbar.update(1)

    print(f"\nDownload complete — success: {success}, failed: {failed}")

if __name__ == "__main__":
    if not os.path.exists(INPUT_CSV):
        print(f"ERROR: {INPUT_CSV} not found. Run phase1_kaggle_setup.py first.")
        exit(1)

    if os.path.exists(RAW_IMAGES) and len(os.listdir(RAW_IMAGES)) > 0:
        print("Found raw/images/ — using Mode A (copy, fast)")
        mode_a_copy()
    else:
        print("raw/images/ not found — using Mode B (download from CDN)")
        mode_b_download()

    print(f"\nImages ready in {OUT_IMAGES}/")
    print("Next: run 'npm run seed' in tatacliq-backend/")
