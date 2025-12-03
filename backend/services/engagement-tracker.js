const { GeneratedPost } = require('../models');
const twitterPublisher = require('./twitter-publisher');

class EngagementTrackerService {
  constructor() {
    this.trackingInterval = null;
  }

  // Start tracking engagement for all published posts
  startTracking(intervalMinutes = 60) {
    if (this.trackingInterval) {
      console.log('⚠️ Engagement tracking already running');
      return;
    }

    console.log(`📊 Starting engagement tracking (every ${intervalMinutes} minutes)...`);
    
    this.trackingInterval = setInterval(async () => {
      await this.syncAllEngagements();
    }, intervalMinutes * 60 * 1000);

    // Run immediately on start
    this.syncAllEngagements();
  }

  // Stop tracking
  stopTracking() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      console.log('⏹️ Engagement tracking stopped');
    }
  }

  // Sync engagement metrics for all published posts
  async syncAllEngagements() {
    try {
      console.log('🔄 Syncing engagement metrics...');

      const publishedPosts = await GeneratedPost.find({
        status: 'published',
        'platforms.twitter.postId': { $exists: true }
      });

      let updated = 0;

      for (const post of publishedPosts) {
        try {
          const twitterPlatform = post.platforms.find(p => p.name === 'twitter');
          if (!twitterPlatform || !twitterPlatform.postId) continue;

          // Fetch latest metrics from Twitter
          const metrics = await twitterPublisher.getTweetMetrics(twitterPlatform.postId);

          // Update platform metrics
          const platformIndex = post.platforms.findIndex(p => p.name === 'twitter');
          post.platforms[platformIndex].metrics = {
            likes: metrics.likes || 0,
            retweets: metrics.retweets || 0,
            replies: metrics.replies || 0,
            impressions: metrics.impressions || 0
          };
          post.platforms[platformIndex].lastSyncedAt = new Date();

          // Calculate virality score
          const viralityScore = this.calculateViralityScore(metrics);
          post.viralityScore = viralityScore;

          // Calculate reward for RL
          const reward = this.calculateReward(metrics, metrics.impressions);
          post.rlReward = reward;

          await post.save();
          updated++;
        } catch (error) {
          console.warn(`⚠️ Failed to sync post ${post._id}:`, error.message);
        }
      }

      console.log(`✅ Synced ${updated} posts`);
      return { synced: updated };
    } catch (error) {
      console.error('❌ Engagement sync error:', error.message);
      throw error;
    }
  }

  // Sync engagement for a single post
  async syncPostEngagement(postId) {
    try {
      const post = await GeneratedPost.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const twitterPlatform = post.platforms.find(p => p.name === 'twitter');
      if (!twitterPlatform || !twitterPlatform.postId) {
        throw new Error('No Twitter post ID found');
      }

      // Fetch latest metrics
      const metrics = await twitterPublisher.getTweetMetrics(twitterPlatform.postId);

      // Update platform metrics
      const platformIndex = post.platforms.findIndex(p => p.name === 'twitter');
      post.platforms[platformIndex].metrics = {
        likes: metrics.likes || 0,
        retweets: metrics.retweets || 0,
        replies: metrics.replies || 0,
        impressions: metrics.impressions || 0
      };
      post.platforms[platformIndex].lastSyncedAt = new Date();

      // Calculate scores
      post.viralityScore = this.calculateViralityScore(metrics);
      post.rlReward = this.calculateReward(metrics, metrics.impressions);

      await post.save();

      return {
        postId: post._id,
        metrics,
        viralityScore: post.viralityScore,
        rlReward: post.rlReward
      };
    } catch (error) {
      console.error(`❌ Sync post ${postId} error:`, error.message);
      throw error;
    }
  }

  // Get aggregated engagement stats for a user
  async getUserEngagementStats(userId) {
    try {
      const posts = await GeneratedPost.find({
        userId,
        status: 'published'
      });

      const totalPosts = posts.length;
      const totalLikes = posts.reduce((sum, p) => {
        const twitter = p.platforms.find(pl => pl.name === 'twitter');
        return sum + (twitter?.metrics?.likes || 0);
      }, 0);
      const totalRetweets = posts.reduce((sum, p) => {
        const twitter = p.platforms.find(pl => pl.name === 'twitter');
        return sum + (twitter?.metrics?.retweets || 0);
      }, 0);
      const totalReplies = posts.reduce((sum, p) => {
        const twitter = p.platforms.find(pl => pl.name === 'twitter');
        return sum + (twitter?.metrics?.replies || 0);
      }, 0);
      const avgViralityScore = posts.reduce((sum, p) => sum + (p.viralityScore || 0), 0) / totalPosts;

      return {
        totalPosts,
        totalEngagement: totalLikes + totalRetweets + totalReplies,
        totalLikes,
        totalRetweets,
        totalReplies,
        avgViralityScore: avgViralityScore || 0
      };
    } catch (error) {
      console.error('❌ Get user stats error:', error.message);
      throw error;
    }
  }

  // Calculate virality score (0-100) - aligned with RL
  calculateViralityScore(metrics) {
    const rlOptimizer = require('./rl-optimizer');
    return rlOptimizer.calculateViralityScore(metrics);
  }

  // Calculate normalized reward
  calculateReward(metrics, impressions = 1) {
    const rlOptimizer = require('./rl-optimizer');
    return rlOptimizer.calculateReward(metrics, impressions);
  }
}

module.exports = new EngagementTrackerService();
