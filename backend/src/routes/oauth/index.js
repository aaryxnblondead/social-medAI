import express from 'express';
import { verifyToken } from '../../util/auth.js';
import { User } from '../../schema/user.js';
import { getRedis } from '../../util/redis.js';
import { buildLinkedInAuthUrl, buildTwitterAuthUrl, generatePkceVerifier, sha256Base64url } from '../../services/oauth.js';

const router = express.Router();
router.use(verifyToken);

// Provide auth URL for platform (server would construct real URL)
router.get('/:platform/auth-url', async (req, res) => {
  const { platform } = req.params;
  const redis = getRedis();
  const state = Math.random().toString(36).slice(2);
  if (redis) {
    await redis.set(`oauth:state:${state}`, JSON.stringify({ userId: req.userId, platform }), 'EX', 600);
  }
  if (platform === 'linkedin') {
    const url = buildLinkedInAuthUrl({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      redirectUri: process.env.LINKEDIN_REDIRECT_URI,
      state
    });
    return res.json({ platform, url });
  }
  if (platform === 'twitter') {
    const codeVerifier = generatePkceVerifier();
    const codeChallenge = sha256Base64url(codeVerifier);
    if (redis) await redis.set(`oauth:cv:${state}`, codeVerifier, 'EX', 600);
    const url = buildTwitterAuthUrl({
      clientId: process.env.TWITTER_CLIENT_ID,
      redirectUri: process.env.TWITTER_REDIRECT_URI,
      state,
      codeChallenge,
      codeChallengeMethod: 'S256'
    });
    return res.json({ platform, url });
  }
  if (platform === 'facebook' || platform === 'instagram') {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
      state,
      response_type: 'code',
      scope: (process.env.FACEBOOK_SCOPES || 'pages_manage_posts pages_read_engagement instagram_basic instagram_manage_insights').toString()
    });
    const url = `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
    return res.json({ platform, url });
  }
  return res.status(400).json({ error: 'unsupported platform' });
});

// Recommended scopes to guide the client UI
router.get('/:platform/recommended-scopes', async (req, res) => {
  const { platform } = req.params;
  if (platform === 'linkedin') {
    const scopes = (process.env.LINKEDIN_SCOPES || 'r_liteprofile w_member_social').toString().split(/[ ,]+/);
    return res.json({ platform, scopes });
  }
  if (platform === 'twitter') {
    const scopes = (process.env.TWITTER_SCOPES || 'tweet.read tweet.write users.read offline.access').toString().split(/[ ,]+/);
    return res.json({ platform, scopes });
  }
  if (platform === 'facebook' || platform === 'instagram') {
    const scopes = (process.env.FACEBOOK_SCOPES || 'pages_manage_posts pages_read_engagement instagram_basic instagram_manage_insights').toString().split(/[ ,]+/);
    return res.json({ platform, scopes });
  }
  return res.status(400).json({ error: 'unsupported platform' });
});

// Callback handler (stub): mark connected
router.post('/:platform/callback', async (req, res) => {
  const { platform } = req.params;
  const { accessToken = 'stub', refreshToken = 'stub', username = 'stub_user', authorUrn, accountId } = req.body;
  const update = {};
  update[`socialAccounts.${platform}`] = {
    connected: true,
    accessToken,
    refreshToken,
    tokenExpiry: new Date(Date.now() + 3600 * 1000),
    username,
    authorUrn,
    accountId
  };
  await User.findByIdAndUpdate(req.userId, update);
  res.json({ ok: true });
});

export default router;
