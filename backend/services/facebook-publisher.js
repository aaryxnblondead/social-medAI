const axios = require('axios');

class FacebookPublisherService {
  constructor() {
    this.apiUrl = 'https://graph.instagram.com/v18.0';
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.pageId = process.env.FACEBOOK_PAGE_ID;
  }

  // Post to Facebook Page
  async postToFacebook(text, imageUrl = null) {
    try {
      console.log('📤 Posting to Facebook...');

      if (!text || text.length === 0) {
        throw new Error('Post text is required');
      }

      if (!this.accessToken || !this.pageId) {
        throw new Error('Facebook credentials not configured');
      }

      // Facebook allows up to 63,206 characters, but practical limit is ~4000
      if (text.length > 4000) {
        text = text.substring(0, 3997) + '...';
      }

      let payload = {
        message: text,
        access_token: this.accessToken
      };

      // Add image if provided
      if (imageUrl) {
        payload.link = imageUrl;
        payload.type = 'link';
      }

      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${this.pageId}/feed`,
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

  // Get post metrics
  async getPostMetrics(postId) {
    try {
      console.log(`📊 Fetching Facebook metrics for ${postId}...`);

      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${postId}`,
        {
          params: {
            fields: 'shares,comments.summary(total_count).limit(0),likes.summary(total_count).limit(0),insights.metric(post_engaged_users,post_impressions).period(lifetime)',
            access_token: this.accessToken
          }
        }
      );

      const data = response.data;
      const insights = data.insights?.data || [];

      return {
        postId,
        likes: data.likes?.summary?.total_count || 0,
        comments: data.comments?.summary?.total_count || 0,
        shares: data.shares || 0,
        impressions: insights.find(i => i.name === 'post_impressions')?.values?.[0]?.value || 0,
        engagedUsers: insights.find(i => i.name === 'post_engaged_users')?.values?.[0]?.value || 0
      };
    } catch (error) {
      console.error('❌ Get metrics error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Delete post
  async deletePost(postId) {
    try {
      console.log(`🗑️ Deleting Facebook post ${postId}...`);

      await axios.delete(
        `https://graph.facebook.com/v18.0/${postId}`,
        {
          params: {
            access_token: this.accessToken
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
