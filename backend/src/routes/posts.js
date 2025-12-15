import express from 'express';
import { verifyToken } from '../util/auth.js';
import { Post } from '../schema/post.js';
import { Brand } from '../schema/brand.js';
import { generateCopyWithGroq, generateImageWithStability } from '../services/generation.js';
import { publishToTwitter, publishToLinkedIn } from '../services/publish.js';
import { User } from '../schema/user.js';

const router = express.Router();
router.use(verifyToken);

router.post('/generate', async (req, res) => {
  try {
    const { brandId, trendId, platform = 'twitter' } = req.body;
    const brand = await Brand.findOne({ _id: brandId, userId: req.userId });
    const trend = { id: trendId, title: 'Stub trend' };
    const copy = await generateCopyWithGroq({ brand, trend, platform });
    const image = await generateImageWithStability({ brand, copy: copy.text });
    const draft = await Post.create({
      userId: req.userId,
      brandId,
      platform,
      status: 'draft',
      content: { copy: copy.text, graphicUrl: image.url }
    });
    res.json(draft);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  const posts = await Post.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(posts);
});

router.post('/:id/publish', async (req, res) => {
  try {
    const { platform } = req.body || {};
    let post = await Post.findOne({ _id: req.params.id, userId: req.userId });
    if (!post) return res.status(404).json({ error: 'not found' });
    const user = await User.findById(req.userId);
    const targetPlatform = platform || post.platform;
    let result = { id: null, url: null };
    if (targetPlatform === 'twitter') {
      const token = user?.socialAccounts?.twitter?.accessToken;
      result = await publishToTwitter({ accessToken: token, text: post.content?.copy });
    } else if (targetPlatform === 'linkedin') {
      const token = user?.socialAccounts?.linkedin?.accessToken;
      const authorUrn = user?.socialAccounts?.linkedin?.authorUrn;
      result = await publishToLinkedIn({ accessToken: token, authorUrn, text: post.content?.copy, mediaUrl: post.content?.graphicUrl });
    } else {
      return res.status(400).json({ error: 'unsupported platform' });
    }
    post = await Post.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, {
      status: 'published',
      publishedAt: new Date(),
      platformPostId: result.id || null,
      platformUrl: result.url || null
    }, { new: true });
    res.json({ ok: true, post });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
