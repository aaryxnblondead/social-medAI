const express = require('express');
const { GeneratedPost } = require('../models');
const multiPlatformPublisher = require('../services/multi-platform-publisher');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Publish to single platform
router.post('/platform/:platform', verifyToken, async (req, res) => {
  try {
    const { postId } = req.body;
    const { platform } = req.params;

    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    if (!['twitter', 'linkedin', 'facebook', 'instagram'].includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    // Get post
    const post = await GeneratedPost.findOne({
      _id: postId,
      userId: req.userId
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (!post.copy || post.copy.length === 0) {
      return res.status(400).json({ error: 'Post has no copy' });
    }

    // Publish to platform
    const result = await multiPlatformPublisher.publishToPlatform(post, platform);

    // Update post with platform data
    const platformIndex = post.platforms.findIndex(p => p.name === platform);
    if (platformIndex >= 0) {
      post.platforms[platformIndex] = {
        ...post.platforms[platformIndex],
        ...result,
        publishedAt: new Date(),
        lastSyncedAt: new Date()
      };
    } else {
      post.platforms.push({
        name: platform,
        ...result,
        publishedAt: new Date(),
        lastSyncedAt: new Date()
      });
    }

    await post.save();

    res.json({
      message: `Post published to ${platform} successfully`,
      result,
      post
    });
  } catch (error) {
    console.error('Publish Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Publish to multiple platforms at once
router.post('/multi', verifyToken, async (req, res) => {
  try {
    const { postId, platforms } = req.body;

    if (!postId || !platforms || platforms.length === 0) {
      return res.status(400).json({ error: 'Post ID and platforms array are required' });
    }

    // Get post
    const post = await GeneratedPost.findOne({
      _id: postId,
      userId: req.userId
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Publish to all platforms
    const results = await multiPlatformPublisher.publishToMultiplePlatforms(post, platforms);

    // Update post with all platform data
    for (const result of results) {
      const platformIndex = post.platforms.findIndex(p => p.name === result.platform);
      if (platformIndex >= 0) {
        post.platforms[platformIndex] = {
          ...post.platforms[platformIndex],
          ...result,
          publishedAt: new Date(),
          lastSyncedAt: new Date()
        };
      } else {
        post.platforms.push({
          name: result.platform,
          ...result,
          publishedAt: new Date(),
          lastSyncedAt: new Date()
        });
      }
    }

    // Update aggregated metrics
    post.status = 'published';
    post.publishedAt = new Date();
    await post.save();

    res.json({
      message: `Post published to ${platforms.length} platforms`,
      results,
      post
    });
  } catch (error) {
    console.error('Multi Publish Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Sync metrics from all platforms
router.post('/sync-metrics/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await GeneratedPost.findOne({
      _id: postId,
      userId: req.userId
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get metrics from all platforms
    const platformMetrics = await multiPlatformPublisher.getMetricsFromAllPlatforms(post);

    // Update each platform's metrics
    for (const metric of platformMetrics) {
      const platformIndex = post.platforms.findIndex(p => p.name === metric.platform);
      if (platformIndex >= 0) {
        post.platforms[platformIndex].metrics = metric;
        post.platforms[platformIndex].lastSyncedAt = new Date();
      }
    }

    // Aggregate metrics
    const aggregated = multiPlatformPublisher.aggregateMetrics(platformMetrics);
    post.metrics = aggregated;

    await post.save();

    res.json({
      message: 'Metrics synced successfully',
      platformMetrics,
      aggregatedMetrics: aggregated,
      post
    });
  } catch (error) {
    console.error('Sync Metrics Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get post performance across all platforms
router.get('/:postId/performance', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await GeneratedPost.findOne({
      _id: postId,
      userId: req.userId
    })
      .populate('brandProfileId', 'brandName')
      .populate('trendId', 'title');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const platformPerformance = post.platforms.map(p => ({
      platform: p.name,
      status: p.status,
      url: p.url,
      metrics: p.metrics,
      publishedAt: p.publishedAt,
      lastSyncedAt: p.lastSyncedAt
    }));

    res.json({
      post: {
        _id: post._id,
        copy: post.copy.substring(0, 100),
        brand: post.brandProfileId?.brandName,
        trend: post.trendId?.title
      },
      platforms: platformPerformance,
      aggregatedMetrics: post.metrics
    });
  } catch (error) {
    console.error('Performance Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
