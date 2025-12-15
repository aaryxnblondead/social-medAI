import { Post } from '../schema/post.js';
import { Brand } from '../schema/brand.js';
import mongoose from 'mongoose';

const PolicySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, index: true },
  brandId: { type: mongoose.Schema.Types.ObjectId, index: true },
  data: Object
}, { timestamps: true });

export const Policy = mongoose.model('Policy', PolicySchema);

export async function trainWeeklyPolicies() {
  const posts = await Post.find({ publishedAt: { $gte: new Date(Date.now() - 30*24*3600*1000) } });
  const grouped = new Map();
  for (const p of posts) {
    const key = `${p.userId}:${p.brandId}:${p.platform}`;
    const arr = grouped.get(key) || [];
    arr.push(p);
    grouped.set(key, arr);
  }
  for (const [key, arr] of grouped.entries()) {
    const [userId, brandId, platform] = key.split(':');
    const avgReward = arr.reduce((s, p) => s + (p.reward || 0), 0) / Math.max(arr.length, 1);
    const policy = { platform, avgReward, totalPosts: arr.length };
    await Policy.findOneAndUpdate({ userId, brandId }, { data: policy }, { upsert: true, new: true });
  }
}
