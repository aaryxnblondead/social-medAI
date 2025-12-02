const mongoose = require('mongoose');

const adsConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Meta/Facebook Ads
  meta: {
    isConnected: { type: Boolean, default: false },
    accessToken: String,
    businessAccountId: String,
    adAccountId: String,
    connectedAt: Date
  },
  
  // Google Ads
  google: {
    isConnected: { type: Boolean, default: false },
    accessToken: String,
    refreshToken: String,
    customerId: String,
    developerToken: String,
    connectedAt: Date
  },
  
  // Default settings
  defaults: {
    defaultBudgetPerCampaign: { type: Number, default: 100 },
    defaultDailyBudget: { type: Number, default: 10 },
    autoOptimize: { type: Boolean, default: true },
    bidStrategy: { type: String, default: 'MANUAL_CPC' }
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

module.exports = mongoose.model('AdsConfig', adsConfigSchema);
