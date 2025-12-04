const mongoose = require('mongoose');

const brandOnboardingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    brandName: {
      type: String,
      required: true,
    },
    industry: {
      type: String,
      required: true,
      enum: [
        'Technology',
        'Fashion',
        'Finance',
        'Health & Wellness',
        'Education',
        'E-commerce',
        'Real Estate',
        'Food & Beverage',
        'Entertainment',
        'Other',
      ],
    },
    targetAudience: {
      type: String,
      required: true,
    },
    voiceTone: {
      type: String,
      required: true,
      enum: [
        'Professional',
        'Casual & Fun',
        'Inspiring',
        'Educational',
        'Trendy',
        'Humorous',
      ],
    },
    socialPlatforms: {
      type: [String],
      required: true,
      enum: ['Twitter', 'LinkedIn', 'Facebook', 'Instagram'],
    },
    websiteUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    mainGoal: {
      type: String,
      required: true,
      enum: ['awareness', 'engagement', 'sales', 'traffic'],
    },
    challenges: {
      type: [String],
      default: [],
    },
    monthlySocialBudget: {
      type: Number,
      default: 0,
    },
    isComplete: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BrandOnboarding', brandOnboardingSchema);
