const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { User } = require('../models');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

// In-memory storage for OAuth states (use Redis in production)
const oauthStates = new Map();

// ============================================================================
// TWITTER OAUTH 2.0
// ============================================================================

/**
 * Initiate Twitter OAuth 2.0 flow
 * Redirects user to Twitter authorization page
 */
router.get('/twitter/connect', verifyToken, async (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    const codeChallenge = crypto.randomBytes(32).toString('base64url');
    
    // Store state and code challenge with user ID
    oauthStates.set(state, {
      userId: req.userId,
      codeChallenge,
      platform: 'twitter',
      createdAt: Date.now()
    });

    // Clean up old states (older than 10 minutes)
    for (const [key, value] of oauthStates.entries()) {
      if (Date.now() - value.createdAt > 10 * 60 * 1000) {
        oauthStates.delete(key);
      }
    }

    const authUrl = new URL('https://twitter.com/i/oauth2/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', process.env.TWITTER_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', process.env.TWITTER_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read offline.access');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'plain');

    res.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Twitter OAuth init error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Twitter OAuth callback handler
 * Exchanges authorization code for access token
 */
router.get('/twitter/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const stateData = oauthStates.get(state);
    if (!stateData) {
      return res.status(400).json({ error: 'Invalid or expired state' });
    }

    oauthStates.delete(state);

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: process.env.TWITTER_CLIENT_ID,
        redirect_uri: process.env.TWITTER_REDIRECT_URI,
        code_verifier: stateData.codeChallenge
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
          ).toString('base64')}`
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user's Twitter info
    const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const twitterUser = userResponse.data.data;

    // Update user record with Twitter credentials
    await User.findByIdAndUpdate(stateData.userId, {
      $set: {
        'socialAccounts.twitter': {
          connected: true,
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiry: new Date(Date.now() + expires_in * 1000),
          userId: twitterUser.id,
          username: twitterUser.username,
          name: twitterUser.name
        }
      }
    });

    // Redirect to success page
    res.redirect(`${process.env.FRONTEND_URL}/settings/social?platform=twitter&status=success`);
  } catch (error) {
    console.error('Twitter OAuth callback error:', error.response?.data || error);
    res.redirect(`${process.env.FRONTEND_URL}/settings/social?platform=twitter&status=error`);
  }
});

/**
 * Disconnect Twitter account
 */
router.delete('/twitter/disconnect', verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $unset: { 'socialAccounts.twitter': 1 }
    });

    res.json({ success: true, message: 'Twitter account disconnected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LINKEDIN OAUTH 2.0
// ============================================================================

/**
 * Initiate LinkedIn OAuth 2.0 flow
 */
router.get('/linkedin/connect', verifyToken, async (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    
    oauthStates.set(state, {
      userId: req.userId,
      platform: 'linkedin',
      createdAt: Date.now()
    });

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', process.env.LINKEDIN_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', process.env.LINKEDIN_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'w_member_social r_liteprofile r_emailaddress');
    authUrl.searchParams.set('state', state);

    res.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('LinkedIn OAuth init error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * LinkedIn OAuth callback handler
 */
router.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const stateData = oauthStates.get(state);
    if (!stateData) {
      return res.status(400).json({ error: 'Invalid or expired state' });
    }

    oauthStates.delete(state);

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    // Get user's LinkedIn profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const linkedinProfile = profileResponse.data;

    // Update user record
    await User.findByIdAndUpdate(stateData.userId, {
      $set: {
        'socialAccounts.linkedin': {
          connected: true,
          accessToken: access_token,
          tokenExpiry: new Date(Date.now() + expires_in * 1000),
          userId: linkedinProfile.id,
          firstName: linkedinProfile.localizedFirstName,
          lastName: linkedinProfile.localizedLastName
        }
      }
    });

    res.redirect(`${process.env.FRONTEND_URL}/settings/social?platform=linkedin&status=success`);
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error.response?.data || error);
    res.redirect(`${process.env.FRONTEND_URL}/settings/social?platform=linkedin&status=error`);
  }
});

/**
 * Disconnect LinkedIn account
 */
router.delete('/linkedin/disconnect', verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $unset: { 'socialAccounts.linkedin': 1 }
    });

    res.json({ success: true, message: 'LinkedIn account disconnected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// FACEBOOK OAUTH 2.0
// ============================================================================

/**
 * Initiate Facebook OAuth 2.0 flow
 */
router.get('/facebook/connect', verifyToken, async (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    
    oauthStates.set(state, {
      userId: req.userId,
      platform: 'facebook',
      createdAt: Date.now()
    });

    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', process.env.FACEBOOK_APP_ID);
    authUrl.searchParams.set('redirect_uri', process.env.FACEBOOK_REDIRECT_URI);
    authUrl.searchParams.set('scope', 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish');
    authUrl.searchParams.set('state', state);

    res.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Facebook OAuth init error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Facebook OAuth callback handler
 */
router.get('/facebook/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const stateData = oauthStates.get(state);
    if (!stateData) {
      return res.status(400).json({ error: 'Invalid or expired state' });
    }

    oauthStates.delete(state);

    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code
      }
    });

    const { access_token } = tokenResponse.data;

    // Get long-lived token
    const longLivedResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: access_token
      }
    });

    const longLivedToken = longLivedResponse.data.access_token;

    // Get user's pages
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: { access_token: longLivedToken }
    });

    const pages = pagesResponse.data.data;

    // Update user record with first page (or allow user to select)
    const selectedPage = pages[0];
    
    await User.findByIdAndUpdate(stateData.userId, {
      $set: {
        'socialAccounts.facebook': {
          connected: true,
          accessToken: selectedPage?.access_token || longLivedToken,
          pageId: selectedPage?.id,
          pageName: selectedPage?.name,
          pages: pages.map(p => ({ id: p.id, name: p.name }))
        }
      }
    });

    res.redirect(`${process.env.FRONTEND_URL}/settings/social?platform=facebook&status=success`);
  } catch (error) {
    console.error('Facebook OAuth callback error:', error.response?.data || error);
    res.redirect(`${process.env.FRONTEND_URL}/settings/social?platform=facebook&status=error`);
  }
});

/**
 * Disconnect Facebook account
 */
router.delete('/facebook/disconnect', verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $unset: { 'socialAccounts.facebook': 1 }
    });

    res.json({ success: true, message: 'Facebook account disconnected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// INSTAGRAM (uses Facebook Graph API)
// ============================================================================

/**
 * Get Instagram Business Account from connected Facebook page
 */
router.get('/instagram/connect', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user.socialAccounts?.facebook?.connected) {
      return res.status(400).json({ 
        error: 'Please connect Facebook first. Instagram requires Facebook Page connection.' 
      });
    }

    const pageAccessToken = user.socialAccounts.facebook.accessToken;
    const pageId = user.socialAccounts.facebook.pageId;

    // Get Instagram Business Account connected to this page
    const igResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${pageId}`,
      {
        params: {
          fields: 'instagram_business_account',
          access_token: pageAccessToken
        }
      }
    );

    const igAccountId = igResponse.data.instagram_business_account?.id;

    if (!igAccountId) {
      return res.status(400).json({ 
        error: 'No Instagram Business Account connected to this Facebook Page' 
      });
    }

    // Update user record
    await User.findByIdAndUpdate(req.userId, {
      $set: {
        'socialAccounts.instagram': {
          connected: true,
          businessAccountId: igAccountId,
          accessToken: pageAccessToken
        }
      }
    });

    res.json({ 
      success: true, 
      message: 'Instagram Business Account connected',
      accountId: igAccountId 
    });
  } catch (error) {
    console.error('Instagram connect error:', error.response?.data || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Disconnect Instagram account
 */
router.delete('/instagram/disconnect', verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $unset: { 'socialAccounts.instagram': 1 }
    });

    res.json({ success: true, message: 'Instagram account disconnected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// UTILITY ENDPOINTS
// ============================================================================

/**
 * Get all connected social accounts for current user
 */
router.get('/status', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('socialAccounts');
    
    const status = {
      twitter: user.socialAccounts?.twitter?.connected || false,
      linkedin: user.socialAccounts?.linkedin?.connected || false,
      facebook: user.socialAccounts?.facebook?.connected || false,
      instagram: user.socialAccounts?.instagram?.connected || false
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Refresh Twitter access token using refresh token
 */
router.post('/twitter/refresh', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user.socialAccounts?.twitter?.refreshToken) {
      return res.status(400).json({ error: 'No refresh token available' });
    }

    const tokenResponse = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: user.socialAccounts.twitter.refreshToken,
        client_id: process.env.TWITTER_CLIENT_ID
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
          ).toString('base64')}`
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    await User.findByIdAndUpdate(req.userId, {
      $set: {
        'socialAccounts.twitter.accessToken': access_token,
        'socialAccounts.twitter.refreshToken': refresh_token,
        'socialAccounts.twitter.tokenExpiry': new Date(Date.now() + expires_in * 1000)
      }
    });

    res.json({ success: true, message: 'Token refreshed' });
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Twitter token status for frontend health display
 */
router.get('/twitter/token-status', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('socialAccounts.twitter');
    const tw = user?.socialAccounts?.twitter;
    const connected = !!tw?.accessToken;
    const expiryMs = tw?.tokenExpiry ? new Date(tw.tokenExpiry).getTime() : null;
    const now = Date.now();
    const remainingMs = expiryMs ? Math.max(expiryMs - now, 0) : null;
    const remainingMinutes = remainingMs !== null ? Math.round(remainingMs / 60000) : null;
    const needsRefresh = connected && remainingMs !== null && remainingMs <= 5 * 60 * 1000;

    res.json({
      connected,
      expiresAt: tw?.tokenExpiry || null,
      remainingMinutes,
      needsRefresh,
      hasRefreshToken: !!tw?.refreshToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * LinkedIn token status for frontend health display
 */
router.get('/linkedin/token-status', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('socialAccounts.linkedin');
    const li = user?.socialAccounts?.linkedin;
    const connected = !!li?.accessToken;
    const expiryMs = li?.tokenExpiry ? new Date(li.tokenExpiry).getTime() : null;
    const now = Date.now();
    const remainingMs = expiryMs ? Math.max(expiryMs - now, 0) : null;
    const remainingMinutes = remainingMs !== null ? Math.round(remainingMs / 60000) : null;
    const needsReconnect = connected && remainingMs !== null && remainingMs <= 5 * 60 * 1000;

    res.json({
      connected,
      expiresAt: li?.tokenExpiry || null,
      remainingMinutes,
      needsReconnect
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Facebook token status for frontend health display
 */
router.get('/facebook/token-status', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('socialAccounts.facebook');
    const fb = user?.socialAccounts?.facebook;
    const connected = !!fb?.accessToken;
    res.json({ connected, pageId: fb?.pageId || null, pageName: fb?.pageName || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Instagram token status for frontend health display
 */
router.get('/instagram/token-status', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('socialAccounts.instagram');
    const ig = user?.socialAccounts?.instagram;
    const connected = !!ig?.accessToken && !!ig?.businessAccountId;
    res.json({ connected, businessAccountId: ig?.businessAccountId || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
