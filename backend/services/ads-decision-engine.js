const { GeneratedPost } = require('../models');
const rlOptimizer = require('./rl-optimizer');
const metaAdsService = require('./meta-ads-service');
const googleAdsService = require('./google-ads-service');

class AdsDecisionEngine {
  constructor() {
    // Thresholds for ad creation
    this.VIRALITY_THRESHOLD = 0.6; // 60% virality score
    this.MIN_ENGAGEMENT_RATE = 0.03; // 3% engagement rate
    this.MIN_HOURS_LIVE = 24; // Post must be live for 24 hours
    this.BASE_BUDGET = 50; // $50 base budget
    this.MAX_BUDGET = 500; // $500 max budget per campaign
  }

  /**
   * Analyze post performance and decide if it should become an ad
   * @param {string} postId - Post ID to analyze
   * @returns {Object} Decision with shouldCreateAd flag and details
   */
  async analyzePostForAds(postId) {
    try {
      const post = await GeneratedPost.findById(postId).populate('brandProfileId');

      if (!post) {
        throw new Error('Post not found');
      }

      if (post.status !== 'published') {
        return {
          shouldCreateAd: false,
          reason: 'Post is not published yet'
        };
      }

      // Check if post has been live long enough
      const hoursLive = (Date.now() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60);
      
      if (hoursLive < this.MIN_HOURS_LIVE) {
        return {
          shouldCreateAd: false,
          reason: `Post needs to be live for at least ${this.MIN_HOURS_LIVE} hours (currently ${Math.round(hoursLive)}h)`
        };
      }

      // Calculate virality score
      const viralityScore = this.calculateViralityScore(post);
      
      // Calculate engagement rate
      const engagementRate = this.calculateEngagementRate(post);

      // Get RL recommendation
      const rlAnalysis = await rlOptimizer.analyzePost(postId);
      const rlReward = rlAnalysis.reward || 0;

      // Decision logic
      const shouldCreateAd = (
        viralityScore >= this.VIRALITY_THRESHOLD &&
        engagementRate >= this.MIN_ENGAGEMENT_RATE &&
        rlReward > 0
      );

      // Determine platform
      const recommendedPlatform = this.selectAdPlatform(post, viralityScore);

      // Calculate budget
      const recommendedBudget = this.calculateAdBudget(viralityScore, engagementRate);

      return {
        shouldCreateAd,
        postId: post._id,
        viralityScore: Math.round(viralityScore * 100) / 100,
        engagementRate: Math.round(engagementRate * 10000) / 100, // Convert to percentage
        rlReward: Math.round(rlReward * 100) / 100,
        recommendedPlatform,
        recommendedBudget,
        metrics: {
          likes: post.engagement?.likes || 0,
          comments: post.engagement?.comments || 0,
          shares: post.engagement?.shares || 0,
          impressions: post.engagement?.impressions || 0
        },
        reason: shouldCreateAd 
          ? `High performance detected! Virality: ${Math.round(viralityScore * 100)}%, Engagement: ${Math.round(engagementRate * 100)}%`
          : `Performance below threshold. Virality: ${Math.round(viralityScore * 100)}% (need ${this.VIRALITY_THRESHOLD * 100}%), Engagement: ${Math.round(engagementRate * 100)}% (need ${this.MIN_ENGAGEMENT_RATE * 100}%)`
      };
    } catch (error) {
      console.error('❌ Ads analysis error:', error);
      throw error;
    }
  }

  /**
   * Calculate virality score based on engagement metrics
   * @param {Object} post - Post document
   * @returns {number} Virality score (0-1)
   */
  calculateViralityScore(post) {
    const engagement = post.engagement || {};
    const likes = engagement.likes || 0;
    const comments = engagement.comments || 0;
    const shares = engagement.shares || 0;
    const impressions = Math.max(engagement.impressions || 0, 1); // Avoid division by zero

    // Weighted virality formula
    const shareWeight = 3; // Shares are most valuable
    const commentWeight = 2; // Comments show high engagement
    const likeWeight = 1; // Likes are baseline

    const totalWeightedEngagement = (shares * shareWeight) + (comments * commentWeight) + (likes * likeWeight);
    const engagementRate = totalWeightedEngagement / impressions;

    // Normalize to 0-1 scale (assuming 0.15 = 100% virality)
    const normalized = Math.min(engagementRate / 0.15, 1);

    return normalized;
  }

