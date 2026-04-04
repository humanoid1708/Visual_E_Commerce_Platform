import { Link } from 'react-router-dom'
import styles from './NotFound.module.css'

export default function NotFound() {
  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.sub}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className={styles.actions}>
          <Link to="/" className={styles.homeBtn}>Go home</Link>
          <Link to="/products" className={styles.browseBtn}>Browse products</Link>
        </div>
      </div>
    </main>
  )
}
