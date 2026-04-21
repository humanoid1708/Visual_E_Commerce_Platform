import express from 'express'
import Product from '../models/Product.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import { spawn } from 'child_process'
import sharp from 'sharp'

const router = express.Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set up multer for image uploads
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})
const upload = multer({ storage })

// GET /api/products - Get products with optional filters
router.get('/', async (req, res) => {
  try {
    const { limit = 20, category, gender, brand, q, color, price_min, price_max, sort = 'newest', page = 1 } = req.query

    let query = {}
    
    // Handle category/gender - match case-insensitively against the gender field
    if (category) {
      query.gender = { $regex: category, $options: 'i' }
    }
    if (gender) {
      query.gender = { $regex: gender, $options: 'i' }
    }
    
    if (brand) query.brand = brand
    if (q) query.$text = { $search: q }
    if (color) query.primary_color = color

    // Price range filter
    if (price_min || price_max) {
      query.price = {}
      if (price_min) query.price.$gte = parseInt(price_min)
      if (price_max) query.price.$lte = parseInt(price_max)
    }

    // Sorting
    let sortObj = { createdAt: -1 } // default: newest
    if (sort === 'price_asc') sortObj = { price: 1 }
    else if (sort === 'price_desc') sortObj = { price: -1 }
    else if (sort === 'discount') sortObj = { mrp: -1, price: 1 } // high MRP, low price = high discount

    const skip = (page - 1) * limit
    const products = await Product.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .sort(sortObj)

    const total = await Product.countDocuments(query)

    res.json({
      products,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    let product = await Product.findOne({ product_id: id })
    if (!product) {
      product = await Product.findById(id)
    }
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/products/:id/similar - Get similar products using DL JSON map
router.get('/:id/similar', async (req, res) => {
  try {
    const { id } = req.params
    
    // Load similarities map
    const simPath = path.join(__dirname, '../data/similarities.json')
    if (!fs.existsSync(simPath)) {
       return res.json([]) // Return empty if not generated yet
    }
    
    const dbData = JSON.parse(fs.readFileSync(simPath, 'utf8'))
    const similarIds = dbData[String(id)] || []
    
    if (similarIds.length === 0) return res.json([])
    
    // Fetch products from DB
    const similarProducts = await Product.find({ product_id: { $in: similarIds } })
    
    // Sort them so they maintain the ranked order from the DL model
    similarProducts.sort((a, b) => similarIds.indexOf(a.product_id) - similarIds.indexOf(b.product_id))
    
    res.json(similarProducts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/products/search-by-image - Visual Search
router.post('/search-by-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' })
    }

    const uploadedImagePath = req.file.path
    
    // Optimize image for better DL model performance
    // Resize to standard size and enhance contrast
    const optimizedImagePath = path.join(path.dirname(uploadedImagePath), `optimized-${Date.now()}.jpg`)
    try {
      await sharp(uploadedImagePath)
        .resize(800, 1067, { fit: 'inside', withoutEnlargement: true })
        .normalize() // Enhance contrast and brightness
        .jpeg({ quality: 90, progressive: true })
        .toFile(optimizedImagePath)
    } catch (optimizeErr) {
      console.warn('Image optimization failed, using original:', optimizeErr.message)
    }

    // Use optimized image if available, otherwise use original
    const imageToProcess = fs.existsSync(optimizedImagePath) ? optimizedImagePath : uploadedImagePath
    
    // Path to the DL project directory
    const dlProjectDir = 'D:\\Downloads\\fsd_project\\SimilarityMeasureUsingCLIP-main\\SimilarityMeasureUsingCLIP-main'
    const pythonExe = fs.existsSync(path.join(dlProjectDir, 'venv', 'Scripts', 'python.exe'))
       ? path.join(dlProjectDir, 'venv', 'Scripts', 'python.exe')
       : 'python' // fallback
    const scriptPath = 'query_similar.py'

    const pythonProcess = spawn(pythonExe, [
      scriptPath,
      '--query', imageToProcess,
      '--topk', '10'
    ], {
      cwd: dlProjectDir,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    })

    let stdoutData = ''
    let stderrData = ''

    pythonProcess.stdout.on('data', (data) => { stdoutData += data.toString() })
    pythonProcess.stderr.on('data', (data) => { stderrData += data.toString() })

    pythonProcess.on('close', async (code) => {
      // Clean up temp images
      fs.unlink(uploadedImagePath, (err) => {
        if (err) console.error("Failed to delete temp image", err)
      })
      if (fs.existsSync(optimizedImagePath)) {
        fs.unlink(optimizedImagePath, (err) => {
          if (err) console.error("Failed to delete optimized image", err)
        })
      }

      if (code !== 0) {
        console.error("Python script error:", stderrData)
        return res.status(500).json({ error: 'Deep Learning model failed to parse image.' })
      }

      // Parse p_id lines
      const p_ids = []
      const regex = /p_id=(\d+)/g
      let match
      while ((match = regex.exec(stdoutData)) !== null) {
        if (!p_ids.includes(match[1])) {
           p_ids.push(match[1])
        }
      }

      if (p_ids.length === 0) {
        return res.json([])
      }

      const similarProducts = await Product.find({ product_id: { $in: p_ids } })
      similarProducts.sort((a, b) => p_ids.indexOf(String(a.product_id)) - p_ids.indexOf(String(b.product_id)))

      res.json(similarProducts)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router