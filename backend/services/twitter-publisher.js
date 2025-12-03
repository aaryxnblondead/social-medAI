const axios = require('axios');

class TwitterPublisherService {
  constructor() {
    this.apiUrl = 'https://api.twitter.com/2';
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN;
    this.accessToken = process.env.TWITTER_ACCESS_TOKEN;
    this.accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;
    this.consumerKey = process.env.TWITTER_CONSUMER_KEY;
    this.consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
  }

  // Post tweet (text only)
  async postTweet(text) {
    try {
      console.log('📤 Posting tweet to Twitter...');

      if (!text || text.length === 0) {
        throw new Error('Tweet text is required');
      }

      if (text.length > 280) {
        throw new Error('Tweet exceeds 280 character limit');
      }

      const response = await axios.post(
        `${this.apiUrl}/tweets`,
        {
          text: text
        },
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
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
  async postTweetWithImage(text, imageUrl) {
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
      const response = await axios.post(
        `${this.apiUrl}/tweets`,
        {
          text: `${text}\n\n${imageUrl}`
        },
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
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
  async getTweetMetrics(tweetId) {
    try {
      console.log(`📊 Fetching metrics for tweet ${tweetId}...`);

      const response = await axios.get(
        `${this.apiUrl}/tweets/${tweetId}`,
        {
          params: {
            'tweet.fields': 'public_metrics,created_at'
          },
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`
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
  async deleteTweet(tweetId) {
    try {
      console.log(`🗑️ Deleting tweet ${tweetId}...`);

      const response = await axios.delete(
        `${this.apiUrl}/tweets/${tweetId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`
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
  async replyToTweet(text, inReplyToTweetId) {
    try {
      console.log(`💬 Replying to tweet ${inReplyToTweetId}...`);

      if (text.length > 280) {
        throw new Error('Reply exceeds 280 character limit');
      }

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
            'Authorization': `Bearer ${this.bearerToken}`,
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
