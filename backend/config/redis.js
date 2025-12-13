const redis = require('redis');

let redisClient;

// Create Redis client
if (process.env.REDIS_URL) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis: Too many retries, stopping reconnection attempts');
          return new Error('Too many retries');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  redisClient.on('connect', () => console.log('✅ Redis connected'));
  redisClient.on('reconnecting', () => console.log('🔄 Redis reconnecting...'));

  // Connect to Redis
  redisClient.connect().catch(console.error);
} else {
  console.warn('⚠️  REDIS_URL not configured - using in-memory cache only');
  // Create a mock client for development
  redisClient = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    exists: async () => 0,
    expire: async () => 1,
    incr: async () => 1
  };
}

module.exports = redisClient;
