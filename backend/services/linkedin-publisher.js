const axios = require('axios');

class LinkedInPublisherService {
  constructor() {
    this.apiUrl = 'https://api.linkedin.com/v2';
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    this.organizationId = process.env.LINKEDIN_ORGANIZATION_ID;
  }

  // Post to LinkedIn as organization
  async postToLinkedIn(text, imageUrl = null) {
    try {
      console.log('📤 Posting to LinkedIn...');

      if (!text || text.length === 0) {
        throw new Error('Post text is required');
      }

      if (!this.accessToken) {
        throw new Error('LinkedIn access token not configured');
      }

      // LinkedIn share text limit (3000 chars)
      if (text.length > 3000) {
        text = text.substring(0, 2997) + '...';
      }

      let payload = {
        owner: `urn:li:organization:${this.organizationId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text
            },
            shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      // Add image if provided
      if (imageUrl) {
        payload.specificContent['com.linkedin.ugc.ShareContent'].media = [
          {
            status: 'READY',
            description: {
              text: 'Post image'
            },
            originalUrl: imageUrl
          }
        ];
      }

      const response = await axios.post(
        `${this.apiUrl}/ugcPosts`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'LinkedIn-Version': '202404'
          }
        }
      );

      console.log('✅ Posted to LinkedIn');
      return {
        postId: response.data.id,
        text: text,
        url: `https://linkedin.com/feed/update/${response.data.id}`
      };
    } catch (error) {
      console.error('❌ LinkedIn post error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get post metrics
  async getPostMetrics(postId) {
    try {
      console.log(`📊 Fetching LinkedIn metrics for ${postId}...`);

      const response = await axios.get(
        `${this.apiUrl}/ugcPosts/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'LinkedIn-Version': '202404'
          }
        }
      );

      // LinkedIn returns engagement in trendingScore and commentaryCount
      const metrics = response.data;

      return {
        postId,
        likes: metrics.engagement?.socialDetailEngagementMetrics?.likeCount || 0,
        comments: metrics.engagement?.socialDetailEngagementMetrics?.commentCount || 0,
        shares: metrics.engagement?.socialDetailEngagementMetrics?.shareCount || 0,
        impressions: metrics.engagement?.socialDetailEngagementMetrics?.impressionCount || 0,
        clicks: metrics.engagement?.socialDetailEngagementMetrics?.clickCount || 0
      };
    } catch (error) {
      console.error('❌ Get metrics error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Delete post
  async deletePost(postId) {
    try {
      console.log(`🗑️ Deleting LinkedIn post ${postId}...`);

      await axios.delete(
        `${this.apiUrl}/ugcPosts/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'LinkedIn-Version': '202404'
          }
        }
      );

      console.log('✅ LinkedIn post deleted');
      return { success: true };
    } catch (error) {
      console.error('❌ Delete error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new LinkedInPublisherService();
