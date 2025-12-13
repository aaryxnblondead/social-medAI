const { User, GeneratedPost, BrandProfile } = require('../models');

/**
 * Middleware to check subscription limits
 */
const checkSubscriptionLimits = (limitType) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if subscription is active
      if (user.subscription.status !== 'active') {
        return res.status(403).json({ 
          error: 'Subscription inactive',
          message: 'Please upgrade your subscription to continue using this feature'
        });
      }

      // Check if subscription has expired
      if (user.subscription.endDate && new Date() > user.subscription.endDate) {
        await User.findByIdAndUpdate(req.userId, {
          $set: { 'subscription.status': 'expired' }
        });
        return res.status(403).json({
          error: 'Subscription expired',
          message: 'Your subscription has expired. Please renew to continue.'
        });
      }

      switch (limitType) {
        case 'posts':
          // Check monthly post limit
          const currentMonth = new Date();
          currentMonth.setDate(1);
          currentMonth.setHours(0, 0, 0, 0);

          const postsThisMonth = await GeneratedPost.countDocuments({
            userId: req.userId,
            createdAt: { $gte: currentMonth }
          });

          if (postsThisMonth >= user.subscription.maxPostsPerMonth) {
            return res.status(403).json({
              error: 'Post limit reached',
              message: `You've reached your monthly limit of ${user.subscription.maxPostsPerMonth} posts`,
              usage: {
                current: postsThisMonth,
                limit: user.subscription.maxPostsPerMonth
              }
            });
          }
          break;

        case 'brands':
          // Check brand limit
          const brandsCount = await BrandProfile.countDocuments({ userId: req.userId });
          
          if (brandsCount >= user.subscription.maxBrands) {
            return res.status(403).json({
              error: 'Brand limit reached',
              message: `You've reached your limit of ${user.subscription.maxBrands} brand profiles`,
              usage: {
                current: brandsCount,
                limit: user.subscription.maxBrands
              }
            });
          }
          break;

        default:
          break;
      }

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({ error: 'Failed to verify subscription limits' });
    }
  };
};

module.exports = { checkSubscriptionLimits };
