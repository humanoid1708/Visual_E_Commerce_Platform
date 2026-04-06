import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useToast } from './Toast'
import styles from './ProductCard.module.css'

export default function ProductCard({ product }) {
  const { toggle, isWishlisted } = useWishlist()
  const toast                    = useToast()
  const [imgError, setImgError]  = useState(false)
  const wishlisted = isWishlisted(product._id)
  const externalUrl = product.ajio_url || product.ajioUrl

  const discount = product.mrp && product.price
    ? Math.round((1 - product.price / product.mrp) * 100)
    : null

  const handleWishlist = (e) => {
    e.preventDefault()
    toggle(product)
    toast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist')
  }

  const Wrapper = externalUrl ? 'a' : Link
  const wrapperProps = externalUrl
    ? { href: externalUrl, target: '_blank', rel: 'noopener noreferrer' }
    : { to: `/product/${product.product_id}` }

  return (
    <div className={styles.card}>
      <Wrapper className={styles.imageWrap} {...wrapperProps}>
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
            loading="lazy"
          />
        )}
        {discount >= 10 && (
          <span className={styles.discountBadge}>{discount}% off</span>
        )}
      </Wrapper>

      {externalUrl && (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.buyLink}
        >
          Buy on external site
        </a>
      )}

      <button
        className={`${styles.heartBtn} ${wishlisted ? styles.wishlisted : ''}`}
        onClick={handleWishlist}
        aria-label="Add to wishlist"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      <div className={styles.info}>
        <p className={styles.brand}>{product.brand}</p>
        <p className={styles.name}>{product.product_name}</p>
        <div className={styles.priceRow}>
          <span className={styles.price}>₹{product.price?.toLocaleString('en-IN')}</span>
          {product.mrp && product.mrp > product.price && (
            <span className={styles.mrp}>₹{product.mrp?.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    </div>
  )
}
