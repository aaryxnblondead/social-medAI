const redis = require('redis');

// Cache configuration
const CACHE_TTL = {
  TRENDS: 6 * 60 * 60,           // 6 hours
  COPY: 24 * 60 * 60,            // 24 hours
  IMAGES: 24 * 60 * 60,          // 24 hours
  BRAND_PROFILE: 12 * 60 * 60,   // 12 hours
  POST: 30 * 60,                 // 30 minutes
  ANALYTICS: 60 * 60             // 1 hour
};

// Generate cache key
const generateCacheKey = (prefix, ...args) => {
  return `${prefix}:${args.join(':')}`;
};

// Get from cache
const getFromCache = async (redisClient, key) => {
  try {
    if (!redisClient) return null;
    
    const data = await redisClient.get(key);
    if (data) {
      console.log(`✅ Cache HIT: ${key}`);
      return JSON.parse(data);
    }
    
    console.log(`❌ Cache MISS: ${key}`);
    return null;
  } catch (error) {
    console.warn(`⚠️ Cache read error: ${error.message}`);
    return null;
  }
};

// Set in cache
const setInCache = async (redisClient, key, data, ttl = CACHE_TTL.POST) => {
  try {
    if (!redisClient) return false;
    
    await redisClient.setEx(key, ttl, JSON.stringify(data));
    console.log(`💾 Cached: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Cache write error: ${error.message}`);
    return false;
  }
};

// Delete from cache
const deleteFromCache = async (redisClient, key) => {
  try {
    if (!redisClient) return false;
    
    await redisClient.del(key);
    console.log(`🗑️ Cache cleared: ${key}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Cache delete error: ${error.message}`);
    return false;
  }
};

// Invalidate pattern (e.g., "trends:*" or "copy:userId:*")
const invalidatePattern = async (redisClient, pattern) => {
  try {
    if (!redisClient) return false;
    
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🗑️ Invalidated ${keys.length} keys matching ${pattern}`);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`⚠️ Pattern invalidation error: ${error.message}`);
    return false;
  }
};

// Cache middleware for express (GET endpoints)
const cacheMiddleware = (prefix, ttl = CACHE_TTL.POST) => {
  return async (req, res, next) => {
    try {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const redisClient = req.app.get('redisClient');
      if (!redisClient) {
        return next();
      }

      // Generate cache key from user + path + query
      const cacheKey = generateCacheKey(
        prefix,
        req.userId || 'public',
        req.path,
        JSON.stringify(req.query)
      );

      // Try cache
      const cachedData = await getFromCache(redisClient, cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }

      // Store original res.json
      const originalJson = res.json.bind(res);
      
      // Override res.json to cache before sending
      res.json = function(data) {
        setInCache(redisClient, cacheKey, data, ttl).catch(err => 
          console.warn(`Cache set failed: ${err.message}`)
        );
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.warn(`Cache middleware error: ${error.message}`);
      next();
    }
  };
};

module.exports = {
  CACHE_TTL,
  generateCacheKey,
  getFromCache,
  setInCache,
  deleteFromCache,
  invalidatePattern,
  cacheMiddleware
};
