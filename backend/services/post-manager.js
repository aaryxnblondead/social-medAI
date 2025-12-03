const { GeneratedPost } = require('../models');

class PostManagerService {
  // Schedule post for future publication
  async schedulePost(postId, userId, scheduledTime) {
    try {
      console.log(`📅 Scheduling post for ${scheduledTime}...`);

      const post = await GeneratedPost.findOneAndUpdate(
        { _id: postId, userId },
        {
          status: 'scheduled',
          scheduledAt: new Date(scheduledTime),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!post) {
        throw new Error('Post not found');
      }

      console.log('✅ Post scheduled');
      return post;
    } catch (error) {
      console.error('❌ Schedule error:', error.message);
      throw error;
    }
  }

  // Get scheduled posts
  async getScheduledPosts(userId) {
    try {
      const posts = await GeneratedPost.find({
        userId,
        status: 'scheduled'
      })
        .sort({ scheduledAt: 1 })
        .populate('brandProfileId', 'brandName')
        .populate('trendId', 'title');

      return posts;
    } catch (error) {
      console.error('❌ Get scheduled error:', error.message);
      throw error;
    }
  }

  // Get drafts
  async getDrafts(userId) {
    try {
      const posts = await GeneratedPost.find({
        userId,
        status: 'draft'
      })
        .sort({ createdAt: -1 })
        .populate('brandProfileId', 'brandName')
        .populate('trendId', 'title');

      return posts;
    } catch (error) {
      console.error('❌ Get drafts error:', error.message);
      throw error;
    }
  }

  // Get published posts
  async getPublishedPosts(userId) {
    try {
      const posts = await GeneratedPost.find({
        userId,
        status: 'published'
      })
        .sort({ publishedAt: -1 })
        .populate('brandProfileId', 'brandName')
        .populate('trendId', 'title');

      return posts;
    } catch (error) {
      console.error('❌ Get published error:', error.message);
      throw error;
    }
  }

  // Get posts due for publishing (scheduled time passed)
  async getPostsDueForPublishing() {
    try {
      const now = new Date();
      const posts = await GeneratedPost.find({
        status: 'scheduled',
        scheduledAt: { $lte: now }
      });

      return posts;
    } catch (error) {
      console.error('❌ Get due posts error:', error.message);
      throw error;
    }
  }

  // Publish post
  async publishPost(postId, userId, twitterPostId = null) {
    try {
      console.log(`📤 Publishing post...`);

      const post = await GeneratedPost.findOneAndUpdate(
        { _id: postId, userId },
        {
          status: 'published',
          publishedAt: new Date(),
          twitterPostId: twitterPostId,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!post) {
        throw new Error('Post not found');
      }

      console.log('✅ Post published');
      return post;
    } catch (error) {
      console.error('❌ Publish error:', error.message);
      throw error;
    }
  }

  // Update post metrics
  async updatePostMetrics(postId, userId, metrics) {
    try {
      const post = await GeneratedPost.findOneAndUpdate(
        { _id: postId, userId },
        {
          'metrics.likes': metrics.likes || 0,
          'metrics.retweets': metrics.retweets || 0,
          'metrics.replies': metrics.replies || 0,
          updatedAt: new Date()
        },
        { new: true }
      );

      return post;
    } catch (error) {
      console.error('❌ Update metrics error:', error.message);
      throw error;
    }
  }

  // Calculate post performance score
  calculateScore(metrics) {
    const likes = metrics.likes || 0;
    const retweets = metrics.retweets || 0;
    const replies = metrics.replies || 0;

    // Simple scoring: likes (1pt) + retweets (2pts) + replies (3pts)
    return likes + (retweets * 2) + (replies * 3);
  }
}

module.exports = new PostManagerService();
