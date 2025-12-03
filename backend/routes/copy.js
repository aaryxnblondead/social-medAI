const express = require('express');
const { BrandProfile, Trend, GeneratedPost } = require('../models');
const copyGenerator = require('../services/copy-generator');
const { verifyToken } = require('../middleware/auth');
const { cacheMiddleware, CACHE_TTL, deleteFromCache, invalidatePattern } = require('../middleware/cache');

const router = express.Router();

// Generate copy for a trend (protected)
router.post('/generate', verifyToken, async (req, res) => {
  try {
    const { brandId, trendId, platform } = req.body;

    // Validation
    if (!brandId || !trendId) {
      return res.status(400).json({ error: 'Brand ID and Trend ID are required' });
    }

    // Verify brand belongs to user
    const brand = await BrandProfile.findOne({
      _id: brandId,
      userId: req.userId
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Get trend
    const trend = await Trend.findById(trendId);
    if (!trend) {
      return res.status(404).json({ error: 'Trend not found' });
    }

    // Generate copy
    const platformToUse = platform || 'twitter';
    const copy = await copyGenerator.generateCopy(brand, trend, platformToUse);

    // Save to GeneratedPost (as draft)
    const post = new GeneratedPost({
      userId: req.userId,
      brandProfileId: brandId,
      trendId: trendId,
      platform: platformToUse,
      copy: copy,
      status: 'draft',
      metrics: {
        likes: 0,
        retweets: 0,
        replies: 0
      }
    });

    await post.save();

    // Invalidate copy cache for this user
    const redisClient = req.app.get('redisClient');
    if (redisClient) {
      await invalidatePattern(redisClient, `copy:posts:${req.userId}:*`);
    }

    res.json({
      message: 'Copy generated successfully',
      copy,
      post
    });
  } catch (error) {
    console.error('Generate Copy Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Generate multiple copy variations (protected)
router.post('/variations', verifyToken, async (req, res) => {
  try {
    const { brandId, trendId, platform, count } = req.body;

    if (!brandId || !trendId) {
      return res.status(400).json({ error: 'Brand ID and Trend ID are required' });
    }

    // Verify brand belongs to user
    const brand = await BrandProfile.findOne({
      _id: brandId,
      userId: req.userId
    });

    if (!brand) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    // Get trend
    const trend = await Trend.findById(trendId);
    if (!trend) {
      return res.status(404).json({ error: 'Trend not found' });
    }

    // Generate variations
    const platformToUse = platform || 'twitter';
    const countToGenerate = count || 3;
    const variations = await copyGenerator.generateCopyVariations(
      brand,
      trend,
      platformToUse,
      countToGenerate
    );

    // Save all variations as drafts
    const posts = await GeneratedPost.insertMany(
      variations.map(copy => ({
        userId: req.userId,
        brandProfileId: brandId,
        trendId: trendId,
        platform: platformToUse,
        copy: copy,
        status: 'draft',
        metrics: { likes: 0, retweets: 0, replies: 0 }
      }))
    );

    res.json({
      message: 'Copy variations generated successfully',
      count: variations.length,
      variations,
      posts
    });
  } catch (error) {
    console.error('Generate Variations Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get generated posts for user (protected)
 router.get('/posts', cacheMiddleware('copy:posts', CACHE_TTL.POST), verifyToken, async (req, res) => {
  try {
    const { status, platform } = req.query;

    let query = { userId: req.userId };

    if (status) query.status = status;
    if (platform) query.platform = platform;

    const posts = await GeneratedPost.find(query)
      .populate('brandProfileId', 'brandName')
      .populate('trendId', 'title source')
      .sort({ createdAt: -1 });

    res.json({
      count: posts.length,
      posts
    });
  } catch (error) {
    console.error('Get Posts Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get single post (protected)
router.get('/posts/:postId', verifyToken, async (req, res) => {
  try {
    const post = await GeneratedPost.findOne({
      _id: req.params.postId,
      userId: req.userId
    })
      .populate('brandProfileId')
      .populate('trendId');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get Post Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update post (protected)
router.put('/posts/:postId', verifyToken, async (req, res) => {
  try {
    const { copy, status, platform } = req.body;

    const post = await GeneratedPost.findOneAndUpdate(
      { _id: req.params.postId, userId: req.userId },
      {
        copy,
        status,
        platform,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update Post Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete post (protected)
router.delete('/posts/:postId', verifyToken, async (req, res) => {
  try {
    const post = await GeneratedPost.findOneAndDelete({
      _id: req.params.postId,
      userId: req.userId
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      message: 'Post deleted successfully',
      post
    });
  } catch (error) {
    console.error('Delete Post Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
