import axios from 'axios';
import { Post } from '../schema/post.js';
import { User } from '../schema/user.js';

function twitterClient(token) {
  return axios.create({ baseURL: 'https://api.twitter.com/2', headers: { Authorization: `Bearer ${token}` } });
}

export async function syncEngagementForUser(userId) {
  const user = await User.findById(userId);
  const posts = await Post.find({ userId, status: 'published' });
  for (const post of posts) {
    try {
      if (post.platform === 'twitter' && user?.socialAccounts?.twitter?.accessToken && post.platformPostId) {
        const client = twitterClient(user.socialAccounts.twitter.accessToken);
        const r = await client.get(`/tweets/${post.platformPostId}`, { params: { 'tweet.fields': 'public_metrics' } });
        const m = r.data?.data?.public_metrics;
        post.engagement = {
          likes: m?.like_count || 0,
          comments: m?.reply_count || 0,
          shares: (m?.retweet_count || 0) + (m?.quote_count || 0),
          impressions: m?.impression_count || 0
        };
      }
      // LinkedIn / Facebook / Instagram fetching can be added similarly
      // Compute reward: R = (L + 3C + 5S) / Impressions (approximate shares from retweets)
      const L = post.engagement?.likes || 0;
      const C = post.engagement?.comments || 0;
      const S = post.engagement?.shares || 0;
      const denominator = post.engagement?.impressions || L + C + S || 1;
      const R = (L + 3 * C + 5 * S) / denominator;
      post.reward = Number(Math.min(R * 100, 5.0).toFixed(2));
      await post.save();
    } catch {}
  }
}
