import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ImageProvider with ChangeNotifier {
  String? _generatedImageUrl;
  bool _isGenerating = false;
  String? _error;
  double _generationProgress = 0;

  String? get generatedImageUrl => _generatedImageUrl;
  bool get isGenerating => _isGenerating;
  String? get error => _error;
  double get generationProgress => _generationProgress;

  Future<void> generateImage({
    required String postId,
    required String prompt,
    String style = 'professional',
  }) async {
    _isGenerating = true;
    _error = null;
    _generationProgress = 0;
    notifyListeners();

    try {
      // Simulate progress updates
      for (int i = 0; i < 5; i++) {
        await Future.delayed(Duration(milliseconds: 200));
        _generationProgress = (i + 1) / 5;
        notifyListeners();
      }

      final response = await ApiService.post('/images/generate', body: {
        'postId': postId,
        'prompt': prompt,
        'style': style,
      });

      _generatedImageUrl = response['imageUrl'];
      _generationProgress = 1.0;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isGenerating = false;
      notifyListeners();
    }
  }

  Future<void> generateBatchImages({
    required List<String> postIds,
  }) async {
    _isGenerating = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.post('/images/generate-batch', body: {
        'postIds': postIds,
      });

      _generationProgress = 1.0;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isGenerating = false;
      notifyListeners();
    }
  }

  void clearImage() {
    _generatedImageUrl = null;
    _generationProgress = 0;
    notifyListeners();
  }
}
