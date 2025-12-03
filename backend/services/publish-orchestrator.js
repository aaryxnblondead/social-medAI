const twitter = require('./twitter-service');

async function publishToPlatform(platform, payload, userId) {
  switch (platform) {
    case 'twitter': {
      const res = await twitter.publishTweet({ text: payload.text, mediaUrl: payload.mediaUrl, userId });
      return { platform: 'twitter', id: res.tweetId };
    }
    default:
      return { platform, id: `ext_${platform}_${Date.now()}` };
  }
}

async function publishToMultiple(platforms, payload, userId) {
  const results = [];
  for (const p of platforms) {
    results.push(await publishToPlatform(p, payload, userId));
  }
  return results;
}

async function syncAllMetrics(postId, userId) {
  // Placeholder: aggregate metrics across platforms
  return {
    twitter: await twitter.getTweetMetrics(`tw_${postId}`)
  };
}

module.exports = { publishToPlatform, publishToMultiple, syncAllMetrics };
