import express from 'express'
import Product from '../models/Product.js'

const router = express.Router()

// GET /api/products - Get products with optional filters
router.get('/', async (req, res) => {
  try {
    const { limit = 20, category, gender, brand, search, page = 1 } = req.query

    let query = {}
    if (category) query.category = category
    if (gender) query.gender = gender
    if (brand) query.brand = brand
    if (search) query.$text = { $search: search }

    const skip = (page - 1) * limit
    const products = await Product.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 })

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
    const product = await Product.findOne({ product_id: req.params.id })
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router