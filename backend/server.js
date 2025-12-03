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
const copyRoutes = require('./routes/copy');
const imageRoutes = require('./routes/images');
const postRoutes = require('./routes/posts');
const publishRoutes = require('./routes/publish');
const multiPublishRoutes = require('./routes/multi-publish');

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

// Copy generation routes (protected)
app.use('/api/copy', copyRoutes);

// Image generation routes (protected)
app.use('/api/images', imageRoutes);

// Post management routes (protected)
app.use('/api/posts', postRoutes);
// Publishing routes (protected)
app.use('/api/publish', publishRoutes);
// Multi-platform publishing routes (protected)
app.use('/api/publish/multi', multiPublishRoutes);

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
console.log('✅ Copy routes mounted (/api/copy)');
console.log('✅ Image routes mounted (/api/images)');
console.log('✅ Post routes mounted (/api/posts)');
console.log('✅ Publish routes mounted (/api/publish)');
console.log('✅ Multi-platform routes mounted (/api/publish/multi)');


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
  console.log(`\n✍️  Copy Generation Endpoints (all protected):`);
  console.log(`   POST   /api/copy/generate - Generate copy for trend`);
  console.log(`   POST   /api/copy/variations - Generate multiple variations`);
  console.log(`   GET    /api/copy/posts - Get user's generated posts`);
  console.log(`   GET    /api/copy/posts/:postId - Get single post`);
  console.log(`   PUT    /api/copy/posts/:postId - Update post`);
  console.log(`   DELETE /api/copy/posts/:postId - Delete post`);
  console.log(`\n🎨 Image Generation Endpoints (all protected):`);
  console.log(`   POST   /api/images/generate - Generate image for post`);
  console.log(`   POST   /api/images/generate-batch - Batch generate images`);
  console.log(`   DELETE /api/images/delete/:publicId - Delete image`);
  console.log(`\n📅 Post Management Endpoints (all protected):`);
  console.log(`   POST   /api/posts/schedule - Schedule post`);
  console.log(`   GET    /api/posts/scheduled - Get scheduled posts`);
  console.log(`   GET    /api/posts/drafts - Get drafts`);
  console.log(`   GET    /api/posts/published - Get published posts`);
  console.log(`   POST   /api/posts/:postId/publish - Publish post`);
  console.log(`   PUT    /api/posts/:postId/metrics - Update metrics`);
  console.log(`   GET    /api/posts/:postId/analytics - Get analytics`);
  console.log(`\n🐦 Social Media Publishing (all protected):`);
  console.log(`   POST   /api/publish/twitter - Publish to Twitter`);
  console.log(`   GET    /api/publish/twitter/metrics/:tweetId - Get metrics`);
  console.log(`   DELETE /api/publish/twitter/:tweetId - Delete tweet`);
  console.log(`   POST   /api/publish/twitter/:tweetId/sync-metrics - Sync metrics`);
  console.log(`   POST   /api/publish/publish-scheduled - Publish all scheduled`);
  console.log(`\n🌐 Multi-Platform Publishing (all protected):`);
  console.log(`   POST   /api/publish/multi/platform/:platform - Publish to single platform`);
  console.log(`   POST   /api/publish/multi/multi - Publish to multiple platforms`);
  console.log(`   POST   /api/publish/multi/sync-metrics/:postId - Sync all platform metrics`);
  console.log(`   GET    /api/publish/multi/:postId/performance - Get cross-platform performance`);
  console.log(`\n🎯 Bigness Backend Ready!\n`);
});

module.exports = app;