  /**
   * Calculate engagement rate
   * @param {Object} post - Post document
   * @returns {number} Engagement rate (0-1)
   */
  calculateEngagementRate(post) {
    const engagement = post.engagement || {};
    const likes = engagement.likes || 0;
    const comments = engagement.comments || 0;
    const shares = engagement.shares || 0;
    const impressions = Math.max(engagement.impressions || 0, 1);

    const totalEngagement = likes + comments + shares;
    return totalEngagement / impressions;
  }

  /**
   * Select best ad platform based on post performance
   * @param {Object} post - Post document
   * @param {number} viralityScore - Calculated virality score
   * @returns {string} Platform name ('meta' or 'google')
   */
  selectAdPlatform(post, viralityScore) {
    // If post has high visual content (image), prefer Meta (Instagram/Facebook)
    if (post.graphics && post.graphics.length > 0 && viralityScore > 0.7) {
      return 'meta';
    }

    // If post performed well on Twitter, use Meta Ads for broader reach
    const twitterPlatform = post.platforms?.find(p => p.name === 'twitter');
    if (twitterPlatform && twitterPlatform.status === 'published') {
      return 'meta';
    }

    // For text-heavy or B2B content, use Google Ads
    const content = post.content?.copy || '';
    if (content.length > 200 || content.includes('enterprise') || content.includes('business')) {
      return 'google';
    }

    // Default to Meta for visual content
    return post.graphics?.length > 0 ? 'meta' : 'google';
  }

  /**
   * Calculate recommended ad budget based on performance
   * @param {number} viralityScore - Virality score (0-1)
   * @param {number} engagementRate - Engagement rate (0-1)
   * @returns {number} Budget in USD
   */
  calculateAdBudget(viralityScore, engagementRate) {
    // Base budget: $50
    let budget = this.BASE_BUDGET;

    // Multiply by virality score (0.6-1.0 → 1.2-2.0x)
    const viralityMultiplier = 1 + viralityScore;
    
    // Multiply by engagement rate (0.03-0.15 → 1.0-2.0x)
    const engagementMultiplier = 1 + (engagementRate * 10);

    budget = budget * viralityMultiplier * engagementMultiplier;

    // Cap at max budget
    return Math.min(Math.round(budget), this.MAX_BUDGET);
  }

  /**
   * Create ad campaign for high-performing post
   * @param {string} postId - Post ID
   * @param {Object} decision - Analysis decision from analyzePostForAds
   * @returns {Object} Created campaign
   */
  async createAdCampaign(postId, decision) {
    try {
      const post = await GeneratedPost.findById(postId).populate('brandProfileId');
      const brand = post.brandProfileId;

      if (!decision.shouldCreateAd) {
        throw new Error('Post does not meet criteria for ad creation');
      }

      let campaign;

      if (decision.recommendedPlatform === 'meta') {
        campaign = await this.createMetaAdCampaign(post, brand, decision.recommendedBudget);
      } else {
        campaign = await this.createGoogleAdCampaign(post, brand, decision.recommendedBudget);
      }

      // Update post with ad campaign reference
      await GeneratedPost.findByIdAndUpdate(postId, {
        $set: {
          'adCampaign': {
            platform: decision.recommendedPlatform,
            campaignId: campaign._id,
            budget: decision.recommendedBudget,
            createdAt: new Date()
          }
        }
      });

      return campaign;
    } catch (error) {
      console.error('❌ Campaign creation error:', error);
      throw error;
    }
  }

