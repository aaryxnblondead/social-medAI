const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Joi = require('joi');
const { GeneratedPost } = require('../models');

const scheduleSchema = Joi.object({
  title: Joi.string().min(3).required(),
  content: Joi.string().min(10).required(),
  imageUrl: Joi.string().uri().optional(),
  platformTargets: Joi.array().items(Joi.string()).default([]),
  scheduledAt: Joi.date().required()
});

// Schedule a post
router.post('/schedule', verifyToken, async (req, res) => {
  try {
    const { value, error } = scheduleSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const doc = await GeneratedPost.create({
      userId: req.userId,
      title: value.title,
      content: value.content,
      imageUrl: value.imageUrl,
      platformTargets: value.platformTargets,
      status: 'scheduled',
      scheduledAt: value.scheduledAt
    });
    res.json({ message: 'Post scheduled', post: doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get scheduled posts
router.get('/scheduled', verifyToken, async (req, res) => {
  try {
    const rows = await GeneratedPost.find({ userId: req.userId, status: 'scheduled' }).sort({ scheduledAt: 1 });
    res.json({ scheduled: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get drafts
router.get('/drafts', verifyToken, async (req, res) => {
  try {
    const rows = await GeneratedPost.find({ userId: req.userId, status: 'draft' });
    res.json({ drafts: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get published posts
router.get('/published', verifyToken, async (req, res) => {
  try {
    const rows = await GeneratedPost.find({ userId: req.userId, status: 'published' }).sort({ publishedAt: -1 });
    res.json({ published: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Publish a specific post
router.post('/:postId/publish', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const doc = await GeneratedPost.findOneAndUpdate(
      { _id: postId, userId: req.userId },
      { status: 'published', publishedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Post published', post: doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update post metrics
const metricsSchema = Joi.object({ impressions: Joi.number().min(0), clicks: Joi.number().min(0), likes: Joi.number().min(0), shares: Joi.number().min(0) }).min(1);
router.put('/:postId/metrics', verifyToken, async (req, res) => {
  try {
    const { value, error } = metricsSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });
    const { postId } = req.params;
    const doc = await GeneratedPost.findOneAndUpdate(
      { _id: postId, userId: req.userId },
      { $set: { metrics: value } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Post not found' });
    res.json({ message: 'Metrics updated', post: doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get analytics for a post
router.get('/:postId/analytics', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const doc = await GeneratedPost.findOne({ _id: postId, userId: req.userId });
    if (!doc) return res.status(404).json({ error: 'Post not found' });
    const impressions = doc.metrics?.impressions || 0;
    const clicks = doc.metrics?.clicks || 0;
    const ctr = impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0;
    res.json({ postId, analytics: { impressions, clicks, ctr } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
const express = require('express');
const { GeneratedPost } = require('../models');
const postManager = require('../services/post-manager');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Schedule a post (protected)
router.post('/schedule', verifyToken, async (req, res) => {
  try {
    const { postId, scheduledTime } = req.body;

    if (!postId || !scheduledTime) {
      return res.status(400).json({ error: 'Post ID and scheduled time are required' });
    }

    // Validate future date
    const scheduleDate = new Date(scheduledTime);
    if (scheduleDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const post = await postManager.schedulePost(postId, req.userId, scheduledTime);

    res.json({
      message: 'Post scheduled successfully',
      post
    });
  } catch (error) {
    console.error('Schedule Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get scheduled posts (protected)
router.get('/scheduled', verifyToken, async (req, res) => {
  try {
    const posts = await postManager.getScheduledPosts(req.userId);

    res.json({
      status: 'scheduled',
      count: posts.length,
      posts
    });
  } catch (error) {
    console.error('Get Scheduled Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get drafts (protected)
router.get('/drafts', verifyToken, async (req, res) => {
  try {
    const posts = await postManager.getDrafts(req.userId);

    res.json({
      status: 'draft',
      count: posts.length,
      posts
    });
  } catch (error) {
    console.error('Get Drafts Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get published posts (protected)
router.get('/published', verifyToken, async (req, res) => {
  try {
    const posts = await postManager.getPublishedPosts(req.userId);

    res.json({
      status: 'published',
      count: posts.length,
      posts
    });
  } catch (error) {
    console.error('Get Published Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Publish post immediately (protected)
router.post('/:postId/publish', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { twitterPostId } = req.body;

    // Get post to verify ownership
    const post = await GeneratedPost.findOne({
      _id: postId,
      userId: req.userId
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Publish via post manager
    const publishedPost = await postManager.publishPost(
      postId,
      req.userId,
      twitterPostId
    );

    res.json({
      message: 'Post published successfully',
      post: publishedPost
    });
  } catch (error) {
    console.error('Publish Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update post metrics (protected)
router.put('/:postId/metrics', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { likes, retweets, replies } = req.body;

    const post = await postManager.updatePostMetrics(
      postId,
      req.userId,
      { likes, retweets, replies }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Calculate score
    const score = postManager.calculateScore(post.metrics);

    res.json({
      message: 'Metrics updated',
      post,
      score
    });
  } catch (error) {
    console.error('Update Metrics Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all posts by status (protected)
router.get('/by-status/:status', verifyToken, async (req, res) => {
  try {
    const { status } = req.params;

    if (!['draft', 'scheduled', 'published', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const posts = await GeneratedPost.find({
      userId: req.userId,
      status
    })
      .sort({ createdAt: -1 })
      .populate('brandProfileId', 'brandName')
      .populate('trendId', 'title');

    res.json({
      status,
      count: posts.length,
      posts
    });
  } catch (error) {
    console.error('Get by Status Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get post analytics (protected)
router.get('/:postId/analytics', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await GeneratedPost.findOne({
      _id: postId,
      userId: req.userId
    })
      .populate('brandProfileId', 'brandName')
      .populate('trendId', 'title score');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const score = postManager.calculateScore(post.metrics);
    const engagementRate = post.metrics.likes + post.metrics.retweets + post.metrics.replies;

    res.json({
      post,
      analytics: {
        totalEngagement: engagementRate,
        performanceScore: score,
        likes: post.metrics.likes,
        retweets: post.metrics.retweets,
        replies: post.metrics.replies,
        createdAt: post.createdAt,
        publishedAt: post.publishedAt,
        scheduledAt: post.scheduledAt
      }
    });
  } catch (error) {
    console.error('Analytics Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
