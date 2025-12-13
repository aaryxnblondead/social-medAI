const axios = require('axios');
const { User } = require('../models');

class InstagramPublisherService {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v18.0';
  }

  /**
   * Post to Instagram using user's OAuth token (via Facebook Graph API)
   * @param {string} caption - Post caption
   * @param {string} imageUrl - Required image URL for Instagram
   * @param {string} userId - User ID for OAuth token
   * @returns {Object} Post response
   */
  async postToInstagram(caption, imageUrl = null, userId) {
    try {
      console.log('📤 Posting to Instagram...');

      if (!caption || caption.length === 0) {
        throw new Error('Caption is required');
      }

      if (!imageUrl) {
        throw new Error('Image URL is required for Instagram posts');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get user's Instagram token
      const user = await User.findById(userId);
      
      if (!user?.socialAccounts?.instagram?.accessToken) {
        throw new Error('Instagram account not connected. Please connect via Facebook Page first.');
      }

      const accessToken = user.socialAccounts.instagram.accessToken;
      const businessAccountId = user.socialAccounts.instagram.businessAccountId;

      if (!businessAccountId) {
        throw new Error('No Instagram Business Account connected');
      }

      // Instagram caption limit is 2200 characters
      if (caption.length > 2200) {
        caption = caption.substring(0, 2197) + '...';
      }

      // Step 1: Create media container
      const containerResponse = await axios.post(
        `${this.apiUrl}/${businessAccountId}/media`,
        {
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken
        }
      );

      const creationId = containerResponse.data.id;

      // Step 2: Wait for media to be processed (Instagram requires this)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Publish the media
      const publishResponse = await axios.post(
        `${this.apiUrl}/${businessAccountId}/media_publish`,
        {
          creation_id: creationId,
          access_token: accessToken
        }
      );

      const mediaId = publishResponse.data.id;

      console.log('✅ Posted to Instagram');
      return {
        postId: mediaId,
        caption: caption,
        url: `https://www.instagram.com/p/${mediaId}`
      };
    } catch (error) {
      console.error('❌ Instagram post error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get post metrics (insights)
   * @param {string} postId - Instagram media ID
   * @param {string} userId - User ID for OAuth token
   * @returns {Object} Post metrics
   */
  async getPostMetrics(postId, userId) {
    try {
      console.log(`📊 Fetching Instagram metrics for ${postId}...`);

      const user = await User.findById(userId);
      
      if (!user?.socialAccounts?.instagram?.accessToken) {
        throw new Error('Instagram account not connected');
      }

      const accessToken = user.socialAccounts.instagram.accessToken;

      // Get insights (available 24h after post)
      const response = await axios.get(
        `${this.apiUrl}/${postId}/insights`,
        {
          params: {
            metric: 'engagement,impressions,reach,saved',
            access_token: accessToken
          }
        }
      );

      const insights = response.data.data || [];
      const metricsMap = {};

      insights.forEach(metric => {
        metricsMap[metric.name] = metric.values?.[0]?.value || 0;
      });

      return {
        postId,
        engagement: metricsMap.engagement || 0,
        impressions: metricsMap.impressions || 0,
        reach: metricsMap.reach || 0,
        saved: metricsMap.saved || 0,
        likes: Math.round((metricsMap.engagement || 0) * 0.7), // Estimate from engagement
        comments: Math.round((metricsMap.engagement || 0) * 0.3) // Estimate from engagement
      };
    } catch (error) {
      console.error('❌ Get metrics error:', error.response?.data || error.message);
      // Return zeros if insights not available yet
      return { postId, engagement: 0, impressions: 0, reach: 0, saved: 0, likes: 0, comments: 0 };
    }
  }

  /**
   * Delete post
   * @param {string} postId - Instagram media ID
   * @param {string} userId - User ID for OAuth token
   * @returns {Object} Deletion result
   */
  async deletePost(postId, userId) {
    try {
      console.log(`🗑️ Deleting Instagram post ${postId}...`);

      const user = await User.findById(userId);
      
      if (!user?.socialAccounts?.instagram?.accessToken) {
        throw new Error('Instagram account not connected');
      }

      const accessToken = user.socialAccounts.instagram.accessToken;

      await axios.delete(
        `${this.apiUrl}/${postId}`,
        {
          params: {
            access_token: accessToken
          }
        }
      );

      console.log('✅ Instagram post deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Delete error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new InstagramPublisherService();
