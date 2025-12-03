import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class AnalyticsProvider with ChangeNotifier {
  Analytics? _analytics;
  PublishingStats? _stats;
  List<GeneratedPost> _topPosts = [];
  bool _isLoading = false;
  String? _error;

  Analytics? get analytics => _analytics;
  PublishingStats? get stats => _stats;
  List<GeneratedPost> get topPosts => _topPosts;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchAnalytics() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.getUserAnalytics();
      _analytics = Analytics.fromJson(response['analytics']);
      
      final postsData = await ApiService.getTopPosts(limit: 5);
      _topPosts = postsData
          .map((p) => GeneratedPost.fromJson(p))
          .toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
