import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, index: true, required: true },
  brandId: { type: mongoose.Schema.Types.ObjectId, index: true },
  platform: { type: String, enum: ['twitter', 'linkedin', 'facebook', 'instagram'], default: 'twitter' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  content: {
    copy: String,
    graphicUrl: String
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
