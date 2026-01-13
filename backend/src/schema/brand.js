import mongoose from 'mongoose';

const BrandSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, index: true, required: true },
  name: { type: String, required: true },
  industry: { type: String, default: 'technology' },
  persona: { type: String, enum: ['brand', 'influencer', 'agency'], default: 'brand' },
  objective: { type: String, default: 'Launch campaign' },
  colors: { type: [String], default: [] },
  tone: { type: String, default: 'professional' },
  pillars: { type: [String], default: [] },
  audience: { type: String, default: '' },
  preferences: {
    frequency: { type: Number, default: 0 },
    cadence: { type: Number, default: 0 },
    focus: { type: String, default: '' },
    bestTimes: { type: [String], default: [] }
  }
}, { timestamps: true });

export const Brand = mongoose.model('Brand', BrandSchema);
