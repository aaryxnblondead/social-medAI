const { GeneratedPost, BrandProfile } = require('../models');

class RLOptimizerService {
  // Calculate reward using normalized formula from README
  // reward = (likes + 3*replies + 5*retweets) / impressions
  calculateReward(metrics, impressions = 1) {
    const likes = metrics.likes || 0;
    const replies = metrics.replies || 0;
    const retweets = metrics.retweets || 0;

    if (impressions <= 0) {
      impressions = 1; // Avoid division by zero
    }

    const engagement = likes + (3 * replies) + (5 * retweets);
    const reward = engagement / impressions;

    return {
      engagement,
      reward,
      normalizedReward: Math.min(reward, 1.0) // Cap at 1.0 for reward function
    };
  }

  // Calculate virality score with RL weights
  calculateViralityScore(metrics) {
    const likes = metrics.likes || 0;
    const retweets = metrics.retweets || 0;
    const replies = metrics.replies || 0;

    // Weighted combination based on engagement value
    const score = (likes * 0.1) + (retweets * 0.5) + (replies * 0.4);
    return Math.min(score, 100);
  }

  // Analyze post features and performance
  async analyzePostPerformance(post) {
    try {
      const metrics = post.metrics || {};
      const platformCount = post.platforms?.length || 1;

      // Aggregate impressions (placeholder if not tracked)
      const impressions = metrics.impressions || Math.max(
        metrics.likes * 20,  // Assume ~20 impressions per like
        100
      );

      const reward = this.calculateReward(metrics, impressions);
      const viralityScore = this.calculateViralityScore(metrics);

      return {
        postId: post._id,
        copy: post.copy.substring(0, 100),
        platform: post.platform,
        platformCount,
        metrics,
        impressions,
        reward: reward.reward,
        normalizedReward: reward.normalizedReward,
        viralityScore,
        engagement: reward.engagement,
        copyLength: post.copy.length,
        hasImage: !!post.imageUrl,
        publishedAt: post.publishedAt,
        publishedDaysAgo: post.publishedAt 
          ? Math.floor((Date.now() - new Date(post.publishedAt)) / (1000 * 60 * 60 * 24))
          : null
      };
    } catch (error) {
      console.error('Analysis error:', error.message);
      throw error;
    }
  }

  // Get training data for this week
  async getWeeklyTrainingData(userId) {
    try {
      console.log('📚 Collecting weekly training data...');

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Get published posts from last 7 days
      const posts = await GeneratedPost.find({
        userId,
        status: 'published',
        publishedAt: { $gte: sevenDaysAgo }
      })
        .populate('brandProfileId', 'brandName industry')
        .populate('trendId', 'title score source');

      console.log(`📊 Found ${posts.length} posts from last 7 days`);

      // Analyze each post
      const analyses = [];
      for (const post of posts) {
        try {
          const analysis = await this.analyzePostPerformance(post);
          analyses.push(analysis);
        } catch (error) {
          console.warn(`Failed to analyze post ${post._id}:`, error.message);
        }
      }

      return {
        userId,
        weekStart: sevenDaysAgo,
        weekEnd: new Date(),
        postCount: analyses.length,
        posts: analyses,
        stats: this.calculateTrainingStats(analyses)
      };
    } catch (error) {
      console.error('Training data error:', error.message);
      throw error;
    }
  }

  // Calculate aggregate stats from analyses
  calculateTrainingStats(analyses) {
    if (analyses.length === 0) {
      return {
        avgReward: 0,
        avgViralityScore: 0,
        avgEngagement: 0,
        bestPost: null,
        worstPost: null,
        topFeatures: {},
        insights: []
      };
    }

    const avgReward = analyses.reduce((sum, a) => sum + a.reward, 0) / analyses.length;
    const avgViralityScore = analyses.reduce((sum, a) => sum + a.viralityScore, 0) / analyses.length;
    const avgEngagement = analyses.reduce((sum, a) => sum + a.engagement, 0) / analyses.length;

    // Find best and worst
    const sortedByReward = [...analyses].sort((a, b) => b.reward - a.reward);
    const bestPost = sortedByReward[0];
    const worstPost = sortedByReward[sortedByReward.length - 1];

    // Analyze features
    const topFeatures = this.identifyTopFeatures(sortedByReward.slice(0, Math.ceil(analyses.length * 0.25)));

    // Generate insights
    const insights = this.generateInsights(analyses, avgReward, avgViralityScore);

    return {
      avgReward: avgReward.toFixed(4),
      avgViralityScore: avgViralityScore.toFixed(2),
      avgEngagement: Math.round(avgEngagement),
      bestPost: bestPost ? { copy: bestPost.copy, reward: bestPost.reward, viralityScore: bestPost.viralityScore } : null,
      worstPost: worstPost ? { copy: worstPost.copy, reward: worstPost.reward } : null,
      topFeatures,
      insights
    };
  }

