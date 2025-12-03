class User {
  final String id;
  final String email;

  User({required this.id, required this.email});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? '',
      email: json['email'] ?? '',
    );
  }
}

class Trend {
  final String id;
  final String title;
  final String description;
  final String source;
  final double score;

  Trend({
    required this.id,
    required this.title,
    required this.description,
    required this.source,
    required this.score,
  });

  factory Trend.fromJson(Map<String, dynamic> json) {
    return Trend(
      id: json['_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      source: json['source'] ?? '',
      score: (json['score'] ?? 0).toDouble(),
    );
  }
}

class GeneratedPost {
  final String id;
  final String copy;
  final String? imageUrl;
  final String status;
  final Map<String, dynamic> metrics;
  final DateTime createdAt;

  GeneratedPost({
    required this.id,
    required this.copy,
    this.imageUrl,
    required this.status,
    required this.metrics,
    required this.createdAt,
  });

  factory GeneratedPost.fromJson(Map<String, dynamic> json) {
    return GeneratedPost(
      id: json['_id'] ?? '',
      copy: json['copy'] ?? '',
      imageUrl: json['imageUrl'],
      status: json['status'] ?? 'draft',
      metrics: json['metrics'] ?? {},
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class Analytics {
  final int publishedPosts;
  final int drafts;
  final int scheduled;
  final int totalEngagement;

  Analytics({
    required this.publishedPosts,
    required this.drafts,
    required this.scheduled,
    required this.totalEngagement,
  });

  factory Analytics.fromJson(Map<String, dynamic> json) {
    final overview = json['overview'] ?? {};
    final allTime = json['allTime'] ?? {};
    return Analytics(
      publishedPosts: overview['publishedPosts'] ?? 0,
      drafts: overview['draftPosts'] ?? 0,
      scheduled: overview['scheduledPosts'] ?? 0,
      totalEngagement: allTime['totalEngagement'] ?? 0,
    );
  }
}

class PublishingStats {
  final int active;
  final int waiting;
  final int completed;
  final int failed;

  PublishingStats({
    required this.active,
    required this.waiting,
    required this.completed,
    required this.failed,
  });

  factory PublishingStats.fromJson(Map<String, dynamic> json) {
    return PublishingStats(
      active: json['active'] ?? 0,
      waiting: json['waiting'] ?? 0,
      completed: json['completed'] ?? 0,
      failed: json['failed'] ?? 0,
    );
  }
}
