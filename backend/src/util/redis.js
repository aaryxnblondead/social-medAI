import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redis;
try {
  redis = new Redis(redisUrl);
  redis.on('error', (e) => console.warn('Redis error', e.message));
} catch (e) {
  console.warn('Redis init failed:', e.message);
}

export function getRedis() {
  return redis;
}
