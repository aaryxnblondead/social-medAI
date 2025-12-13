const express = require('express');
const { GeneratedPost, User } = require('../models');
const { verifyToken } = require('../middleware/auth');
const twitterPublisher = require('../services/twitter-publisher');
const instagramPublisher = require('../services/instagram-publisher');
const facebookPublisher = require('../services/facebook-publisher');
const linkedinPublisher = require('../services/linkedin-publisher');

const router = express.Router();

// Get comprehensive user analytics across all platforms
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Get post counts by status
    const draftCount = await GeneratedPost.countDocuments({ userId, status: 'draft' });
    const scheduledCount = await GeneratedPost.countDocuments({ userId, status: 'scheduled' });
    const publishedCount = await GeneratedPost.countDocuments({ userId, status: 'published' });

    // Get published posts for metrics
    const publishedPosts = await GeneratedPost.find({ 
      userId, 
      status: 'published' 
    }).sort({ publishedAt: -1 }).limit(100);

    // Aggregate metrics across all platforms
    let totalLikes = 0;
    let totalRetweets = 0;
    let totalReplies = 0;
    let totalViews = 0;
    let totalImpressions = 0;
    let totalEngagement = 0;
    let totalReach = 0;

    const platformStats = {
      twitter: { posts: 0, likes: 0, retweets: 0, replies: 0, impressions: 0 },
      instagram: { posts: 0, likes: 0, comments: 0, saves: 0, reach: 0 },
      facebook: { posts: 0, likes: 0, comments: 0, shares: 0, reach: 0 },
      linkedin: { posts: 0, likes: 0, comments: 0, shares: 0, impressions: 0 }
    };

    publishedPosts.forEach(post => {
      if (post.platforms && post.platforms.length > 0) {
        post.platforms.forEach(platform => {
          const metrics = platform.metrics || {};
          const platformName = platform.name;

          if (platformName === 'twitter') {
            platformStats.twitter.posts++;
            platformStats.twitter.likes += metrics.likes || 0;
            platformStats.twitter.retweets += metrics.retweets || 0;
            platformStats.twitter.replies += metrics.replies || 0;
            platformStats.twitter.impressions += metrics.impressions || 0;

            totalLikes += metrics.likes || 0;
            totalRetweets += metrics.retweets || 0;
            totalReplies += metrics.replies || 0;
            totalImpressions += metrics.impressions || 0;
          } else if (platformName === 'instagram') {
            platformStats.instagram.posts++;
            platformStats.instagram.likes += metrics.likes || 0;
            platformStats.instagram.comments += metrics.comments || 0;
            platformStats.instagram.saves += metrics.saved || 0;
            platformStats.instagram.reach += metrics.reach || 0;

            totalLikes += metrics.likes || 0;
            totalReplies += metrics.comments || 0;
            totalReach += metrics.reach || 0;
          } else if (platformName === 'facebook') {
            platformStats.facebook.posts++;
            platformStats.facebook.likes += metrics.likes || 0;
            platformStats.facebook.comments += metrics.comments || 0;
            platformStats.facebook.shares += metrics.shares || 0;
            platformStats.facebook.reach += metrics.reach || 0;

            totalLikes += metrics.likes || 0;
            totalReplies += metrics.comments || 0;
            totalRetweets += metrics.shares || 0;
            totalReach += metrics.reach || 0;
          } else if (platformName === 'linkedin') {
            platformStats.linkedin.posts++;
            platformStats.linkedin.likes += metrics.likes || 0;
            platformStats.linkedin.comments += metrics.comments || 0;
            platformStats.linkedin.shares += metrics.shares || 0;
            platformStats.linkedin.impressions += metrics.impressions || 0;

            totalLikes += metrics.likes || 0;
            totalReplies += metrics.comments || 0;
            totalRetweets += metrics.shares || 0;
            totalImpressions += metrics.impressions || 0;
          }
        });
      }
    });

    totalEngagement = totalLikes + totalRetweets + totalReplies;
    totalViews = Math.max(totalImpressions, totalReach);

    // Calculate engagement rate
    const engagementRate = totalViews > 0 
      ? ((totalEngagement / totalViews) * 100).toFixed(2) 
      : '0.00';

    // Get top performing posts (by engagement)
    const topPosts = publishedPosts
      .map(post => {
        let postEngagement = 0;
        if (post.platforms && post.platforms.length > 0) {
          post.platforms.forEach(platform => {
            const m = platform.metrics || {};
            postEngagement += (m.likes || 0) + (m.retweets || m.shares || 0) + 
                             (m.replies || m.comments || 0);
          });
        }
        return { post, engagement: postEngagement };
      })
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 5)
      .map(item => item.post);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentPosts = await GeneratedPost.countDocuments({
      userId,
      status: 'published',
      publishedAt: { $gte: sevenDaysAgo }
    });

    // Best performing platform
    let bestPlatform = 'twitter';
    let maxPosts = platformStats.twitter.posts;
    Object.keys(platformStats).forEach(platform => {
      if (platformStats[platform].posts > maxPosts) {
        bestPlatform = platform;
        maxPosts = platformStats[platform].posts;
      }
    });

    res.json({
      analytics: {
        publishedPosts: publishedCount,
        drafts: draftCount,
        scheduled: scheduledCount,
        totalEngagement,
        totalLikes,
        totalRetweets,
        totalReplies,
        totalViews,
        totalImpressions,
        totalReach,
        engagementRate: parseFloat(engagementRate),
        recentPosts7Days: recentPosts,
        bestPlatform
      },
      platformStats,
      topPosts
    });
  } catch (error) {
    console.error('Dashboard Analytics Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Sync real-time metrics from social media platforms
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { platform } = req.body;

    const publishedPosts = await GeneratedPost.find({
      userId,
      status: 'published',
      'platforms.name': platform || { $exists: true }
    });

    let synced = 0;
    const errors = [];

    for (const post of publishedPosts) {
      try {
        for (const platformData of post.platforms) {
          if (platform && platformData.name !== platform) continue;
          if (!platformData.postId) continue;

          let metrics = null;

          // Fetch metrics based on platform
          switch (platformData.name) {
            case 'twitter':
              metrics = await twitterPublisher.getTweetMetrics(platformData.postId);
              break;
            case 'instagram':
              metrics = await instagramPublisher.getPostMetrics(platformData.postId);
              break;
            case 'facebook':
              metrics = await facebookPublisher.getPostMetrics(platformData.postId);
              break;
            case 'linkedin':
              metrics = await linkedinPublisher.getPostMetrics(platformData.postId);
              break;
          }

          if (metrics) {
            const platformIndex = post.platforms.findIndex(p => p.name === platformData.name);
            post.platforms[platformIndex].metrics = metrics;
            post.platforms[platformIndex].lastSyncedAt = new Date();
            synced++;
          }
        }

        await post.save();
      } catch (error) {
        errors.push({ postId: post._id, error: error.message });
      }
    }

    res.json({
      message: 'Metrics synced successfully',
      synced,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Sync Analytics Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get platform-specific analytics
router.get('/platform/:platform', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { platform } = req.params;

    const posts = await GeneratedPost.find({
      userId,
      status: 'published',
      'platforms.name': platform
    }).sort({ publishedAt: -1 });

    const stats = {
      totalPosts: 0,
      totalEngagement: 0,
      metrics: {}
    };

    posts.forEach(post => {
      const platformData = post.platforms.find(p => p.name === platform);
      if (platformData && platformData.metrics) {
        stats.totalPosts++;
        const metrics = platformData.metrics;
        
        Object.keys(metrics).forEach(key => {
          stats.metrics[key] = (stats.metrics[key] || 0) + (metrics[key] || 0);
        });
        
        stats.totalEngagement += (metrics.likes || 0) + 
                                 (metrics.retweets || metrics.shares || 0) + 
                                 (metrics.replies || metrics.comments || 0);
      }
    });

    res.json({
      platform,
      stats,
      recentPosts: posts.slice(0, 10)
    });
  } catch (error) {
    console.error('Platform Analytics Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
