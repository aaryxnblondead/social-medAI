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
          like_count: m?.like_count || 0,
          retweet_count: m?.retweet_count || 0,
          reply_count: m?.reply_count || 0,
          impression_count: m?.impression_count || 0
        };
      }
      // LinkedIn / Facebook / Instagram fetching can be added similarly
      // Compute reward: R = (L + 3C + 5S) / Impressions (approximate shares from retweets)
      const L = post.engagement?.like_count || 0;
      const C = post.engagement?.reply_count || 0;
      const S = post.engagement?.retweet_count || 0;
      const Impr = post.engagement?.impression_count || 1;
      const R = (L + 3*C + 5*S) / Impr;
      post.reward = Math.min(R * 100, 5.0);
      await post.save();
    } catch {}
  }
}
