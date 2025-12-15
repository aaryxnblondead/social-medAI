import mongoose from 'mongoose';

const BrandSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, index: true, required: true },
  name: String,
  industry: String,
  colors: [String],
  tone: String,
  pillars: [String],
  audience: String,
  preferences: {
    frequency: Number,
    bestTimes: [String]
  }
}, { timestamps: true });

export const Brand = mongoose.model('Brand', BrandSchema);
