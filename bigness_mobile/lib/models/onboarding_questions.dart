class OnboardingQuestion {
  final int id;
  final String question;
  final String subtitle;
  final String inputType; // text, select, multi_select, slider, date
  final List<String>? options;
  final String? placeholder;
  final int? minValue;
  final int? maxValue;
  final String icon;

  OnboardingQuestion({
    required this.id,
    required this.question,
    required this.subtitle,
    required this.inputType,
    this.options,
    this.placeholder,
    this.minValue,
    this.maxValue,
    required this.icon,
  });
}

// Brand Questions
final List<OnboardingQuestion> brandQuestions = [
  OnboardingQuestion(
    id: 1,
    question: "What's your brand name?",
    subtitle: "This is how people will know you",
    inputType: 'text',
    placeholder: 'e.g., TechCorp, Fashion Inc',
    icon: '🏢',
  ),
  OnboardingQuestion(
    id: 2,
    question: 'What industry are you in?',
    subtitle: 'Help us understand your business',
    inputType: 'select',
    options: [
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
    ],
    icon: '🎯',
  ),
  OnboardingQuestion(
    id: 3,
    question: 'Who is your ideal customer?',
    subtitle: 'Describe your target audience',
    inputType: 'text',
    placeholder: 'e.g., Tech-savvy millennials, ages 25-35',
    icon: '👥',
  ),
  OnboardingQuestion(
    id: 4,
    question: 'What tone does your brand use?',
    subtitle: 'How should your content sound?',
    inputType: 'select',
    options: [
      'Professional',
      'Casual & Fun',
      'Inspiring',
      'Educational',
      'Trendy',
      'Humorous',
    ],
    icon: '🎤',
  ),
  OnboardingQuestion(
    id: 5,
    question: 'Which platforms do you use?',
    subtitle: 'Select all that apply',
    inputType: 'multi_select',
    options: ['Twitter', 'LinkedIn', 'Facebook', 'Instagram'],
    icon: '📱',
  ),
  OnboardingQuestion(
    id: 6,
    question: 'What\'s your main goal?',
    subtitle: 'Help us optimize your content',
    inputType: 'select',
    options: [
      'Brand Awareness',
      'Engagement',
      'Sales/Conversions',
      'Website Traffic',
    ],
    icon: '🎯',
  ),
  OnboardingQuestion(
    id: 7,
    question: 'What are your main challenges?',
    subtitle: 'Select all that apply',
    inputType: 'multi_select',
    options: [
      'Consistency in posting',
      'Finding content ideas',
      'Time constraints',
      'Measuring ROI',
      'Audience engagement',
      'Platform knowledge',
    ],
    icon: '🚧',
  ),
  OnboardingQuestion(
    id: 8,
    question: 'What\'s your monthly budget?',
    subtitle: 'For social media tools and content',
    inputType: 'slider',
    minValue: 0,
    maxValue: 100000,
    icon: '��',
  ),
];

// Influencer Questions
final List<OnboardingQuestion> influencerQuestions = [
  OnboardingQuestion(
    id: 1,
    question: "What's your display name?",
    subtitle: 'How brands will know you',
    inputType: 'text',
    placeholder: 'e.g., Sarah Chen, The Tech Guru',
    icon: '⭐',
  ),
  OnboardingQuestion(
    id: 2,
    question: 'What are your niches?',
    subtitle: 'Select all that apply',
    inputType: 'multi_select',
    options: [
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
    ],
    icon: '🎨',
  ),
  OnboardingQuestion(
    id: 3,
    question: 'Where do you create content?',
    subtitle: 'Select your active platforms',
    inputType: 'multi_select',
    options: ['Twitter/X', 'Instagram', 'TikTok', 'YouTube', 'LinkedIn'],
    icon: '📸',
  ),
  OnboardingQuestion(
    id: 4,
    question: 'What\'s your primary audience?',
    subtitle: 'Who makes up most of your followers?',
    inputType: 'select',
    options: [
      'Gen Z (13-24)',
      'Millennials (25-40)',
      'Gen X (41-56)',
      'Baby Boomers (57+)',
    ],
    icon: '👨‍👩‍👧‍👦',
  ),
  OnboardingQuestion(
    id: 5,
    question: 'What collaboration types interest you?',
    subtitle: 'Select all that apply',
    inputType: 'multi_select',
    options: [
      'Sponsored posts',
      'Product reviews',
      'Affiliate partnerships',
      'Brand ambassadorships',
      'Collaborations',
    ],
    icon: '🤝',
  ),
  OnboardingQuestion(
    id: 6,
    question: 'Tell us about yourself',
    subtitle: 'What makes you unique?',
    inputType: 'text',
    placeholder: 'Tech enthusiast | 5+ years creating content | High engagement rates',
    icon: '✨',
  ),
  OnboardingQuestion(
    id: 7,
    question: 'Minimum collaboration budget?',
    subtitle: 'Your starting rate',
    inputType: 'slider',
    minValue: 0,
    maxValue: 100000,
    icon: '💵',
  ),
];
