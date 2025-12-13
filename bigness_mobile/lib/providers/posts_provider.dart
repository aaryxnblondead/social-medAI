import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class PostsProvider with ChangeNotifier {
  List<GeneratedPost> _drafts = [];
  List<GeneratedPost> _scheduled = [];
  List<GeneratedPost> _published = [];
  bool _isLoading = false;
  String? _error;

  List<GeneratedPost> get drafts => _drafts;
  List<GeneratedPost> get scheduled => _scheduled;
  List<GeneratedPost> get published => _published;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchDrafts() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/posts/drafts');
      _drafts = (response['posts'] as List)
          .map((p) => GeneratedPost.fromJson(p as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchScheduled() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/posts/scheduled');
      _scheduled = (response['posts'] as List)
          .map((p) => GeneratedPost.fromJson(p as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchPublished() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/posts/published');
      _published = (response['posts'] as List)
          .map((p) => GeneratedPost.fromJson(p as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchAll() async {
    await Future.wait([
      fetchDrafts(),
      fetchScheduled(),
      fetchPublished(),
    ]);
  }

  // Add a newly generated post to drafts without a full API call
  void addDraft(GeneratedPost post) {
    if (!_drafts.any((p) => p.id == post.id)) {
      _drafts.insert(0, post);
      notifyListeners();
    }
  }
}
