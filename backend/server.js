require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const redis = require('redis');

// Import models
const { 
  User, 
  BrandProfile, 
  Trend, 
  GeneratedPost,
  MetaAdsCampaign,
  GoogleAdsCampaign,
  AdsConfig 
} = require('./models');

// Import services
const metaAdsService = require('./services/meta-ads-service');
const googleAdsService = require('./services/google-ads-service');
const adsConfigService = require('./services/ads-config-service');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes mounted (/api/auth)');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'connected',
      redis: 'connected',
      ads: 'ready'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    console.log('✅ User model loaded');
    console.log('✅ BrandProfile model loaded');
    console.log('✅ Trend model loaded');
    console.log('✅ GeneratedPost model loaded');
    console.log('✅ MetaAdsCampaign model loaded');
    console.log('✅ GoogleAdsCampaign model loaded');
    console.log('✅ AdsConfig model loaded');
  })
  .catch(err => console.error('❌ MongoDB error:', err.message));

// Connect to Redis
const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect()
  .then(() => console.log('✅ Redis connected'))
  .catch(err => console.error('❌ Redis error:', err.message));

// Initialize services
console.log('✅ MetaAdsService initialized');
console.log('✅ GoogleAdsService initialized');
console.log('✅ AdsConfigService initialized');

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`�� Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log('Registered top-level paths:', app._router.stack.filter(r => r.route).map(r => r.route.path));
  console.log(`\n🎯 Bigness Backend Ready!\n`);
});

module.exports = app;
