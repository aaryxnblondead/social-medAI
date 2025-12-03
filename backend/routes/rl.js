const express = require('express');
const rlOptimizer = require('../services/rl-optimizer');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get weekly training data (protected)
router.get('/training-data', verifyToken, async (req, res) => {
  try {
    const trainingData = await rlOptimizer.getWeeklyTrainingData(req.userId);

    res.json({
      message: 'Weekly training data retrieved',
      trainingData
    });
  } catch (error) {
    console.error('Training Data Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Run weekly training (protected)
router.post('/train-weekly', verifyToken, async (req, res) => {
  try {
    const result = await rlOptimizer.trainWeekly(req.userId);

    res.json({
      message: 'Weekly training executed',
      result
    });
  } catch (error) {
    console.error('Training Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get performance analysis for a post (protected)
router.get('/post/:postId/analysis', verifyToken, async (req, res) => {
  try {
    const { GeneratedPost } = require('../models');
    const { postId } = req.params;

    const post = await GeneratedPost.findOne({
      _id: postId,
      userId: req.userId
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const analysis = await rlOptimizer.analyzePostPerformance(post);

    res.json({
      message: 'Post analysis retrieved',
      analysis
    });
  } catch (error) {
    console.error('Analysis Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Calculate reward for metrics (protected)
router.post('/calculate-reward', verifyToken, async (req, res) => {
  try {
    const { metrics, impressions } = req.body;

    if (!metrics) {
      return res.status(400).json({ error: 'Metrics are required' });
    }

    const reward = rlOptimizer.calculateReward(metrics, impressions || 1);

    res.json({
      message: 'Reward calculated',
      reward
    });
  } catch (error) {
    console.error('Reward Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
