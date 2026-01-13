import express from 'express';
import { verifyToken } from '../util/auth.js';
import { fetchTrendsFromSources } from '../services/trends.js';

const router = express.Router();
router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const category = (req.query.category || 'technology').toString().toLowerCase();
    const refresh = req.query.refresh === 'true';
    const { items, source } = await fetchTrendsFromSources({ category, refresh });
    res.json({ items, source });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
