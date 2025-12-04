import 'package:flutter/material.dart';
import '../models/onboarding_models.dart';
import '../services/api_service.dart';

class OnboardingProvider with ChangeNotifier {
  UserRole? _selectedRole;
  BrandOnboardingData _brandData = BrandOnboardingData();
  InfluencerOnboardingData _influencerData = InfluencerOnboardingData();
  int _currentStep = 0;
  bool _isSubmitting = false;
  String? _error;

  UserRole? get selectedRole => _selectedRole;
  BrandOnboardingData get brandData => _brandData;
  InfluencerOnboardingData get influencerData => _influencerData;
  int get currentStep => _currentStep;
  bool get isSubmitting => _isSubmitting;
  String? get error => _error;

  int get totalSteps => _selectedRole == UserRole.brand ? 8 : 7;

  void selectRole(UserRole role) {
    _selectedRole = role;
    _currentStep = 0;
    _error = null;
    notifyListeners();
  }

  void nextStep() {
    if (_currentStep < totalSteps - 1) {
      _currentStep++;
      _error = null;
      notifyListeners();
    }
  }

  void previousStep() {
    if (_currentStep > 0) {
      _currentStep--;
      notifyListeners();
    }
  }

  void goToStep(int step) {
    if (step >= 0 && step < totalSteps) {
      _currentStep = step;
      notifyListeners();
    }
  }

  // Brand methods
  void updateBrandName(String value) {
    _brandData.brandName = value;
    notifyListeners();
  }

  void updateBrandIndustry(String value) {
    _brandData.industry = value;
    notifyListeners();
  }

  void updateBrandAudience(String value) {
    _brandData.targetAudience = value;
    notifyListeners();
  }

  void updateBrandTone(String value) {
    _brandData.voiceTone = value;
    notifyListeners();
  }

  void toggleBrandPlatform(String platform) {
    if (_brandData.socialPlatforms.contains(platform)) {
      _brandData.socialPlatforms.remove(platform);
    } else {
      _brandData.socialPlatforms.add(platform);
    }
    notifyListeners();
  }

  void updateBrandWebsite(String value) {
    _brandData.websiteUrl = value;
    notifyListeners();
  }

  void updateBrandDescription(String value) {
    _brandData.description = value;
    notifyListeners();
  }

  void updateBrandGoal(String value) {
    _brandData.mainGoal = value;
    notifyListeners();
  }

  void toggleBrandChallenge(String challenge) {
    if (_brandData.challenges.contains(challenge)) {
      _brandData.challenges.remove(challenge);
    } else {
      _brandData.challenges.add(challenge);
    }
    notifyListeners();
  }

  void updateBrandBudget(int value) {
    _brandData.monthlySocialBudget = value;
    notifyListeners();
  }

  // Influencer methods
  void updateInfluencerName(String value) {
    _influencerData.displayName = value;
    notifyListeners();
  }

  void toggleInfluencerNiche(String niche) {
    if (_influencerData.niches.contains(niche)) {
      _influencerData.niches.remove(niche);
    } else {
      _influencerData.niches.add(niche);
    }
    notifyListeners();
  }

  void updateInfluencerEngagement(int value) {
    _influencerData.engagementRate = value;
    notifyListeners();
  }

  void updateInfluencerFollowers(String platform, int count) {
    _influencerData.followerCounts[platform] = count;
    notifyListeners();
  }

  void toggleInfluencerPlatform(String platform) {
    if (_influencerData.connectedPlatforms.contains(platform)) {
      _influencerData.connectedPlatforms.remove(platform);
    } else {
      _influencerData.connectedPlatforms.add(platform);
    }
    notifyListeners();
  }

  void updateInfluencerBio(String value) {
    _influencerData.bio = value;
    notifyListeners();
  }

  void updateInfluencerAudience(String value) {
    _influencerData.audienceDemographic = value;
    notifyListeners();
  }

  void toggleCollaborationType(String type) {
    if (_influencerData.collaborationTypes.contains(type)) {
      _influencerData.collaborationTypes.remove(type);
    } else {
      _influencerData.collaborationTypes.add(type);
    }
    notifyListeners();
  }

  void updateMinBudget(int value) {
    _influencerData.minCollaborationBudget = value;
    notifyListeners();
  }

  void updateContentTypes(String value) {
    _influencerData.preferredContentTypes = value;
    notifyListeners();
  }

  Future<void> submitBrandOnboarding() async {
    _isSubmitting = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.post('/onboarding/brand', body: {
        'brandName': _brandData.brandName,
        'industry': _brandData.industry,
        'targetAudience': _brandData.targetAudience,
        'voiceTone': _brandData.voiceTone,
        'socialPlatforms': _brandData.socialPlatforms,
        'websiteUrl': _brandData.websiteUrl,
        'description': _brandData.description,
        'mainGoal': _brandData.mainGoal,
        'challenges': _brandData.challenges,
        'monthlySocialBudget': _brandData.monthlySocialBudget,
      });
    } catch (e) {
      _error = e.toString();
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  Future<void> submitInfluencerOnboarding() async {
    _isSubmitting = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.post('/onboarding/influencer', body: {
        'displayName': _influencerData.displayName,
        'niches': _influencerData.niches,
        'engagementRate': _influencerData.engagementRate,
        'followerCounts': _influencerData.followerCounts,
        'connectedPlatforms': _influencerData.connectedPlatforms,
        'bio': _influencerData.bio,
        'audienceDemographic': _influencerData.audienceDemographic,
        'collaborationTypes': _influencerData.collaborationTypes,
        'minCollaborationBudget': _influencerData.minCollaborationBudget,
        'preferredContentTypes': _influencerData.preferredContentTypes,
      });
    } catch (e) {
      _error = e.toString();
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }
}
