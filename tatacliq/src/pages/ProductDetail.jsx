import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import styles from './ProductDetail.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function ProductDetail() {
  const { id } = useParams()
  const { toggle, isWishlisted } = useWishlist()
  const { addToCart, isInCart }   = useCart()
  const navigate                  = useNavigate()
  const [product, setProduct]   = useState(null)
  const [related, setRelated]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setImgError(false)
    axios.get(`${API}/products/${id}`)
      .then(r => {
        setProduct(r.data)
        return axios.get(`${API}/products?category=${r.data.category}&limit=4`)
      })
      .then(r => setRelated(r.data.products?.filter(p => p.product_id !== id) || []))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.skeletonLayout}>
          <div className={`${styles.skeletonImg} skeleton`} />
          <div className={styles.skeletonInfo}>
            {[200, 120, 80, 160, 100].map((w, i) => (
              <div key={i} className={`${styles.skeletonLine} skeleton`} style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
    </main>
  )

  if (!product) return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.notFound}>
          <p>Product not found.</p>
          <Link to="/products" className={styles.backLink}>← Back to products</Link>
        </div>
      </div>
    </main>
  )

  const wishlisted = isWishlisted(product._id)
  const discount   = product.mrp && product.price
    ? Math.round((1 - product.price / product.mrp) * 100) : null

  return (
    <main className={styles.main}>
      <div className="container">

        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category?.toLowerCase()}`}>
            {product.category}
          </Link>
          <span>/</span>
          <span>{product.product_name}</span>
        </nav>

        {/* Main layout */}
        <div className={styles.layout}>

          {/* Image */}
          <div className={styles.imageSection}>
            {imgError || !product.image_url ? (
              <div className={styles.placeholder}>
                <span>{product.category?.[0] || 'F'}</span>
              </div>
            ) : (
              <img
                src={product.image_url}
                alt={product.product_name}
                className={styles.image}
                onError={() => setImgError(true)}
              />
            )}
          </div>

          {/* Info */}
          <div className={styles.infoSection}>
            <p className={styles.brand}>{product.brand}</p>
            <h1 className={styles.name}>{product.product_name}</h1>

            {/* Price */}
            <div className={styles.priceRow}>
              <span className={styles.price}>
                ₹{product.price?.toLocaleString('en-IN')}
              </span>
              {product.mrp && product.mrp > product.price && (
                <>
                  <span className={styles.mrp}>
                    ₹{product.mrp?.toLocaleString('en-IN')}
                  </span>
                  <span className={styles.discountTag}>{discount}% off</span>
                </>
              )}
            </div>

            {/* Meta */}
            <div className={styles.metaGrid}>
              {product.gender && (
                <div className={styles.metaItem}>
                  <span className={styles.metaKey}>Gender</span>
                  <span className={styles.metaVal}>{product.gender}</span>
                </div>
              )}
              {product.primary_color && (
                <div className={styles.metaItem}>
                  <span className={styles.metaKey}>Color</span>
                  <span className={styles.metaVal}>{product.primary_color}</span>
                </div>
              )}
              {product.category && (
                <div className={styles.metaItem}>
                  <span className={styles.metaKey}>Category</span>
                  <span className={styles.metaVal}>{product.category}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className={styles.description}>{product.description}</p>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <button
                className={styles.addBtn}
                onClick={() => { addToCart(product); navigate('/cart') }}
              >
                {isInCart(product._id) ? 'Added — go to bag →' : 'Add to bag'}
              </button>
              {product.ajio_url ? (
                <a
                  href={product.ajio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.buyBtn}
                >
                  Buy on AJIO →
                </a>
              ) : null}
              <button
                className={`${styles.wishBtn} ${wishlisted ? styles.wishlisted : ''}`}
                onClick={() => toggle(product)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {wishlisted ? 'Wishlisted' : 'Add to wishlist'}
              </button>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className={styles.related}>
            <h2 className={styles.relatedTitle}>More from {product.category}</h2>
            <div className={styles.relatedGrid}>
              {related.slice(0, 4).map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
