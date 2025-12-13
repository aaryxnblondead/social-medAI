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
const adsDecisionEngine = require('./services/ads-decision-engine');

// Import jobs
const trendDetectionJob = require('./jobs/trend-detection-job');
const engagementTrackingJob = require('./jobs/engagement-tracking-job');
const rlTrainingJob = require('./jobs/rl-training-job');

// Import routes
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/account');
const onboardingRoutes = require('./routes/onboarding');
const socialAuthRoutes = require('./routes/social-auth');
const adsRoutes = require('./routes/ads');
const healthRoutes = require('./routes/health');

// Import queue service
const { publishingQueue } = require('./services/publishing-queue');
const brandRoutes = require('./routes/brands');
const trendRoutes = require('./routes/trends');
const copyRoutes = require('./routes/copy');
const imageRoutes = require('./routes/images');
const postRoutes = require('./routes/posts');
const publishRoutes = require('./routes/publish');
const multiPublishRoutes = require('./routes/multi-publish');
const rlRoutes = require('./routes/rl');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const { verifyToken } = require('./middleware/auth');

const app = express();

// Initialize Sentry for error tracking (if configured)
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1
  });
  
  // Request handler must be first
  app.use(Sentry.Handlers.requestHandler());
  console.log('✅ Sentry initialized');
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoints (public)
app.use('/api/health', healthRoutes);

// Legacy health check for backward compatibility
app.get('/health', (req, res) => {
  res.redirect('/api/health');
});

// Auth routes (public)
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes mounted (/api/auth)');

// Account management routes (protected)
app.use('/api/account', accountRoutes);
console.log('✅ Account routes mounted (/api/account)');

// Social OAuth routes (protected)
app.use('/api/social-auth', socialAuthRoutes);
console.log('✅ Social Auth routes mounted (/api/social-auth)');

// Onboarding routes (protected)
app.use('/api/onboarding', onboardingRoutes);

// Ads management routes (protected)
app.use('/api/ads', adsRoutes);

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

// RL & Optimization routes (protected)
app.use('/api/rl', rlRoutes);

// Analytics routes (protected)
app.use('/api/analytics', analyticsRoutes);

// Sentry error handler (must be before other error handlers)
if (process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  app.use(Sentry.Handlers.errorHandler());
}

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

// Initialize Redis (via URL)
const redisClient = redis.createClient({ url: process.env.REDIS_URL });
app.set('redisClient', redisClient);
redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('error', (err) => console.warn('⚠️ Redis error:', err.message));
redisClient.connect().catch(err => console.warn('⚠️ Redis connect error:', err.message));

// Initialize publishing queue
console.log('📅 Publishing queue initialized');

// Clean up old jobs every 24 hours
setInterval(async () => {
  await publishingQueue.clean(24 * 60 * 60 * 1000, 100, 'completed');
  await publishingQueue.clean(24 * 60 * 60 * 1000, 100, 'failed');
}, 24 * 60 * 60 * 1000);

// Initialize weekly RL training job
const scheduleWeeklyTraining = () => {
  // Deprecated: Now handled by rl-training-job.js
  // Keeping for backward compatibility but job takes precedence
  const getNextMonday = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setHours(2, 0, 0, 0);
    return nextMonday;
  };

  const scheduleNext = () => {
    const nextRun = getNextMonday();
    const delayMs = nextRun.getTime() - Date.now();

    console.log(`📅 Legacy weekly RL training scheduled for ${nextRun.toISOString()}`);

    setTimeout(async () => {
      try {
        console.log('🤖 Running legacy weekly RL training (use rlTrainingJob instead)...');
        // Deprecated - job handles this now
        console.log('⚠️ Use rlTrainingJob for weekly training');
      } catch (error) {
        console.error('❌ Legacy training error:', error.message);
      }

      // Schedule next week's run
      scheduleNext();
    }, delayMs);
  };

  // Commenting out to avoid duplicate training
  // scheduleNext();
};

// scheduleWeeklyTraining(); // Disabled - using rlTrainingJob instead

// Initialize services
console.log('✅ MetaAdsService initialized');
console.log('✅ GoogleAdsService initialized');
console.log('✅ AdsConfigService initialized');
console.log('✅ AdsDecisionEngine initialized');
console.log('✅ TrendDetectorService initialized');

// Mount routes
console.log('✅ Auth routes mounted (/api/auth)');
console.log('✅ Social Auth routes mounted (/api/social-auth)');
console.log('✅ Ads routes mounted (/api/ads)');
console.log('✅ Brand routes mounted (/api/brands)');
console.log('✅ Trend routes mounted (/api/trends)');
console.log('✅ Copy routes mounted (/api/copy)');
console.log('✅ Image routes mounted (/api/images)');
console.log('✅ Post routes mounted (/api/posts)');
console.log('✅ Publish routes mounted (/api/publish)');
console.log('✅ Multi-platform routes mounted (/api/publish/multi)');
console.log('✅ RL routes mounted (/api/rl)');

// Start background jobs
trendDetectionJob.start(360); // Every 6 hours
engagementTrackingJob.start(240); // Every 4 hours
rlTrainingJob.start(); // Every Monday at 2 AM

console.log('✅ Background jobs started');

// Start automatic trend detection every 30 minutes (deprecated - replaced by job)
// Keeping for backward compatibility but job takes precedence
setInterval(async () => {
  console.log('⏰ Running scheduled trend detection (legacy)...');
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
  console.log(`\n🎯 Onboarding Endpoints (all protected):`);
  console.log(`   POST   /api/onboarding/brand - Create/update brand profile`);
  console.log(`   POST   /api/onboarding/influencer - Create/update influencer profile`);
  console.log(`   GET    /api/onboarding/brand - Get brand profile`);
  console.log(`   GET    /api/onboarding/influencer - Get influencer profile`);
  console.log(`   PUT    /api/onboarding/brand - Update brand profile`);
  console.log(`   PUT    /api/onboarding/influencer - Update influencer profile`);
  console.log(`   GET    /api/onboarding/status - Check onboarding completion`);
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
  console.log(`\n🤖 Reinforcement Learning & Optimization (all protected):`);
  console.log(`   GET    /api/rl/training-data - Get weekly training data`);
  console.log(`   POST   /api/rl/train-weekly - Run weekly RL training`);
  console.log(`   GET    /api/rl/post/:postId/analysis - Analyze single post`);
  console.log(`   POST   /api/rl/calculate-reward - Calculate reward score`);
  console.log(`\n🎯 Bigness Backend Ready!\n`);
}); 

module.exports = app;
