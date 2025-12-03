const twitterPublisher = require('./twitter-publisher');
const RetryService = require('./retry-service');

class MultiPlatformPublisherService {
  constructor() {
    this.publishers = {
      twitter: twitterPublisher,
      // LinkedIn, Facebook, Instagram will be added as separate services
      linkedin: null,
      facebook: null,
      instagram: null
    };
  }

  // Publish to single platform (with retry)
  async publishToPlatform(post, platform) {
    try {
      console.log(`📤 Publishing to ${platform}...`);

      if (!this.publishers[platform]) {
        throw new Error(`Platform ${platform} not supported yet`);
      }

      // Use jittered backoff for resilience
      const result = await RetryService.jitteredBackoff(
        async () => {
          if (platform === 'twitter') {
            return await this.publishToTwitter(post);
          } else if (platform === 'linkedin') {
            return await this.publishToLinkedIn(post);
          } else if (platform === 'facebook') {
            return await this.publishToFacebook(post);
          } else if (platform === 'instagram') {
            return await this.publishToInstagram(post);
          }
        },
        3,           // max retries
        1000         // initial delay
      );

      return result;
      } else if (platform === 'linkedin') {
        return await this.publishToLinkedIn(post);
      } else if (platform === 'facebook') {
        return await this.publishToFacebook(post);
      } else if (platform === 'instagram') {
        return await this.publishToInstagram(post);
      }
    } catch (error) {
      console.error(`❌ ${platform} publish error:`, error.message);
      throw error;
    }
  }

  // Publish to Twitter
  async publishToTwitter(post) {
    try {
      let result;
      if (post.imageUrl) {
        result = await twitterPublisher.postTweetWithImage(post.copy, post.imageUrl);
      } else {
        result = await twitterPublisher.postTweet(post.copy);
      }

      return {
        platform: 'twitter',
        postId: result.tweetId,
        url: result.url,
        status: 'published'
      };
    } catch (error) {
      throw error;
    }
  }

  // Publish to LinkedIn (placeholder for future implementation)
  async publishToLinkedIn(post) {
    try {
      console.log('LinkedIn publishing coming soon...');
      // Requires LinkedIn API integration
      // For now, return mock response
      return {
        platform: 'linkedin',
        postId: `linkedin_${Date.now()}`,
        url: `https://linkedin.com/posts/${Date.now()}`,
        status: 'published'
      };
    } catch (error) {
      throw error;
    }
  }

  // Publish to Facebook (placeholder for future implementation)
  async publishToFacebook(post) {
    try {
      console.log('Facebook publishing coming soon...');
      // Requires Facebook Graph API integration
      return {
        platform: 'facebook',
        postId: `facebook_${Date.now()}`,
        url: `https://facebook.com/posts/${Date.now()}`,
        status: 'published'
      };
    } catch (error) {
      throw error;
    }
  }

  // Publish to Instagram (placeholder for future implementation)
  async publishToInstagram(post) {
    try {
      console.log('Instagram publishing coming soon...');
      // Requires Instagram API integration
      return {
        platform: 'instagram',
        postId: `instagram_${Date.now()}`,
        url: `https://instagram.com/p/${Date.now()}`,
        status: 'published'
      };
    } catch (error) {
      throw error;
    }
  }

  // Publish to multiple platforms at once
  async publishToMultiplePlatforms(post, platforms) {
    try {
      console.log(`📤 Publishing to ${platforms.length} platforms...`);

      const results = [];

      for (const platform of platforms) {
        try {
          const result = await this.publishToPlatform(post, platform);
          results.push(result);
        } catch (error) {
          results.push({
            platform,
            status: 'failed',
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('❌ Multi-platform error:', error.message);
      throw error;
    }
  }

  // Get metrics from all platforms
  async getMetricsFromAllPlatforms(post) {
    try {
      console.log('📊 Fetching metrics from all platforms...');

      const allMetrics = [];

      for (const platformData of post.platforms) {
        try {
          const metrics = await this.getMetricsForPlatform(
            platformData.name,
            platformData.postId
          );
          allMetrics.push(metrics);
        } catch (error) {
          console.warn(`Could not fetch ${platformData.name} metrics:`, error.message);
        }
      }

      return allMetrics;
    } catch (error) {
      console.error('❌ Get metrics error:', error.message);
      throw error;
    }
  }

  // Get metrics for specific platform
  async getMetricsForPlatform(platform, postId) {
    try {
      if (platform === 'twitter') {
        return await twitterPublisher.getTweetMetrics(postId);
      } else if (platform === 'linkedin') {
        console.log('LinkedIn metrics coming soon...');
        return { platform: 'linkedin', postId, error: 'Not implemented' };
      } else if (platform === 'facebook') {
        console.log('Facebook metrics coming soon...');
        return { platform: 'facebook', postId, error: 'Not implemented' };
      } else if (platform === 'instagram') {
        console.log('Instagram metrics coming soon...');
        return { platform: 'instagram', postId, error: 'Not implemented' };
      }
    } catch (error) {
      throw error;
    }
  }

  // Aggregate metrics from all platforms
  aggregateMetrics(platformMetrics) {
    return platformMetrics.reduce(
      (agg, metric) => ({
        likes: agg.likes + (metric.likes || 0),
        shares: agg.shares + (metric.shares || 0),
        comments: agg.comments + (metric.comments || 0),
        views: agg.views + (metric.views || 0),
        clicks: agg.clicks + (metric.clicks || 0),
        impressions: agg.impressions + (metric.impressions || 0)
      }),
      {
        likes: 0,
        shares: 0,
        comments: 0,
        views: 0,
        clicks: 0,
        impressions: 0
      }
    );
  }
}

module.exports = new MultiPlatformPublisherService();
