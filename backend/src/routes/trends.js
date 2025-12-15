import express from 'express';
import { verifyToken } from '../util/auth.js';
import { fetchTrendsFromSources } from '../services/trends.js';
import { getRedis } from '../util/redis.js';

const router = express.Router();
router.use(verifyToken);

// Stub: returns empty list initially
router.get('/', async (req, res) => {
  const redis = getRedis();
  const category = (req.query.category || 'technology').toString();
  const cacheKey = `trends:${category}`;
  let cached = null;
  if (redis) {
    try { cached = await redis.get(cacheKey); } catch {}
  }
  if (cached) {
    return res.json({ items: JSON.parse(cached), source: 'cache' });
  }
  const items = await fetchTrendsFromSources({ category });
  if (redis) {
    try { await redis.set(cacheKey, JSON.stringify(items), 'EX', 60 * 15); } catch {}
  }
  res.json({ items, source: 'mixed' });
});

export default router;
