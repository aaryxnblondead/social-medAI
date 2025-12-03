const Queue = require('bull');
const multiPlatformPublisher = require('./multi-platform-publisher');
const { GeneratedPost } = require('../models');

// Create queue
const publishingQueue = new Queue('post-publishing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Process publishing jobs
publishingQueue.process(async (job) => {
  try {
    const { postId, userId, platforms } = job.data;

    console.log(`📤 Processing publishing job for post ${postId}...`);

    // Get post
    const post = await GeneratedPost.findOne({
      _id: postId,
      userId
    });

    if (!post) {
      throw new Error('Post not found');
    }

    if (!post.copy || post.copy.length === 0) {
      throw new Error('Post has no copy');
    }

    // Publish to platforms
    const results = await multiPlatformPublisher.publishToMultiplePlatforms(
      post,
      platforms
    );

    // Update post with results
    for (const result of results) {
      const platformIndex = post.platforms.findIndex(p => p.name === result.platform);
      if (platformIndex >= 0) {
        post.platforms[platformIndex] = {
          ...post.platforms[platformIndex],
          ...result,
          publishedAt: new Date(),
          lastSyncedAt: new Date()
        };
      } else {
        post.platforms.push({
          name: result.platform,
          ...result,
          publishedAt: new Date(),
          lastSyncedAt: new Date()
        });
      }
    }

    post.status = 'published';
    post.publishedAt = new Date();
    await post.save();

    console.log(`✅ Post ${postId} published successfully`);
    return results;
  } catch (error) {
    console.error(`❌ Publishing job error: ${error.message}`);
    throw error;
  }
});

// Job events
publishingQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

publishingQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed: ${err.message}`);
  console.log(`   Retrying... (attempt ${job.attemptsMade + 1}/${job.opts.attempts})`);
});

// Schedule a post for publishing
const schedulePublishing = async (postId, userId, platforms, scheduledTime) => {
  try {
    const delayMs = new Date(scheduledTime).getTime() - Date.now();

    if (delayMs <= 0) {
      throw new Error('Scheduled time must be in the future');
    }

    const job = await publishingQueue.add(
      { postId, userId, platforms },
      {
        delay: delayMs,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    );

    console.log(`📅 Publishing job ${job.id} scheduled for ${scheduledTime}`);
    return job;
  } catch (error) {
    console.error(`❌ Schedule error: ${error.message}`);
    throw error;
  }
};

// Publish immediately
const publishImmediate = async (postId, userId, platforms) => {
  try {
    const job = await publishingQueue.add(
      { postId, userId, platforms },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
      }
    );

    console.log(`📤 Publishing job ${job.id} enqueued for immediate processing`);
    return job;
  } catch (error) {
    console.error(`❌ Immediate publish error: ${error.message}`);
    throw error;
  }
};

// Get queue stats
const getQueueStats = async () => {
  try {
    const counts = await publishingQueue.getJobCounts();
    const active = await publishingQueue.getActiveCount();
    const delayed = await publishingQueue.getDelayedCount();

    return {
      active,
      delayed,
      completed: counts.completed,
      failed: counts.failed,
      waiting: counts.waiting
    };
  } catch (error) {
    console.error(`❌ Queue stats error: ${error.message}`);
    return {};
  }
};

// Get job status
const getJobStatus = async (jobId) => {
  try {
    const job = await publishingQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      status: await job.getState(),
      progress: job.progress(),
      data: job.data,
      attempts: job.attemptsMade,
      failedReason: job.failedReason
    };
  } catch (error) {
    console.error(`❌ Job status error: ${error.message}`);
    return null;
  }
};

// Clean up old jobs
const cleanupOldJobs = async (ageInMs = 7 * 24 * 60 * 60 * 1000) => {
  try {
    const completed = await publishingQueue.clean(ageInMs, 100, 'completed');
    const failed = await publishingQueue.clean(ageInMs, 100, 'failed');

    console.log(`🧹 Cleaned ${completed.length} completed and ${failed.length} failed jobs`);
    return { completed: completed.length, failed: failed.length };
  } catch (error) {
    console.error(`❌ Cleanup error: ${error.message}`);
    return { error: error.message };
  }
};

module.exports = {
  publishingQueue,
  schedulePublishing,
  publishImmediate,
  getQueueStats,
  getJobStatus,
  cleanupOldJobs
};
