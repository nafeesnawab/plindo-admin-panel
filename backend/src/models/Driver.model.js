import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    licenseNumber: { type: String, trim: true },
    licenseUrl: { type: String },
    licenseExpiry: { type: String },
    insuranceUrl: { type: String },
    insuranceExpiry: { type: String },
    photoUrl: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

driverSchema.index({ partnerId: 1, status: 1 });

const Driver = mongoose.model('Driver', driverSchema);

export default Driver;
