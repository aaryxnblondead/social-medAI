import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/analytics_provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

class DashboardScreen extends StatefulWidget {
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AnalyticsProvider>(context, listen: false).fetchAnalytics();
    });
  }

  String _formatNumber(int number) {
    if (number >= 1000000) {
      return '${(number / 1000000).toStringAsFixed(1)}M';
    } else if (number >= 1000) {
      return '${(number / 1000).toStringAsFixed(1)}K';
    }
    return number.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Dashboard'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () {
              Provider.of<AnalyticsProvider>(context, listen: false).fetchAnalytics();
            },
          ),
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () {
              Provider.of<AuthProvider>(context, listen: false).logout();
              Navigator.of(context).pushReplacementNamed('/login');
            },
          ),
        ],
      ),
      body: Consumer<AnalyticsProvider>(
        builder: (context, analytics, _) {
          if (analytics.isLoading) {
            return Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppTheme.teal),
              ),
            );
          }

          final data = analytics.analytics;
          if (data == null) {
            return Center(child: Text('No data available'));
          }

          return SingleChildScrollView(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Welcome header
                Container(
                  padding: EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: AppTheme.blackToTealGradient,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome back! 👋',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.white,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Here\'s your performance overview',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.teal,
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 24),

                // Stats grid
                Text(
                  'Performance Metrics',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                SizedBox(height: 16),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 1.1,
                  children: [
                    _StatCard(
                      icon: Icons.check_circle,
                      title: 'Published',
                      value: data.publishedPosts.toString(),
                      color: AppTheme.teal,
                    ),
                    _StatCard(
                      icon: Icons.favorite,
                      title: 'Total Likes',
                      value: _formatNumber(data.totalLikes),
                      color: Colors.red,
                    ),
                    _StatCard(
                      icon: Icons.repeat,
                      title: 'Shares/RTs',
                      value: _formatNumber(data.totalRetweets),
                      color: AppTheme.success,
                    ),
                    _StatCard(
                      icon: Icons.visibility,
                      title: 'Total Views',
                      value: _formatNumber(data.totalViews),
                      color: AppTheme.info,
                    ),
                    _StatCard(
                      icon: Icons.trending_up,
                      title: 'Engagement',
                      value: _formatNumber(data.totalEngagement),
                      color: AppTheme.mustard,
                    ),
                    _StatCard(
                      icon: Icons.percent,
                      title: 'Eng. Rate',
                      value: '${data.engagementRate.toStringAsFixed(1)}%',
                      color: AppTheme.teal,
                    ),
                  ],
                ),
                SizedBox(height: 32),

                // Top posts
                Text(
                  'Top Performers',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                SizedBox(height: 16),
                analytics.topPosts.isEmpty
                    ? Container(
                        padding: EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: AppTheme.offWhite,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.lightGray),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.inbox, size: 48, color: AppTheme.lightGray),
                            SizedBox(height: 12),
                            Text(
                              'No posts yet',
                              style: TextStyle(
                                color: AppTheme.mediumGray,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        shrinkWrap: true,
                        physics: NeverScrollableScrollPhysics(),
                        itemCount: analytics.topPosts.length,
                        itemBuilder: (context, index) {
                          final post = analytics.topPosts[index];
                          return _PostCard(post: post, index: index);
                        },
                      ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.white,
        border: Border.all(color: AppTheme.lightGray),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.black.withOpacity(0.05),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          SizedBox(height: 12),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              color: AppTheme.mediumGray,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  final dynamic post;
  final int index;

  const _PostCard({required this.post, required this.index});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.white,
        border: Border.all(color: AppTheme.lightGray),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppTheme.black.withOpacity(0.05),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.teal.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '#${index + 1}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.teal,
                  ),
                ),
              ),
              Spacer(),
              Icon(Icons.star, size: 16, color: AppTheme.mustard),
            ],
          ),
          SizedBox(height: 12),
          Text(
            post.copy.length > 100 ? post.copy.substring(0, 100) + '...' : post.copy,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 14, height: 1.5),
          ),
          SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _MetricBadge('❤️', '${post.metrics['likes'] ?? 0}'),
              _MetricBadge('🔄', '${post.metrics['retweets'] ?? 0}'),
              _MetricBadge('💬', '${post.metrics['replies'] ?? 0}'),
              _MetricBadge('👁️', '${post.metrics['views'] ?? 0}'),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricBadge extends StatelessWidget {
  final String emoji;
  final String value;

  const _MetricBadge(this.emoji, this.value);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.offWhite,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppTheme.lightGray),
      ),
      child: Text(
        '$emoji $value',
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }
}
