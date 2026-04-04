import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './components/Toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Auth from './pages/Auth'
import Wishlist from './pages/Wishlist'
import Cart from './pages/Cart'
import Search from './pages/Search'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <ToastProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <div style={{ flex: 1 }}>
                <Routes>
                  <Route path="/"            element={<Home />} />
                  <Route path="/products"    element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/auth"        element={<Auth />} />
                  <Route path="/wishlist"    element={<Wishlist />} />
                  <Route path="/cart"        element={<Cart />} />
                  <Route path="/search"      element={<Search />} />
                  <Route path="*"            element={<NotFound />} />
                </Routes>
              </div>
              <Footer />
            </div>
          </ToastProvider>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  )
}
