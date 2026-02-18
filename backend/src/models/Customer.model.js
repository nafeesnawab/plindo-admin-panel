import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  make: { type: String },
  model: { type: String },
  year: { type: Number },
  color: { type: String },
  plateNumber: { type: String },
  type: { type: String, enum: ['compact', 'sedan', 'suv', 'van', 'luxury'] },
}, { _id: true });

const paymentMethodSchema = new mongoose.Schema({
  type: { type: String },
  last4: { type: String },
  expiryDate: { type: String },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    location: { type: String, trim: true },

    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      index: true,
    },
    suspensionReason: { type: String },
    suspendedAt: { type: Date },

    vehicles: [vehicleSchema],
    paymentMethods: [paymentMethodSchema],

    // Subscription
    subscriptionTier: { type: String, enum: ['none', 'basic', 'premium'], default: 'none' },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    subscriptionAutoRenew: { type: Boolean, default: false },

    // Stats
    totalBookings: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

customerSchema.index({ email: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ name: 'text', email: 'text' });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
