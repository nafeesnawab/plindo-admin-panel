import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      enum: ['oil_fluids', 'tires_wheels', 'cleaning', 'accessories', 'parts', 'other'],
      required: true,
    },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    imageUrl: { type: String },
    status: {
      type: String,
      enum: ['available', 'unavailable', 'out_of_stock'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ partnerId: 1, status: 1 });
productSchema.index({ name: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
