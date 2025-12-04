const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const BrandOnboarding = require('../models/BrandOnboarding');
const InfluencerOnboarding = require('../models/InfluencerOnboarding');
const User = require('../models/User');

// POST /api/onboarding/brand - Create/Update brand profile
router.post('/brand', verifyToken, async (req, res) => {
  try {
    const {
      brandName,
      industry,
      targetAudience,
      voiceTone,
      socialPlatforms,
      websiteUrl,
      description,
      mainGoal,
      challenges,
      monthlySocialBudget,
    } = req.body;

    // Validate required fields
    if (!brandName || !industry || !targetAudience || !voiceTone || !socialPlatforms || !mainGoal) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    // Check if brand profile already exists
    let brandProfile = await BrandOnboarding.findOne({ userId: req.userId });

    if (brandProfile) {
      // Update existing profile
      brandProfile.brandName = brandName;
      brandProfile.industry = industry;
      brandProfile.targetAudience = targetAudience;
      brandProfile.voiceTone = voiceTone;
      brandProfile.socialPlatforms = socialPlatforms;
      brandProfile.websiteUrl = websiteUrl || '';
      brandProfile.description = description || '';
      brandProfile.mainGoal = mainGoal;
      brandProfile.challenges = challenges || [];
      brandProfile.monthlySocialBudget = monthlySocialBudget || 0;
    } else {
      // Create new profile
      brandProfile = new BrandOnboarding({
        userId: req.userId,
        brandName,
        industry,
        targetAudience,
        voiceTone,
        socialPlatforms,
        websiteUrl: websiteUrl || '',
        description: description || '',
        mainGoal,
        challenges: challenges || [],
        monthlySocialBudget: monthlySocialBudget || 0,
      });
    }

    await brandProfile.save();

    // Update user profile with role
    await User.findByIdAndUpdate(req.userId, {
      userType: 'brand',
      onboardingComplete: true,
    });

    res.json({
      message: 'Brand profile saved successfully',
      brandProfile,
    });
  } catch (error) {
    console.error('Brand onboarding error:', error);
    res.status(500).json({
      error: error.message || 'Failed to save brand profile',
    });
  }
});

// POST /api/onboarding/influencer - Create/Update influencer profile
router.post('/influencer', verifyToken, async (req, res) => {
  try {
    const {
      displayName,
      niches,
      engagementRate,
      followerCounts,
      connectedPlatforms,
      bio,
      audienceDemographic,
      collaborationTypes,
      minCollaborationBudget,
      preferredContentTypes,
    } = req.body;

    // Validate required fields
    if (!displayName || !niches || !connectedPlatforms || !audienceDemographic) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    // Check if influencer profile already exists
    let influencerProfile = await InfluencerOnboarding.findOne({ userId: req.userId });

    if (influencerProfile) {
      // Update existing profile
      influencerProfile.displayName = displayName;
      influencerProfile.niches = niches;
      influencerProfile.engagementRate = engagementRate || 0;
      influencerProfile.followerCounts = followerCounts || {};
      influencerProfile.connectedPlatforms = connectedPlatforms;
      influencerProfile.bio = bio || '';
      influencerProfile.audienceDemographic = audienceDemographic;
      influencerProfile.collaborationTypes = collaborationTypes || [];
      influencerProfile.minCollaborationBudget = minCollaborationBudget || 0;
      influencerProfile.preferredContentTypes = preferredContentTypes || '';
    } else {
      // Create new profile
      influencerProfile = new InfluencerOnboarding({
        userId: req.userId,
        displayName,
        niches,
        engagementRate: engagementRate || 0,
        followerCounts: followerCounts || {},
        connectedPlatforms,
        bio: bio || '',
        audienceDemographic,
        collaborationTypes: collaborationTypes || [],
        minCollaborationBudget: minCollaborationBudget || 0,
        preferredContentTypes: preferredContentTypes || '',
      });
    }

    await influencerProfile.save();

    // Update user profile with role
    await User.findByIdAndUpdate(req.userId, {
      userType: 'influencer',
      onboardingComplete: true,
    });

    res.json({
      message: 'Influencer profile saved successfully',
      influencerProfile,
    });
  } catch (error) {
    console.error('Influencer onboarding error:', error);
    res.status(500).json({
      error: error.message || 'Failed to save influencer profile',
    });
  }
});

// GET /api/onboarding/brand - Get brand profile
router.get('/brand', verifyToken, async (req, res) => {
  try {
    const brandProfile = await BrandOnboarding.findOne({ userId: req.userId });

    if (!brandProfile) {
      return res.status(404).json({
        error: 'Brand profile not found',
      });
    }

    res.json({
      brandProfile,
    });
  } catch (error) {
    console.error('Get brand profile error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch brand profile',
    });
  }
});

// GET /api/onboarding/influencer - Get influencer profile
router.get('/influencer', verifyToken, async (req, res) => {
  try {
    const influencerProfile = await InfluencerOnboarding.findOne({ userId: req.userId });

    if (!influencerProfile) {
      return res.status(404).json({
        error: 'Influencer profile not found',
      });
    }

    res.json({
      influencerProfile,
    });
  } catch (error) {
    console.error('Get influencer profile error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch influencer profile',
    });
  }
});

// PUT /api/onboarding/brand - Update brand profile
router.put('/brand', verifyToken, async (req, res) => {
  try {
    const updates = req.body;

    const brandProfile = await BrandOnboarding.findOneAndUpdate(
      { userId: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!brandProfile) {
      return res.status(404).json({
        error: 'Brand profile not found',
      });
    }

    res.json({
      message: 'Brand profile updated successfully',
      brandProfile,
    });
  } catch (error) {
    console.error('Update brand profile error:', error);
    res.status(500).json({
      error: error.message || 'Failed to update brand profile',
    });
  }
});

// PUT /api/onboarding/influencer - Update influencer profile
router.put('/influencer', verifyToken, async (req, res) => {
  try {
    const updates = req.body;

    const influencerProfile = await InfluencerOnboarding.findOneAndUpdate(
      { userId: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!influencerProfile) {
      return res.status(404).json({
        error: 'Influencer profile not found',
      });
    }

    res.json({
      message: 'Influencer profile updated successfully',
      influencerProfile,
    });
  } catch (error) {
    console.error('Update influencer profile error:', error);
    res.status(500).json({
      error: error.message || 'Failed to update influencer profile',
    });
  }
});

// GET /api/onboarding/status - Check onboarding completion
router.get('/status', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const isComplete = user.onboardingComplete || false;
    const userType = user.userType || null;

    let profile = null;
    if (userType === 'brand') {
      profile = await BrandOnboarding.findOne({ userId: req.userId });
    } else if (userType === 'influencer') {
      profile = await InfluencerOnboarding.findOne({ userId: req.userId });
    }

    res.json({
      onboardingComplete: isComplete,
      userType,
      profile,
    });
  } catch (error) {
    console.error('Onboarding status error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch onboarding status',
    });
  }
});

module.exports = router;
