const axios = require('axios');
const { User } = require('../models');

class LinkedInPublisherService {
  constructor() {
    this.apiUrl = 'https://api.linkedin.com/v2';
  }

  async getUserAccess(userId) {
    const user = await User.findById(userId).select('socialAccounts.linkedin');
    const li = user?.socialAccounts?.linkedin;
    if (!li?.accessToken) {
      throw new Error('LinkedIn account not connected. Please connect via OAuth first.');
    }
    const expiryMs = li.tokenExpiry ? new Date(li.tokenExpiry).getTime() : null;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (expiryMs && (expiryMs - now) <= fiveMinutes) {
      // LinkedIn tokens often do not provide refresh tokens; prompt re-auth
      throw new Error('LinkedIn token nearing expiry. Please reconnect LinkedIn.');
    }
    return { accessToken: li.accessToken, linkedinUserId: li.userId };
  }

  /**
   * Post to LinkedIn using user's OAuth token
   * @param {string} text - Post content
   * @param {string} imageUrl - Optional image URL
   * @param {string} userId - User ID for OAuth token
   * @returns {Object} Post response
   */
  async postToLinkedIn(text, imageUrl = null, userId) {
    try {
      console.log('📤 Posting to LinkedIn...');

      if (!text || text.length === 0) {
        throw new Error('Post text is required');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get user's LinkedIn token with expiry check
      const { accessToken, linkedinUserId } = await this.getUserAccess(userId);

      // LinkedIn share text limit (3000 chars)
      if (text.length > 3000) {
        text = text.substring(0, 2997) + '...';
      }

      // Get user's person URN
      const authorUrn = `urn:li:person:${linkedinUserId}`;

      let payload = {
        author: authorUrn,
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
        // Register upload for image
        const registerResponse = await axios.post(
          `${this.apiUrl}/assets?action=registerUpload`,
          {
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: authorUrn,
              serviceRelationships: [
                {
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent'
                }
              ]
            }
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
        const asset = registerResponse.data.value.asset;

        // Download image
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data);

        // Upload image to LinkedIn
        await axios.put(uploadUrl, imageBuffer, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': imageResponse.headers['content-type'] || 'image/jpeg'
          }
        });

        // Add media to payload
        payload.specificContent['com.linkedin.ugc.ShareContent'].media = [
          {
            status: 'READY',
            description: {
              text: 'Post image'
            },
            media: asset,
            title: {
              text: 'Image'
            }
          }
        ];
      }

      const response = await axios.post(
        `${this.apiUrl}/ugcPosts`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      const postId = response.data.id;

      console.log('✅ Posted to LinkedIn');
      return {
        postId,
        text: text,
        url: `https://www.linkedin.com/feed/update/${postId}`
      };
    } catch (error) {
      console.error('❌ LinkedIn post error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get post metrics
   * @param {string} postId - LinkedIn post ID
   * @param {string} userId - User ID for OAuth token
   * @returns {Object} Post metrics
   */
  async getPostMetrics(postId, userId) {
    try {
      console.log(`📊 Fetching LinkedIn metrics for ${postId}...`);

      const { accessToken } = await this.getUserAccess(userId);

      const response = await axios.get(
        `${this.apiUrl}/socialActions/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      const metrics = response.data;

      return {
        postId,
        likes: metrics.likesSummary?.totalLikes || 0,
        comments: metrics.commentsSummary?.totalComments || 0,
        shares: 0, // LinkedIn API doesn't provide share count directly
        impressions: 0, // Not available in basic API
        clicks: 0 // Not available in basic API
      };
    } catch (error) {
      console.error('❌ Get metrics error:', error.response?.data || error.message);
      return { postId, likes: 0, comments: 0, shares: 0, impressions: 0, clicks: 0 };
    }
  }

  /**
   * Delete post
   * @param {string} postId - LinkedIn post ID
   * @param {string} userId - User ID for OAuth token
   * @returns {Object} Deletion result
   */
  async deletePost(postId, userId) {
    try {
      console.log(`🗑️ Deleting LinkedIn post ${postId}...`);

      const { accessToken } = await this.getUserAccess(userId);

      await axios.delete(
        `${this.apiUrl}/ugcPosts/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
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
