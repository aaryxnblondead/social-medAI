const express = require('express');
const { Trend } = require('../models');
const trendDetector = require('../services/trend-detector');
const { cacheMiddleware, CACHE_TTL, invalidatePattern } = require('../middleware/cache');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all trends (public)
router.get('/', cacheMiddleware('trends', CACHE_TTL.TRENDS), async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const trends = await trendDetector.getCurrentTrends(parseInt(limit));

    res.json({
      count: trends.length,
      trends
    });
  } catch (error) {
    console.error('Get Trends Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get trends by source (public)
router.get('/source/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const limit = req.query.limit || 20;

    if (!['twitter', 'newsapi'].includes(source)) {
      return res.status(400).json({ error: 'Invalid source. Must be "twitter" or "newsapi"' });
    }

    const trends = await trendDetector.getTrendsBySource(source, parseInt(limit));

    res.json({
      source,
      count: trends.length,
      trends
    });
  } catch (error) {
    console.error('Get Source Trends Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Search trends (public)
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const limit = req.query.limit || 20;

    const trends = await Trend.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
      .sort({ score: -1 })
      .limit(parseInt(limit));

    res.json({
      query,
      count: trends.length,
      trends
    });
  } catch (error) {
    console.error('Search Trends Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Manually trigger trend detection (protected)
router.post('/refresh', verifyToken, async (req, res) => {
  try {
    console.log('Manually refreshing trends...');

    const trends = await trendDetector.detectAndSaveTrends();

    res.json({
      message: 'Trends refreshed successfully',
      count: trends.length,
      trends
    });
  } catch (error) {
    console.error('Refresh Trends Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
