import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';

class ApiService {
  // Use 10.0.2.2 for Android emulator, or your PC's IP address (e.g., 192.168.x.x) for physical device
  // To find your IP: run 'ipconfig' on Windows and look for IPv4 Address
  static const String baseUrl = 'http://192.168.1.6:5000/api'; // Updated to PC IP for physical device
  static String? _token;

  // Initialize token from storage
  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
  }

  // Save token
  static Future<void> saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  // Clear token
  static Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  // Get headers with auth
  static Map<String, String> _getHeaders() {
    return {
      'Content-Type': 'application/json',
      if (_token != null) 'Authorization': 'Bearer $_token',
    };
  }

  // Helper: POST request
  static Future<dynamic> post(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(),
        body: jsonEncode(body),
      ).timeout(Duration(seconds: 30));

      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  static Future<dynamic> put(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(),
        body: jsonEncode(body),
      ).timeout(Duration(seconds: 30));

      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Helper: DELETE request
  static Future<dynamic> delete(String endpoint) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(),
      ).timeout(Duration(seconds: 30));

      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Helper: GET request
  static Future<dynamic> get(String endpoint) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl$endpoint'),
        headers: _getHeaders(),
      ).timeout(Duration(seconds: 30));

      return _handleResponse(response);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // Handle response
  static dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return jsonDecode(response.body);
    } else if (response.statusCode == 401) {
      clearToken();
      throw 'Unauthorized';
    } else {
      throw jsonDecode(response.body)['error'] ?? 'Unknown error';
    }
  }

  // Handle errors
  static String _handleError(dynamic error) {
    if (error is SocketException) {
      return 'Network error - check your connection';
    } else if (error is TimeoutException) {
      return 'Request timeout';
    }
    return error.toString();
  }

  // ===== Auth Endpoints =====
  static Future<Map<String, dynamic>> register(String email, String password, String name, String accountType) async {
    final response = await post('/auth/register', body: {
      'email': email,
      'password': password,
      'name': name,
      'accountType': accountType,
    });
    if (response['token'] != null) {
      await saveToken(response['token']);
    }
    return response;
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await post('/auth/login', body: {
      'email': email,
      'password': password,
    });
    if (response['token'] != null) {
      await saveToken(response['token']);
    }
    return response;
  }

  static Future<Map<String, dynamic>> getMe() async {
    return await get('/auth/me');
  }

  // ===== Trends =====
  static Future<Map<String, dynamic>> getTrends({String? source}) async {
    String endpoint = '/trends';
    if (source != null) {
      endpoint = '/trends/source/$source';
    }
    return await get(endpoint);
  }

  // ===== Copy Generation =====
  static Future<Map<String, dynamic>> generateCopy({
    required String brandId,
    required String trendId,
    String platform = 'twitter',
  }) async {
    return await post('/copy/generate', body: {
      'brandId': brandId,
      'trendId': trendId,
      'platform': platform,
    });
  }

  static Future<List<dynamic>> getCopyPosts({String? platform}) async {
    String endpoint = '/copy/posts';
    if (platform != null) {
      endpoint = '$endpoint?platform=$platform';
    }
    final response = await get(endpoint);
    return response['posts'] ?? [];
  }

  // ===== Publishing =====
  static Future<Map<String, dynamic>> publishMultiPlatform(
    String postId,
    List<String> platforms,
  ) async {
    return await post('/publish/multi/multi', body: {
      'postId': postId,
      'platforms': platforms,
    });
  }

  static Future<Map<String, dynamic>> getPerformance(String postId) async {
    return await get('/publish/multi/$postId/performance');
  }

  // ===== Analytics =====
  static Future<Map<String, dynamic>> getUserAnalytics() async {
    return await get('/analytics/user');
  }

  static Future<List<dynamic>> getTopPosts({int limit = 10}) async {
    final response = await get('/analytics/top-posts?limit=$limit');
    return response['posts'] ?? [];
  }

  // ===== RL Optimization =====
  static Future<Map<String, dynamic>> getTrainingData() async {
    return await get('/rl/training-data');
  }

  static Future<Map<String, dynamic>> trainWeekly() async {
    return await post('/rl/train-weekly');
  }

  // ===== Onboarding =====
  static Future<Map<String, dynamic>> submitBrandOnboarding(Map<String, dynamic> data) async {
    return await post('/onboarding/brand', body: data);
  }

  static Future<Map<String, dynamic>> submitInfluencerOnboarding(Map<String, dynamic> data) async {
    return await post('/onboarding/influencer', body: data);
  }

  static Future<Map<String, dynamic>> getBrandProfile() async {
    return await get('/onboarding/brand');
  }

  static Future<Map<String, dynamic>> getInfluencerProfile() async {
    return await get('/onboarding/influencer');
  }

  static Future<Map<String, dynamic>> getOnboardingStatus() async {
    return await get('/onboarding/status');
  }
}
