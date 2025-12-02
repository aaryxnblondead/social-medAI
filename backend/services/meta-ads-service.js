const axios = require('axios');

class MetaAdsService {
  constructor() {
    this.apiVersion = process.env.META_API_VERSION || 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    this.accessToken = process.env.META_ACCESS_TOKEN;
    this.adAccountId = process.env.META_AD_ACCOUNT_ID;
  }

  // Create ad campaign
  async createCampaign(campaignData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/act_${this.adAccountId}/campaigns`,
        {
          name: campaignData.name,
          objective: campaignData.objective,
          status: 'PAUSED',
          special_ad_categories: ['NONE'],
          access_token: this.accessToken
        }
      );
      return response.data;
    } catch (error) {
      console.error('Meta Campaign Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Create ad set (budget & targeting)
  async createAdSet(adSetData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/act_${this.adAccountId}/adsets`,
        {
          name: adSetData.name,
          campaign_id: adSetData.campaignId,
          daily_budget: adSetData.dailyBudget * 100,
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'REACH',
          targeting: {
            geo_locations: { regions: adSetData.targeting.regions || [] },
            age_min: adSetData.targeting.ageMin || 18,
            age_max: adSetData.targeting.ageMax || 65,
            genders: adSetData.targeting.genders || [1, 2],
            interests: adSetData.targeting.interests || []
          },
          status: 'PAUSED',
          access_token: this.accessToken
        }
      );
      return response.data;
    } catch (error) {
      console.error('Meta AdSet Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Create ad (creative)
  async createAd(adData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/act_${this.adAccountId}/ads`,
        {
          adset_id: adData.adSetId,
          creative: {
            title: adData.title,
            body: adData.description,
            image_hash: adData.imageHash,
            call_to_action_type: adData.callToAction || 'LEARN_MORE'
          },
          status: 'PAUSED',
          access_token: this.accessToken
        }
      );
      return response.data;
    } catch (error) {
      console.error('Meta Ad Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get campaign insights (metrics)
  async getCampaignMetrics(campaignId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${campaignId}/insights`,
        {
          params: {
            fields: 'impressions,clicks,spend,actions',
            access_token: this.accessToken
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Meta Metrics Error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new MetaAdsService();
