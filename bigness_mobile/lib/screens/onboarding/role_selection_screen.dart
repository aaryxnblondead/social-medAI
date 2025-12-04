import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/onboarding_provider.dart';
import '../../models/onboarding_models.dart';
import 'brand_onboarding_screen.dart';
import 'influencer_onboarding_screen.dart';

class RoleSelectionScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF1F2937), Color(0xFF111827)],
          ),
        ),
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
                    color: Colors.white,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Choose your role to get started',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[400],
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
                  onTap: () {
                    Provider.of<OnboardingProvider>(context, listen: false)
                        .selectRole(UserRole.brand);
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (_) => BrandOnboardingScreen(),
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
                  onTap: () {
                    Provider.of<OnboardingProvider>(context, listen: false)
                        .selectRole(UserRole.influencer);
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(
                        builder: (_) => InfluencerOnboardingScreen(),
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
  final VoidCallback onTap;

  const _RoleCard({
    required this.emoji,
    required this.title,
    required this.subtitle,
    required this.features,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 12,
              offset: Offset(0, 4),
            ),
          ],
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
                          color: Colors.black,
                        ),
                      ),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward, color: Color(0xFF10B981)),
              ],
            ),
            SizedBox(height: 16),
            ...features.map((feature) {
              return Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Text('✓', style: TextStyle(color: Color(0xFF10B981), fontSize: 16)),
                    SizedBox(width: 8),
                    Text(feature, style: TextStyle(fontSize: 13, color: Colors.grey[700])),
                  ],
                ),
              );
            }).toList(),
          ],
        ),
      ),
    );
  }
}
