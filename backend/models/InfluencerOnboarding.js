const mongoose = require('mongoose');

const influencerOnboardingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    niches: {
      type: [String],
      required: true,
    },
    engagementRate: {
      type: Number,
      default: 0,
    },
    followerCounts: {
      type: Map,
      of: Number,
      default: {},
    },
    connectedPlatforms: {
      type: [String],
      required: true,
      enum: ['twitter', 'instagram', 'tiktok', 'youtube', 'linkedin'],
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    audienceDemographic: {
      type: String,
      required: true,
      enum: ['Gen Z (13-24)', 'Millennials (25-40)', 'Gen X (41-56)', 'Baby Boomers (57+)'],
    },
    collaborationTypes: {
      type: [String],
      default: [],
    },
    minCollaborationBudget: {
      type: Number,
      default: 0,
    },
    preferredContentTypes: {
      type: String,
      default: '',
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

module.exports = mongoose.model('InfluencerOnboarding', influencerOnboardingSchema);
