import mongoose from 'mongoose';

const SocialAccountSchema = new mongoose.Schema({
  connected: { type: Boolean, default: false },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiry: { type: Date },
  username: { type: String },
  // Optional provider-specific fields
  authorUrn: { type: String }, // LinkedIn
  accountId: { type: String }, // Generic
  pageId: { type: String },    // Facebook Page ID
  igBusinessId: { type: String } // Instagram Business Account ID
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['brand', 'influencer', 'admin'], default: 'brand' },
  socialAccounts: {
    twitter: SocialAccountSchema,
    linkedin: SocialAccountSchema,
    facebook: SocialAccountSchema,
    instagram: SocialAccountSchema
  }
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
