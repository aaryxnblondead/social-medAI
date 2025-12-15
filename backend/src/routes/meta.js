import express from 'express';
import axios from 'axios';
import { verifyToken } from '../util/auth.js';
import { User } from '../schema/user.js';
import { Post } from '../schema/post.js';

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
    const client = fbClient(token);
    let result = null;
    if (imageUrl) {
      // Publish photo to page
      const r = await client.post(`/${req.params.pageId}/photos`, null, { params: { url: imageUrl, caption: text || '' } });
      result = { id: r.data?.id, url: null };
    } else {
      const r = await client.post(`/${req.params.pageId}/feed`, null, { params: { message: text || '' } });
      result = { id: r.data?.id, url: null };
    }
    if (postId) {
      await Post.findOneAndUpdate({ _id: postId, userId: req.userId }, {
        status: 'published',
        publishedAt: new Date(),
        platformPostId: result.id || null,
        platformUrl: null
      });
    }
    res.json({ ok: true, result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/instagram/:igBusinessId/publish', async (req, res) => {
  try {
    // Note: IG requires creating a container then publishing
    const { caption, imageUrl, postId } = req.body;
    const user = await User.findById(req.userId);
    const token = user?.socialAccounts?.facebook?.accessToken; // IG uses FB Graph
    if (!token) return res.status(400).json({ error: 'instagram not connected via facebook token' });
    const client = fbClient(token);
    const igId = req.params.igBusinessId;
    // Step 1: create media container
    const container = await client.post(`/${igId}/media`, null, { params: { image_url: imageUrl, caption: caption || '' } });
    const creationId = container.data?.id;
    // Step 2: publish container
    const publish = await client.post(`/${igId}/media_publish`, null, { params: { creation_id: creationId } });
    const id = publish.data?.id;
    if (postId) {
      await Post.findOneAndUpdate({ _id: postId, userId: req.userId }, {
        status: 'published',
        publishedAt: new Date(),
        platformPostId: id || null,
        platformUrl: null
      });
    }
    res.json({ ok: true, id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
