const express = require('express');
const { verifyToken } = require('../middleware/auth');
const adsDecisionEngine = require('../services/ads-decision-engine');
const { MetaAdsCampaign, GoogleAdsCampaign, GeneratedPost } = require('../models');

const router = express.Router();

/**
 * Analyze post for ad potential
 * POST /api/ads/analyze/:postId
 */
router.post('/analyze/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Verify user owns this post
    const post = await GeneratedPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const decision = await adsDecisionEngine.analyzePostForAds(postId);

    res.json(decision);
  } catch (error) {
    console.error('Ads analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create ad campaign from post
 * POST /api/ads/create/:postId
 */
router.post('/create/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { platform, budget } = req.body; // Allow manual override

    // Verify user owns this post
    const post = await GeneratedPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get analysis
    const decision = await adsDecisionEngine.analyzePostForAds(postId);

    // Allow manual creation even if decision says no
    if (!decision.shouldCreateAd && !req.body.forceCreate) {
      return res.status(400).json({ 
        error: 'Post does not meet automatic ad criteria', 
        decision,
        hint: 'Add "forceCreate": true to create anyway' 
      });
    }

    // Override platform/budget if provided
    if (platform) decision.recommendedPlatform = platform;
    if (budget) decision.recommendedBudget = budget;

    const campaign = await adsDecisionEngine.createAdCampaign(postId, decision);

    res.json({ 
      success: true, 
      campaign,
      message: `${decision.recommendedPlatform.toUpperCase()} ad campaign created with $${decision.recommendedBudget} budget`
    });
  } catch (error) {
    console.error('Campaign creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get ROI analytics for post + ad combination
 * GET /api/ads/roi/:postId
 */
router.get('/roi/:postId', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    // Verify user owns this post
    const post = await GeneratedPost.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const roi = await adsDecisionEngine.getROIAnalysis(postId);

    res.json(roi);
  } catch (error) {
    console.error('ROI analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * List all ad campaigns for current user
 * GET /api/ads/campaigns
 */
router.get('/campaigns', verifyToken, async (req, res) => {
  try {
    const { platform, status } = req.query;

    const metaCampaigns = await MetaAdsCampaign.find({ 
      userId: req.userId,
      ...(status && { status })
    }).populate('postId brandProfileId');

    const googleCampaigns = await GoogleAdsCampaign.find({ 
      userId: req.userId,
      ...(status && { status })
    }).populate('postId brandProfileId');

    let campaigns = [];

    if (!platform || platform === 'meta') {
      campaigns = [...campaigns, ...metaCampaigns.map(c => ({ ...c.toObject(), platform: 'meta' }))];
    }

    if (!platform || platform === 'google') {
      campaigns = [...campaigns, ...googleCampaigns.map(c => ({ ...c.toObject(), platform: 'google' }))];
    }

    // Sort by creation date
    campaigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      total: campaigns.length,
      meta: metaCampaigns.length,
      google: googleCampaigns.length,
      campaigns
    });
  } catch (error) {
    console.error('Campaigns list error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get single campaign details
 * GET /api/ads/campaigns/:campaignId
 */
router.get('/campaigns/:campaignId', verifyToken, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { platform } = req.query; // 'meta' or 'google'

    let campaign;

    if (platform === 'meta') {
      campaign = await MetaAdsCampaign.findById(campaignId).populate('postId brandProfileId');
    } else if (platform === 'google') {
      campaign = await GoogleAdsCampaign.findById(campaignId).populate('postId brandProfileId');
    } else {
      // Try both
      campaign = await MetaAdsCampaign.findById(campaignId).populate('postId brandProfileId');
      if (!campaign) {
        campaign = await GoogleAdsCampaign.findById(campaignId).populate('postId brandProfileId');
      }
    }

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Campaign details error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update campaign (pause/resume/update budget)
 * PUT /api/ads/campaigns/:campaignId
 */
router.put('/campaigns/:campaignId', verifyToken, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { platform, action, budget } = req.body; // action: 'pause', 'resume', 'update_budget'

    let campaign;

    if (platform === 'meta') {
      campaign = await MetaAdsCampaign.findById(campaignId);
    } else if (platform === 'google') {
      campaign = await GoogleAdsCampaign.findById(campaignId);
    } else {
      return res.status(400).json({ error: 'Platform required (meta or google)' });
    }

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Update based on action
    switch (action) {
      case 'pause':
        campaign.status = 'PAUSED';
        break;
      case 'resume':
        campaign.status = 'ACTIVE';
        break;
      case 'update_budget':
        if (!budget) {
          return res.status(400).json({ error: 'Budget required for update_budget action' });
        }
        campaign.budget.daily = Math.round(budget / 30);
        campaign.budget.total = budget;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action. Use: pause, resume, update_budget' });
    }

    await campaign.save();

    res.json({ 
      success: true, 
      campaign,
      message: `Campaign ${action} successful`
    });
  } catch (error) {
    console.error('Campaign update error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete campaign
 * DELETE /api/ads/campaigns/:campaignId
 */
router.delete('/campaigns/:campaignId', verifyToken, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { platform } = req.query;

    let deleted = false;

    if (platform === 'meta' || !platform) {
      const metaCampaign = await MetaAdsCampaign.findByIdAndDelete(campaignId);
      if (metaCampaign) deleted = true;
    }

    if (platform === 'google' || (!platform && !deleted)) {
      const googleCampaign = await GoogleAdsCampaign.findByIdAndDelete(campaignId);
      if (googleCampaign) deleted = true;
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    console.error('Campaign deletion error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get aggregated ads performance metrics
 * GET /api/ads/performance
 */
router.get('/performance', verifyToken, async (req, res) => {
  try {
    const { timeRange } = req.query; // '7d', '30d', '90d', 'all'

    const metaCampaigns = await MetaAdsCampaign.find({ userId: req.userId });
    const googleCampaigns = await GoogleAdsCampaign.find({ userId: req.userId });

    const totalSpend = [
      ...metaCampaigns.map(c => c.budget?.total || 0),
      ...googleCampaigns.map(c => c.budget?.total || 0)
    ].reduce((sum, val) => sum + val, 0);

    const totalImpressions = [
      ...metaCampaigns.map(c => c.metrics?.impressions || 0),
      ...googleCampaigns.map(c => c.metrics?.impressions || 0)
    ].reduce((sum, val) => sum + val, 0);

    const totalClicks = [
      ...metaCampaigns.map(c => c.metrics?.clicks || 0),
      ...googleCampaigns.map(c => c.metrics?.clicks || 0)
    ].reduce((sum, val) => sum + val, 0);

    const avgCPC = totalSpend / Math.max(totalClicks, 1);
    const avgCTR = (totalClicks / Math.max(totalImpressions, 1)) * 100;

    res.json({
      summary: {
        totalCampaigns: metaCampaigns.length + googleCampaigns.length,
        activeCampaigns: [...metaCampaigns, ...googleCampaigns].filter(c => c.status === 'ACTIVE').length,
        totalSpend: Math.round(totalSpend * 100) / 100,
        totalImpressions,
        totalClicks,
        avgCPC: Math.round(avgCPC * 100) / 100,
        avgCTR: Math.round(avgCTR * 100) / 100
      },
      byPlatform: {
        meta: {
          campaigns: metaCampaigns.length,
          spend: metaCampaigns.reduce((sum, c) => sum + (c.budget?.total || 0), 0),
          impressions: metaCampaigns.reduce((sum, c) => sum + (c.metrics?.impressions || 0), 0),
          clicks: metaCampaigns.reduce((sum, c) => sum + (c.metrics?.clicks || 0), 0)
        },
        google: {
          campaigns: googleCampaigns.length,
          spend: googleCampaigns.reduce((sum, c) => sum + (c.budget?.total || 0), 0),
          impressions: googleCampaigns.reduce((sum, c) => sum + (c.metrics?.impressions || 0), 0),
          clicks: googleCampaigns.reduce((sum, c) => sum + (c.metrics?.clicks || 0), 0)
        }
      }
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
