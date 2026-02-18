import mongoose from 'mongoose';

const legalContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['terms', 'privacy', 'refund', 'about'],
      required: true,
      index: true,
    },
    content: { type: String, default: '' },
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    publishedBy: { type: String },
    publishedAt: { type: Date, default: Date.now },

    // About-specific fields
    companyName: { type: String },
    tagline: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    socialLinks: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      linkedin: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

legalContentSchema.index({ type: 1, version: -1 });

const LegalContent = mongoose.model('LegalContent', legalContentSchema);

export default LegalContent;