  /**
   * Create Meta Ads campaign (Facebook/Instagram)
   * @param {Object} post - Post document
   * @param {Object} brand - Brand profile
   * @param {number} budget - Campaign budget
   * @returns {Object} Meta campaign
   */
  async createMetaAdCampaign(post, brand, budget) {
    try {
      const headline = post.content?.copy?.substring(0, 40) || 'Sponsored Post';
      const description = post.content?.copy?.substring(0, 125) || '';
      const imageUrl = post.graphics?.[0]?.url || null;

      const targeting = {
        ages: brand.targetAudience?.ageRange || ['25-54'],
        locations: brand.targetAudience?.geography || ['US'],
        interests: brand.industry ? [brand.industry] : [],
        demographics: brand.targetAudience?.demographics || {}
      };

      const campaign = await metaAdsService.createCampaign({
        brandProfileId: brand._id,
        postId: post._id,
        campaignName: `${brand.name} - ${post.content?.platform} - ${new Date().toISOString().split('T')[0]}`,
        objective: 'REACH', // or 'ENGAGEMENT', 'CONVERSIONS'
        budget: {
          daily: Math.round(budget / 30), // Distribute over 30 days
          total: budget,
          currency: 'USD'
        },
        schedule: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        targeting,
        creative: {
          headline,
          description,
          imageUrl,
          callToAction: 'LEARN_MORE'
        },
        platforms: ['facebook', 'instagram']
      });

      return campaign;
    } catch (error) {
      console.error('❌ Meta campaign creation error:', error);
      throw error;
    }
  }

  /**
   * Create Google Ads campaign
   * @param {Object} post - Post document
   * @param {Object} brand - Brand profile
   * @param {number} budget - Campaign budget
   * @returns {Object} Google campaign
   */
  async createGoogleAdCampaign(post, brand, budget) {
    try {
      const keywords = this.extractKeywords(post.content?.copy || '');
      const headline = post.content?.copy?.substring(0, 30) || 'Sponsored Ad';
      const description = post.content?.copy?.substring(0, 90) || '';

      const targeting = {
        keywords,
        locations: brand.targetAudience?.geography || ['US'],
        languages: ['en'],
        demographics: brand.targetAudience?.demographics || {}
      };

      const campaign = await googleAdsService.createCampaign({
        brandProfileId: brand._id,
        postId: post._id,
        campaignName: `${brand.name} - Search - ${new Date().toISOString().split('T')[0]}`,
        campaignType: 'SEARCH', // or 'DISPLAY'
        budget: {
          daily: Math.round(budget / 30),
          total: budget,
          currency: 'USD'
        },
        biddingStrategy: 'MAXIMIZE_CLICKS',
        targeting,
        ads: [
          {
            type: 'TEXT_AD',
            headlines: [headline, brand.name],
            descriptions: [description],
            finalUrl: brand.website || 'https://example.com'
          }
        ]
      });

      return campaign;
    } catch (error) {
      console.error('❌ Google campaign creation error:', error);
      throw error;
    }
  }

  /**
   * Extract keywords from post content
   * @param {string} text - Post text
   * @returns {Array} Keywords array
   */
  extractKeywords(text) {
    // Simple keyword extraction - can be enhanced with NLP
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had'];
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    
    // Filter out stop words and get unique keywords
    return [...new Set(words.filter(w => !stopWords.includes(w)))].slice(0, 20);
  }

  /**
   * Get ROI analysis for a post's ad campaigns
   * @param {string} postId - Post ID
   * @returns {Object} ROI metrics
   */
  async getROIAnalysis(postId) {
    try {
      const post = await GeneratedPost.findById(postId);

      if (!post?.adCampaign) {
        return {
          hasAds: false,
          message: 'No ad campaigns for this post'
        };
      }

      const organicMetrics = {
        impressions: post.engagement?.impressions || 0,
        likes: post.engagement?.likes || 0,
        comments: post.engagement?.comments || 0,
        shares: post.engagement?.shares || 0,
        engagement: (post.engagement?.likes || 0) + (post.engagement?.comments || 0) + (post.engagement?.shares || 0)
      };

      // TODO: Fetch actual ad metrics from Meta/Google APIs
      const adMetrics = {
        spend: post.adCampaign.budget || 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cpc: 0, // Cost per click
        cpm: 0, // Cost per mille (thousand impressions)
        roas: 0 // Return on ad spend
      };

      const roi = {
        platform: post.adCampaign.platform,
        campaignId: post.adCampaign.campaignId,
        organic: organicMetrics,
        paid: adMetrics,
        combined: {
          totalImpressions: organicMetrics.impressions + adMetrics.impressions,
          totalEngagement: organicMetrics.engagement + adMetrics.clicks,
          totalSpend: adMetrics.spend,
          costPerEngagement: adMetrics.spend / Math.max(organicMetrics.engagement + adMetrics.clicks, 1)
        }
      };

      return roi;
    } catch (error) {
      console.error('❌ ROI analysis error:', error);
      throw error;
    }
  }
}

module.exports = new AdsDecisionEngine();
