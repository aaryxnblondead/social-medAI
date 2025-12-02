const mongoose = require('mongoose');

const brandProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brandName: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  targetAudience: {
    type: String,
    required: true
  },
  brandVoice: {
    type: String,
    enum: ['professional', 'casual', 'humorous', 'inspirational', 'educational'],
    default: 'professional'
  },
  keywords: {
    type: [String],
    default: []
  },
  twitterHandle: String,
  twitterId: String,
  linkedinHandle: String,
  instagramHandle: String,
  postsPerDay: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BrandProfile', brandProfileSchema);
