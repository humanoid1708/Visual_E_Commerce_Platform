import 'dotenv/config'
import express from 'express'
import cors    from 'cors'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import productRoutes from './routes/products.js'

const app  = express()
const PORT = process.env.PORT || 5000
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Middleware
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001', process.env.FRONTEND_URL].filter(Boolean) }))
app.use(express.json())

// Serve images from data-pipeline
app.use('/images', express.static(path.join(__dirname, '../../data-pipeline/images')))

// Routes
app.use('/api/products', productRoutes)

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

// Connect to MongoDB then start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  })
  .catch(err => { console.error('MongoDB connection error:', err); process.exit(1) })
