import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
}, { _id: false });

const productOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    bookingRef: { type: String },
    serviceName: { type: String },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String },
    customerPhone: { type: String },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
    products: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'ready', 'collected', 'cancelled'],
      default: 'pending',
    },
    orderDate: { type: Date, default: Date.now },
    pickupDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

productOrderSchema.index({ partnerId: 1, status: 1 });

const ProductOrder = mongoose.model('ProductOrder', productOrderSchema);

export default ProductOrder;
