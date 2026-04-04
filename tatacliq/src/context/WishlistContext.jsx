import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const WishlistContext = createContext(null)
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState([])

  // Load wishlist — from backend if logged in, localStorage if guest
  useEffect(() => {
    if (user) {
      axios.get(`${API}/wishlist?uid=${user.uid}`)
        .then(r => setWishlist(r.data.products || []))
        .catch(() => setWishlist([]))
    } else {
      const saved = localStorage.getItem('wishlist_guest')
      setWishlist(saved ? JSON.parse(saved) : [])
    }
  }, [user])

  const toggle = async (product) => {
    if (user) {
      // Sync with backend
      try {
        const r = await axios.post(`${API}/wishlist/toggle`, {
          uid: user.uid,
          productId: product._id
        })
        setWishlist(r.data.products || [])
      } catch {
        // Fallback to local toggle
        localToggle(product)
      }
    } else {
      localToggle(product)
    }
  }

  const localToggle = (product) => {
    const exists = wishlist.find(p => p._id === product._id)
    const next   = exists
      ? wishlist.filter(p => p._id !== product._id)
      : [...wishlist, product]
    localStorage.setItem('wishlist_guest', JSON.stringify(next))
    setWishlist(next)
  }

  const isWishlisted = (id) => wishlist.some(p => p._id === id)

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
