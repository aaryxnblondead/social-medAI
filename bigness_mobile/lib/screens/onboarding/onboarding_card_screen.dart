import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/onboarding_provider.dart';
import '../../models/onboarding_questions.dart';
import '../../theme/app_theme.dart';

class OnboardingCardScreen extends StatefulWidget {
  final List<OnboardingQuestion> questions;
  final bool isBrand;

  const OnboardingCardScreen({
    required this.questions,
    required this.isBrand,
  });

  @override
  State<OnboardingCardScreen> createState() => _OnboardingCardScreenState();
}

class _OnboardingCardScreenState extends State<OnboardingCardScreen> {
  late PageController _pageController;
  int _currentIndex = 0;
  late Map<int, dynamic> _answers;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _answers = {};
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _handleAnswer(dynamic value) {
    setState(() {
      _answers[widget.questions[_currentIndex].id] = value;
    });
  }

  Future<void> _nextQuestion() async {
    if (_currentIndex < widget.questions.length - 1) {
      _pageController.nextPage(
        duration: Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      await _submitAnswers();
    }
  }

  void _previousQuestion() {
    if (_currentIndex > 0) {
      _pageController.previousPage(
        duration: Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _submitAnswers() async {
    final onboardingProvider = Provider.of<OnboardingProvider>(context, listen: false);

    try {
      if (widget.isBrand) {
        // Map answers to brand data
        _answers.forEach((id, value) {
          switch (id) {
            case 1:
              onboardingProvider.updateBrandName(value);
              break;
            case 2:
              onboardingProvider.updateBrandIndustry(value);
              break;
            case 3:
              onboardingProvider.updateBrandAudience(value);
              break;
            case 4:
              onboardingProvider.updateBrandTone(value);
              break;
            case 5:
              onboardingProvider.brandData.socialPlatforms = value;
              break;
            case 6:
              onboardingProvider.updateBrandGoal(
                value.toLowerCase().replaceAll('/', '').replaceAll(' ', ''),
              );
              break;
            case 7:
              onboardingProvider.brandData.challenges = value;
              break;
            case 8:
              onboardingProvider.updateBrandBudget(value);
              break;
          }
        });
        await onboardingProvider.submitBrandOnboarding();
      } else {
        // Map answers to influencer data
        _answers.forEach((id, value) {
          switch (id) {
            case 1:
              onboardingProvider.updateInfluencerName(value);
              break;
            case 2:
              onboardingProvider.influencerData.niches = value;
              break;
            case 3:
              onboardingProvider.influencerData.connectedPlatforms = value;
              break;
            case 4:
              onboardingProvider.updateInfluencerAudience(value);
              break;
            case 5:
              onboardingProvider.influencerData.collaborationTypes = value;
              break;
            case 6:
              onboardingProvider.updateInfluencerBio(value);
              break;
            case 7:
              onboardingProvider.updateMinBudget(value);
              break;
          }
        });
        await onboardingProvider.submitInfluencerOnboarding();
      }

      if (onboardingProvider.error == null) {
        Navigator.of(context).pushReplacementNamed('/dashboard');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Profile setup complete!'),
            backgroundColor: AppTheme.success,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${onboardingProvider.error}'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: AppTheme.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background gradient
          Container(
            decoration: BoxDecoration(
              gradient: AppTheme.blackToTealGradient,
            ),
          ),

          // Page view with cards
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() => _currentIndex = index);
            },
            itemCount: widget.questions.length,
            itemBuilder: (context, index) {
              return _QuestionCard(
                question: widget.questions[index],
                answer: _answers[widget.questions[index].id],
                onAnswerChanged: _handleAnswer,
                onNextPressed: _nextQuestion,
                onPreviousPressed: _currentIndex > 0 ? _previousQuestion : null,
                isLast: index == widget.questions.length - 1,
                isFirst: index == 0,
                progress: (index + 1) / widget.questions.length,
                isSubmitting: Provider.of<OnboardingProvider>(context).isSubmitting,
              );
            },
          ),

          // Progress indicator
          SafeArea(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                children: [
                  // Top progress bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: (_currentIndex + 1) / widget.questions.length,
                      minHeight: 3,
                      backgroundColor: AppTheme.white.withOpacity(0.2),
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.teal),
                    ),
                  ),
                  SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (_currentIndex > 0)
                        GestureDetector(
                          onTap: _previousQuestion,
                          child: Icon(Icons.arrow_back, color: AppTheme.white),
                        )
                      else
                        SizedBox(width: 24),
                      Text(
                        '${_currentIndex + 1}/${widget.questions.length}',
                        style: TextStyle(
                          color: AppTheme.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      GestureDetector(
                        onTap: _currentIndex < widget.questions.length - 1
                            ? _nextQuestion
                            : null,
                        child: Icon(
                          Icons.close,
                          color: AppTheme.white,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuestionCard extends StatefulWidget {
  final OnboardingQuestion question;
  final dynamic answer;
  final Function(dynamic) onAnswerChanged;
  final VoidCallback onNextPressed;
  final VoidCallback? onPreviousPressed;
  final bool isLast;
  final bool isFirst;
  final double progress;
  final bool isSubmitting;

  const _QuestionCard({
    required this.question,
    required this.answer,
    required this.onAnswerChanged,
    required this.onNextPressed,
    this.onPreviousPressed,
    required this.isLast,
    required this.isFirst,
    required this.progress,
    required this.isSubmitting,
  });

  @override
  State<_QuestionCard> createState() => _QuestionCardState();
}

class _QuestionCardState extends State<_QuestionCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late TextEditingController _textController;
  late Set<String> _selectedItems;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: Duration(milliseconds: 600),
      vsync: this,
    )..forward();

    _textController = TextEditingController(text: widget.answer ?? '');
    _selectedItems = Set.from(widget.answer ?? []);
  }

  @override
  void didUpdateWidget(_QuestionCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.question.id != widget.question.id) {
      _animationController.reset();
      _animationController.forward();
      _textController.text = widget.answer ?? '';
      _selectedItems = Set.from(widget.answer ?? []);
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _animationController,
      child: ScaleTransition(
        scale: Tween<double>(begin: 0.95, end: 1.0).animate(
          CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon
                Text(
                  widget.question.icon,
                  style: TextStyle(fontSize: 60),
                ),
                SizedBox(height: 32),

                // Question
                Text(
                  widget.question.question,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.white,
                    height: 1.3,
                  ),
                ),
                SizedBox(height: 12),

                // Subtitle
                Text(
                  widget.question.subtitle,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.white.withOpacity(0.7),
                  ),
                ),
                SizedBox(height: 48),

                // Input based on type
                _buildInput(),
                SizedBox(height: 48),

                // Next button
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: (widget.answer != null && widget.answer != '' && widget.answer.length > 0) || widget.isSubmitting
                        ? widget.onNextPressed
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.teal,
                      foregroundColor: AppTheme.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: widget.isSubmitting
                        ? SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(AppTheme.white),
                            ),
                          )
                        : Text(
                            widget.isLast ? 'Finish ✓' : 'Next →',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInput() {
    switch (widget.question.inputType) {
      case 'text':
        return TextField(
          controller: _textController,
          onChanged: widget.onAnswerChanged,
          style: TextStyle(color: AppTheme.black, fontSize: 16),
          decoration: InputDecoration(
            hintText: widget.question.placeholder,
            filled: true,
            fillColor: AppTheme.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide.none,
            ),
            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        );

      case 'select':
        return Column(
          children: (widget.question.options ?? []).map((option) {
            final isSelected = widget.answer == option;
            return GestureDetector(
              onTap: () => widget.onAnswerChanged(option),
              child: Container(
                margin: EdgeInsets.only(bottom: 12),
                padding: EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.mustard
                      : AppTheme.white.withOpacity(0.1),
                  border: Border.all(
                    color: isSelected
                        ? AppTheme.mustard
                        : AppTheme.white.withOpacity(0.3),
                    width: 2,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      option,
                      style: TextStyle(
                        color: isSelected ? AppTheme.white : AppTheme.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (isSelected)
                      Icon(Icons.check, color: AppTheme.white),
                  ],
                ),
              ),
            );
          }).toList(),
        );

      case 'multi_select':
        return Column(
          children: (widget.question.options ?? []).map((option) {
            final isSelected = _selectedItems.contains(option);
            return GestureDetector(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    _selectedItems.remove(option);
                  } else {
                    _selectedItems.add(option);
                  }
                });
                widget.onAnswerChanged(_selectedItems.toList());
              },
              child: Container(
                margin: EdgeInsets.only(bottom: 12),
                padding: EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.teal.withOpacity(0.9)
                      : AppTheme.white.withOpacity(0.1),
                  border: Border.all(
                    color: isSelected
                        ? AppTheme.teal
                        : AppTheme.white.withOpacity(0.3),
                    width: 2,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      option,
                      style: TextStyle(
                        color: AppTheme.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (isSelected)
                      Icon(Icons.check_circle, color: AppTheme.white),
                  ],
                ),
              ),
            );
          }).toList(),
        );

      case 'slider':
        return Column(
          children: [
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppTheme.white.withOpacity(0.2),
                ),
              ),
              child: Column(
                children: [
                  Text(
                    '₹${widget.answer ?? 0}',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.teal,
                    ),
                  ),
                  SizedBox(height: 16),
                  Slider(
                    value: (widget.answer ?? 0).toDouble(),
                    onChanged: (value) =>
                        widget.onAnswerChanged(value.toInt()),
                    min: widget.question.minValue?.toDouble() ?? 0,
                    max: widget.question.maxValue?.toDouble() ?? 100,
                    activeColor: AppTheme.teal,
                    inactiveColor: AppTheme.white.withOpacity(0.2),
                  ),
                  SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '₹0',
                        style: TextStyle(
                          color: AppTheme.white.withOpacity(0.6),
                          fontSize: 12,
                        ),
                      ),
                      Text(
                        '₹${widget.question.maxValue ?? 100}K+',
                        style: TextStyle(
                          color: AppTheme.white.withOpacity(0.6),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        );

      default:
        return SizedBox.shrink();
    }
  }
}
