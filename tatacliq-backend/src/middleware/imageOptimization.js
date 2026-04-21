import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { optimizeImage, IMAGE_SIZES } from '../utils/imageOptimizer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Middleware to serve optimized images
 * Query params: src (image path), size (thumbnail|small|medium|large), format (webp|jpeg|png)
 */
export async function serveOptimizedImage(req, res) {
  try {
    const { src, size = 'medium', format = 'webp' } = req.query

    if (!src) {
      return res.status(400).json({ error: 'Missing src parameter' })
    }

    // Validate size
    if (!IMAGE_SIZES[size]) {
      return res.status(400).json({ error: 'Invalid size parameter' })
    }

    // Validate format
    if (!['webp', 'jpeg', 'png'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format parameter' })
    }

    // Handle different source types
    let imagePath
    
    if (src.startsWith('/images/')) {
      // Local image from data-pipeline - strip leading slash and join properly
      const relativeSrc = src.slice(1) // Remove leading /
      imagePath = path.join(__dirname, '../../', relativeSrc)
    } else if (src.startsWith('http')) {
      // Remote image - would need to download first
      // For now, return error
      return res.status(400).json({ error: 'Remote images not yet supported for optimization' })
    } else if (src.startsWith('data-pipeline/')) {
      // Already relative to data-pipeline
      imagePath = path.join(__dirname, '../../', src)
    } else {
      // Relative path from project root
      imagePath = path.join(__dirname, '../../', src)
    }

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(imagePath)
    const baseDir = path.normalize(path.join(__dirname, '../../'))
    if (!normalizedPath.startsWith(baseDir)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ error: 'Image not found' })
    }

    // Optimize and serve
    try {
      const optimizedPath = await optimizeImage(normalizedPath, size, format)
      
      // Set caching headers
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable') // 1 year
      res.setHeader('Content-Type', format === 'webp' ? 'image/webp' : `image/${format}`)
      
      // Send the file
      return res.sendFile(optimizedPath)
    } catch (optimizeError) {
      // Fallback to original image if optimization fails
      console.warn('Optimization failed, serving original image:', optimizeError.message)
      
      res.setHeader('Cache-Control', 'public, max-age=604800') // 1 week
      res.setHeader('Content-Type', 'image/jpeg')
      
      return res.sendFile(normalizedPath)
    }
  } catch (error) {
    console.error('Error serving optimized image:', error)
    res.status(500).json({ error: 'Failed to serve image' })
  }
}

export default { serveOptimizedImage }
