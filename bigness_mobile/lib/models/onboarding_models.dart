class OnboardingStep {
  final int step;
  final String title;
  final String subtitle;
  final String? icon;

  OnboardingStep({
    required this.step,
    required this.title,
    required this.subtitle,
    this.icon,
  });
}

enum UserRole { brand, influencer }

class BrandOnboardingData {
  String brandName = '';
  String industry = '';
  String targetAudience = '';
  String voiceTone = '';
  List<String> socialPlatforms = [];
  String? brandLogo;
  String websiteUrl = '';
  String description = '';
  String mainGoal = ''; // awareness, engagement, sales, traffic
  List<String> challenges = [];
  int monthlySocialBudget = 0;

  bool get isComplete =>
      brandName.isNotEmpty &&
      industry.isNotEmpty &&
      targetAudience.isNotEmpty &&
      voiceTone.isNotEmpty &&
      socialPlatforms.isNotEmpty &&
      mainGoal.isNotEmpty;
}

class InfluencerOnboardingData {
  String displayName = '';
  List<String> niches = [];
  int engagementRate = 0;
  Map<String, int> followerCounts = {}; // platform: count
  List<String> connectedPlatforms = [];
  String bio = '';
  String? profileImage;
  String audienceDemographic = ''; // Gen Z, Millennials, etc
  List<String> collaborationTypes = [];
  int minCollaborationBudget = 0;
  String preferredContentTypes = ''; // educational, entertaining, lifestyle, etc

  bool get isComplete =>
      displayName.isNotEmpty &&
      niches.isNotEmpty &&
      connectedPlatforms.isNotEmpty &&
      audienceDemographic.isNotEmpty;
}
