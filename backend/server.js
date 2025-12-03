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
const trendDetector = require('./services/trend-detector');

// Import routes
const authRoutes = require('./routes/auth');
const brandRoutes = require('./routes/brands');
const trendRoutes = require('./routes/trends');

// Import middleware
const { verifyToken } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'connected',
      redis: 'connected',
      ads: 'ready',
      trends: 'ready'
    }
  });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Brand routes (protected)
app.use('/api/brands', brandRoutes);

// Trend routes (mostly public)
app.use('/api/trends', trendRoutes);

// Protected routes example
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({
    message: 'This is a protected endpoint',
    userId: req.userId,
    user: req.user
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
console.log('✅ TrendDetectorService initialized');

// Mount routes
console.log('✅ Auth routes mounted (/api/auth)');
console.log('✅ Brand routes mounted (/api/brands)');
console.log('✅ Trend routes mounted (/api/trends)');

// Start automatic trend detection every 30 minutes
setInterval(async () => {
  console.log('⏰ Running scheduled trend detection...');
  await trendDetector.detectAndSaveTrends();
}, 30 * 60 * 1000);

// Optional: Run on startup
setTimeout(async () => {
  console.log('⏰ Running initial trend detection...');
  await trendDetector.detectAndSaveTrends();
}, 2000);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`\n🔐 Authentication Endpoints:`);
  console.log(`   POST   /api/auth/register`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me (protected)`);
  console.log(`   POST   /api/auth/logout (protected)`);
  console.log(`\n📱 Brand Profile Endpoints (all protected):`);
  console.log(`   POST   /api/brands - Create brand`);
  console.log(`   GET    /api/brands - List all brands`);
  console.log(`   GET    /api/brands/:id - Get single brand`);
  console.log(`   PUT    /api/brands/:id - Update brand`);
  console.log(`   DELETE /api/brands/:id - Delete brand`);
  console.log(`\n📰 Trend Detection Endpoints (mostly public):`);
  console.log(`   GET    /api/trends - Get all trending topics`);
  console.log(`   GET    /api/trends/source/:source - Get trends by source`);
  console.log(`   GET    /api/trends/search/:query - Search trends`);
  console.log(`   POST   /api/trends/refresh - Manually refresh trends (protected)`);
  console.log(`\n🎯 Bigness Backend Ready!\n`);
});

module.exports = app;
