const mongoose = require('mongoose');

const metaAdsCampaignSchema = new mongoose.Schema({
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
  metaCampaignId: String,
  metaAdSetId: String,
  metaAdId: String,
  
  // Campaign settings
  objective: {
    type: String,
    enum: ['AWARENESS', 'TRAFFIC', 'CONVERSIONS', 'ENGAGEMENT'],
    default: 'ENGAGEMENT'
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
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'paused', 'completed', 'failed'],
    default: 'draft'
  },
  
  // Targeting
  targetAudience: {
    ageMin: { type: Number, default: 18 },
    ageMax: { type: Number, default: 65 },
    genders: { type: [String], default: ['MALE', 'FEMALE'] },
    interests: [String],
    countries: [String]
  },
  
  // Content
  adContent: {
    headline: String,
    description: String,
    imageUrl: String,
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
    conversionRate: { type: Number, default: 0 }
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

module.exports = mongoose.model('MetaAdsCampaign', metaAdsCampaignSchema);
