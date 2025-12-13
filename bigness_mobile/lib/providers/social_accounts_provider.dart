import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SocialAccountsProvider with ChangeNotifier {
  Map<String, dynamic> _socialAccounts = {
    'twitter': {'connected': false},
    'linkedin': {'connected': false},
    'facebook': {'connected': false},
    'instagram': {'connected': false},
  };

  bool _isLoading = false;
  String? _error;

  Map<String, dynamic> get socialAccounts => _socialAccounts;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Load social accounts status
  Future<void> loadStatus() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final status = await ApiService.getSocialStatus();
      _socialAccounts = status;
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Check if platform is connected
  bool isConnected(String platform) {
    return _socialAccounts[platform]?['connected'] ?? false;
  }

  /// Get platform username
  String? getUsername(String platform) {
    final account = _socialAccounts[platform];
    if (account == null || !account['connected']) return null;
    
    switch (platform) {
      case 'twitter':
        return account['username'];
      case 'linkedin':
        return account['name'];
      case 'facebook':
        return account['pageName'];
      case 'instagram':
        return account['username'];
      default:
        return null;
    }
  }

  /// Get all connected platforms
  List<String> get connectedPlatforms {
    return _socialAccounts.entries
        .where((entry) => entry.value['connected'] == true)
        .map((entry) => entry.key)
        .toList();
  }

  /// Get platform display name
  String getPlatformName(String platform) {
    switch (platform) {
      case 'twitter':
        return 'Twitter';
      case 'linkedin':
        return 'LinkedIn';
      case 'facebook':
        return 'Facebook';
      case 'instagram':
        return 'Instagram';
      default:
        return platform;
    }
  }

  /// Get platform icon
  IconData getPlatformIcon(String platform) {
    switch (platform) {
      case 'twitter':
        return Icons.alternate_email;
      case 'linkedin':
        return Icons.work;
      case 'facebook':
        return Icons.facebook;
      case 'instagram':
        return Icons.photo_camera;
      default:
        return Icons.link;
    }
  }

  /// Get platform color
  Color getPlatformColor(String platform) {
    switch (platform) {
      case 'twitter':
        return const Color(0xFF1DA1F2);
      case 'linkedin':
        return const Color(0xFF0A66C2);
      case 'facebook':
        return const Color(0xFF1877F2);
      case 'instagram':
        return const Color(0xFFE4405F);
      default:
        return Colors.grey;
    }
  }
}
