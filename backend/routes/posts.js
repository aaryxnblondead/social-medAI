const express = require('express');
const { GeneratedPost } = require('../models');
const postManager = require('../services/post-manager');
const { verifyToken } = require('../middleware/auth');
const { schedulePublishing, publishImmediate, getQueueStats, getJobStatus } = require('../services/publishing-queue');

const router = express.Router();

// Get single post details (protected)
router.get('/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await GeneratedPost.findOne({
      _id: postId,
      userId: req.userId
    }).populate('brandProfileId').populate('trendId');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get Post Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Schedule post via queue (replaces old schedule endpoint)
router.post('/schedule', verifyToken, async (req, res) => {
  try {
    const { postId, scheduledTime, platforms = ['twitter'] } = req.body;

    if (!postId || !scheduledTime) {
      return res.status(400).json({ error: 'Post ID and scheduled time required' });
    }

    const post = await GeneratedPost.findOne({ _id: postId, userId: req.userId });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const job = await schedulePublishing(postId, req.userId, platforms, scheduledTime);

    res.json({
      message: 'Post scheduled',
      jobId: job.id,
      scheduledFor: scheduledTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish immediately via queue
router.post('/:postId/publish-now', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { platforms = ['twitter'] } = req.body;

    const post = await GeneratedPost.findOne({ _id: postId, userId: req.userId });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const job = await publishImmediate(postId, req.userId, platforms);

    res.json({
      message: 'Post queued for immediate publishing',
      jobId: job.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get queue stats (protected)
router.get('/queue/stats', verifyToken, async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job status (protected)
router.get('/queue/job/:jobId', verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await getJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ status });
  } catch (error) {
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
