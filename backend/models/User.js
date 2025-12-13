const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['brand', 'influencer'],
    default: 'brand'
  },
  userType: {
    type: String,
    enum: ['brand', 'influencer', null],
    default: null
  },
  onboardingComplete: {
    type: Boolean,
    default: false
  },
  socialAccounts: {
    twitter: {
      connected: { type: Boolean, default: false },
      accessToken: String,
      refreshToken: String,
      tokenExpiry: Date,
      userId: String,
      username: String,
      name: String,
      connectedAt: Date,
      lastRefreshed: Date,
      scopes: [String]
    },
    linkedin: {
      connected: { type: Boolean, default: false },
      accessToken: String,
      tokenExpiry: Date,
      userId: String,
      firstName: String,
      lastName: String,
      connectedAt: Date,
      scopes: [String]
    },
    facebook: {
      connected: { type: Boolean, default: false },
      accessToken: String,
      pageId: String,
      pageName: String,
      pages: [{ id: String, name: String }],
      connectedAt: Date,
      tokenExpiry: Date,
      scopes: [String]
    },
    instagram: {
      connected: { type: Boolean, default: false },
      businessAccountId: String,
      accessToken: String,
      connectedAt: Date,
      username: String,
      scopes: [String]
    }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
    status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
    maxBrands: { type: Number, default: 1 },
    maxPostsPerMonth: { type: Number, default: 10 },
    startDate: Date,
    endDate: Date
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false }
  },
  security: {
    lastPasswordChange: Date,
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
  return this.security.lockedUntil && this.security.lockedUntil > Date.now();
};

// Method to increment failed login attempts
userSchema.methods.incLoginAttempts = async function() {
  // Reset if lock has expired
  if (this.security.lockedUntil && this.security.lockedUntil < Date.now()) {
    return this.updateOne({
      $set: { 'security.failedLoginAttempts': 1 },
      $unset: { 'security.lockedUntil': 1 }
    });
  }

  // Increment attempts
  const updates = { $inc: { 'security.failedLoginAttempts': 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.security.failedLoginAttempts + 1 >= 5) {
    updates.$set = { 'security.lockedUntil': Date.now() + 2 * 60 * 60 * 1000 };
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { 'security.failedLoginAttempts': 0 },
    $unset: { 'security.lockedUntil': 1 }
  });
};

// Method to revoke all social account tokens (for GDPR/account deletion)
userSchema.methods.revokeSocialTokens = async function() {
  // In production, make API calls to revoke tokens on each platform
  // For now, just clear them from database
  return this.updateOne({
    $set: {
      'socialAccounts.twitter.connected': false,
      'socialAccounts.twitter.accessToken': null,
      'socialAccounts.twitter.refreshToken': null,
      'socialAccounts.linkedin.connected': false,
      'socialAccounts.linkedin.accessToken': null,
      'socialAccounts.facebook.connected': false,
      'socialAccounts.facebook.accessToken': null,
      'socialAccounts.instagram.connected': false,
      'socialAccounts.instagram.accessToken': null
    }
  });
};

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ 'socialAccounts.twitter.userId': 1 });
userSchema.index({ 'socialAccounts.linkedin.userId': 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
