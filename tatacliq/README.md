# StyleVault — Tata CLiQ-style Fashion App

## Project structure

```
stylevault/
├── tatacliq/               ← React frontend (Vite)
│   ├── src/
│   │   ├── components/     ← Navbar, ProductCard
│   │   ├── context/        ← AuthContext, WishlistContext
│   │   ├── pages/          ← Home, Products, ProductDetail, Auth, Wishlist
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── .env.example
│
├── tatacliq-backend/       ← Node.js + Express backend
│   ├── src/
│   │   ├── models/         ← Product.js (Mongoose schema)
│   │   ├── routes/         ← products.js
│   │   ├── index.js        ← Express server
│   │   └── seed.js         ← CSV → MongoDB loader
│   └── .env.example
│
└── data-pipeline/          ← Python scripts (Phase 1 & 2)
    ├── phase1_kaggle_setup.py
    ├── phase2_image_downloader.py
    └── products_clean.csv  ← output of Phase 1
```

---

## Setup order

### Step 1 — Run data pipeline first
```bash
cd data-pipeline
pip install -r requirements.txt
python phase1_kaggle_setup.py     # → products_clean.csv
python phase2_image_downloader.py # → images/
```

### Step 2 — MongoDB Atlas
1. Create free account at mongodb.com/atlas
2. Create a free M0 cluster
3. Database Access → Add user (username + password)
4. Network Access → Allow from anywhere (0.0.0.0/0)
5. Connect → Drivers → copy the connection string

### Step 3 — Firebase
1. Create project at console.firebase.google.com
2. Authentication → Enable Email/Password and Google providers
3. Project Settings → Your apps → Add web app → copy config

### Step 4 — Backend
```bash
cd tatacliq-backend
cp .env.example .env
# Fill in MONGO_URI in .env
npm install
npm run seed      # loads products_clean.csv into MongoDB (run once)
npm run dev       # starts server on http://localhost:5000
```

### Step 5 — Frontend
```bash
cd tatacliq
cp .env.example .env
# Fill in VITE_API_URL and Firebase config in .env
npm install
npm run dev       # starts on http://localhost:3000
```

---

## Pages

| Route | Page |
|---|---|
| `/` | Homepage — hero banner, categories, featured products |
| `/products` | Product listing — filters, search, sort, pagination |
| `/product/:id` | Product detail — image, info, related products |
| `/auth` | Login / register — email + Google |
| `/wishlist` | Saved products |

---

## Deployment

**Frontend → Vercel**
```bash
cd tatacliq && npm run build
# Push to GitHub → Import in Vercel → Set env vars
```

**Backend → Railway**
```bash
# Push tatacliq-backend to GitHub
# New project in Railway → Deploy from GitHub
# Add MONGO_URI env var in Railway dashboard
```
