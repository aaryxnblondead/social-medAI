import 'package:flutter/material.dart';
import '../services/api_service.dart';

class Brand {
  final String id;
  final String brandName;
  final String industry;
  final String targetAudience;
  final String brandVoice;

  Brand({
    required this.id,
    required this.brandName,
    required this.industry,
    required this.targetAudience,
    required this.brandVoice,
  });

  factory Brand.fromJson(Map<String, dynamic> json) {
    return Brand(
      id: json['_id'] ?? '',
      brandName: json['brandName'] ?? '',
      industry: json['industry'] ?? '',
      targetAudience: json['targetAudience'] ?? '',
      brandVoice: json['brandVoice'] ?? json['voiceTone'] ?? '',
    );
  }
}

class BrandProvider with ChangeNotifier {
  List<Brand> _brands = [];
  Brand? _selectedBrand;
  bool _isLoading = false;
  String? _error;

  List<Brand> get brands => _brands;
  Brand? get selectedBrand => _selectedBrand;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchBrands() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.get('/brands');
      _brands = (response['brands'] as List)
          .map((b) => Brand.fromJson(b as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void selectBrand(Brand brand) {
    _selectedBrand = brand;
    notifyListeners();
  }

  Future<void> createBrand(Map<String, String> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.post('/brands', body: data);
      _brands.add(Brand.fromJson(response['brand']));
      _selectedBrand = _brands.last;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
