"""
Phase 1 — Dataset Preparation
Columns: image, description, display name, category
Images are filenames like 3238.jpg stored in raw/images/
"""

import os
import pandas as pd

RAW_CSV      = "./raw/styles.csv"
OUTPUT_CSV   = "./products_clean.csv"
MAX_PRODUCTS = 2000

# Categories to keep (remove accessories, shoes etc if you want clothing only)
KEEP_CATEGORIES = [
    'Tshirts', 'Jeans', 'Shorts', 'Tops', 'Shirts', 'Kurtas',
    'Dresses', 'Trousers', 'Leggings', 'Sarees', 'Skirts',
    'Jackets', 'Sweaters', 'Sweatshirts', 'Innerwear', 'Suits',
    'Kurtis', 'Palazzos', 'Dupatta', 'Lehenga Choli', 'Jumpsuit',
    'Handbags', 'Watches', 'Casual Shoes', 'Sports Shoes', 'Heels',
    'Flats', 'Sandals', 'Wallets', 'Socks', 'Belts', 'Caps',
    'Sunglasses', 'Perfume', 'Nail Polish', 'Lipstick'
]

def clean():
    print(f"Reading {RAW_CSV}...")
    df = pd.read_csv(RAW_CSV, on_bad_lines='skip')  # Skips malformed lines
# Or use 'warn' to log warnings instead of skipping
    print(f"Raw rows: {len(df)}")
    print(f"Columns: {df.columns.tolist()}")

    # Rename columns
    df = df.rename(columns={
        'productDisplayName': 'product_name',
        'articleType': 'category',
        'baseColour': 'primary_color',
        'masterCategory': 'master_category',
        'subCategory': 'sub_category',
    })

    # Create image_file from id (images are named {id}.jpg)
    df['image_file'] = df['id'].astype(str) + '.jpg'

    # Generate product_id from image filename (strip .jpg)
    df['product_id'] = df['image_file'].astype(str).apply(
        lambda x: x.replace('.jpg', '').replace('.png', '').strip()
    )

    # image_url will point to local server once seeded
    # store just the filename for now, seed.js will build the full URL
    df['image_url'] = df['image_file']

    # Extract brand from product_name (first word)
    df['brand'] = df['product_name'].astype(str).apply(
        lambda x: x.split()[0] if len(x.split()) > 0 else 'Unknown'
    )

    # Placeholder fields not in this dataset
    df['price']         = 999
    df['mrp']           = 1499
    df['primary_color'] = df['product_name'].astype(str).apply(extract_color)
    df['gender']        = df['product_name'].astype(str).apply(extract_gender)
    df['rating']        = 0.0
    df['ajio_url']      = ''

    # Drop missing
    df.dropna(subset=['product_id', 'product_name'], inplace=True)
    df = df[df['product_name'].str.strip() != '']
    df.drop_duplicates(subset='product_id', inplace=True)

    # Cap balanced across categories
    if len(df) > MAX_PRODUCTS:
        df = (
            df.groupby('category', group_keys=False)
            .apply(lambda x: x.sample(
                min(len(x), max(1, int(MAX_PRODUCTS * len(x) / len(df)))),
                random_state=42
            ))
            .reset_index(drop=True)
            .head(MAX_PRODUCTS)
        )

    final_cols = [
        'product_id', 'product_name', 'brand', 'category',
        'primary_color', 'price', 'mrp', 'rating',
        'gender', 'description', 'image_url', 'ajio_url'
    ]
    df = df[final_cols]
    df.to_csv(OUTPUT_CSV, index=False)

    print(f"\nSaved {len(df)} products → {OUTPUT_CSV}")
    print("\nCategory breakdown:")
    print(df['category'].value_counts().head(15).to_string())
    print(f"\nSample product_id: {df['product_id'].iloc[0]}")
    print(f"Sample image_url:  {df['image_url'].iloc[0]}")

def extract_color(name):
    colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow',
              'Pink', 'Grey', 'Brown', 'Orange', 'Purple', 'Navy',
              'Beige', 'Maroon', 'Teal', 'Khaki', 'Olive', 'Gold']
    for color in colors:
        if color.lower() in name.lower():
            return color
    return ''

def extract_gender(name):
    name_lower = name.lower()
    if 'women' in name_lower or 'girl' in name_lower:
        return 'Women'
    elif 'men' in name_lower or 'boy' in name_lower:
        return 'Men'
    elif 'kid' in name_lower or 'child' in name_lower:
        return 'Kids'
    return 'Unisex'

if __name__ == "__main__":
    if not os.path.exists(RAW_CSV):
        print(f"ERROR: {RAW_CSV} not found.")
        print("Place 'Fashion Dataset v2.csv' inside the raw/ folder.")
    else:
        clean()
        print("\nPhase 1 complete. Run phase2_image_downloader.py next.")