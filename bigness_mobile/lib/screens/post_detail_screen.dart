import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/publishing_provider.dart';

class PostDetailScreen extends StatefulWidget {
  final String postId;

  const PostDetailScreen({required this.postId});

  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadPerformance();
    });
  }

  Future<void> _loadPerformance() async {
    try {
      await Provider.of<PublishingProvider>(context, listen: false)
          .getPerformance(widget.postId);
    } catch (e) {
      // Error handled in provider
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Post Details')),
      body: Consumer<PublishingProvider>(
        builder: (context, publishingProvider, _) {
          final performance = publishingProvider.publishResult;

          if (performance == null) {
            return Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Post content
                if (performance['post'] != null) ...[
                  Text(
                    'Post Content',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 12),
                  Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.grey[50],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          performance['post']['copy'] ?? '',
                          style: TextStyle(fontSize: 14, height: 1.6),
                        ),
                        if (performance['post']['imageUrl'] != null)
                          Padding(
                            padding: EdgeInsets.only(top: 12),
                            child: Chip(label: Text('📸 Image attached')),
                          ),
                      ],
                    ),
                  ),
                  SizedBox(height: 32),
                ],

                // Platform performance
                if (performance['platforms'] != null) ...[
                  Text(
                    'Platform Performance',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 12),
                  ...(performance['platforms'] as List).map((platform) {
                    return Container(
                      margin: EdgeInsets.only(bottom: 12),
                      padding: EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            platform['platform'].toString().toUpperCase(),
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              _MetricItem('Likes', '${platform['metrics']?['likes'] ?? 0}'),
                              _MetricItem('Comments', '${platform['metrics']?['comments'] ?? 0}'),
                              _MetricItem('Shares', '${platform['metrics']?['shares'] ?? 0}'),
                              _MetricItem('Views', '${platform['metrics']?['impressions'] ?? 0}'),
                            ],
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  SizedBox(height: 32),
                ],

                // Aggregated metrics
                if (performance['aggregatedMetrics'] != null) ...[
                  Text(
                    'Total Engagement',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 12),
                  Container(
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Color(0xFF10B981).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Color(0xFF10B981)),
                    ),
                    child: GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.5,
                      children: [
                        _EngagementCard(
                          '❤️',
                          'Likes',
                          '${performance['aggregatedMetrics']['likes'] ?? 0}',
                        ),
                        _EngagementCard(
                          '💬',
                          'Comments',
                          '${performance['aggregatedMetrics']['comments'] ?? 0}',
                        ),
                        _EngagementCard(
                          '🔄',
                          'Shares',
                          '${performance['aggregatedMetrics']['shares'] ?? 0}',
                        ),
                        _EngagementCard(
                          '👁️',
                          'Views',
                          '${performance['aggregatedMetrics']['impressions'] ?? 0}',
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _MetricItem extends StatelessWidget {
  final String label;
  final String value;

  const _MetricItem(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey)),
      ],
    );
  }
}

class _EngagementCard extends StatelessWidget {
  final String emoji;
  final String label;
  final String value;

  const _EngagementCard(this.emoji, this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(emoji, style: TextStyle(fontSize: 24)),
          SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          Text(label, style: TextStyle(fontSize: 11, color: Colors.grey)),
        ],
      ),
    );
  }
}
