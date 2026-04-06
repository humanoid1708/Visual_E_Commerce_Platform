import express from 'express'
import Product from '../models/Product.js'

const router = express.Router()

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

export default router