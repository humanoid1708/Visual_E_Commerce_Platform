import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import ProductCard from '../components/ProductCard'
import styles from './Home.module.css'

const CATEGORIES = [
  { label: 'Women',    slug: 'women',    color: '#E8D5C4' },
  { label: 'Men',      slug: 'men',      color: '#C4D0D8' },
  { label: 'Kids',     slug: 'kids',     color: '#D4E0C8' },
  { label: 'Ethnic',   slug: 'ethnic',   color: '#DEC4C4' },
  { label: 'Western',  slug: 'western',  color: '#C4C8DE' },
  { label: 'Sale',     slug: 'sale',     color: '#E8C4C4' },
]

const BANNERS = [
  { title: 'New Season',   sub: 'Fresh arrivals for every occasion', cta: 'Explore Women', link: '/products?category=women',  bg: '#1A1714', fg: '#F5F0E8' },
  { title: 'Bold & Free',  sub: 'The men\'s edit — curated for you', cta: 'Shop Men',      link: '/products?category=men',    bg: '#2C3E35', fg: '#F5F0E8' },
  { title: 'Up to 60% Off', sub: 'End of season sale — limited time', cta: 'Shop Sale',    link: '/products?category=sale',   bg: '#C4392D', fg: '#F5F0E8' },
]

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading]   = useState(true)
  const [banner, setBanner]     = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch featured products from API
    axios.get(`${API}/products?limit=8&sort=newest`)
      .then(r => setFeatured(r.data.products || []))
      .catch(err => {
        console.error('Failed to fetch products:', err)
        setFeatured([])
      })
      .finally(() => setLoading(false))
  }, [])

  // Auto-rotate banner
  useEffect(() => {
    const t = setInterval(() => setBanner(b => (b + 1) % BANNERS.length), 5000)
    return () => clearInterval(t)
  }, [])

  const b = BANNERS[banner]

  return (
    <main className={styles.main}>

      {/* Hero banner */}
      <section className={styles.hero} style={{ background: b.bg, color: b.fg }}>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>StyleVault — Season 2025</p>
          <h1 className={styles.heroTitle}>{b.title}</h1>
          <p className={styles.heroSub}>{b.sub}</p>
          <Link to={b.link} className={styles.heroCta} style={{ color: b.bg, background: b.fg }}>
            {b.cta}
          </Link>
        </div>
        <div className={styles.bannerDots}>
          {BANNERS.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === banner ? styles.dotActive : ''}`}
              onClick={() => setBanner(i)}
              style={{ background: i === banner ? b.fg : 'rgba(255,255,255,0.3)' }}
            />
          ))}
        </div>
      </section>

      {/* Category strip */}
      <section className={styles.catSection}>
        <div className="container">
          <div className={styles.catGrid}>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                to={`/products?category=${cat.slug}`}
                className={styles.catCard}
                style={{ background: cat.color }}
              >
                <span className={styles.catLabel}>{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className={styles.featuredSection}>
        <div className="container">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Featured this week</h2>
            <Link to="/products" className={styles.seeAll}>View all →</Link>
          </div>

          {loading ? (
            <div className={styles.productGrid}>
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className={`${styles.skeletonCard} skeleton`} />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className={styles.productGrid}>
              {featured.map((p, i) => (
                <div key={p._id} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>Products loading — make sure your backend is running.</p>
              <button className={styles.demoBtn} onClick={() => navigate('/products')}>
                Browse catalogue
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Editorial strip */}
      <section className={styles.editorial}>
        <div className="container">
          <div className={styles.editGrid}>
            <div className={styles.editCard} style={{ background: '#1A1714', color: '#F5F0E8' }}>
              <p className={styles.editEye}>The Edit</p>
              <h3 className={styles.editTitle}>Occasion<br />Dressing</h3>
              <Link to="/products?category=ethnic" className={styles.editCta}>Explore</Link>
            </div>
            <div className={styles.editCard} style={{ background: '#B8935A', color: '#F5F0E8' }}>
              <p className={styles.editEye}>New In</p>
              <h3 className={styles.editTitle}>Premium<br />Brands</h3>
              <Link to="/products?category=brands" className={styles.editCta}>Discover</Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
