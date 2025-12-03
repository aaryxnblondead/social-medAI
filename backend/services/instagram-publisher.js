const axios = require('axios');

class InstagramPublisherService {
  constructor() {
    this.apiUrl = 'https://graph.instagram.com/v18.0';
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  }

  // Create and publish carousel post (images + caption)
  async postToInstagram(caption, imageUrl = null) {
    try {
      console.log('📤 Posting to Instagram...');

      if (!caption || caption.length === 0) {
        throw new Error('Caption is required');
      }

      if (!this.accessToken || !this.businessAccountId) {
        throw new Error('Instagram credentials not configured');
      }

      // Instagram caption limit is 2200 characters
      if (caption.length > 2200) {
        caption = caption.substring(0, 2197) + '...';
      }

      // First, create a media container
      let containerPayload = {
        media_type: imageUrl ? 'IMAGE' : 'CAROUSEL',
        access_token: this.accessToken
      };

      if (imageUrl) {
        containerPayload.image_url = imageUrl;
      }

      containerPayload.caption = caption;

      const containerResponse = await axios.post(
        `${this.apiUrl}/${this.businessAccountId}/media`,
        containerPayload
      );

      const mediaId = containerResponse.data.id;

      // Then publish the media
      const publishResponse = await axios.post(
        `${this.apiUrl}/${this.businessAccountId}/media_publish`,
        {
          creation_id: mediaId,
          access_token: this.accessToken
        }
      );

      console.log('✅ Posted to Instagram');
      return {
        postId: publishResponse.data.id,
        caption: caption,
        url: `https://instagram.com/p/${publishResponse.data.id}`
      };
    } catch (error) {
      console.error('❌ Instagram post error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get post metrics (insights)
  async getPostMetrics(postId) {
    try {
      console.log(`�� Fetching Instagram metrics for ${postId}...`);

      const response = await axios.get(
        `${this.apiUrl}/${postId}/insights`,
        {
          params: {
            metric: 'engagement,impressions,reach,saved',
            access_token: this.accessToken
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
        likes: Math.round((metricsMap.engagement || 0) * 0.7), // Estimate
        comments: Math.round((metricsMap.engagement || 0) * 0.3)
      };
    } catch (error) {
      console.error('❌ Get metrics error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Delete post
  async deletePost(postId) {
    try {
      console.log(`🗑️ Deleting Instagram post ${postId}...`);

      await axios.delete(
        `${this.apiUrl}/${postId}`,
        {
          params: {
            access_token: this.accessToken
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
