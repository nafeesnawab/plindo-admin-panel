import mongoose from 'mongoose';

const carSchema = new mongoose.Schema(
  {
    make: { type: String, required: true, trim: true, index: true },
    model: { type: String, required: true, trim: true },
    bodyType: {
      type: String,
      required: true,
      enum: [
        'Hatchback', 'Sedan', 'SUV', 'Coupe', 'Convertible',
        'Van', 'Pickup Truck', 'MPV/Minivan', 'Station Wagon', 'Crossover',
      ],
    },
  },
  {
    timestamps: true,
  }
);

carSchema.index({ make: 1, model: 1 });
carSchema.index({ bodyType: 1 });
carSchema.index({ make: 'text', model: 'text' });

const Car = mongoose.model('Car', carSchema);

export default Car;
