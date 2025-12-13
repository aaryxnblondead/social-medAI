const engagementTracker = require('../services/engagement-tracker');
const { GeneratedPost } = require('../models');

/**
 * Engagement Tracking Job
 * Runs every 4 hours to sync engagement metrics from all platforms
 */
class EngagementTrackingJob {
  constructor() {
    this.interval = null;
    this.intervalMinutes = 240; // 4 hours
  }

  /**
   * Start the engagement tracking job
   * @param {number} intervalMinutes - How often to run (default: 240 = 4 hours)
   */
  start(intervalMinutes = 240) {
    if (this.interval) {
      console.log('⚠️ Engagement tracking job already running');
      return;
    }

    this.intervalMinutes = intervalMinutes;

    console.log(`📈 Starting engagement tracking job (every ${intervalMinutes} minutes)...`);

    // Run immediately on start
    this.run();

    // Schedule recurring execution
    this.interval = setInterval(() => {
      this.run();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the engagement tracking job
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('⏹️ Engagement tracking job stopped');
    }
  }

  /**
   * Run engagement tracking once
   */
  async run() {
    try {
      console.log('📊 Running engagement tracking job...');
      const startTime = Date.now();

      // Get all published posts from last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const posts = await GeneratedPost.find({
        status: 'published',
        publishedAt: { $gte: thirtyDaysAgo }
      });

      console.log(`📝 Found ${posts.length} published posts to track`);

      let updated = 0;
      let errors = 0;

      for (const post of posts) {
        try {
          // Sync engagement for each platform
          for (const platform of post.platforms || []) {
            if (platform.status === 'published' && platform.postId) {
              await this.syncPlatformEngagement(post, platform);
              updated++;
            }
          }
        } catch (error) {
          console.error(`❌ Error tracking post ${post._id}:`, error.message);
          errors++;
        }
      }

      const duration = Date.now() - startTime;

      console.log(`✅ Engagement tracking completed in ${duration}ms`);
      console.log(`📈 Updated: ${updated} posts | Errors: ${errors}`);
    } catch (error) {
      console.error('❌ Engagement tracking job error:', error.message);
    }
  }

  /**
   * Sync engagement for a specific platform
   * @param {Object} post - Post document
   * @param {Object} platform - Platform object from post
   */
  async syncPlatformEngagement(post, platform) {
    try {
      let metrics = {};

      switch (platform.name) {
        case 'twitter':
          const twitterService = require('../services/twitter-service');
          metrics = await twitterService.getTweetMetrics(platform.postId, post.userId);
          break;

        case 'linkedin':
          const linkedinPublisher = require('../services/linkedin-publisher');
          metrics = await linkedinPublisher.getPostMetrics(platform.postId, post.userId);
          break;

        case 'facebook':
          const facebookPublisher = require('../services/facebook-publisher');
          metrics = await facebookPublisher.getPostMetrics(platform.postId, post.userId);
          break;

        case 'instagram':
          const instagramPublisher = require('../services/instagram-publisher');
          metrics = await instagramPublisher.getPostMetrics(platform.postId, post.userId);
          break;

        default:
          console.warn(`⚠️ Unknown platform: ${platform.name}`);
          return;
      }

      // Update post engagement
      await GeneratedPost.findByIdAndUpdate(post._id, {
        $set: {
          engagement: {
            likes: (post.engagement?.likes || 0) + (metrics.likes || 0),
            comments: (post.engagement?.comments || 0) + (metrics.comments || 0),
            shares: (post.engagement?.shares || 0) + (metrics.shares || metrics.retweets || 0),
            impressions: (post.engagement?.impressions || 0) + (metrics.impressions || 0),
            lastSynced: new Date()
          }
        }
      });

      console.log(`✅ Synced ${platform.name} metrics for post ${post._id}`);
    } catch (error) {
      console.error(`❌ Platform sync error (${platform.name}):`, error.message);
      throw error;
    }
  }

  /**
   * Get job status
   * @returns {Object} Job status
   */
  getStatus() {
    return {
      running: this.interval !== null,
      intervalMinutes: this.intervalMinutes,
      nextRunIn: this.interval ? `${this.intervalMinutes} minutes` : 'Not scheduled'
    };
  }
}

module.exports = new EngagementTrackingJob();
