import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class CopyProvider with ChangeNotifier {
  GeneratedPost? _currentPost;
  List<GeneratedPost> _allPosts = [];
  List<GeneratedPost> _draftPosts = [];
  bool _isLoading = false;
  String? _error;

  GeneratedPost? get currentPost => _currentPost;
  List<GeneratedPost> get allPosts => _allPosts;
  List<GeneratedPost> get draftPosts => _draftPosts;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> generateCopy({
    required String brandId,
    required String trendId,
    required String platform,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/copy/generate', body: {
        'brandId': brandId,
        'trendId': trendId,
        'platform': platform,
      });
      
      _currentPost = GeneratedPost.fromJson(response['post']);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchDrafts() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/copy/posts?status=draft');
      _draftPosts = (response['posts'] as List)
          .map((p) => GeneratedPost.fromJson(p as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateCopy(String postId, String newCopy) async {
    try {
      final response = await ApiService.put('/copy/posts/$postId', body: {
        'copy': newCopy,
      });
      _currentPost = GeneratedPost.fromJson(response['post']);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> deleteCopy(String postId) async {
    try {
      await ApiService.delete('/copy/posts/$postId');
      _draftPosts.removeWhere((p) => p.id == postId);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
}
