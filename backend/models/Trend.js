const mongoose = require('mongoose');

const trendSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  source: {
    type: String,
    enum: ['twitter', 'news', 'newsapi', 'reddit', 'trends'],
    required: true
  },
  category: {
    type: String,
    default: 'general'
  },
  trendingScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  hashtags: {
    type: [String],
    default: []
  },
  url: String,
  sourceData: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 24*60*60*1000) // 24 hours
  }
});

// TTL index to auto-delete old trends
trendSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Trend', trendSchema);
