const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { User, GeneratedPost, BrandProfile } = require('../models');

const router = express.Router();

/**
 * Get current user account details
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -security.twoFactorSecret');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get usage statistics
    const postsCount = await GeneratedPost.countDocuments({ userId: req.userId });
    const brandsCount = await BrandProfile.countDocuments({ userId: req.userId });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        onboardingComplete: user.onboardingComplete,
        subscription: user.subscription,
        preferences: user.preferences,
        createdAt: user.createdAt,
        socialAccounts: {
          twitter: {
            connected: user.socialAccounts.twitter.connected,
            username: user.socialAccounts.twitter.username,
            connectedAt: user.socialAccounts.twitter.connectedAt
          },
          linkedin: {
            connected: user.socialAccounts.linkedin.connected,
            name: `${user.socialAccounts.linkedin.firstName || ''} ${user.socialAccounts.linkedin.lastName || ''}`.trim(),
            connectedAt: user.socialAccounts.linkedin.connectedAt
          },
          facebook: {
            connected: user.socialAccounts.facebook.connected,
            pageName: user.socialAccounts.facebook.pageName,
            connectedAt: user.socialAccounts.facebook.connectedAt
          },
          instagram: {
            connected: user.socialAccounts.instagram.connected,
            username: user.socialAccounts.instagram.username,
            connectedAt: user.socialAccounts.instagram.connectedAt
          }
        }
      },
      usage: {
        postsThisMonth: postsCount,
        brandsCreated: brandsCount,
        limit: user.subscription.maxPostsPerMonth
      }
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update user preferences
 */
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { emailNotifications, pushNotifications, marketingEmails } = req.body;

    const updates = {};
    if (typeof emailNotifications === 'boolean') updates['preferences.emailNotifications'] = emailNotifications;
    if (typeof pushNotifications === 'boolean') updates['preferences.pushNotifications'] = pushNotifications;
    if (typeof marketingEmails === 'boolean') updates['preferences.marketingEmails'] = marketingEmails;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json({ preferences: user.preferences });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Disconnect social account
 */
router.delete('/social/:platform', verifyToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const validPlatforms = ['twitter', 'linkedin', 'facebook', 'instagram'];

    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    const user = await User.findById(req.userId);
    
    // TODO: In production, make API call to revoke token on platform
    // await revokePlatformToken(platform, user.socialAccounts[platform].accessToken);

    await User.findByIdAndUpdate(req.userId, {
      $set: {
        [`socialAccounts.${platform}.connected`]: false,
        [`socialAccounts.${platform}.accessToken`]: null,
        [`socialAccounts.${platform}.refreshToken`]: null
      }
    });

    res.json({ message: `${platform} account disconnected successfully` });
  } catch (error) {
    console.error('Disconnect social account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete account (GDPR compliance)
 */
router.delete('/delete', verifyToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required for account deletion' });
    }

    const user = await User.findById(req.userId);
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Revoke all social tokens
    await user.revokeSocialTokens();

    // Delete all user data
    await Promise.all([
      GeneratedPost.deleteMany({ userId: req.userId }),
      BrandProfile.deleteMany({ userId: req.userId }),
      User.findByIdAndDelete(req.userId)
    ]);

    res.json({ message: 'Account and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export user data (GDPR compliance)
 */
router.get('/export', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -security.twoFactorSecret');
    const posts = await GeneratedPost.find({ userId: req.userId });
    const brands = await BrandProfile.find({ userId: req.userId });

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        createdAt: user.createdAt,
        socialAccounts: user.socialAccounts
      },
      posts: posts.map(post => ({
        content: post.content,
        platform: post.platform,
        status: post.status,
        createdAt: post.createdAt,
        publishedAt: post.publishedAt,
        engagement: post.engagement
      })),
      brands: brands.map(brand => ({
        companyName: brand.companyName,
        industry: brand.industry,
        targetAudience: brand.targetAudience,
        brandVoice: brand.brandVoice,
        createdAt: brand.createdAt
      }))
    };

    res.json(exportData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
