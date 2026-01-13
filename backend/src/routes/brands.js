import express from 'express';
import { verifyToken } from '../util/auth.js';
import { Brand } from '../schema/brand.js';

const router = express.Router();

router.use(verifyToken);

function normalizePreferences(preferences = {}, fallback = {}) {
  return {
    frequency: preferences.frequency ?? preferences.cadence ?? fallback.frequency ?? fallback.cadence ?? 0,
    cadence: preferences.cadence ?? preferences.frequency ?? fallback.cadence ?? fallback.frequency ?? 0,
    focus: preferences.focus ?? fallback.focus ?? '',
    bestTimes: preferences.bestTimes ?? fallback.bestTimes ?? []
  };
}

function buildCreatePayload(body = {}) {
  return {
    name: body.name,
    industry: body.industry || 'technology',
    persona: body.persona || 'brand',
    objective: body.objective || 'Launch campaign',
    colors: body.colors || [],
    tone: body.tone || 'professional',
    pillars: body.pillars || [],
    audience: body.audience || '',
    preferences: normalizePreferences(body.preferences)
  };
}

function buildUpdatePayload(body = {}, existing = {}) {
  const payload = {};
  ['name', 'industry', 'persona', 'objective', 'tone', 'audience'].forEach((field) => {
    if (typeof body[field] !== 'undefined') payload[field] = body[field];
  });
  if (Array.isArray(body.colors)) payload.colors = body.colors;
  if (Array.isArray(body.pillars)) payload.pillars = body.pillars;
  if (typeof body.preferences !== 'undefined') {
    payload.preferences = normalizePreferences(body.preferences, existing.preferences || {});
  }
  return payload;
}

router.post('/', async (req, res) => {
  try {
    const payload = buildCreatePayload(req.body);
    if (!payload.name || !payload.industry) {
      return res.status(400).json({ error: 'name and industry required' });
    }
    const brand = await Brand.create({ userId: req.userId, ...payload });
    res.json(brand);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(brands);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await Brand.findOne({ _id: req.params.id, userId: req.userId });
    if (!existing) return res.status(404).json({ error: 'not found' });
    const payload = buildUpdatePayload(req.body, existing);
    Object.assign(existing, payload);
    await existing.save();
    res.json(existing);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Onboarding convenience: save onboarding payload with validation
router.post('/onboard', async (req, res) => {
  try {
    const payload = buildCreatePayload(req.body);
    if (!payload.name || !payload.industry) {
      return res.status(400).json({ error: 'name and industry required' });
    }
    let brand = await Brand.findOne({ userId: req.userId });
    if (brand) {
      Object.assign(brand, payload);
      await brand.save();
    } else {
      brand = await Brand.create({ userId: req.userId, ...payload });
    }
    res.json({ ok: true, brand });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
