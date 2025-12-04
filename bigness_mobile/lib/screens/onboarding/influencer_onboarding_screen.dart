import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/onboarding_provider.dart';

class InfluencerOnboardingScreen extends StatefulWidget {
  @override
  State<InfluencerOnboardingScreen> createState() => _InfluencerOnboardingScreenState();
}

class _InfluencerOnboardingScreenState extends State<InfluencerOnboardingScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Setup Your Profile'),
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: Consumer<OnboardingProvider>(
        builder: (context, provider, _) {
          return Column(
            children: [
              // Progress indicator
              Container(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: Colors.grey[100],
                child: Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: (provider.currentStep + 1) / provider.totalSteps,
                          minHeight: 6,
                          backgroundColor: Colors.grey[300],
                          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                        ),
                      ),
                    ),
                    SizedBox(width: 12),
                    Text(
                      '${provider.currentStep + 1}/${provider.totalSteps}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),

              // Content area
              Expanded(
                child: SingleChildScrollView(
                  padding: EdgeInsets.all(24),
                  child: _buildStep(provider, context),
                ),
              ),

              // Navigation buttons
              Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border(top: BorderSide(color: Colors.grey[200]!)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    ElevatedButton(
                      onPressed: provider.currentStep > 0 ? () => provider.previousStep() : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey[300],
                      ),
                      child: Text('← Back'),
                    ),
                    ElevatedButton(
                      onPressed: provider.currentStep < provider.totalSteps - 1
                          ? () => provider.nextStep()
                          : () => _submitOnboarding(provider, context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF10B981),
                        padding: EdgeInsets.symmetric(horizontal: 32),
                      ),
                      child: Text(
                        provider.currentStep == provider.totalSteps - 1
                            ? provider.isSubmitting ? 'Submitting...' : '✓ Finish'
                            : 'Next →',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStep(OnboardingProvider provider, BuildContext context) {
    switch (provider.currentStep) {
      case 0:
        return _NameStep(provider);
      case 1:
        return _NichesStep(provider);
      case 2:
        return _PlatformsStep(provider);
      case 3:
        return _FollowersStep(provider);
      case 4:
        return _AudienceStep(provider);
      case 5:
        return _CollaborationStep(provider);
      case 6:
        return _BioStep(provider);
      default:
        return SizedBox.shrink();
    }
  }

  Future<void> _submitOnboarding(OnboardingProvider provider, BuildContext context) async {
    await provider.submitInfluencerOnboarding();
    if (provider.error == null) {
      Navigator.of(context).pushReplacementNamed('/dashboard');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${provider.error}')),
      );
    }
  }
}

class _NameStep extends StatelessWidget {
  final OnboardingProvider provider;
  final _controller = TextEditingController();

  _NameStep(this.provider);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What\'s your name?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'How would brands know you by?',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 32),
        TextField(
          controller: _controller..text = provider.influencerData.displayName,
          onChanged: provider.updateInfluencerName,
          decoration: InputDecoration(
            hintText: 'e.g., Sarah Chen, The Tech Guru',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Colors.grey[50],
          ),
        ),
      ],
    );
  }
}

class _NichesStep extends StatelessWidget {
  final OnboardingProvider provider;

  _NichesStep(this.provider);

