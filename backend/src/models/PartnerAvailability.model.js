import mongoose from 'mongoose';

const timeBlockSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, required: true },
}, { _id: false });

const dayAvailabilitySchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  dayName: { type: String, required: true },
  isEnabled: { type: Boolean, default: true },
  timeBlocks: [timeBlockSchema],
}, { _id: false });

const partnerAvailabilitySchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
      unique: true,
      index: true,
    },
    schedule: [dayAvailabilitySchema],
    bufferTimeMinutes: { type: Number, default: 15 },
    maxAdvanceBookingDays: { type: Number, default: 14 },
  },
  { timestamps: true }
);

const PartnerAvailability = mongoose.model('PartnerAvailability', partnerAvailabilitySchema);

export default PartnerAvailability;
