const rlOptimizer = require('../services/rl-optimizer');
const { User, BrandProfile } = require('../models');

/**
 * RL Training Job
 * Runs weekly (every Monday at 2 AM) to train RL models for all users
 */
class RLTrainingJob {
  constructor() {
    this.timeout = null;
    this.runDay = 1; // Monday (0 = Sunday, 1 = Monday, etc.)
    this.runHour = 2; // 2 AM
  }

  /**
   * Start the RL training job
   * Calculates next Monday 2 AM and schedules execution
   */
  start() {
    if (this.timeout) {
      console.log('⚠️ RL training job already scheduled');
      return;
    }

    console.log('🤖 Starting weekly RL training job...');
    this.scheduleNext();
  }

  /**
   * Stop the RL training job
   */
  stop() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
      console.log('⏹️ RL training job stopped');
    }
  }

  /**
   * Schedule next execution
   */
  scheduleNext() {
    const nextRun = this.getNextRunTime();
    const delayMs = nextRun.getTime() - Date.now();

    console.log(`📅 RL training scheduled for ${nextRun.toISOString()}`);

    this.timeout = setTimeout(async () => {
      await this.run();
      // Schedule next week's run
      this.scheduleNext();
    }, delayMs);
  }

  /**
   * Get next run time (next Monday at 2 AM)
   * @returns {Date} Next run timestamp
   */
  getNextRunTime() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Calculate days until next Monday
    const daysUntilMonday = (this.runDay - dayOfWeek + 7) % 7 || 7;
    
    const nextMonday = new Date(now);
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    nextMonday.setHours(this.runHour, 0, 0, 0);

    // If next Monday 2 AM is in the past, add 7 days
    if (nextMonday.getTime() <= Date.now()) {
      nextMonday.setDate(nextMonday.getDate() + 7);
    }

    return nextMonday;
  }

  /**
   * Run RL training for all users
   */
  async run() {
    try {
      console.log('🤖 Running weekly RL training for all users...');
      const startTime = Date.now();

      // Get all active brand profiles
      const brands = await BrandProfile.find({ active: { $ne: false } });
      console.log(`📊 Training models for ${brands.length} brands`);

      let successCount = 0;
      let errorCount = 0;

      for (const brand of brands) {
        try {
          console.log(`🔄 Training brand: ${brand.name} (${brand._id})`);
          
          // Get training data
          const trainingData = await rlOptimizer.getTrainingData(brand.userId);

          if (!trainingData || trainingData.length === 0) {
            console.log(`⚠️ No training data for brand ${brand.name}`);
            continue;
          }

          // Train weekly
          await rlOptimizer.trainWeekly(brand.userId);

          // Update brand preferences based on learning
          const recommendations = await this.generateRecommendations(brand.userId);
          
          await BrandProfile.findByIdAndUpdate(brand._id, {
            $set: {
              'mlInsights': {
                lastTrainingDate: new Date(),
                recommendations,
                trainingDataSize: trainingData.length
              }
            }
          });

          successCount++;
          console.log(`✅ Trained brand ${brand.name}`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Error training brand ${brand.name}:`, error.message);
        }
      }

      const duration = Date.now() - startTime;

      console.log(`✅ Weekly RL training completed in ${(duration / 1000).toFixed(2)}s`);
      console.log(`📊 Success: ${successCount} | Errors: ${errorCount}`);
    } catch (error) {
      console.error('❌ RL training job error:', error.message);
    }
  }

  /**
   * Generate content recommendations based on RL insights
   * @param {string} userId - User ID
   * @returns {Array} Recommendations
   */
  async generateRecommendations(userId) {
    try {
      const trainingData = await rlOptimizer.getTrainingData(userId);

      if (!trainingData || trainingData.length === 0) {
        return [];
      }

      // Analyze top performing posts
      const topPosts = trainingData
        .sort((a, b) => b.reward - a.reward)
        .slice(0, 10);

      const recommendations = [];

      // Analyze platforms
      const platformPerformance = {};
      topPosts.forEach(post => {
        (post.platforms || []).forEach(platform => {
          if (!platformPerformance[platform.name]) {
            platformPerformance[platform.name] = { count: 0, totalReward: 0 };
          }
          platformPerformance[platform.name].count++;
          platformPerformance[platform.name].totalReward += post.reward || 0;
        });
      });

      const bestPlatform = Object.entries(platformPerformance)
        .sort((a, b) => b[1].totalReward / b[1].count - a[1].totalReward / a[1].count)
        [0]?.[0];

      if (bestPlatform) {
        recommendations.push({
          type: 'platform',
          value: bestPlatform,
          confidence: 0.8,
          message: `Your content performs best on ${bestPlatform}`
        });
      }

      // Analyze content length
      const avgTopLength = topPosts.reduce((sum, p) => sum + (p.content?.copy?.length || 0), 0) / topPosts.length;
      recommendations.push({
        type: 'content_length',
        value: Math.round(avgTopLength),
        confidence: 0.7,
        message: `Optimal post length: ${Math.round(avgTopLength)} characters`
      });

      // Analyze posting time
      const hourCounts = {};
      topPosts.forEach(post => {
        const hour = new Date(post.publishedAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const bestHour = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        [0]?.[0];

      if (bestHour) {
        recommendations.push({
          type: 'posting_time',
          value: parseInt(bestHour),
          confidence: 0.6,
          message: `Best posting time: ${bestHour}:00 - ${parseInt(bestHour) + 1}:00`
        });
      }

      return recommendations;
    } catch (error) {
      console.error('❌ Recommendations error:', error.message);
      return [];
    }
  }

  /**
   * Get job status
   * @returns {Object} Job status
   */
  getStatus() {
    return {
      running: this.timeout !== null,
      nextRun: this.timeout ? this.getNextRunTime().toISOString() : 'Not scheduled',
      schedule: 'Every Monday at 2:00 AM'
    };
  }
}

module.exports = new RLTrainingJob();
