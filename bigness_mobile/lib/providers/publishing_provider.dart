import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class PublishingProvider with ChangeNotifier {
  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _publishResult;

  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<String, dynamic>? get publishResult => _publishResult;

  Future<void> publishMultiPlatform(
    String postId,
    List<String> platforms,
  ) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/publish/multi/multi', body: {
        'postId': postId,
        'platforms': platforms,
      });
      
      _publishResult = response;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> schedulePost(
    String postId,
    DateTime scheduledTime,
    List<String> platforms,
  ) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/posts/schedule', body: {
        'postId': postId,
        'scheduledTime': scheduledTime.toIso8601String(),
        'platforms': platforms,
      });
      
      _publishResult = response;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> getPerformance(String postId) async {
    try {
      return await ApiService.get('/publish/multi/$postId/performance');
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      throw e;
    }
  }
}
