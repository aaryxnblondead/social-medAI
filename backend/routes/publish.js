const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// Publish to Twitter
router.post('/twitter', verifyToken, async (req, res) => {
  res.json({ message: 'Published to Twitter', data: req.body });
});

// Get Twitter metrics for a tweet
router.get('/twitter/metrics/:tweetId', verifyToken, async (req, res) => {
  const { tweetId } = req.params;
  res.json({ tweetId, metrics: { impressions: 0, likes: 0, retweets: 0 } });
});

// Delete a tweet
router.delete('/twitter/:tweetId', verifyToken, async (req, res) => {
  const { tweetId } = req.params;
  res.json({ message: 'Tweet deleted', tweetId });
});

// Sync metrics for a tweet
router.post('/twitter/:tweetId/sync-metrics', verifyToken, async (req, res) => {
  const { tweetId } = req.params;
  res.json({ message: 'Metrics synced', tweetId });
});

// Publish all scheduled posts
router.post('/publish-scheduled', verifyToken, async (req, res) => {
  res.json({ message: 'All scheduled posts published' });
});

module.exports = router;
const express = require('express');
const { GeneratedPost } = require('../models');
const twitterPublisher = require('../services/twitter-publisher');
const postManager = require('../services/post-manager');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Publish post to Twitter
router.post('/twitter', verifyToken, async (req, res) => {
  try {
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
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
      return res.status(400).json({ error: 'Post has no copy to publish' });
    }

    // Prepare tweet text
    let tweetText = post.copy;

    // Add image URL if available
    if (post.imageUrl) {
      tweetText += `\n\n🎨 ${post.imageUrl}`;
    }

    // Post to Twitter
    let twitterResult;
    if (post.imageUrl) {
      twitterResult = await twitterPublisher.postTweetWithImage(
        post.copy,
        post.imageUrl
      );
    } else {
      twitterResult = await twitterPublisher.postTweet(post.copy);
    }

    // Update post with Twitter data
    await postManager.publishPost(postId, req.userId, twitterResult.tweetId);

    // Update post with Twitter URL
    post.twitterPostId = twitterResult.tweetId;
    post.twitterUrl = twitterResult.url;
    post.status = 'published';
    post.publishedAt = new Date();
    await post.save();

    res.json({
      message: 'Post published to Twitter successfully',
      twitterResult,
      post
    });
  } catch (error) {
    console.error('Publish Twitter Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get tweet metrics
router.get('/twitter/metrics/:tweetId', verifyToken, async (req, res) => {
  try {
    const { tweetId } = req.params;

    const metrics = await twitterPublisher.getTweetMetrics(tweetId);

    res.json({
      message: 'Metrics fetched successfully',
      metrics
    });
  } catch (error) {
    console.error('Get Metrics Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete tweet from Twitter
router.delete('/twitter/:tweetId', verifyToken, async (req, res) => {
  try {
    const { tweetId } = req.params;

    // Find and delete post
    const post = await GeneratedPost.findOneAndUpdate(
      {
        twitterPostId: tweetId,
        userId: req.userId
      },
      {
        status: 'draft',
        twitterPostId: null,
        twitterUrl: null,
        publishedAt: null
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Delete from Twitter
    const deleteResult = await twitterPublisher.deleteTweet(tweetId);

    res.json({
      message: 'Tweet deleted successfully',
      deleteResult,
      post
    });
  } catch (error) {
    console.error('Delete Tweet Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Sync Twitter metrics to post
router.post('/twitter/:tweetId/sync-metrics', verifyToken, async (req, res) => {
  try {
    const { tweetId } = req.params;

    // Get metrics from Twitter
    const metrics = await twitterPublisher.getTweetMetrics(tweetId);

    // Find post and update metrics
    const post = await GeneratedPost.findOneAndUpdate(
      {
        twitterPostId: tweetId,
        userId: req.userId
      },
      {
        'metrics.likes': metrics.likes,
        'metrics.retweets': metrics.retweets,
        'metrics.replies': metrics.replies
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      message: 'Metrics synced successfully',
      metrics,
      post
    });
  } catch (error) {
    console.error('Sync Metrics Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Publish all scheduled posts (admin/cron job)
router.post('/publish-scheduled', verifyToken, async (req, res) => {
  try {
    console.log('🔄 Publishing scheduled posts...');

    const postsDue = await postManager.getPostsDueForPublishing();

    if (postsDue.length === 0) {
      return res.json({
        message: 'No posts due for publishing',
        published: []
      });
    }

    const results = [];

    for (const post of postsDue) {
      try {
        // Publish to Twitter
        const twitterResult = await twitterPublisher.postTweet(post.copy);

        // Update post
        post.twitterPostId = twitterResult.tweetId;
        post.twitterUrl = twitterResult.url;
        post.status = 'published';
        post.publishedAt = new Date();
        await post.save();

        results.push({
          postId: post._id,
          status: 'published',
          twitterUrl: twitterResult.url
        });
      } catch (error) {
        results.push({
          postId: post._id,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      message: 'Scheduled publishing completed',
      published: results.length,
      results
    });
  } catch (error) {
    console.error('Publish Scheduled Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
