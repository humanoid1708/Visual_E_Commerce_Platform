import { Link } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import styles from './Wishlist.module.css'

export default function Wishlist() {
  const { wishlist } = useWishlist()
  const { user }     = useAuth()

  return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Wishlist</h1>
          <p className={styles.count}>{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}</p>
        </div>

        {!user && (
          <div className={styles.loginBanner}>
            <p>Sign in to save your wishlist across devices.</p>
            <Link to="/auth" className={styles.loginLink}>Sign in</Link>
          </div>
        )}

        {wishlist.length === 0 ? (
          <div className={styles.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <p>Your wishlist is empty</p>
            <Link to="/products" className={styles.shopLink}>Start browsing</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {wishlist.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </main>
  )
}
