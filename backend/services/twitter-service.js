const axios = require('axios');
const { TwitterApi } = require('twitter-api-v2');
const { User } = require('../models');

/**
 * Publish tweet using user's OAuth token
 * @param {Object} params - Publishing parameters
 * @param {string} params.text - Tweet text
 * @param {string} params.mediaUrl - Optional media URL
 * @param {string} params.userId - User ID for OAuth token lookup
 * @returns {Object} Tweet response with ID and URL
 */
async function publishTweet({ text, mediaUrl, userId }) {
  try {
    // Get user's Twitter OAuth token
    const user = await User.findById(userId);
    
    if (!user?.socialAccounts?.twitter?.accessToken) {
      throw new Error('Twitter account not connected. Please connect via OAuth first.');
    }

    // Check if token is expired and refresh if needed
    const tokenExpiry = new Date(user.socialAccounts.twitter.tokenExpiry);
    if (tokenExpiry < new Date()) {
      await refreshTwitterToken(userId);
      // Re-fetch user with new token
      const refreshedUser = await User.findById(userId);
      user.socialAccounts.twitter = refreshedUser.socialAccounts.twitter;
    }

    // Initialize Twitter client with user's access token
    const client = new TwitterApi(user.socialAccounts.twitter.accessToken);
    const rwClient = client.readWrite;

    let mediaIds = [];

    // Upload media if provided
    if (mediaUrl) {
      try {
        // Download image
        const imageResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data);

        // Upload to Twitter
        const mediaId = await client.v1.uploadMedia(imageBuffer, {
          mimeType: imageResponse.headers['content-type'] || 'image/jpeg'
        });
        mediaIds.push(mediaId);
      } catch (mediaError) {
        console.warn('⚠️ Media upload failed, posting text only:', mediaError.message);
      }
    }

    // Post tweet
    const tweet = await rwClient.v2.tweet({
      text: text,
      ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } })
    });

    return {
      tweetId: tweet.data.id,
      text: tweet.data.text,
      url: `https://twitter.com/${user.socialAccounts.twitter.username}/status/${tweet.data.id}`
    };
  } catch (error) {
    console.error('❌ Twitter publish error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get tweet metrics using Twitter API v2
 * @param {string} tweetId - Tweet ID
 * @param {string} userId - User ID for OAuth token
 * @returns {Object} Tweet metrics
 */
async function getTweetMetrics(tweetId, userId) {
  try {
    const user = await User.findById(userId);
    
    if (!user?.socialAccounts?.twitter?.accessToken) {
      throw new Error('Twitter account not connected');
    }

    const client = new TwitterApi(user.socialAccounts.twitter.accessToken);

    // Get tweet with metrics
    const tweet = await client.v2.singleTweet(tweetId, {
      'tweet.fields': 'public_metrics,created_at'
    });

    const metrics = tweet.data.public_metrics || {};

    return {
      impressions: metrics.impression_count || 0,
      likes: metrics.like_count || 0,
      retweets: metrics.retweet_count || 0,
      replies: metrics.reply_count || 0,
      quotes: metrics.quote_count || 0,
      bookmarks: metrics.bookmark_count || 0
    };
  } catch (error) {
    console.error('❌ Twitter metrics error:', error.response?.data || error.message);
    return { impressions: 0, likes: 0, retweets: 0, replies: 0, quotes: 0, bookmarks: 0 };
  }
}

/**
 * Delete tweet
 * @param {string} tweetId - Tweet ID to delete
 * @param {string} userId - User ID for OAuth token
 * @returns {Object} Deletion result
 */
async function deleteTweet(tweetId, userId) {
  try {
    const user = await User.findById(userId);
    
    if (!user?.socialAccounts?.twitter?.accessToken) {
      throw new Error('Twitter account not connected');
    }

    const client = new TwitterApi(user.socialAccounts.twitter.accessToken);
    await client.v2.deleteTweet(tweetId);

    return { deleted: true };
  } catch (error) {
    console.error('❌ Twitter delete error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Refresh Twitter OAuth token
 * @param {string} userId - User ID
 * @returns {Object} New token data
 */
async function refreshTwitterToken(userId) {
  try {
    const user = await User.findById(userId);
    
    if (!user?.socialAccounts?.twitter?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokenResponse = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: user.socialAccounts.twitter.refreshToken,
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

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Update user with new tokens
    await User.findByIdAndUpdate(userId, {
      $set: {
        'socialAccounts.twitter.accessToken': access_token,
        'socialAccounts.twitter.refreshToken': refresh_token,
        'socialAccounts.twitter.tokenExpiry': new Date(Date.now() + expires_in * 1000)
      }
    });

    return { access_token, refresh_token, expires_in };
  } catch (error) {
    console.error('❌ Token refresh error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { publishTweet, getTweetMetrics, deleteTweet, refreshTwitterToken };
