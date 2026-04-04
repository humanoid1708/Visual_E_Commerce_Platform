import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import ProductCard from '../components/ProductCard'
import styles from './Products.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const COLORS    = ['Black', 'White', 'Blue', 'Red', 'Green', 'Pink', 'Yellow', 'Grey', 'Brown', 'Multi']
const PRICE_RANGES = [
  { label: 'Under ₹500',     min: 0,    max: 500  },
  { label: '₹500 – ₹1,000', min: 500,  max: 1000 },
  { label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
  { label: '₹2,500+',        min: 2500, max: null  },
]
const SORT_OPTIONS = [
  { label: 'Newest',        value: 'newest'     },
  { label: 'Price: Low–High', value: 'price_asc' },
  { label: 'Price: High–Low', value: 'price_desc'},
  { label: 'Discount',      value: 'discount'   },
]

export default function Products() {
  const [params, setParams]     = useSearchParams()
  const [products, setProducts] = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(true)

  const category  = params.get('category') || ''
  const q         = params.get('q') || ''
  const color     = params.get('color') || ''
  const priceMin  = params.get('price_min') || ''
  const priceMax  = params.get('price_max') || ''
  const sort      = params.get('sort') || 'newest'
  const LIMIT     = 12

  const fetchProducts = useCallback(() => {
    setLoading(true)
    const p = new URLSearchParams({
      ...(category  && { category }),
      ...(q         && { q }),
      ...(color     && { color }),
      ...(priceMin  && { price_min: priceMin }),
      ...(priceMax  && { price_max: priceMax }),
      sort,
      page,
      limit: LIMIT,
    })
    axios.get(`${API}/products?${p}`)
      .then(r => { setProducts(r.data.products || []); setTotal(r.data.total || 0) })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [category, q, color, priceMin, priceMax, sort, page])

  useEffect(() => { setPage(1) }, [category, q, color, priceMin, priceMax, sort])
  useEffect(() => { fetchProducts() }, [fetchProducts])

  const setFilter = (key, val) => {
    const next = new URLSearchParams(params)
    if (val) next.set(key, val); else next.delete(key)
    setParams(next)
  }

  const clearAll = () => setParams(q ? { q } : {})

  const totalPages = Math.ceil(total / LIMIT)
  const hasFilters = color || priceMin || priceMax || category

  return (
    <main className={styles.main}>
      <div className="container">

        {/* Page header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {q ? `Results for "${q}"` : category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Products'}
            </h1>
            {!loading && <p className={styles.count}>{total} products</p>}
          </div>
          <div className={styles.sortRow}>
            <button className={styles.filterToggle} onClick={() => setFiltersOpen(p => !p)}>
              {filtersOpen ? 'Hide' : 'Show'} filters
            </button>
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={e => setFilter('sort', e.target.value)}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.layout}>

          {/* Filters sidebar */}
          {filtersOpen && (
            <aside className={styles.sidebar}>
              {hasFilters && (
                <button className={styles.clearAll} onClick={clearAll}>Clear all filters</button>
              )}

              {/* Color filter */}
              <div className={styles.filterGroup}>
                <p className={styles.filterLabel}>Color</p>
                <div className={styles.colorList}>
                  {COLORS.map(c => (
                    <button
                      key={c}
                      className={`${styles.colorChip} ${color === c ? styles.activeChip : ''}`}
                      onClick={() => setFilter('color', color === c ? '' : c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price filter */}
              <div className={styles.filterGroup}>
                <p className={styles.filterLabel}>Price</p>
                {PRICE_RANGES.map(r => {
                  const active = priceMin === String(r.min) && priceMax === String(r.max ?? '')
                  return (
                    <button
                      key={r.label}
                      className={`${styles.filterOption} ${active ? styles.activeOption : ''}`}
                      onClick={() => {
                        if (active) { setFilter('price_min', ''); setFilter('price_max', '') }
                        else { setFilter('price_min', r.min); setFilter('price_max', r.max ?? '') }
                      }}
                    >
                      {r.label}
                    </button>
                  )
                })}
              </div>
            </aside>
          )}

          {/* Product grid */}
          <section className={styles.grid}>
            {loading ? (
              <div className={styles.productGrid}>
                {Array(LIMIT).fill(0).map((_, i) => (
                  <div key={i} className={`${styles.skeletonCard} skeleton`} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className={styles.empty}>
                <p>No products found.</p>
                <button className={styles.clearBtn} onClick={clearAll}>Clear filters</button>
              </div>
            ) : (
              <>
                <div className={styles.productGrid}>
                  {products.map((p, i) => (
                    <div key={p._id} className="fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pageBtn}
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >← Prev</button>
                    <span className={styles.pageInfo}>{page} / {totalPages}</span>
                    <button
                      className={styles.pageBtn}
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >Next →</button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
