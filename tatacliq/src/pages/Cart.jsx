import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import styles from './Cart.module.css'

export default function Cart() {
  const { cart, removeFromCart, updateQty, totalItems, totalPrice, clearCart } = useCart()
  const { user } = useAuth()

  return (
    <main className={styles.main}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Shopping bag</h1>
          <p className={styles.count}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
        </div>

        {!user && (
          <div className={styles.loginBanner}>
            <p>Sign in to save your bag across devices.</p>
            <Link to="/auth" className={styles.loginLink}>Sign in</Link>
          </div>
        )}

        {cart.length === 0 ? (
          <div className={styles.empty}>
            <BagIcon />
            <p>Your bag is empty</p>
            <Link to="/products" className={styles.shopLink}>Continue shopping</Link>
          </div>
        ) : (
          <div className={styles.layout}>

            {/* Cart items */}
            <div className={styles.items}>
              {cart.map(item => (
                <CartItem
                  key={item._id}
                  item={item}
                  onRemove={() => removeFromCart(item._id)}
                  onQty={(qty) => updateQty(item._id, qty)}
                />
              ))}
              <button className={styles.clearBtn} onClick={clearCart}>
                Clear bag
              </button>
            </div>

            {/* Order summary */}
            <div className={styles.summary}>
              <h2 className={styles.summaryTitle}>Order summary</h2>

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Subtotal ({totalItems} items)</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Delivery</span>
                  <span className={styles.free}>
                    {totalPrice >= 999 ? 'Free' : '₹99'}
                  </span>
                </div>
                {totalPrice < 999 && (
                  <p className={styles.freeNote}>
                    Add ₹{(999 - totalPrice).toLocaleString('en-IN')} more for free delivery
                  </p>
                )}
              </div>

              <div className={styles.total}>
                <span>Total</span>
                <span>₹{(totalPrice + (totalPrice >= 999 ? 0 : 99)).toLocaleString('en-IN')}</span>
              </div>

              <button className={styles.checkoutBtn}>
                Proceed to checkout
              </button>
              <p className={styles.checkoutNote}>
                Checkout coming soon — products redirect to brand sites
              </p>

              <div className={styles.divider} />

              <div className={styles.trustBadges}>
                {['100% Authentic', 'Easy Returns', 'Secure Payment'].map(b => (
                  <span key={b} className={styles.badge}>{b}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function CartItem({ item, onRemove, onQty }) {
  const [imgError, setImgError] = useState(false)
  const discount = item.mrp && item.price
    ? Math.round((1 - item.price / item.mrp) * 100) : null

  return (
    <div className={styles.item}>
      <Link to={`/product/${item._id}`} className={styles.itemImg}>
        {imgError || !item.image_url ? (
          <div className={styles.imgPlaceholder}>
            <span>{item.category?.[0] || 'F'}</span>
          </div>
        ) : (
          <img
            src={item.image_url}
            alt={item.product_name}
            onError={() => setImgError(true)}
          />
        )}
      </Link>

      <div className={styles.itemInfo}>
        <p className={styles.itemBrand}>{item.brand}</p>
        <Link to={`/product/${item._id}`} className={styles.itemName}>
          {item.product_name}
        </Link>

        <div className={styles.itemPriceRow}>
          <span className={styles.itemPrice}>₹{item.price?.toLocaleString('en-IN')}</span>
          {item.mrp && item.mrp > item.price && (
            <>
              <span className={styles.itemMrp}>₹{item.mrp?.toLocaleString('en-IN')}</span>
              {discount >= 10 && <span className={styles.itemDiscount}>{discount}% off</span>}
            </>
          )}
        </div>

        <div className={styles.itemActions}>
          <div className={styles.qtyControl}>
            <button onClick={() => onQty(item.qty - 1)}>−</button>
            <span>{item.qty}</span>
            <button onClick={() => onQty(item.qty + 1)}>+</button>
          </div>
          <button className={styles.removeBtn} onClick={onRemove}>Remove</button>
        </div>
      </div>
    </div>
  )
}

// useState needed inside CartItem
import { useState } from 'react'

const BagIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
)
