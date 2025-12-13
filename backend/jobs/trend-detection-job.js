const trendDetector = require('../services/trend-detector');
const { Trend } = require('../models');

/**
 * Trend Detection Job
 * Runs every 6 hours to fetch and store trends from multiple sources
 */
class TrendDetectionJob {
  constructor() {
    this.interval = null;
    this.intervalMinutes = 360; // 6 hours
  }

  /**
   * Start the trend detection job
   * @param {number} intervalMinutes - How often to run (default: 360 = 6 hours)
   */
  start(intervalMinutes = 360) {
    if (this.interval) {
      console.log('⚠️ Trend detection job already running');
      return;
    }

    this.intervalMinutes = intervalMinutes;

    console.log(`📊 Starting trend detection job (every ${intervalMinutes} minutes)...`);

    // Run immediately on start
    this.run();

    // Schedule recurring execution
    this.interval = setInterval(() => {
      this.run();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop the trend detection job
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('⏹️ Trend detection job stopped');
    }
  }

  /**
   * Run trend detection once
   */
  async run() {
    try {
      console.log('🔍 Running trend detection job...');
      const startTime = Date.now();

      await trendDetector.detectAndSaveTrends();

      const duration = Date.now() - startTime;
      const trendCount = await Trend.countDocuments();

      console.log(`✅ Trend detection completed in ${duration}ms`);
      console.log(`📊 Total trends in database: ${trendCount}`);
    } catch (error) {
      console.error('❌ Trend detection job error:', error.message);
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

module.exports = new TrendDetectionJob();
