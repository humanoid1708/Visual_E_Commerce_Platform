import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Product from './models/Product.js'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const CSV_PATH   = path.join(__dirname, '../../data-pipeline/products_clean.csv')
const IMAGES_DIR = path.join(__dirname, '../../data-pipeline/images')
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000'

function parseCSV(filePath) {
  const raw     = fs.readFileSync(filePath, 'utf8')
  const lines   = raw.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

  return lines.slice(1).map(line => {
    const values = []
    let cur = '', inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = '' }
      else cur += ch
    }
    values.push(cur.trim())
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']))
  })
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB connected')

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`products_clean.csv not found at ${CSV_PATH}`)
    console.error('Run phase1_kaggle_setup.py first.')
    process.exit(1)
  }

  const rows = parseCSV(CSV_PATH)
  console.log(`Parsed ${rows.length} rows from CSV`)

  const localImages = fs.existsSync(IMAGES_DIR)
    ? new Set(fs.readdirSync(IMAGES_DIR).map(f => f.replace('.jpg', '')))
    : new Set()
  console.log(`Local images available: ${localImages.size}`)

  let inserted = 0, skipped = 0, errors = 0

  for (const row of rows) {
    try {
      const pid = row.product_id

      // Build image URL — use local if copied, otherwise no image
      let imageUrl = ''
      if (localImages.has(pid)) {
        imageUrl = `${SERVER_URL}/images/${pid}.jpg`
      } else if (row.image_url && row.image_url.startsWith('http')) {
        // CDN URL fallback
        imageUrl = row.image_url
      }

      await Product.updateOne(
        { product_id: pid },
        {
          $set: {
            product_id:    pid,
            product_name:  row.product_name  || '',
            brand:         row.brand         || '',
            gender:        row.gender        || 'Unisex',
            category:      row.category      || '',
            primary_color: row.primary_color || '',
            price:         Number(row.price) || 999,
            mrp:           Number(row.mrp)   || 1499,
            rating:        Number(row.rating)|| 0,
            description:   row.description   || '',
            image_url:     imageUrl,
            ajio_url:      row.ajio_url      || '',
          }
        },
        { upsert: true }
      )
      inserted++
    } catch (e) {
      if (e.code === 11000) skipped++
      else { console.error('Error:', row.product_id, e.message); errors++ }
    }
  }

  console.log(`\nSeed complete`)
  console.log(`  Inserted/updated : ${inserted}`)
  console.log(`  Skipped (dup)    : ${skipped}`)
  console.log(`  Errors           : ${errors}`)
  await mongoose.disconnect()
}

seed().catch(console.error)
