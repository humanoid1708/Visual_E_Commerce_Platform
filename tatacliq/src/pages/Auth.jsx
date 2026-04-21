import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Auth.module.css'

export default function Auth() {
  const [mode, setMode]     = useState('login')
  const [email, setEmail]   = useState('')
  const [pw, setPw]         = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { loginWithEmail, loginWithGoogle, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'login') await loginWithEmail(email, pw)
      else await register(email, pw)
      navigate('/')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    setError(''); setLoading(true)
    try { await loginWithGoogle(); navigate('/') }
    catch (err) { setError(friendlyError(err.code)) }
    finally { setLoading(false) }
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.logo}>StyleVault</h1>
        <p className={styles.sub}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={styles.input}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className={styles.label}>
            Password
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              className={styles.input}
              placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
              required
            />
          </label>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className={styles.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className={styles.switchBtn} onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </main>
  )
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':    'No account found with this email.',
    'auth/wrong-password':    'Incorrect password.',
    'auth/email-already-in-use': 'Email already in use.',
    'auth/weak-password':     'Password must be at least 6 characters.',
    'auth/invalid-email':     'Please enter a valid email.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}