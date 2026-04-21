import os
import shutil
import pandas as pd
import subprocess
import numpy as np
import json
from pathlib import Path

def setup_dataset():
    # Paths
    base_dir = Path(__file__).resolve().parent
    dataset_dir = base_dir / "dataset"
    dataset_dir.mkdir(exist_ok=True)
    images_dst = dataset_dir / "images"
    
    # 1. Create Fashion Dataset v2.csv exactly how DL model expects it
    csv_src = r"D:\Downloads\fsd_project\data-pipeline\products_clean.csv"
    print(f"Reading {csv_src}...")
    df = pd.read_csv(csv_src)
    
    # DL Model expects 'p_id' and 'products'
    # We combine name, category, color, brand to give the text model rich data
    df['p_id'] = df['product_id']
    df['products'] = df['product_name'].astype(str) + " " + df['category'].astype(str) + " " + df['primary_color'].astype(str) + " " + df['brand'].astype(str)
    
    out_csv = dataset_dir / "Fashion Dataset v2.csv"
    df[['p_id', 'products']].to_csv(out_csv, index=False)
    print(f"Created {out_csv} with {len(df)} rows.")

    # 2. Copy images (since symlinks can fail on Windows without Admin)
    print("Copying images to dataset folder...")
    images_src = r"D:\Downloads\fsd_project\data-pipeline\images"
    shutil.copytree(images_src, images_dst, dirs_exist_ok=True)
    print("Images copied successfully!")

def run_dl_model():
    # 3. Trigger untouched build_index.py
    print("\n--- Running Deep Learning Model to generate Embeddings ---")
    print("This will take a few minutes as PyTorch downloads the model and analyzes 1,989 images...")
    python_exe = str(Path(__file__).resolve().parent / "venv" / "Scripts" / "python.exe")
    if not os.path.exists(python_exe):
        python_exe = "python" # fallback if run from global
    subprocess.run([python_exe, "build_index.py", "--clip-batch", "32"], check=True)

def calculate_all_similarities():
    print("\n--- Precomputing Top 15 Similar Items for each Product ---")
    base_dir = Path(__file__).resolve().parent
    artifacts_dir = base_dir / "artifacts"
    
    clip_emb = np.load(artifacts_dir / "clip_embeddings.npy")
    color_emb = np.load(artifacts_dir / "color_embeddings.npy")
    pattern_emb = np.load(artifacts_dir / "pattern_embeddings.npy")
    p_ids = np.load(artifacts_dir / "p_ids.npy")
    
    # N is the number of products
    N = len(p_ids)
    
    # Calculate massive 2000x2000 similarity score matrices in milliseconds using numpy dot product!
    # A @ B.T computes cosine similarity for all pairs simultaneously 
    clip_sims = clip_emb @ clip_emb.T
    color_sims = color_emb @ color_emb.T
    pat_sims = pattern_emb @ pattern_emb.T
    
    # Weights from query_similar.py
    W_CLIP = 0.44
    W_COLOR = 0.28
    W_PATTERN = 0.16
    
    # We will ignore garment type hard filtering for offline matrix (too complex offline and usually W_TYPE only provides 0.12 bonus)
    # The pure visual/text weights will give extremely accurate similar items!
    hybrid_sims = (W_CLIP * clip_sims) + (W_COLOR * color_sims) + (W_PATTERN * pat_sims)
    
    similarities = {}
    
    # For each product, find top 15 (excluding itself)
    for i in range(N):
        pid = int(p_ids[i])
        # argsort sorts from lowest to highest. We want highest similarity, so we reverse it [::-1]
        sorted_indices = np.argsort(hybrid_sims[i])[::-1]
        
        top_matches = []
        for j in sorted_indices:
            match_pid = int(p_ids[j])
            if match_pid != pid: # don't recommend the exact same item
                top_matches.append(match_pid)
            if len(top_matches) == 15:
                break
                
        similarities[str(pid)] = top_matches
        
    out_path = r"D:\Downloads\fsd_project\tatacliq-backend\src\data\similarities.json"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(similarities, f)
        
    print(f"\n✅ All DONE! Created instant lookup table at {out_path}")

if __name__ == "__main__":
    setup_dataset()
    run_dl_model()
    calculate_all_similarities()
