import { useEffect, useState, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import axios from 'axios'
import ProductCard from '../components/ProductCard'
import styles from './Search.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const SUGGESTIONS = [
  'Floral dress', 'White shirt', 'Blue jeans', 'Ethnic kurta',
  'Black top', 'Formal trousers', 'Casual tee', 'Maxi dress',
]

export default function Search() {
  const [params, setParams]       = useSearchParams()
  const [products, setProducts]   = useState([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [inputVal, setInputVal]   = useState(params.get('q') || '')
  const debounceRef               = useRef(null)
  const q = params.get('q') || ''

  // Fetch on query change
  useEffect(() => {
    if (!q) { setProducts([]); setTotal(0); return }
    setLoading(true)
    axios.get(`${API}/products?q=${encodeURIComponent(q)}&limit=20`)
      .then(r => { setProducts(r.data.products || []); setTotal(r.data.total || 0) })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [q])

  // Debounce input → update URL param
  const handleInput = (val) => {
    setInputVal(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const next = new URLSearchParams(params)
      if (val.trim()) next.set('q', val.trim())
      else next.delete('q')
      setParams(next)
    }, 350)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputVal.trim()) {
      const next = new URLSearchParams()
      next.set('q', inputVal.trim())
      setParams(next)
    }
  }

  return (
    <main className={styles.main}>
      <div className="container">

        {/* Search bar */}
        <div className={styles.searchBar}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <SearchIcon />
            <input
              autoFocus
              value={inputVal}
              onChange={e => handleInput(e.target.value)}
              placeholder="Search for products, brands, categories..."
              className={styles.input}
            />
            {inputVal && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => { setInputVal(''); setParams({}) }}
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* No query — show suggestions */}
        {!q && (
          <div className={styles.suggestions}>
            <p className={styles.suggestLabel}>Popular searches</p>
            <div className={styles.chips}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  className={styles.chip}
                  onClick={() => { setInputVal(s); setParams({ q: s }) }}
                >
                  {s}
                </button>
              ))}
            </div>

            <p className={styles.suggestLabel} style={{ marginTop: 32 }}>
              Browse categories
            </p>
            <div className={styles.catRow}>
              {['Women', 'Men', 'Kids', 'Ethnic', 'Western', 'Sale'].map(cat => (
                <Link
                  key={cat}
                  to={`/products?category=${cat.toLowerCase()}`}
                  className={styles.catPill}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {q && (
          <>
            <div className={styles.resultsHeader}>
              {loading ? (
                <p className={styles.resultsCount}>Searching…</p>
              ) : (
                <p className={styles.resultsCount}>
                  {total > 0
                    ? `${total} results for "${q}"`
                    : `No results for "${q}"`}
                </p>
              )}
              {total > 0 && (
                <Link to={`/products?q=${encodeURIComponent(q)}`} className={styles.viewAll}>
                  View all with filters →
                </Link>
              )}
            </div>

            {loading ? (
              <div className={styles.grid}>
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className={`${styles.skeletonCard} skeleton`} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className={styles.noResults}>
                <p>Try a different search term or browse by category.</p>
                <div className={styles.chips} style={{ marginTop: 20 }}>
                  {SUGGESTIONS.slice(0, 4).map(s => (
                    <button
                      key={s}
                      className={styles.chip}
                      onClick={() => { setInputVal(s); setParams({ q: s }) }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className={styles.grid}>
                {products.map((p, i) => (
                  <div key={p._id} className="fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