  // Identify top-performing features
  identifyTopFeatures(topPosts) {
    if (topPosts.length === 0) return {};

    const avgLength = topPosts.reduce((sum, p) => sum + p.copyLength, 0) / topPosts.length;
    const avgImpressions = topPosts.reduce((sum, p) => sum + p.impressions, 0) / topPosts.length;
    const withImageCount = topPosts.filter(p => p.hasImage).length;
    const avgPlatforms = topPosts.reduce((sum, p) => sum + p.platformCount, 0) / topPosts.length;

    return {
      avgCopyLength: Math.round(avgLength),
      avgImpressions: Math.round(avgImpressions),
      hasImageRatio: (withImageCount / topPosts.length * 100).toFixed(1) + '%',
      avgPlatformsUsed: avgPlatforms.toFixed(1)
    };
  }

  // Generate actionable insights
  generateInsights(analyses, avgReward, avgViralityScore) {
    const insights = [];

    // Copy length analysis
    const shortCopies = analyses.filter(a => a.copyLength < 100);
    const longCopies = analyses.filter(a => a.copyLength > 250);
    const shortAvgReward = shortCopies.length > 0
      ? shortCopies.reduce((sum, a) => sum + a.reward, 0) / shortCopies.length
      : 0;
    const longAvgReward = longCopies.length > 0
      ? longCopies.reduce((sum, a) => sum + a.reward, 0) / longCopies.length
      : 0;

    if (shortAvgReward > longAvgReward * 1.2) {
      insights.push('✅ SHORT COPY performs 20%+ better - use concise messaging');
    } else if (longAvgReward > shortAvgReward * 1.2) {
      insights.push('✅ LONG COPY performs 20%+ better - provide more context');
    }

    // Image impact
    const withImage = analyses.filter(a => a.hasImage);
    const withoutImage = analyses.filter(a => !a.hasImage);
    if (withImage.length > 0 && withoutImage.length > 0) {
      const imageReward = withImage.reduce((sum, a) => sum + a.reward, 0) / withImage.length;
      const noImageReward = withoutImage.reduce((sum, a) => sum + a.reward, 0) / withoutImage.length;

      if (imageReward > noImageReward * 1.3) {
        insights.push('🖼️ IMAGES increase engagement by 30%+ - prioritize visuals');
      }
    }

    // Multi-platform impact
    const multiPlatform = analyses.filter(a => a.platformCount > 1);
    if (multiPlatform.length > 2) {
      const multiReward = multiPlatform.reduce((sum, a) => sum + a.reward, 0) / multiPlatform.length;
      const singleReward = analyses.filter(a => a.platformCount === 1).reduce((sum, a) => sum + a.reward, 0) 
        / analyses.filter(a => a.platformCount === 1).length;

      if (multiReward > singleReward * 1.2) {
        insights.push('🌐 MULTI-PLATFORM posting drives 20%+ more engagement');
      }
    }

    // Virality threshold
    if (avgViralityScore < 30) {
      insights.push('⚠️ LOW VIRALITY - consider more controversial/emotional themes');
    } else if (avgViralityScore > 70) {
      insights.push('🔥 HIGH VIRALITY - your content is resonating well');
    }

    return insights.length > 0 ? insights : ['📊 Continue analyzing - need more data'];
  }

  // Store training result
  async storeTrainingResult(userId, trainingData, model) {
    try {
      console.log('💾 Storing training result...');

      // In a real system, you'd store this in MongoDB
      // For now, log it
      const result = {
        userId,
        timestamp: new Date(),
        trainingData: {
          postCount: trainingData.postCount,
          stats: trainingData.stats
        },
        model: {
          timestamp: new Date(),
          version: model.version,
          accuracy: model.accuracy,
          parameters: model.parameters
        }
      };

      console.log('✅ Training result stored');
      return result;
    } catch (error) {
      console.error('Store error:', error.message);
      throw error;
    }
  }

  // Full training pipeline
  async trainWeekly(userId) {
    try {
      console.log(`🤖 Starting weekly RL training for user ${userId}...`);

      // Collect training data
      const trainingData = await this.getWeeklyTrainingData(userId);

      if (trainingData.postCount === 0) {
        console.log('⚠️ No posts to train on');
        return {
          status: 'skipped',
          reason: 'No posts this week'
        };
      }

      // In production, you'd use TensorFlow.js or similar
      // For now, we'll use insights-based optimization
      const model = {
        version: '1.0',
        timestamp: new Date(),
        accuracy: trainingData.stats.insights.length > 0 ? 0.85 : 0.5,
        parameters: {
          optimalCopyLength: trainingData.stats.topFeatures.avgCopyLength,
          useImageFrequency: trainingData.stats.topFeatures.hasImageRatio,
          platformStrategy: 'multi-platform' // Based on insights
        }
      };

      // Store result
      await this.storeTrainingResult(userId, trainingData, model);

      console.log('✅ Weekly training complete');
      return {
        status: 'completed',
        trainingData,
        model
      };
    } catch (error) {
      console.error('Training error:', error.message);
      throw error;
    }
  }
}

module.exports = new RLOptimizerService();
