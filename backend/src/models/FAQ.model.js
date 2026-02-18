import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: {
      type: String,
      enum: ['general', 'booking', 'payment', 'partner', 'account', 'other'],
      default: 'general',
      index: true,
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

faqSchema.index({ category: 1, order: 1 });

const FAQ = mongoose.model('FAQ', faqSchema);

export default FAQ;
