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
