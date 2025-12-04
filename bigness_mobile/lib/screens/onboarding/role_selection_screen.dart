import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/onboarding_provider.dart';
import '../../models/onboarding_models.dart';
import '../../models/onboarding_questions.dart';
import '../../theme/app_theme.dart';
import 'onboarding_card_screen.dart';

class RoleSelectionScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(gradient: AppTheme.blackToTealGradient),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: 32),
                Text(
                  'Welcome to Bigness',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.white,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Choose your role to get started',
                  style: TextStyle(
                    fontSize: 16,
                    color: AppTheme.teal,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 48),

                // Brand Card
                _RoleCard(
                  emoji: '🏢',
                  title: 'Brand',
                  subtitle: 'I want to grow my business with AI-powered content',
                  features: [
                    'Generate engaging posts',
                    'Schedule across platforms',
                    'Track engagement & ROI',
                    'RL-optimized content',
                  ],
                  gradient: AppTheme.blackToMustardGradient,
                  onTap: () {
                    Provider.of<OnboardingProvider>(context, listen: false)
                        .selectRole(UserRole.brand);
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (_) => OnboardingCardScreen(
                          questions: brandQuestions,
                          isBrand: true,
                        ),
                      ),
                    );
                  },
                ),
                SizedBox(height: 20),

                // Influencer Card
                _RoleCard(
                  emoji: '⭐',
                  title: 'Influencer',
                  subtitle: 'I want to find brand collaborations & monetize',
                  features: [
                    'Showcase your audience',
                    'Receive brand opportunities',
                    'Manage collaborations',
                    'Analytics dashboard',
                  ],
                  gradient: AppTheme.tealToBlackGradient,
                  onTap: () {
                    Provider.of<OnboardingProvider>(context, listen: false)
                        .selectRole(UserRole.influencer);
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (_) => OnboardingCardScreen(
                          questions: influencerQuestions,
                          isBrand: false,
                        ),
                      ),
                    );
                  },
                ),
                SizedBox(height: 48),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final String emoji;
  final String title;
  final String subtitle;
  final List<String> features;
  final LinearGradient gradient;
  final VoidCallback onTap;

  const _RoleCard({
    required this.emoji,
    required this.title,
    required this.subtitle,
    required this.features,
    required this.gradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppTheme.black.withOpacity(0.3),
              blurRadius: 12,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Container(
          padding: EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: AppTheme.white.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(emoji, style: TextStyle(fontSize: 32)),
                  SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.white,
                          ),
                        ),
                        Text(
                          subtitle,
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.white.withOpacity(0.7),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.arrow_forward, color: AppTheme.white),
                ],
              ),
              SizedBox(height: 16),
              ...features.map((feature) {
                return Padding(
                  padding: EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Text(
                        '✓',
                        style: TextStyle(
                          color: AppTheme.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(width: 8),
                      Text(
                        feature,
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.white.withOpacity(0.8),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ],
          ),
        ),
      ),
    );
  }
}
