import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/onboarding_provider.dart';

class BrandOnboardingScreen extends StatefulWidget {
  @override
  State<BrandOnboardingScreen> createState() => _BrandOnboardingScreenState();
}

class _BrandOnboardingScreenState extends State<BrandOnboardingScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Setup Your Brand'),
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
        return _BrandNameStep(provider);
      case 1:
        return _IndustryStep(provider);
      case 2:
        return _TargetAudienceStep(provider);
      case 3:
        return _VoiceToneStep(provider);
      case 4:
        return _SocialPlatformsStep(provider);
      case 5:
        return _BrandGoalStep(provider);
      case 6:
        return _ChallengesStep(provider);
      case 7:
        return _BudgetStep(provider);
      default:
        return SizedBox.shrink();
    }
  }

  Future<void> _submitOnboarding(OnboardingProvider provider, BuildContext context) async {
    await provider.submitBrandOnboarding();
    if (provider.error == null) {
      Navigator.of(context).pushReplacementNamed('/dashboard');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${provider.error}')),
      );
    }
  }
}

class _BrandNameStep extends StatelessWidget {
  final OnboardingProvider provider;
  final _controller = TextEditingController();

  _BrandNameStep(this.provider);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "What's your brand name?",
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'This helps us personalize your experience',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 32),
        TextField(
          controller: _controller..text = provider.brandData.brandName,
          onChanged: provider.updateBrandName,
          decoration: InputDecoration(
            hintText: 'e.g., TechCo, Fashion Inc',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Colors.grey[50],
          ),
        ),
      ],
    );
  }
}

class _IndustryStep extends StatelessWidget {
  final OnboardingProvider provider;

  _IndustryStep(this.provider);

  @override
  Widget build(BuildContext context) {
    final industries = [
      'Technology',
      'Fashion',
      'Finance',
      'Health & Wellness',
      'Education',
      'E-commerce',
      'Real Estate',
      'Food & Beverage',
      'Entertainment',
      'Other',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What industry are you in?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'We'll tailor content suggestions based on your industry',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 24),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: industries.map((industry) {
            final isSelected = provider.brandData.industry == industry;
            return ChoiceChip(
              label: Text(industry),
              selected: isSelected,
              onSelected: (_) => provider.updateBrandIndustry(industry),
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

class _TargetAudienceStep extends StatelessWidget {
  final OnboardingProvider provider;
  final _controller = TextEditingController();

  _TargetAudienceStep(this.provider);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Who is your target audience?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'Describe your ideal customer (age, interests, demographics)',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 24),
        TextField(
          controller: _controller..text = provider.brandData.targetAudience,
          onChanged: provider.updateBrandAudience,
          maxLines: 4,
          decoration: InputDecoration(
            hintText: 'e.g., Tech-savvy millennials, ages 25-35, interested in sustainability',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            filled: true,
            fillColor: Colors.grey[50],
          ),
        ),
      ],
    );
  }
}

class _VoiceToneStep extends StatelessWidget {
  final OnboardingProvider provider;

  _VoiceToneStep(this.provider);

  @override
  Widget build(BuildContext context) {
    final tones = [
      'Professional',
      'Casual & Fun',
      'Inspiring',
      'Educational',
      'Trendy',
      'Humorous',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What\'s your brand voice?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'How should your content sound?',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 24),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: tones.map((tone) {
            final isSelected = provider.brandData.voiceTone == tone;
            return ChoiceChip(
              label: Text(tone),
              selected: isSelected,
              onSelected: (_) => provider.updateBrandTone(tone),
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

class _SocialPlatformsStep extends StatelessWidget {
  final OnboardingProvider provider;

  _SocialPlatformsStep(this.provider);

  @override
  Widget build(BuildContext context) {
    final platforms = [
      ('Twitter', '𝕏'),
      ('LinkedIn', '💼'),
      ('Facebook', 'f'),
      ('Instagram', '📷'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Which platforms do you use?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'Select the platforms where you want to publish',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 24),
        Column(
          children: platforms.map((p) {
            final isSelected = provider.brandData.socialPlatforms.contains(p.$1);
            return CheckboxListTile(
              value: isSelected,
              onChanged: (_) => provider.toggleBrandPlatform(p.$1),
              title: Text(p.$1),
              secondary: Text(p.$2, style: TextStyle(fontSize: 18)),
              contentPadding: EdgeInsets.zero,
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _BrandGoalStep extends StatelessWidget {
  final OnboardingProvider provider;

  _BrandGoalStep(this.provider);

  @override
  Widget build(BuildContext context) {
    final goals = [
      ('awareness', '📢 Brand Awareness', 'Reach more people'),
      ('engagement', '💬 Engagement', 'Get likes, comments, shares'),
      ('sales', '💰 Sales/Conversions', 'Drive purchases'),
      ('traffic', '�� Website Traffic', 'Drive clicks to your site'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What\'s your main goal?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'This helps us optimize content for your objectives',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 24),
        Column(
          children: goals.map((goal) {
            final isSelected = provider.brandData.mainGoal == goal.$1;
            return GestureDetector(
              onTap: () => provider.updateBrandGoal(goal.$1),
              child: Container(
                margin: EdgeInsets.only(bottom: 12),
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: isSelected ? Color(0xFF10B981) : Colors.grey[300]!,
                    width: isSelected ? 2 : 1,
                  ),
                  borderRadius: BorderRadius.circular(8),
                  color: isSelected ? Color(0xFF10B981).withOpacity(0.05) : Colors.white,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(goal.$2, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    Text(goal.$3, style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _ChallengesStep extends StatelessWidget {
  final OnboardingProvider provider;

  _ChallengesStep(this.provider);

  @override
  Widget build(BuildContext context) {
    final challenges = [
      'Consistency in posting',
      'Finding content ideas',
      'Time constraints',
      'Measuring ROI',
      'Audience engagement',
      'Platform knowledge',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What are your main challenges?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'Select all that apply (helps us personalize features)',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 24),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: challenges.map((challenge) {
            final isSelected = provider.brandData.challenges.contains(challenge);
            return FilterChip(
              label: Text(challenge),
              selected: isSelected,
              onSelected: (_) => provider.toggleBrandChallenge(challenge),
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

class _BudgetStep extends StatefulWidget {
  final OnboardingProvider provider;

  _BudgetStep(this.provider);

  @override
  State<_BudgetStep> createState() => _BudgetStepState();
}

class _BudgetStepState extends State<_BudgetStep> {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What\'s your monthly social media budget?',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          'This helps us recommend appropriate tools and features',
          style: TextStyle(color: Colors.grey, fontSize: 14),
        ),
        SizedBox(height: 32),
        Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              Text(
                '₹${widget.provider.brandData.monthlySocialBudget.toString()}',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF10B981),
                ),
              ),
              SizedBox(height: 16),
              Slider(
                value: widget.provider.brandData.monthlySocialBudget.toDouble(),
                onChanged: (value) => widget.provider.updateBrandBudget(value.toInt()),
                min: 0,
                max: 100000,
                divisions: 100,
                activeColor: Color(0xFF10B981),
              ),
              SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('₹0', style: TextStyle(color: Colors.grey)),
                  Text('₹100,000+', style: TextStyle(color: Colors.grey)),
                ],
              ),
            ],
          ),
        ),
        SizedBox(height: 32),
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
                  'All features are available regardless of budget',
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
