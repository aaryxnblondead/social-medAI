import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/models.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _error;
  bool _isLoggedIn = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _isLoggedIn;

  AuthProvider() {
    _initAuth();
  }

  Future<void> _initAuth() async {
    await ApiService.init();
    final token = await _getStoredToken();
    if (token != null) {
      _isLoggedIn = true;
      try {
        final response = await ApiService.getMe();
        _user = User.fromJson(response['user']);
      } catch (e) {
        await logout();
      }
      notifyListeners();
    }
  }

  Future<String?> _getStoredToken() async {
    // Token is loaded in ApiService.init()
    return null; // Placeholder
  }

  Future<void> register(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.register(email, password);
      _user = User.fromJson(response['user']);
      _isLoggedIn = true;
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.login(email, password);
      _user = User.fromJson(response['user']);
      _isLoggedIn = true;
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    _user = null;
    _isLoggedIn = false;
    notifyListeners();
  }
}
