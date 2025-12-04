import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/posts_provider.dart';
import '../models/models.dart';
import 'post_detail_screen.dart';
import 'publish_screen.dart';
import 'edit_post_screen.dart';

class PostsListScreen extends StatefulWidget {
  final String tab; // 'drafts', 'scheduled', 'published'

  const PostsListScreen({required this.tab});

  @override
  State<PostsListScreen> createState() => _PostsListScreenState();
}

class _PostsListScreenState extends State<PostsListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final postsProvider = Provider.of<PostsProvider>(context, listen: false);
      if (widget.tab == 'drafts') {
        postsProvider.fetchDrafts();
      } else if (widget.tab == 'scheduled') {
        postsProvider.fetchScheduled();
      } else {
        postsProvider.fetchPublished();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.tab == 'drafts'
              ? 'Drafts'
              : widget.tab == 'scheduled'
                  ? 'Scheduled'
                  : 'Published',
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () {
              if (widget.tab == 'drafts') {
                Provider.of<PostsProvider>(context, listen: false).fetchDrafts();
              } else if (widget.tab == 'scheduled') {
                Provider.of<PostsProvider>(context, listen: false).fetchScheduled();
              } else {
                Provider.of<PostsProvider>(context, listen: false).fetchPublished();
              }
            },
          ),
        ],
      ),
      body: Consumer<PostsProvider>(
        builder: (context, postsProvider, _) {
          final posts = widget.tab == 'drafts'
              ? postsProvider.drafts
              : widget.tab == 'scheduled'
                  ? postsProvider.scheduled
                  : postsProvider.published;

          if (postsProvider.isLoading) {
            return Center(child: CircularProgressIndicator());
          }

          if (posts.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'No ${widget.tab} posts yet',
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: EdgeInsets.all(16),
            itemCount: posts.length,
            itemBuilder: (context, index) {
              final post = posts[index];
              return _PostCard(post: post, tab: widget.tab);
            },
          );
        },
      ),
    );
  }
}

class _PostCard extends StatelessWidget {
  final GeneratedPost post;
  final String tab;

  const _PostCard({required this.post, required this.tab});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => PostDetailScreen(postId: post.id),
            ),
          );
        },
        child: Container(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Post copy preview
              Text(
                post.copy.length > 120 ? post.copy.substring(0, 120) + '...' : post.copy,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  height: 1.5,
                ),
              ),
              SizedBox(height: 12),

              // Image indicator
              if (post.imageUrl != null)
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      Icon(Icons.image, size: 16, color: Colors.grey),
                      SizedBox(width: 6),
                      Text(
                        'Image attached',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),

              // Metrics (for published posts)
              if (tab == 'published')
                Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _MetricBadge('❤️', '${post.metrics['likes'] ?? 0}'),
                      _MetricBadge('🔄', '${post.metrics['retweets'] ?? 0}'),
                      _MetricBadge('💬', '${post.metrics['replies'] ?? 0}'),
                      _MetricBadge('👁️', '${post.metrics['views'] ?? 0}'),
                    ],
                  ),
                ),

              // Date and actions
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    DateFormat('MMM dd, yyyy').format(post.createdAt),
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  if (tab == 'drafts')
                    Row(
                      children: [
                        IconButton(
                          icon: Icon(Icons.edit, size: 20),
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => EditPostScreen(
                                  postId: post.id,
                                  initialCopy: post.copy,
                                ),
                              ),
                            );
                          },
                          padding: EdgeInsets.zero,
                          constraints: BoxConstraints(),
                        ),
                        SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => PublishScreen(postId: post.id),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            backgroundColor: Color(0xFF10B981),
                          ),
                          child: Text(
                            'Publish',
                            style: TextStyle(fontSize: 12, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ],
          ),
        ),
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
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        '$emoji $value',
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      ),
    );
  }
}
