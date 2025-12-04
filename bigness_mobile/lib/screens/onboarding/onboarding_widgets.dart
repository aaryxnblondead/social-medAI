import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class OnboardingProgressBar extends StatelessWidget {
  final int currentStep;
  final int totalSteps;

  const OnboardingProgressBar({
    required this.currentStep,
    required this.totalSteps,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: AppTheme.offWhite,
      child: Row(
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (currentStep + 1) / totalSteps,
                minHeight: 6,
                backgroundColor: AppTheme.lightGray,
                valueColor: AlwaysStoppedAnimation<Color>(AppTheme.teal),
              ),
            ),
          ),
          SizedBox(width: 12),
          Text(
            '${currentStep + 1}/$totalSteps',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppTheme.mediumGray,
            ),
          ),
        ],
      ),
    );
  }
}

class OnboardingNavigationButtons extends StatelessWidget {
  final VoidCallback? onBack;
  final VoidCallback? onNext;
  final bool isLastStep;
  final bool isLoading;
  final String? nextButtonLabel;

  const OnboardingNavigationButtons({
    this.onBack,
    this.onNext,
    this.isLastStep = false,
    this.isLoading = false,
    this.nextButtonLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: AppTheme.lightGray)),
        color: AppTheme.white,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          ElevatedButton(
            onPressed: onBack,
            style: AppTheme.secondaryButtonStyle,
            child: Text('← Back'),
          ),
          ElevatedButton(
            onPressed: onNext,
            style: isLastStep ? AppTheme.aiButtonStyle : AppTheme.primaryButtonStyle,
            child: isLoading
                ? SizedBox(
                    height: 16,
                    width: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.white),
                    ),
                  )
                : Text(
                    nextButtonLabel ?? (isLastStep ? '✓ Finish' : 'Next →'),
                  ),
          ),
        ],
      ),
    );
  }
}
