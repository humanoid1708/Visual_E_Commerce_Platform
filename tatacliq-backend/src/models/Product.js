import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  product_id:   { type: String, required: true, unique: true },
  product_name: { type: String, required: true },
  brand:        { type: String, index: true },
  gender:       { type: String, index: true },
  category:     { type: String, index: true },
  primary_color:{ type: String, index: true },
  price:        { type: Number, index: true },
  mrp:          { type: Number },
  description:  { type: String },
  image_url:    { type: String },
  ajio_url:     { type: String },
}, { timestamps: true })

// Text index for search
productSchema.index({ product_name: 'text', brand: 'text', description: 'text' })

export default mongoose.model('Product', productSchema)
