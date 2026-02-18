import mongoose from 'mongoose';

const serviceStepSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'skipped'], default: 'pending' },
  startedAt: { type: Date },
  completedAt: { type: Date },
  order: { type: Number, required: true },
}, { _id: true });

const bookingPricingSchema = new mongoose.Schema({
  basePrice: { type: Number, required: true },
  isCustomPrice: { type: Boolean, default: false },
  bodyTypeDefault: { type: Number },
  finalPrice: { type: Number, required: true },
  platformFee: { type: Number, default: 0 },
  partnerPayout: { type: Number, default: 0 },
  distanceCharge: { type: Number },
  discountApplied: { type: Number },
  subscriptionDiscount: { type: Number },
}, { _id: false });

const vehicleInfoSchema = new mongoose.Schema({
  make: { type: String },
  model: { type: String },
  year: { type: Number },
  color: { type: String },
  plateNumber: { type: String },
  type: { type: String, enum: ['compact', 'sedan', 'suv', 'van', 'luxury'] },
}, { _id: false });

const productOrderSchema = new mongoose.Schema({
  orderNumber: { type: String },
  productCount: { type: Number },
  totalAmount: { type: Number },
}, { _id: false });

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },

    // References
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerName: { type: String },
    customerEmail: { type: String },
    customerPhone: { type: String },
    customerAvatar: { type: String },

    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
    partnerBusinessName: { type: String },
    partnerOwnerName: { type: String },
    partnerPhone: { type: String },
    partnerLocation: { type: String },
    partnerAddress: { type: String },
    partnerRating: { type: Number },

    // Vehicle (embedded)
    vehicle: vehicleInfoSchema,

    // Service info (embedded)
    serviceId: { type: String },
    serviceName: { type: String, required: true },
    serviceType: { type: String, enum: ['book_me', 'pick_by_me', 'washing_van'] },
    serviceCategory: { type: String, enum: ['wash', 'detailing', 'other'], index: true },
    serviceDuration: { type: Number },

    // Slot
    slotDate: { type: String, required: true, index: true },
    slotStartTime: { type: String, required: true },
    slotEndTime: { type: String, required: true },

    // Pricing
    pricing: bookingPricingSchema,

    // Status
    status: {
      type: String,
      enum: ['booked', 'in_progress', 'completed', 'picked', 'out_for_delivery', 'delivered', 'cancelled', 'rescheduled'],
      default: 'booked',
      index: true,
    },

    // Service steps
    serviceSteps: [serviceStepSchema],

    // Bay assignment
    bayId: { type: String },
    bayName: { type: String },

    // Product order (embedded summary)
    productOrder: productOrderSchema,

    // Cancellation
    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ['customer', 'partner'] },
    cancellationReason: { type: String },

    // Reschedule
    rescheduledFromDate: { type: String },
    rescheduledFromStartTime: { type: String },
    rescheduledFromEndTime: { type: String },
    rescheduledAt: { type: Date },
    rescheduledBy: { type: String, enum: ['customer', 'partner'] },

    // Service progress
    startedAt: { type: Date },
    completedAt: { type: Date },

    // Rating
    ratingScore: { type: Number },
    ratingComment: { type: String },
    ratingCreatedAt: { type: Date },

    // Dispute
    isDisputed: { type: Boolean, default: false },
    disputeReason: { type: String },
    disputeStatus: { type: String, enum: ['open', 'resolved', 'dismissed'] },
    disputeResolvedAt: { type: Date },
    disputeResolution: { type: String },

    // Refund
    isRefunded: { type: Boolean, default: false },
    refundAmount: { type: Number },
    refundedAt: { type: Date },

    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ partnerId: 1, slotDate: 1 });
bookingSchema.index({ customerId: 1, slotDate: 1 });
bookingSchema.index({ bookingNumber: 'text', customerName: 'text', partnerBusinessName: 'text' });

/**
 * Generate a unique booking number: BK-YYYYMM-XXXXXX
 */
bookingSchema.statics.generateBookingNumber = function () {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${dateStr}-${random}`;
};

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
