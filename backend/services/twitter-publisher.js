const axios = require('axios');
const { User } = require('../models');

class TwitterPublisherService {
  constructor() {
    this.apiUrl = 'https://api.twitter.com/2';
  }

  async getUserBearerToken(userId) {
    const user = await User.findById(userId).select('socialAccounts.twitter');
    const twitter = user?.socialAccounts?.twitter;
    if (!twitter?.accessToken) {
      throw new Error('Twitter not connected for this user');
    }

    // Refresh if token is near expiry (within 5 minutes) and we have a refresh token
    const expiry = twitter.tokenExpiry ? new Date(twitter.tokenExpiry).getTime() : null;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (expiry && twitter.refreshToken && (expiry - now) <= fiveMinutes) {
      const refreshed = await this.refreshAccessToken(userId, twitter.refreshToken);
      return refreshed;
    }

    return twitter.accessToken;
  }

  async refreshAccessToken(userId, refreshToken) {
    try {
      const resp = await axios.post(
        'https://api.twitter.com/2/oauth2/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
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

      const { access_token, refresh_token, expires_in } = resp.data;

      await User.findByIdAndUpdate(userId, {
        $set: {
          'socialAccounts.twitter.accessToken': access_token,
          'socialAccounts.twitter.refreshToken': refresh_token || refreshToken,
          'socialAccounts.twitter.tokenExpiry': new Date(Date.now() + (expires_in || 3600) * 1000)
        }
      });

      return access_token;
    } catch (err) {
      // If refresh fails, bubble up a clear error so caller can handle (e.g., prompt re-connect)
      throw new Error(`Twitter token refresh failed: ${err.response?.data?.error_description || err.message}`);
    }
  }

  // Post tweet (text only)
  async postTweet(userId, text) {
    try {
      console.log('📤 Posting tweet to Twitter...');

      if (!text || text.length === 0) {
        throw new Error('Tweet text is required');
      }

      if (text.length > 280) {
        throw new Error('Tweet exceeds 280 character limit');
      }

      const bearer = await this.getUserBearerToken(userId);
      const response = await axios.post(
        `${this.apiUrl}/tweets`,
        {
          text: text
        },
        {
          headers: {
            'Authorization': `Bearer ${bearer}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Tweet posted successfully');
      return {
        tweetId: response.data.data.id,
        text: text,
        url: `https://twitter.com/i/web/status/${response.data.data.id}`
      };
    } catch (error) {
      console.error('❌ Tweet posting error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Post tweet with image
  async postTweetWithImage(userId, text, imageUrl) {
    try {
      console.log('📤 Posting tweet with image to Twitter...');

      if (!text || text.length === 0) {
        throw new Error('Tweet text is required');
      }

      if (text.length > 280) {
        throw new Error('Tweet exceeds 280 character limit');
      }

      if (!imageUrl) {
        throw new Error('Image URL is required');
      }

      // Download image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });

      // In production, you'd upload the image to Twitter media endpoint
      // For now, we'll post text-only and note the image URL
      const bearer = await this.getUserBearerToken(userId);
      const response = await axios.post(
        `${this.apiUrl}/tweets`,
        {
          text: `${text}\n\n${imageUrl}`
        },
        {
          headers: {
            'Authorization': `Bearer ${bearer}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Tweet with image posted');
      return {
        tweetId: response.data.data.id,
        text: text,
        imageUrl: imageUrl,
        url: `https://twitter.com/i/web/status/${response.data.data.id}`
      };
    } catch (error) {
      console.error('❌ Tweet with image error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get tweet metrics
  async getTweetMetrics(userId, tweetId) {
    try {
      console.log(`📊 Fetching metrics for tweet ${tweetId}...`);

      const bearer = await this.getUserBearerToken(userId);
      const response = await axios.get(
        `${this.apiUrl}/tweets/${tweetId}`,
        {
          params: {
            'tweet.fields': 'public_metrics,created_at'
          },
          headers: {
            'Authorization': `Bearer ${bearer}`
          }
        }
      );

      const metrics = response.data.data.public_metrics;

      return {
        tweetId,
        likes: metrics.like_count,
        retweets: metrics.retweet_count,
        replies: metrics.reply_count,
        quotes: metrics.quote_count
      };
    } catch (error) {
      console.error('❌ Get metrics error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Delete tweet
  async deleteTweet(userId, tweetId) {
    try {
      console.log(`🗑️ Deleting tweet ${tweetId}...`);

      const bearer = await this.getUserBearerToken(userId);
      const response = await axios.delete(
        `${this.apiUrl}/tweets/${tweetId}`,
        {
          headers: {
            'Authorization': `Bearer ${bearer}`
          }
        }
      );

      console.log('✅ Tweet deleted');
      return response.data.data;
    } catch (error) {
      console.error('❌ Delete tweet error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Reply to tweet
  async replyToTweet(userId, text, inReplyToTweetId) {
    try {
      console.log(`💬 Replying to tweet ${inReplyToTweetId}...`);

      if (text.length > 280) {
        throw new Error('Reply exceeds 280 character limit');
      }

      const bearer = await this.getUserBearerToken(userId);
      const response = await axios.post(
        `${this.apiUrl}/tweets`,
        {
          text: text,
          reply: {
            in_reply_to_tweet_id: inReplyToTweetId
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${bearer}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Reply posted');
      return {
        tweetId: response.data.data.id,
        text: text
      };
    } catch (error) {
      console.error('❌ Reply error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new TwitterPublisherService();
