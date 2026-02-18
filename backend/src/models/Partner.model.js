import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const workingHoursDaySchema = new mongoose.Schema({
  isOpen: { type: Boolean, default: true },
  openTime: { type: String, default: '09:00' },
  closeTime: { type: String, default: '18:00' },
}, { _id: false });

const driverSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  driverLicenseUrl: { type: String },
  driverInsuranceUrl: { type: String },
}, { _id: true });

const partnerSchema = new mongoose.Schema(
  {
    // Account
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    // Business Info
    businessName: { type: String, required: true, trim: true },
    businessLicenseNumber: { type: String, trim: true },
    contactPersonName: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    location: { type: String, trim: true },

    // Status
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String },
    suspensionReason: { type: String },
    suspendedAt: { type: Date },
    approvedAt: { type: Date },
    appliedAt: { type: Date, default: Date.now },

    // Business Documents (file URLs)
    businessRegistrationUrl: { type: String },
    businessInsuranceUrl: { type: String },
    motorTradeInsuranceUrl: { type: String },

    // Business Details
    logo: { type: String },
    coverPhoto: { type: String },
    workPhotos: [{ type: String }],
    description: { type: String },
    serviceRadius: { type: Number, default: 10 },
    avatar: { type: String },

    // Working Hours
    workingHours: {
      monday: { type: workingHoursDaySchema, default: () => ({ isOpen: true, openTime: '09:00', closeTime: '18:00' }) },
      tuesday: { type: workingHoursDaySchema, default: () => ({ isOpen: true, openTime: '09:00', closeTime: '18:00' }) },
      wednesday: { type: workingHoursDaySchema, default: () => ({ isOpen: true, openTime: '09:00', closeTime: '18:00' }) },
      thursday: { type: workingHoursDaySchema, default: () => ({ isOpen: true, openTime: '09:00', closeTime: '18:00' }) },
      friday: { type: workingHoursDaySchema, default: () => ({ isOpen: true, openTime: '09:00', closeTime: '18:00' }) },
      saturday: { type: workingHoursDaySchema, default: () => ({ isOpen: true, openTime: '10:00', closeTime: '16:00' }) },
      sunday: { type: workingHoursDaySchema, default: () => ({ isOpen: false, openTime: '10:00', closeTime: '16:00' }) },
    },

    // Drivers (embedded during registration)
    drivers: [driverSchema],

    // Stats
    rating: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

partnerSchema.index({ email: 1 });
partnerSchema.index({ status: 1 });
partnerSchema.index({ businessName: 'text' });

partnerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

partnerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Partner = mongoose.model('Partner', partnerSchema);

export default Partner;
