import mongoose from 'mongoose';

const bodyTypePricingSchema = new mongoose.Schema({
  bodyType: { type: String, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const carOverrideSchema = new mongoose.Schema({
  carId: { type: String },
  make: { type: String },
  model: { type: String },
  bodyType: { type: String },
  price: { type: Number, required: true },
}, { _id: false });

const distanceChargesSchema = new mongoose.Schema({
  '0-1km': { type: Number, default: 0 },
  '1-2km': { type: Number, default: 0 },
  '2-3km': { type: Number, default: 0 },
}, { _id: false });

const serviceSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    serviceCategory: { type: String, enum: ['wash', 'detailing', 'other'], required: true },
    serviceType: { type: String, enum: ['book_me', 'pick_by_me', 'washing_van'], required: true },
    duration: { type: Number, required: true },
    bannerUrl: { type: String },
    bodyTypePricing: [bodyTypePricingSchema],
    carOverrides: [carOverrideSchema],
    distanceCharges: distanceChargesSchema,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  {
    timestamps: true,
  }
);

serviceSchema.index({ partnerId: 1, status: 1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;
