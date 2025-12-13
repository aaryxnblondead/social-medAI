const axios = require('axios');
const { User } = require('../models');

class FacebookPublisherService {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v18.0';
  }

  /**
   * Post to Facebook Page using user's OAuth token
   * @param {string} text - Post content
   * @param {string} imageUrl - Optional image URL
   * @param {string} userId - User ID for OAuth token
   * @returns {Object} Post response
   */
  async postToFacebook(text, imageUrl = null, userId) {
    try {
      console.log('📤 Posting to Facebook...');

      if (!text || text.length === 0) {
        throw new Error('Post text is required');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get user's Facebook token
      const user = await User.findById(userId);
      
      if (!user?.socialAccounts?.facebook?.accessToken) {
        throw new Error('Facebook account not connected. Please connect via OAuth first.');
      }

      const accessToken = user.socialAccounts.facebook.accessToken;
      const pageId = user.socialAccounts.facebook.pageId;

      if (!pageId) {
        throw new Error('No Facebook Page selected. Please select a page.');
      }

      // Facebook allows up to 63,206 characters, but practical limit is ~4000
      if (text.length > 4000) {
        text = text.substring(0, 3997) + '...';
      }

      let payload = {
        message: text,
        access_token: accessToken
      };

      // Add image if provided
      if (imageUrl) {
        // Upload photo to page
        const photoResponse = await axios.post(
          `${this.apiUrl}/${pageId}/photos`,
          {
            url: imageUrl,
            caption: text,
            access_token: accessToken
          }
        );

        console.log('✅ Posted to Facebook with image');
        return {
          postId: photoResponse.data.id,
          text: text,
          url: `https://facebook.com/${photoResponse.data.post_id}`
        };
      }

      // Post text-only to feed
      const response = await axios.post(
        `${this.apiUrl}/${pageId}/feed`,
        payload
      );

      console.log('✅ Posted to Facebook');
      return {
        postId: response.data.id,
        text: text,
        url: `https://facebook.com/${response.data.id}`
      };
    } catch (error) {
      console.error('❌ Facebook post error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get post metrics
   * @param {string} postId - Facebook post ID
   * @param {string} userId - User ID for OAuth token
   * @returns {Object} Post metrics
   */
  async getPostMetrics(postId, userId) {
    try {
      console.log(`📊 Fetching Facebook metrics for ${postId}...`);

      const user = await User.findById(userId);
      
      if (!user?.socialAccounts?.facebook?.accessToken) {
        throw new Error('Facebook account not connected');
      }

      const accessToken = user.socialAccounts.facebook.accessToken;

      const response = await axios.get(
        `${this.apiUrl}/${postId}`,
        {
          params: {
            fields: 'shares,comments.summary(total_count).limit(0),likes.summary(total_count).limit(0),insights.metric(post_engaged_users,post_impressions).period(lifetime)',
            access_token: accessToken
          }
        }
      );

      const data = response.data;
      const insights = data.insights?.data || [];

      return {
        postId,
        likes: data.likes?.summary?.total_count || 0,
        comments: data.comments?.summary?.total_count || 0,
        shares: data.shares?.count || 0,
        impressions: insights.find(i => i.name === 'post_impressions')?.values?.[0]?.value || 0,
        engagedUsers: insights.find(i => i.name === 'post_engaged_users')?.values?.[0]?.value || 0
      };
    } catch (error) {
      console.error('❌ Get metrics error:', error.response?.data || error.message);
      return { postId, likes: 0, comments: 0, shares: 0, impressions: 0, engagedUsers: 0 };
    }
  }

  /**
   * Delete post
   * @param {string} postId - Facebook post ID
   * @param {string} userId - User ID for OAuth token
   * @returns {Object} Deletion result
   */
  async deletePost(postId, userId) {
    try {
      console.log(`🗑️ Deleting Facebook post ${postId}...`);

      const user = await User.findById(userId);
      
      if (!user?.socialAccounts?.facebook?.accessToken) {
        throw new Error('Facebook account not connected');
      }

      const accessToken = user.socialAccounts.facebook.accessToken;

      await axios.delete(
        `${this.apiUrl}/${postId}`,
        {
          params: {
            access_token: accessToken
          }
        }
      );

      console.log('✅ Facebook post deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Delete error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new FacebookPublisherService();
