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

  // Content
  copy: {
    type: String,
    required: true
  },
  imageUrl: String,
  imagePublicId: String,
  videoUrl: String,

  // Multi-platform posting
  platforms: [
    {
      name: {
        type: String,
        enum: ['twitter', 'linkedin', 'facebook', 'instagram'],
        required: true
      },
      status: {
        type: String,
        enum: ['draft', 'scheduled', 'published', 'failed'],
        default: 'draft'
      },
      postId: String,  // Platform-specific post ID
      url: String,     // Platform-specific URL
      scheduledAt: Date,
      publishedAt: Date,
      metrics: {
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 }
      },
      lastSyncedAt: Date
    }
  ],

  // Overall post status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed', 'archived'],
    default: 'draft'
  },

  // Legacy: single platform (for backward compatibility)
  platform: {
    type: String,
    enum: ['twitter', 'linkedin', 'facebook', 'instagram'],
    default: 'twitter'
  },

  // Aggregated metrics across all platforms
  metrics: {
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    totalEngagement: { type: Number, default: 0 }
  },

  // Performance
  performanceScore: { type: Number, default: 0 },
  viralityScore: { type: Number, default: 0 },

  // Timing
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: Date,
  scheduledAt: Date,

  // Legacy fields (kept for backward compatibility)
  twitterPostId: String,
  twitterUrl: String
});

// Index for faster queries
generatedPostSchema.index({ userId: 1, status: 1 });
generatedPostSchema.index({ userId: 1, 'platforms.name': 1 });
generatedPostSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('GeneratedPost', generatedPostSchema);
