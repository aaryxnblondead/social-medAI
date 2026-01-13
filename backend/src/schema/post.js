import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, index: true, required: true },
  brandId: { type: mongoose.Schema.Types.ObjectId, index: true, required: true },
  platform: { type: String, enum: ['twitter', 'linkedin', 'facebook', 'instagram'], default: 'twitter' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  content: {
    copy: { type: String, default: '' },
    graphicUrl: { type: String, default: '' }
  },
  trend: {
    id: String,
    title: String,
    description: String,
    url: String,
    category: String,
    source: String,
    imageUrl: String,
    metrics: {
      growth: String,
      volume: String,
      sentiment: String
    }
  },
  brandSnapshot: {
    name: String,
    persona: String,
    industry: String,
    tone: String,
    objective: String
  },
  platformPostId: String,
  platformUrl: String,
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 }
  },
  reward: { type: Number, default: 0 },
  publishedAt: Date
}, { timestamps: true });

export const Post = mongoose.model('Post', PostSchema);
