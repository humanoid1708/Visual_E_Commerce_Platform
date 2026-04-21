import { useState, useRef } from 'react'
import axios from 'axios'
import ProductCard from '../components/ProductCard'
import styles from './VisualSearch.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function VisualSearch() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (file) => {
    if (!file.type.match('image.*')) {
      setError('Please select a valid image file (jpeg, png).')
      return
    }
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setError('')
    setResults([])
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleSearch = async () => {
    if (!image) return

    setLoading(true)
    setError('')
    
    const formData = new FormData()
    formData.append('image', image)

    try {
      const res = await axios.post(`${API}/products/search-by-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (res.data.length === 0) {
        setError('No similar items found in our catalog.')
      } else {
        setResults(res.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process image. Deep Learning engine might be down.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className="container">
        
        <div className={styles.header}>
          <h1 className={styles.title}>Visual Search</h1>
          <p className={styles.subtitle}>Upload a photo to find visually similar styles in our catalog</p>
        </div>

        {!preview && (
          <div 
            className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
            <div className={styles.dropZoneContent}>
              <UploadIcon />
              <h3>Drag &amp; Drop an image here</h3>
              <p>or click to browse your files</p>
            </div>
          </div>
        )}

        {preview && (
          <div className={styles.previewContainer}>
            <div className={styles.previewImageWrapper}>
              <img src={preview} alt="Upload preview" className={styles.previewImage} />
              
              {loading && (
                <div className={styles.scannerOverlay}>
                  <div className={styles.scannerLine}></div>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              {!loading && (
                <>
                  <button 
                    className={styles.resetBtn} 
                    onClick={() => { setPreview(null); setImage(null); setResults([]); }}
                  >
                    Try another image
                  </button>
                  <button 
                    className={styles.searchBtn} 
                    onClick={handleSearch}
                  >
                    ✨ Find Similar Styles
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Initializing AI Model &amp; Scanning Dataset... This usually takes 5-10 seconds.</p>
          </div>
        )}

        {error && (
          <div className={styles.errorAlert}>
            {error}
          </div>
        )}

        {results.length > 0 && !loading && (
          <div className={styles.resultsSection}>
            <h2 className={styles.resultsTitle}>Found {results.length} Similar Styles</h2>
            <div className={styles.resultsGrid}>
              {results.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16 }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
)
