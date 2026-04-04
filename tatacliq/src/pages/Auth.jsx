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

        <div className={styles.divider}><span>or</span></div>

        <button className={styles.googleBtn} onClick={handleGoogle} disabled={loading}>
          <GoogleIcon />
          Continue with Google
        </button>

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

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

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
