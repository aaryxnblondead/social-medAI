import express from 'express';
import { verifyToken } from '../util/auth.js';
import { Brand } from '../schema/brand.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', async (req, res) => {
  try {
    const brand = await Brand.create({ userId: req.userId, ...req.body });
    res.json(brand);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find({ userId: req.userId });
    res.json(brands);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Brand.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Onboarding convenience: save onboarding payload with validation
router.post('/onboard', async (req, res) => {
  try {
    const { name, industry, colors = [], tone, pillars = [], audience, preferences = {} } = req.body;
    if (!name || !industry) return res.status(400).json({ error: 'name and industry required' });
    const brand = await Brand.create({
      userId: req.userId,
      name, industry, colors, tone, pillars, audience,
      preferences
    });
    res.json({ ok: true, brand });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
