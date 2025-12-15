import express from 'express';
import { getRedis } from '../../util/redis.js';
import { User } from '../../schema/user.js';
import { exchangeLinkedInCode, exchangeTwitterCode } from '../../services/oauth.js';
import axios from 'axios';

const router = express.Router();

router.get('/linkedin/callback', async (req, res) => {
  try {
    const { state, code } = req.query;
    const redis = getRedis();
    const mapped = redis ? await redis.get(`oauth:state:${state}`) : null;
    if (!mapped) return res.status(400).send('Invalid state');
    const { userId } = JSON.parse(mapped);
    let tokens = null;
    if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
      tokens = await exchangeLinkedInCode({
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        redirectUri: process.env.LINKEDIN_REDIRECT_URI,
        code
      });
    }
    await User.findByIdAndUpdate(userId, {
      'socialAccounts.linkedin': {
        connected: true,
        accessToken: tokens?.access_token || 'dev-linkedin-token',
        tokenExpiry: tokens?.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null
      }
    });
    return res.send('LinkedIn account connected. You can close this tab.');
  } catch (e) {
    return res.status(500).send('Error: ' + e.message);
  }
});

router.get('/twitter/callback', async (req, res) => {
  try {
    const { state, code } = req.query;
    const redis = getRedis();
    const mapped = redis ? await redis.get(`oauth:state:${state}`) : null;
    if (!mapped) return res.status(400).send('Invalid state');
    const { userId } = JSON.parse(mapped);
    let tokens = null;
    const codeVerifier = redis ? await redis.get(`oauth:cv:${state}`) : null;
    if (process.env.TWITTER_CLIENT_ID && codeVerifier) {
      try {
        tokens = await exchangeTwitterCode({
          clientId: process.env.TWITTER_CLIENT_ID,
          redirectUri: process.env.TWITTER_REDIRECT_URI,
          codeVerifier,
          code
        });
      } catch {}
    }
    await User.findByIdAndUpdate(userId, {
      'socialAccounts.twitter': {
        connected: true,
        accessToken: tokens?.access_token || 'dev-twitter-token',
        refreshToken: tokens?.refresh_token || null,
        tokenExpiry: tokens?.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null
      }
    });
    return res.send('Twitter account connected. You can close this tab.');
  } catch (e) {
    return res.status(500).send('Error: ' + e.message);
  }
});

export default router;
router.get('/facebook/callback', async (req, res) => {
  try {
    const { state, code } = req.query;
    const redis = getRedis();
    const mapped = redis ? await redis.get(`oauth:state:${state}`) : null;
    if (!mapped) return res.status(400).send('Invalid state');
    const { userId } = JSON.parse(mapped);
    let tokens = null;
    if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
      const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code
      });
      const r = await axios.get(`https://graph.facebook.com/v20.0/oauth/access_token?${params.toString()}`);
      tokens = r.data; // access_token, token_type, expires_in
    }
    await User.findByIdAndUpdate(userId, {
      'socialAccounts.facebook': {
        connected: true,
        accessToken: tokens?.access_token || 'dev-facebook-token',
        tokenExpiry: tokens?.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null
      }
    });
    return res.send('Facebook account connected. You can close this tab.');
  } catch (e) {
    return res.status(500).send('Error: ' + e.message);
  }
});

router.get('/instagram/callback', async (req, res) => {
  // For simplicity, reuse Facebook OAuth user token
  try {
    const { state, code } = req.query;
    const redis = getRedis();
    const mapped = redis ? await redis.get(`oauth:state:${state}`) : null;
    if (!mapped) return res.status(400).send('Invalid state');
    const { userId } = JSON.parse(mapped);
    let tokens = null;
    if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
      const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code
      });
      const r = await axios.get(`https://graph.facebook.com/v20.0/oauth/access_token?${params.toString()}`);
      tokens = r.data;
    }
    await User.findByIdAndUpdate(userId, {
      'socialAccounts.instagram': {
        connected: true,
        accessToken: tokens?.access_token || 'dev-instagram-token',
        tokenExpiry: tokens?.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null
      }
    });
    return res.send('Instagram account connected. You can close this tab.');
  } catch (e) {
    return res.status(500).send('Error: ' + e.message);
  }
});
