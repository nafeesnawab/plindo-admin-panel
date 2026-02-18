import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerName: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    service: { type: String },
    partnerResponse: {
      text: { type: String },
      date: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ partnerId: 1, rating: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
