const express = require('express');
const router = express.Router();
const { BrandProfile } = require('../models');
const auth = require('../middleware/auth');

// Apply auth to all routes
router.use(auth);

// Create brand
router.post('/', async (req, res, next) => {
  try {
    const { brandName, industry, targetAudience, voiceTone, keywords } = req.body;
    if (!brandName || !industry || !targetAudience) {
      return res.status(400).json({ error: 'brandName, industry, targetAudience are required' });
    }
    const brand = await BrandProfile.create({
      userId: req.userId,
      brandName,
      industry,
      targetAudience,
      brandVoice: voiceTone || 'professional',
      keywords: Array.isArray(keywords) ? keywords : []
    });
    res.status(201).json({ message: 'Brand created successfully', brand });
  } catch (err) { next(err); }
});

// List brands for current user
router.get('/', async (req, res, next) => {
  try {
    const brands = await BrandProfile.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ count: brands.length, brands });
  } catch (err) { next(err); }
});

// Get single brand
router.get('/:id', async (req, res, next) => {
  try {
    const brand = await BrandProfile.findOne({ _id: req.params.id, userId: req.userId });
    if (!brand) return res.status(404).json({ error: 'Not found' });
    res.json({ brand });
  } catch (err) { next(err); }
});

// Update brand
router.put('/:id', async (req, res, next) => {
  try {
    const updates = {};
    const fields = ['brandName', 'industry', 'targetAudience', 'brandVoice', 'keywords'];
    for (const f of fields) {
      if (typeof req.body[f] !== 'undefined') updates[f] = req.body[f];
    }
    updates.updatedAt = new Date();
    const brand = await BrandProfile.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updates },
      { new: true }
    );
    if (!brand) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Brand updated', brand });
  } catch (err) { next(err); }
});

// Delete brand
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await BrandProfile.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Brand deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
