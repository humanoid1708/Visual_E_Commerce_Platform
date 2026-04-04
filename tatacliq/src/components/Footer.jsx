import { Link } from 'react-router-dom'
import { useState } from 'react'
import styles from './Footer.module.css'

const LINKS = {
  'Shop': [
    { label: 'Women',   to: '/products?category=women'   },
    { label: 'Men',     to: '/products?category=men'     },
    { label: 'Kids',    to: '/products?category=kids'    },
    { label: 'Ethnic',  to: '/products?category=ethnic'  },
    { label: 'Sale',    to: '/products?category=sale'    },
  ],
  'Help': [
    { label: 'About',           to: '#' },
    { label: 'Shipping policy', to: '#' },
    { label: 'Return policy',   to: '#' },
    { label: 'Contact us',      to: '#' },
  ],
  'Account': [
    { label: 'Sign in',   to: '/auth'     },
    { label: 'Wishlist',  to: '/wishlist' },
    { label: 'Your bag',  to: '/cart'     },
  ],
}

export default function Footer() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleNewsletter = (e) => {
    e.preventDefault()
    if (email.trim()) { setSubmitted(true); setEmail('') }
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className="container">
          <div className={styles.grid}>

            {/* Brand col */}
            <div className={styles.brandCol}>
              <Link to="/" className={styles.logo}>
                Style<span>Vault</span>
              </Link>
              <p className={styles.tagline}>
                Fashion discovery for the modern wardrobe. Curated products from India's top brands.
              </p>
              <div className={styles.socials}>
                {['Instagram', 'Pinterest', 'Twitter'].map(s => (
                  <a key={s} href="#" className={styles.socialLink}>{s}</a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(LINKS).map(([heading, links]) => (
              <div key={heading} className={styles.linkCol}>
                <p className={styles.colHeading}>{heading}</p>
                {links.map(l => (
                  <Link key={l.label} to={l.to} className={styles.footerLink}>
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}

            {/* Newsletter */}
            <div className={styles.newsletterCol}>
              <p className={styles.colHeading}>Stay in the loop</p>
              <p className={styles.newsletterSub}>
                New arrivals, exclusive offers, and style inspiration — straight to your inbox.
              </p>
              {submitted ? (
                <p className={styles.thankYou}>Thank you for subscribing!</p>
              ) : (
                <form onSubmit={handleNewsletter} className={styles.newsletterForm}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={styles.newsletterInput}
                    required
                  />
                  <button type="submit" className={styles.newsletterBtn}>
                    Subscribe
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <div className={styles.bottomInner}>
            <p className={styles.copy}>
              © {new Date().getFullYear()} StyleVault. Built for MIT-WPU Deep Learning Mini Project.
            </p>
            <div className={styles.bottomLinks}>
              <a href="#" className={styles.bottomLink}>Privacy</a>
              <a href="#" className={styles.bottomLink}>Terms</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
