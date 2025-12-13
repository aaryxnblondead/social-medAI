const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');

const router = express.Router();

/**
 * Basic health check
 * GET /api/health
 */
router.get('/', async (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'bigness-backend'
  });
});

/**
 * Detailed health check
 * GET /api/health/detailed
 */
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'bigness-backend',
    checks: {}
  };

  // Check MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.checks.mongodb = { status: 'connected', responseTime: 'OK' };
    } else {
      health.checks.mongodb = { status: 'disconnected' };
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.mongodb = { status: 'error', error: error.message };
    health.status = 'degraded';
  }

  // Check Redis
  try {
    const redisClient = req.app.get('redisClient');
    if (redisClient && redisClient.isOpen) {
      await redisClient.ping();
      health.checks.redis = { status: 'connected', responseTime: 'OK' };
    } else {
      health.checks.redis = { status: 'disconnected' };
      health.status = 'degraded';
    }
  } catch (error) {
    health.checks.redis = { status: 'error', error: error.message };
    health.status = 'degraded';
  }

  // Check Twitter API
  try {
    if (process.env.TWITTER_BEARER_TOKEN) {
      const response = await axios.get(
        'https://api.twitter.com/2/tweets/search/recent?query=test&max_results=10',
        {
          headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` },
          timeout: 5000
        }
      );
      health.checks.twitter = { status: 'ok', rateLimit: response.headers['x-rate-limit-remaining'] };
    } else {
      health.checks.twitter = { status: 'not_configured' };
    }
  } catch (error) {
    health.checks.twitter = { status: 'error', error: error.message };
  }

  // Check NewsAPI
  try {
    if (process.env.NEWSAPI_KEY) {
      const response = await axios.get(
        'https://newsapi.org/v2/top-headlines?category=technology&pageSize=1',
        {
          params: { apiKey: process.env.NEWSAPI_KEY },
          timeout: 5000
        }
      );
      health.checks.newsapi = { status: 'ok' };
    } else {
      health.checks.newsapi = { status: 'not_configured' };
    }
  } catch (error) {
    health.checks.newsapi = { status: 'error', error: error.message };
  }

  // Check Groq API
  try {
    if (process.env.GROQ_API_KEY) {
      health.checks.groq = { status: 'configured' }; // Don't test actual API call
    } else {
      health.checks.groq = { status: 'not_configured' };
    }
  } catch (error) {
    health.checks.groq = { status: 'error', error: error.message };
  }

  // Check Cloudinary
  try {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      health.checks.cloudinary = { status: 'configured' };
    } else {
      health.checks.cloudinary = { status: 'not_configured' };
    }
  } catch (error) {
    health.checks.cloudinary = { status: 'error', error: error.message };
  }

  // Memory usage
  const memUsage = process.memoryUsage();
  health.memory = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
  };

  // Send response with appropriate status code
  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Job status
 * GET /api/health/jobs
 */
router.get('/jobs', (req, res) => {
  const trendDetectionJob = require('../jobs/trend-detection-job');
  const engagementTrackingJob = require('../jobs/engagement-tracking-job');
  const rlTrainingJob = require('../jobs/rl-training-job');

  res.json({
    jobs: {
      trendDetection: trendDetectionJob.getStatus(),
      engagementTracking: engagementTrackingJob.getStatus(),
      rlTraining: rlTrainingJob.getStatus()
    }
  });
});

module.exports = router;
