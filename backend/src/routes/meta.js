import express from 'express';
import axios from 'axios';
import { verifyToken } from '../util/auth.js';
import { User } from '../schema/user.js';
import { Post } from '../schema/post.js';
import { publishToFacebookPage, publishToInstagramBusiness } from '../services/publish.js';

const router = express.Router();
router.use(verifyToken);

function fbClient(accessToken) {
  const instance = axios.create({ baseURL: 'https://graph.facebook.com/v20.0' });
  instance.interceptors.request.use(cfg => {
    cfg.params = { ...(cfg.params || {}), access_token: accessToken };
    return cfg;
  });
  return instance;
}

router.get('/pages', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const token = user?.socialAccounts?.facebook?.accessToken;
    if (!token) return res.status(400).json({ error: 'facebook not connected' });
    const client = fbClient(token);
    const r = await client.get('/me/accounts');
    res.json({ pages: r.data?.data || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/pages/select', async (req, res) => {
  try {
    const { pageId } = req.body;
    await User.findByIdAndUpdate(req.userId, { 'socialAccounts.facebook.pageId': pageId });
    res.json({ ok: true, pageId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/instagram-account', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const token = user?.socialAccounts?.facebook?.accessToken;
    const pageId = user?.socialAccounts?.facebook?.pageId;
    if (!token || !pageId) return res.status(400).json({ error: 'facebook page not resolved' });
    const client = fbClient(token);
    const r = await client.get(`/${pageId}`, { params: { fields: 'instagram_business_account' } });
    const igId = r.data?.instagram_business_account?.id || null;
    if (igId) await User.findByIdAndUpdate(req.userId, { 'socialAccounts.instagram.igBusinessId': igId });
    res.json({ igBusinessId: igId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/pages/:pageId/publish', async (req, res) => {
  try {
    const { text, imageUrl, postId } = req.body;
    const user = await User.findById(req.userId);
    const token = user?.socialAccounts?.facebook?.accessToken;
    if (!token) return res.status(400).json({ error: 'facebook not connected' });
    const result = await publishToFacebookPage({ accessToken: token, pageId: req.params.pageId, text, imageUrl });
    if (postId) {
      await Post.findOneAndUpdate({ _id: postId, userId: req.userId }, {
        status: 'published',
        publishedAt: new Date(),
        platformPostId: result.id || null,
        platformUrl: result.url || null
      });
    }
    res.json({ ok: true, result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/instagram/:igBusinessId/publish', async (req, res) => {
  try {
    const { caption, imageUrl, postId } = req.body;
    const user = await User.findById(req.userId);
    const token = user?.socialAccounts?.facebook?.accessToken;
    if (!token) return res.status(400).json({ error: 'instagram not connected via facebook token' });
    const result = await publishToInstagramBusiness({
      accessToken: token,
      igBusinessId: req.params.igBusinessId,
      caption,
      imageUrl
    });
    if (postId) {
      await Post.findOneAndUpdate({ _id: postId, userId: req.userId }, {
        status: 'published',
        publishedAt: new Date(),
        platformPostId: result.id || null,
        platformUrl: result.url || null
      });
    }
    res.json({ ok: true, result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
