import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Image sizes for different breakpoints
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 200, label: '150w' },
  small: { width: 300, height: 400, label: '300w' },
  medium: { width: 500, height: 667, label: '500w' },
  large: { width: 800, height: 1067, label: '800w' }
}

// Optimized cache directory
const cacheDir = path.join(__dirname, '../../image-cache')

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true })
}

/**
 * Generate a cache key for an image variant
 */
export function getCacheKey(imagePath, size, format) {
  const hash = crypto
    .createHash('md5')
    .update(`${imagePath}-${size}-${format}`)
    .digest('hex')
  return hash
}

/**
 * Optimize image to a specific size and format
 */
export async function optimizeImage(inputPath, size, format = 'webp') {
  try {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Image file not found: ${inputPath}`)
    }

    const { width, height } = IMAGE_SIZES[size] || IMAGE_SIZES.medium
    const cacheKey = getCacheKey(inputPath, size, format)
    const cachePath = path.join(cacheDir, `${cacheKey}.${format}`)

    // Return cached image if it exists
    if (fs.existsSync(cachePath)) {
      return cachePath
    }

    // Optimize and cache
    let pipeline = sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true
      })

    if (format === 'webp') {
      pipeline = pipeline.webp({ quality: 85 })
    } else if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: 85, progressive: true })
    } else if (format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 9 })
    }

    await pipeline.toFile(cachePath)
    return cachePath
  } catch (error) {
    console.error('Image optimization error:', error)
    throw error
  }
}

/**
 * Batch optimize image for all sizes
 */
export async function optimizeImageAllSizes(inputPath, formats = ['webp', 'jpeg']) {
  const results = {}
  
  for (const [sizeKey, sizeConfig] of Object.entries(IMAGE_SIZES)) {
    results[sizeKey] = {}
    
    for (const format of formats) {
      try {
        const optimizedPath = await optimizeImage(inputPath, sizeKey, format)
        const relativePath = path.relative(path.join(__dirname, '../../'), optimizedPath)
        results[sizeKey][format] = relativePath
      } catch (error) {
        console.error(`Failed to optimize ${sizeKey} ${format}:`, error.message)
      }
    }
  }
  
  return results
}

/**
 * Get responsive image URLs for a given image path
 * Returns srcset-compatible string
 */
export function getResponsiveImageUrls(baseUrl) {
  // Assuming baseUrl is the original image path
  const urls = []
  
  for (const [sizeKey, sizeConfig] of Object.entries(IMAGE_SIZES)) {
    urls.push(`/api/images/optimized?src=${encodeURIComponent(baseUrl)}&size=${sizeKey}&format=webp ${sizeConfig.label}`)
  }
  
  return urls.join(', ')
}

/**
 * Get optimized image with fallback
 */
export async function getOptimizedImagePath(inputPath, size, format) {
  try {
    return await optimizeImage(inputPath, size, format)
  } catch (error) {
    // Return original if optimization fails
    console.warn(`Optimization failed, returning original: ${error.message}`)
    return inputPath
  }
}

export default {
  optimizeImage,
  optimizeImageAllSizes,
  getResponsiveImageUrls,
  getOptimizedImagePath,
  IMAGE_SIZES,
  getCacheKey
}
