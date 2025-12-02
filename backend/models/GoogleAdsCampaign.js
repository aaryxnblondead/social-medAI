const mongoose = require('mongoose');

const googleAdsCampaignSchema = new mongoose.Schema({
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
  generatedPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneratedPost'
  },
  campaignName: {
    type: String,
    required: true
  },
  googleCampaignId: String,
  googleAdGroupId: String,
  googleAdId: String,
  
  // Campaign settings
  campaignType: {
    type: String,
    enum: ['SEARCH', 'DISPLAY', 'SHOPPING', 'VIDEO'],
    default: 'SEARCH'
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  dailyBudget: {
    type: Number,
    required: true,
    min: 0
  },
  bidStrategy: {
    type: String,
    enum: ['MANUAL_CPC', 'ENHANCED_CPC', 'TARGET_CPA', 'MAXIMIZE_CLICKS'],
    default: 'MANUAL_CPC'
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'paused', 'completed', 'failed'],
    default: 'draft'
  },
  
  // Targeting
  keywords: [String],
  excludedKeywords: [String],
  targetAudience: {
    ageRanges: [String],
    genders: [String],
    interests: [String],
    locations: [String]
  },
  
  // Content
  adContent: {
    headline1: String,
    headline2: String,
    headline3: String,
    description1: String,
    description2: String,
    displayUrl: String,
    finalUrl: String,
    callToAction: String
  },
  
  // Performance metrics
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    averagePosition: { type: Number, default: 0 }
  },
  
  // Schedule
  startDate: Date,
  endDate: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('GoogleAdsCampaign', googleAdsCampaignSchema);
