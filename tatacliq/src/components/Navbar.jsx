import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import styles from './Navbar.module.css'

const CATEGORIES = ['Women', 'Men', 'Kids', 'Brands', 'Sale']

export default function Navbar() {
  const { user, logout }     = useAuth()
  const { wishlist }         = useWishlist()
  const { totalItems }       = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [search, setSearch]  = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`)
      setSearch('')
    } else {
      navigate('/search')
    }
  }

  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>

        {/* Logo */}
        <Link to="/" className={styles.logo}>
          Style<span>Vault</span>
        </Link>

        {/* Category links */}
        <nav className={styles.cats}>
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              to={`/products?category=${cat.toLowerCase()}`}
              className={styles.catLink}
            >
              {cat}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className={styles.actions}>
          {/* Search */}
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchBtn}>
              <SearchIcon />
            </button>
          </form>

          {/* Wishlist */}
          <Link to="/wishlist" className={styles.iconBtn}>
            <HeartIcon />
            {wishlist.length > 0 && (
              <span className={styles.badge}>{wishlist.length}</span>
            )}
          </Link>

          {/* Cart */}
          <Link to="/cart" className={styles.iconBtn}>
            <BagIcon />
            {totalItems > 0 && (
              <span className={styles.badge}>{totalItems}</span>
            )}
          </Link>

          {/* Auth */}
          {user ? (
            <div className={styles.userMenu}>
              <button className={styles.iconBtn} onClick={() => setMenuOpen(p => !p)}>
                <UserIcon />
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <span className={styles.dropEmail}>{user.email}</span>
                  <Link to="/wishlist" className={styles.dropItem}>Wishlist</Link>
                  <button className={styles.dropItem} onClick={logout}>Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className={styles.signIn}>Sign in</Link>
          )}
        </div>
      </div>
    </header>
  )
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
)
const BagIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
)
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
