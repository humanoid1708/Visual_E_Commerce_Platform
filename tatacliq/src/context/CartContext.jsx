import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState([])

  useEffect(() => {
    const key = user ? `cart_${user.uid}` : 'cart_guest'
    const saved = localStorage.getItem(key)
    if (saved) setCart(JSON.parse(saved))
  }, [user])

  const save = (items) => {
    const key = user ? `cart_${user.uid}` : 'cart_guest'
    localStorage.setItem(key, JSON.stringify(items))
    setCart(items)
  }

  const addToCart = (product, qty = 1) => {
    const existing = cart.find(i => i._id === product._id)
    if (existing) {
      save(cart.map(i => i._id === product._id
        ? { ...i, qty: i.qty + qty }
        : i
      ))
    } else {
      save([...cart, { ...product, qty }])
    }
  }

  const removeFromCart = (id) => save(cart.filter(i => i._id !== id))

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id)
    save(cart.map(i => i._id === id ? { ...i, qty } : i))
  }

  const clearCart = () => save([])

  const totalItems  = cart.reduce((s, i) => s + i.qty, 0)
  const totalPrice  = cart.reduce((s, i) => s + (i.price * i.qty), 0)
  const isInCart    = (id) => cart.some(i => i._id === id)

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQty,
      clearCart, totalItems, totalPrice, isInCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