  @override
  Widget build(BuildContext context) {
    final niches = [
      'Technology',
      'Fashion',
      'Fitness',
      'Beauty',
      'Travel',
      'Food',
      'Lifestyle',
      'Gaming',
      'Finance',
      'Education',
      'Health',
      'Other',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What are your niches?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'Select all that apply (helps match with brands)',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 24),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: niches.map((niche) {
            final isSelected = provider.influencerData.niches.contains(niche);
            return FilterChip(
              label: Text(niche),
              selected: isSelected,
              onSelected: (_) => provider.toggleInfluencerNiche(niche),
              backgroundColor: Colors.grey[200],
              selectedColor: Color(0xFF10B981),
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : Colors.black,
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _PlatformsStep extends StatelessWidget {
  final OnboardingProvider provider;

  _PlatformsStep(this.provider);

  @override
  Widget build(BuildContext context) {
    final platforms = [
      ('twitter', '𝕏 Twitter/X'),
      ('instagram', '📷 Instagram'),
      ('tiktok', '🎵 TikTok'),
      ('youtube', '▶️ YouTube'),
      ('linkedin', '💼 LinkedIn'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Where do you create content?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'Select the platforms where you\'re active',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 24),
        Column(
          children: platforms.map((p) {
            final isSelected = provider.influencerData.connectedPlatforms.contains(p.$1);
            return CheckboxListTile(
              value: isSelected,
              onChanged: (_) => provider.toggleInfluencerPlatform(p.$1),
              title: Text(p.$2),
              contentPadding: EdgeInsets.zero,
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _FollowersStep extends StatelessWidget {
  final OnboardingProvider provider;

  _FollowersStep(this.provider);

  @override
  Widget build(BuildContext context) {
    final platforms = ['twitter', 'instagram', 'tiktok', 'youtube', 'linkedin'];
    final platformNames = {
      'twitter': 'Twitter/X',
      'instagram': 'Instagram',
      'tiktok': 'TikTok',
      'youtube': 'YouTube',
      'linkedin': 'LinkedIn',
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'How many followers do you have?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'Add your follower counts on connected platforms',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 24),
        Column(
          children: platforms
              .where((p) => provider.influencerData.connectedPlatforms.contains(p))
              .map((platform) {
                return Padding(
                  padding: EdgeInsets.only(bottom: 16),
                  child: TextField(
                    onChanged: (value) {
                      provider.updateInfluencerFollowers(
                        platform,
                        int.tryParse(value) ?? 0,
                      );
                    },
                    decoration: InputDecoration(
                      labelText: '${platformNames[platform]} followers',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      filled: true,
                      fillColor: Colors.grey[50],
                      prefixIcon: Icon(Icons.people),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                );
              }).toList(),
        ),
      ],
    );
  }
}

class _AudienceStep extends StatelessWidget {
  final OnboardingProvider provider;

  _AudienceStep(this.provider);

  @override
  Widget build(BuildContext context) {
    final demographics = [
      'Gen Z (13-24)',
      'Millennials (25-40)',
      'Gen X (41-56)',
      'Baby Boomers (57+)',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What\'s your primary audience?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'Who makes up most of your followers?',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 24),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: demographics.map((demo) {
            final isSelected = provider.influencerData.audienceDemographic == demo;
            return ChoiceChip(
              label: Text(demo),
              selected: isSelected,
              onSelected: (_) => provider.updateInfluencerAudience(demo),
              backgroundColor: Colors.grey[200],
              selectedColor: Color(0xFF10B981),
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : Colors.black,
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _CollaborationStep extends StatelessWidget {
  final OnboardingProvider provider;

  _CollaborationStep(this.provider);

  @override
  Widget build(BuildContext context) {
    final types = [
      'Sponsored posts',
      'Product reviews',
      'Affiliate partnerships',
      'Brand ambassadorships',
      'Collaborations',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What types of collaborations interest you?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'Select all that apply',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 24),
        Column(
          children: types.map((type) {
            final isSelected = provider.influencerData.collaborationTypes.contains(type);
            return CheckboxListTile(
              value: isSelected,
              onChanged: (_) => provider.toggleCollaborationType(type),
              title: Text(type),
              contentPadding: EdgeInsets.zero,
            );
          }).toList(),
        ),
        SizedBox(height: 24),
        TextField(
          onChanged: provider.updateMinBudget,
          decoration: InputDecoration(
            labelText: 'Minimum budget per collaboration (₹)',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Colors.grey[50],
            prefixIcon: Icon(Icons.currency_rupee),
          ),
          keyboardType: TextInputType.number,
        ),
      ],
    );
  }
}

class _BioStep extends StatelessWidget {
  final OnboardingProvider provider;
  final _controller = TextEditingController();

  _BioStep(this.provider);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tell us about yourself',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'What makes you unique? What do brands need to know?',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 24),
        TextField(
          controller: _controller..text = provider.influencerData.bio,
          onChanged: provider.updateInfluencerBio,
          maxLines: 5,
          decoration: InputDecoration(
            hintText:
                'e.g., Tech enthusiast | 5+ years of content creation | Specializing in unboxing reviews | High engagement rates',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Colors.grey[50],
            counterText: '',
          ),
          maxLength: 500,
        ),
        SizedBox(height: 24),
        Container(
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Color(0xFF10B981).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Color(0xFF10B981)),
          ),
          child: Row(
            children: [
              Icon(Icons.info, color: Color(0xFF10B981), size: 20),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Next: You\'ll verify your social accounts',
                  style: TextStyle(fontSize: 12, color: Color(0xFF10B981)),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
