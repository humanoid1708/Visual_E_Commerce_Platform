import mongoose from 'mongoose'

const wishlistSchema = new mongoose.Schema({
  uid:      { type: String, required: true, unique: true },  // Firebase UID
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true })

export default mongoose.model('Wishlist', wishlistSchema)
