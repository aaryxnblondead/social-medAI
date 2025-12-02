const mongoose = require('mongoose');

const generatedPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brandProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrandProfile',
    required: true
  },
  trendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trend'
  },
  content: {
    type: String,
    required: true
  },
  imageUrl: String,
  imagePrompt: String,
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  platform: {
    type: String,
    enum: ['twitter', 'linkedin', 'instagram', 'all'],
    default: 'all'
  },
  scheduledFor: Date,
  publishedAt: Date,
  metrics: {
    likes: { type: Number, default: 0 },
    retweets: { type: Number, default: 0 },
    replies: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 }
  },
  performanceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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

module.exports = mongoose.model('GeneratedPost', generatedPostSchema);
