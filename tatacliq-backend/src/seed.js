/**
 * Seed script — run once to load your CSV into MongoDB
 * Usage: node src/seed.js
 * Place products_clean.csv in the same folder as this file, or adjust CSV_PATH below
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Product from './models/Product.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_PATH  = path.join(__dirname, '../../data-pipeline/products_clean.csv')

function parseCSV(filePath) {
  const raw   = fs.readFileSync(filePath, 'utf8')
  const lines = raw.trim().split('\n')
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

  const rows = parseCSV(CSV_PATH)
  console.log(`Parsed ${rows.length} rows from CSV`)

  let inserted = 0, skipped = 0, errors = 0

  for (const row of rows) {
    try {
      await Product.updateOne(
        { product_id: row.product_id },
        {
          $set: {
            product_id:    row.product_id,
            product_name:  row.product_name,
            brand:         row.brand || '',
            gender:        row.gender || '',
            category:      row.category || '',
            primary_color: row.primary_color || '',
            price:         Number(row.price) || 0,
            mrp:           Number(row.mrp)   || 0,
            description:   row.description   || '',
            image_url:     row.image_url      || '',
            ajio_url:      row.ajio_url       || '',
          }
        },
        { upsert: true }
      )
      inserted++
    } catch (e) {
      if (e.code === 11000) skipped++
      else { console.error('Error:', e.message); errors++ }
    }
  }

  console.log(`\nSeed complete`)
  console.log(`  Inserted/updated : ${inserted}`)
  console.log(`  Skipped (dup)    : ${skipped}`)
  console.log(`  Errors           : ${errors}`)
  await mongoose.disconnect()
}

seed().catch(console.error)
