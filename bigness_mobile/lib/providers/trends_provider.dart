import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class TrendsProvider with ChangeNotifier {
  List<Trend> _trends = [];
  Trend? _selectedTrend;
  bool _isLoading = false;
  String? _error;
  String _selectedSource = 'all';

  List<Trend> get trends => _trends;
  Trend? get selectedTrend => _selectedTrend;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get selectedSource => _selectedSource;

  Future<void> fetchTrends({String source = 'all'}) async {
    _isLoading = true;
    _error = null;
    _selectedSource = source;
    notifyListeners();

    try {
      final response = source == 'all'
          ? await ApiService.get('/trends')
          : await ApiService.get('/trends/source/$source');
      
      _trends = (response['trends'] as List)
          .map((t) => Trend.fromJson(t as Map<String, dynamic>))
          .toList();
      
      // Sort by score descending
      _trends.sort((a, b) => b.score.compareTo(a.score));
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void selectTrend(Trend trend) {
    _selectedTrend = trend;
    notifyListeners();
  }

  Future<void> refreshTrends() async {
    try {
      await ApiService.post('/trends/refresh');
      await fetchTrends(source: _selectedSource);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
}
