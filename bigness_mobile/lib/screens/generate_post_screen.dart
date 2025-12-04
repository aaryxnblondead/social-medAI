import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/brand_provider.dart';
import '../providers/trends_provider.dart';
import '../providers/copy_provider.dart';
import '../theme/app_theme.dart';
import 'brand_screen.dart';
import 'trends_screen.dart';

class GeneratePostScreen extends StatefulWidget {
  @override
  State<GeneratePostScreen> createState() => _GeneratePostScreenState();
}

class _GeneratePostScreenState extends State<GeneratePostScreen> {
  String _selectedPlatform = 'twitter';
  bool _isGenerating = false;

  Future<void> _generatePost() async {
    final brandProvider = Provider.of<BrandProvider>(context, listen: false);
    final trendsProvider = Provider.of<TrendsProvider>(context, listen: false);
    final copyProvider = Provider.of<CopyProvider>(context, listen: false);

    if (brandProvider.selectedBrand == null) {
      _showErrorSnackbar('Please select a brand');
      return;
    }

    if (trendsProvider.selectedTrend == null) {
      _showErrorSnackbar('Please select a trend');
      return;
    }

    setState(() => _isGenerating = true);

    try {
      await copyProvider.generateCopy(
        brandId: brandProvider.selectedBrand!.id,
        trendId: trendsProvider.selectedTrend!.id,
        platform: _selectedPlatform,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: AppTheme.white),
              SizedBox(width: 12),
              Text('Post generated!'),
            ],
          ),
          backgroundColor: AppTheme.success,
        ),
      );
    } catch (e) {
      _showErrorSnackbar('Error: $e');
    } finally {
      setState(() => _isGenerating = false);
    }
  }

  void _showErrorSnackbar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.error, color: AppTheme.white),
            SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: AppTheme.error,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Generate Post'),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Step 1: Brand Selection
            _StepHeader(stepNumber: 1, title: 'Select Brand'),
            SizedBox(height: 12),
            Consumer<BrandProvider>(
              builder: (context, brandProvider, _) {
                return _SelectionCard(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => BrandScreen()),
                    );
                  },
                  title: brandProvider.selectedBrand?.brandName ?? 'No brand selected',
                  subtitle: brandProvider.selectedBrand?.industry ?? 'Tap to select',
                  isSelected: brandProvider.selectedBrand != null,
                );
              },
            ),
            SizedBox(height: 32),

            // Step 2: Trend Selection
            _StepHeader(stepNumber: 2, title: 'Select Trend'),
            SizedBox(height: 12),
            Consumer<TrendsProvider>(
              builder: (context, trendsProvider, _) {
                return _SelectionCard(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => TrendsScreen()),
                    );
                  },
                  title: trendsProvider.selectedTrend?.title ?? 'No trend selected',
                  subtitle: trendsProvider.selectedTrend != null
                      ? '🔥 ${trendsProvider.selectedTrend!.score.toStringAsFixed(1)} • ${trendsProvider.selectedTrend!.source}'
                      : 'Tap to select',
                  isSelected: trendsProvider.selectedTrend != null,
                );
              },
            ),
            SizedBox(height: 32),

            // Step 3: Platform Selection
            _StepHeader(stepNumber: 3, title: 'Select Platform'),
            SizedBox(height: 12),
            Wrap(
              spacing: 12,
              children: ['twitter', 'linkedin', 'facebook', 'instagram'].map((platform) {
                final isSelected = _selectedPlatform == platform;
                return FilterChip(
                  label: Text(platform.toUpperCase()),
                  selected: isSelected,
                  onSelected: (_) => setState(() => _selectedPlatform = platform),
                  backgroundColor: AppTheme.offWhite,
                  selectedColor: AppTheme.mustard,
                  labelStyle: TextStyle(
                    color: isSelected ? AppTheme.white : AppTheme.black,
                    fontWeight: FontWeight.w600,
                  ),
                );
              }).toList(),
            ),
            SizedBox(height: 32),

            // Generate button
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: _isGenerating ? null : _generatePost,
                style: AppTheme.aiButtonStyle.copyWith(
                  minimumSize: MaterialStateProperty.all(Size.fromHeight(54)),
                ),
                child: _isGenerating
                    ? SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(AppTheme.white),
                        ),
                      )
                    : Text(
                        '✨ Generate Post',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),

            // Generated post preview
            Consumer<CopyProvider>(
              builder: (context, copyProvider, _) {
                if (copyProvider.currentPost == null) return SizedBox.shrink();

                return Padding(
                  padding: EdgeInsets.only(top: 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _StepHeader(stepNumber: 4, title: 'Generated Post'),
                      SizedBox(height: 12),
                      Container(
                        padding: EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppTheme.mustard, width: 2),
                          borderRadius: BorderRadius.circular(12),
                          color: AppTheme.mustard.withOpacity(0.05),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              copyProvider.currentPost!.copy,
                              style: TextStyle(fontSize: 14, height: 1.6),
                            ),
                            if (copyProvider.currentPost!.imageUrl != null)
                              Padding(
                                padding: EdgeInsets.only(top: 12),
                                child: Chip(
                                  avatar: Icon(Icons.image, size: 18),
                                  label: Text('Image attached'),
                                  backgroundColor: AppTheme.teal.withOpacity(0.1),
                                ),
                              ),
                            SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () {
                                      // Navigate to schedule screen
                                    },
                                    style: AppTheme.secondaryButtonStyle,
                                    child: Text('📅 Schedule'),
                                  ),
                                ),
                                SizedBox(width: 12),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: () {
                                      // Publish immediately
                                    },
                                    style: AppTheme.primaryButtonStyle,
                                    child: Text('🚀 Publish'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _StepHeader extends StatelessWidget {
  final int stepNumber;
  final String title;

  const _StepHeader({required this.stepNumber, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppTheme.mustard,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              stepNumber.toString(),
              style: TextStyle(
                color: AppTheme.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        SizedBox(width: 12),
        Text(
          title,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}

class _SelectionCard extends StatelessWidget {
  final VoidCallback onTap;
  final String title;
  final String subtitle;
  final bool isSelected;

  const _SelectionCard({
    required this.onTap,
    required this.title,
    required this.subtitle,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? AppTheme.teal : AppTheme.lightGray,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
          color: isSelected ? AppTheme.teal.withOpacity(0.05) : AppTheme.offWhite,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.black,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.mediumGray,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(
              isSelected ? Icons.check_circle : Icons.arrow_forward,
              color: isSelected ? AppTheme.teal : AppTheme.mediumGray,
            ),
          ],
        ),
      ),
    );
  }
}
