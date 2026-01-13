import express from 'express';
import { verifyToken } from '../util/auth.js';
import { Post } from '../schema/post.js';
import { Brand } from '../schema/brand.js';
import { generateCopyWithGroq, generateImageWithStability } from '../services/generation.js';
import {
  publishToTwitter,
  publishToLinkedIn,
  publishToFacebookPage,
  publishToInstagramBusiness
} from '../services/publish.js';
import { User } from '../schema/user.js';
import { fetchTrendsFromSources, getTrendById } from '../services/trends.js';

const router = express.Router();
router.use(verifyToken);

function industryToCategory(industry = '') {
  const value = industry.toLowerCase();
  if (value.includes('fin')) return 'finance';
  if (value.includes('travel')) return 'travel';
  if (value.includes('culture') || value.includes('consumer') || value.includes('media')) return 'culture';
  if (value.includes('market') || value.includes('biz') || value.includes('growth')) return 'business';
  return 'technology';
}

function buildBrandSnapshot(brand) {
  if (!brand) return null;
  return {
    name: brand.name,
    persona: brand.persona,
    industry: brand.industry,
    tone: brand.tone,
    objective: brand.objective
  };
}

function fallbackTrend(brand) {
  const category = industryToCategory(brand?.industry);
  return {
    id: null,
    title: `${brand?.name || 'Brand'} spotlight`,
    description: 'Auto-generated talking point based on brand memory.',
    url: null,
    source: 'memory',
    category,
    imageUrl: null,
    metrics: {
      growth: '18.4%',
      volume: '240 mentions',
      sentiment: 'Neutral'
    }
  };
}

async function resolveTrend({ trendId, brand }) {
  if (trendId) {
    const cached = await getTrendById(trendId);
    if (cached) return cached;
  }
  const category = industryToCategory(brand?.industry);
  const { items } = await fetchTrendsFromSources({ category, refresh: true, limit: 10 });
  return items?.[0] || fallbackTrend(brand);
}

function formatPostResponse(postDoc) {
  if (!postDoc) return null;
  const json = postDoc.toObject({ virtuals: false });
  json.brand = json.brandSnapshot || null;
  return json;
}

router.post('/generate', async (req, res) => {
  try {
    const { brandId, trendId, platform = 'twitter' } = req.body;
    if (!brandId) return res.status(400).json({ error: 'brandId required' });
    const brand = await Brand.findOne({ _id: brandId, userId: req.userId });
    if (!brand) return res.status(404).json({ error: 'brand not found' });
    const trend = await resolveTrend({ trendId, brand });
    const copy = await generateCopyWithGroq({ brand, trend, platform });
    const image = await generateImageWithStability({ brand, copy: copy.text });
    const graphicUrl = image?.url || '';
    const draft = await Post.create({
      userId: req.userId,
      brandId,
      platform,
      status: 'draft',
      content: { copy: copy.text, graphicUrl },
      trend,
      brandSnapshot: buildBrandSnapshot(brand)
    });
    res.json(formatPostResponse(draft));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  const posts = await Post.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(posts.map((doc) => formatPostResponse(doc)));
});

router.post('/:id/publish', async (req, res) => {
  try {
    const { platform, copy } = req.body || {};
    const post = await Post.findOne({ _id: req.params.id, userId: req.userId });
    if (!post) return res.status(404).json({ error: 'not found' });
    const user = await User.findById(req.userId);
    const targetPlatform = (platform || post.platform || 'twitter').toLowerCase();
    const finalCopy = copy?.trim() ? copy.trim() : (post.content?.copy || '');
    if (!finalCopy) return res.status(400).json({ error: 'copy required before publishing' });

    const content = {
      copy: finalCopy,
      graphicUrl: post.content?.graphicUrl || ''
    };

    let result = { id: null, url: null };
    if (targetPlatform === 'twitter') {
      const token = user?.socialAccounts?.twitter?.accessToken;
      if (!token) return res.status(400).json({ error: 'connect twitter before publishing' });
      result = await publishToTwitter({ accessToken: token, text: finalCopy });
    } else if (targetPlatform === 'linkedin') {
      const token = user?.socialAccounts?.linkedin?.accessToken;
      const authorUrn = user?.socialAccounts?.linkedin?.authorUrn;
      if (!token || !authorUrn) return res.status(400).json({ error: 'connect linkedin before publishing' });
      result = await publishToLinkedIn({ accessToken: token, authorUrn, text: finalCopy, mediaUrl: content.graphicUrl });
    } else if (targetPlatform === 'facebook') {
      const token = user?.socialAccounts?.facebook?.accessToken;
      const pageId = user?.socialAccounts?.facebook?.pageId;
      if (!token || !pageId) return res.status(400).json({ error: 'connect a facebook page first' });
      result = await publishToFacebookPage({ accessToken: token, pageId, text: finalCopy, imageUrl: content.graphicUrl });
    } else if (targetPlatform === 'instagram') {
      const token = user?.socialAccounts?.facebook?.accessToken;
      const igBusinessId = user?.socialAccounts?.instagram?.igBusinessId;
      if (!token || !igBusinessId) return res.status(400).json({ error: 'connect instagram business via facebook' });
      if (!content.graphicUrl) return res.status(400).json({ error: 'instagram requires a graphic' });
      result = await publishToInstagramBusiness({ accessToken: token, igBusinessId, caption: finalCopy, imageUrl: content.graphicUrl });
    } else {
      return res.status(400).json({ error: 'unsupported platform' });
    }

    const updated = await Post.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        platform: targetPlatform,
        content,
        status: 'published',
        publishedAt: new Date(),
        platformPostId: result.id || null,
        platformUrl: result.url || null
      },
      { new: true }
    );

    res.json({ ok: true, post: formatPostResponse(updated), publication: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
