import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Skip Firebase for testing - set loading to false immediately
    setLoading(false)
  }, [])

  const loginWithGoogle = () => Promise.resolve()
  const loginWithEmail  = (email, pw) => Promise.resolve()
  const register        = (email, pw) => Promise.resolve()
  const logout          = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
