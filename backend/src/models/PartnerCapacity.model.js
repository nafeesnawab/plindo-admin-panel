import mongoose from 'mongoose';

const baySchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  serviceCategory: { type: String, enum: ['wash', 'detailing', 'other'], required: true },
  isActive: { type: Boolean, default: true },
}, { _id: false });

const partnerCapacitySchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
      unique: true,
      index: true,
    },
    bays: [baySchema],
    capacityByCategory: {
      wash: { type: Number, default: 3 },
      detailing: { type: Number, default: 1 },
      other: { type: Number, default: 0 },
    },
    bufferTimeMinutes: { type: Number, default: 15 },
  },
  { timestamps: true }
);

const PartnerCapacity = mongoose.model('PartnerCapacity', partnerCapacitySchema);

export default PartnerCapacity;
