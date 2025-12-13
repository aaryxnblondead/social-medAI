const rateLimit = require('express-rate-limit');
const redis = require('../config/redis');

// Note: Redis store requires additional setup in production
// For now, using memory store (works in single-instance deployments)

/**
 * General API rate limiter - 100 requests per 15 minutes
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Authentication rate limiter - 5 login attempts per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true // Don't count successful logins
});

/**
 * Content generation rate limiter - 20 posts per hour
 */
const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Content generation limit reached. Please try again later.',
  skip: (req) => !req.userId, // Skip rate limit if not authenticated
  keyGenerator: (req) => req.userId || 'anonymous'
});

/**
 * Publishing rate limiter - 30 publishes per hour
 */
const publishLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Publishing limit reached. Please try again later.',
  skip: (req) => !req.userId,
  keyGenerator: (req) => req.userId || 'anonymous'
});

/**
 * OAuth rate limiter - 3 OAuth flows per 10 minutes
 */
const oauthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: 'Too many OAuth attempts, please try again later.',
  skip: (req) => !req.userId,
  keyGenerator: (req) => req.userId || 'anonymous'
});

module.exports = {
  apiLimiter,
  authLimiter,
  generationLimiter,
  publishLimiter,
  oauthLimiter
};
