# Flutter Mobile App Enhancement Guide

## Pull-to-Refresh Implementation

Add `RefreshIndicator` widget to all list screens for better UX.

### Example: trends_screen.dart

Wrap the ListView.builder with RefreshIndicator:

```dart
Expanded(
  child: RefreshIndicator(
    onRefresh: () async {
      await Provider.of<TrendsProvider>(context, listen: false).refreshTrends();
    },
    child: trendsProvider.isLoading
        ? Center(child: CircularProgressIndicator())
        : trendsProvider.trends.isEmpty
            ? ListView( // Wrap with ListView to enable pull-to-refresh on empty state
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      children: [
                        Icon(Icons.trending_up, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('No trends available'),
                      ],
                    ),
                  ),
                ],
              )
            : ListView.builder(
                padding: EdgeInsets.all(16),
                itemCount: trendsProvider.trends.length,
                itemBuilder: (context, index) {
                  // ... existing code
                },
              ),
  ),
),
```

### Apply to these screens:
1. `trends_screen.dart` - Refresh trends
2. `posts_list_screen.dart` - Refresh posts
3. `dashboard_screen.dart` - Refresh dashboard data

## Firebase Cloud Messaging Setup

### 1. Add Dependencies

In `pubspec.yaml`:

```yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  flutter_local_notifications: ^16.2.0
```

### 2. Create Firebase Messaging Service

Create `lib/services/firebase_messaging_service.dart`:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class FirebaseMessagingService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // Request permission
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Get FCM token
    String? token = await _messaging.getToken();
    print('FCM Token: $token');
    // TODO: Send token to backend

    // Initialize local notifications
    const AndroidInitializationSettings android =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iOS = DarwinInitializationSettings();
    const InitializationSettings settings =
        InitializationSettings(android: android, iOS: iOS);

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);

    // Handle notification tap when app was terminated
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null) {
        _handleNotificationTap(message);
      }
    });

    // Handle notification tap when app was in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }

  void _handleForegroundMessage(RemoteMessage message) {
    print('Foreground message: ${message.messageId}');

    // Show local notification
    _localNotifications.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'bigness_channel',
          'Bigness Notifications',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }

  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    await Firebase.initializeApp();
    print('Background message: ${message.messageId}');
  }

  void _handleNotificationTap(RemoteMessage message) {
    print('Notification tapped: ${message.messageId}');
    // TODO: Navigate to specific screen based on notification data
  }

  void _onNotificationTapped(NotificationResponse response) {
    print('Notification tapped: ${response.payload}');
    // TODO: Handle notification tap
  }

  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
  }
}
```

### 3. Update main.dart

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:bigness_mobile/services/firebase_messaging_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Initialize FCM
  final fcm = FirebaseMessagingService();
  await fcm.initialize();
  
  runApp(MyApp());
}
```

### 4. Android Configuration

In `android/app/build.gradle`:

```gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
    <meta-data
        android:name="com.google.firebase.messaging.default_notification_channel_id"
        android:value="bigness_channel" />
    
    <service
        android:name="com.google.firebase.messaging.FirebaseMessagingService"
        android:exported="false">
        <intent-filter>
            <action android:name="com.google.firebase.MESSAGING_EVENT" />
        </intent-filter>
    </service>
</application>
```

### 5. iOS Configuration

In `ios/Runner/Info.plist`:

```xml
<key>FirebaseAppDelegateProxyEnabled</key>
<false/>
```

In `ios/Runner/AppDelegate.swift`:

```swift
import UIKit
import Flutter
import Firebase

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    FirebaseApp.configure()
    GeneratedPluginRegistrant.register(with: self)
    
    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
    }
    
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

### 6. Backend Integration

Send notifications from backend when:
- Post is published successfully
- Ad campaign is created
- Engagement milestones reached
- Trends matching brand detected

Example backend code (Node.js):

```javascript
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./firebase-service-account.json'))
});

async function sendNotification(fcmToken, title, body, data = {}) {
  const message = {
    notification: { title, body },
    data,
    token: fcmToken
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent:', response);
  } catch (error) {
    console.error('Notification error:', error);
  }
}

// Usage
sendNotification(
  userFCMToken,
  'Post Published!',
  'Your post went live on Twitter',
  { postId: '123', type: 'post_published' }
);
```

## Social Account Connection Screens

Create `lib/screens/social_accounts_screen.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';

class SocialAccountsScreen extends StatefulWidget {
  @override
  State<SocialAccountsScreen> createState() => _SocialAccountsScreenState();
}

class _SocialAccountsScreenState extends State<SocialAccountsScreen> {
  Map<String, bool> _connectedAccounts = {
    'twitter': false,
    'linkedin': false,
    'facebook': false,
    'instagram': false,
  };

  @override
  void initState() {
    super.initState();
    _loadConnectionStatus();
  }

  Future<void> _loadConnectionStatus() async {
    try {
      final status = await ApiService.getSocialAccountStatus();
      setState(() {
        _connectedAccounts = status;
      });
    } catch (e) {
      print('Error loading status: $e');
    }
  }

  Future<void> _connectAccount(String platform) async {
    try {
      final authUrl = await ApiService.initiateSocialAuth(platform);
      
      if (await canLaunch(authUrl)) {
        await launch(authUrl, forceWebView: true);
        // After OAuth flow completes, refresh status
        await Future.delayed(Duration(seconds: 2));
        await _loadConnectionStatus();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Connection failed: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Social Accounts')),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          _buildAccountTile('Twitter', 'twitter', Icons.alternate_email),
          _buildAccountTile('LinkedIn', 'linkedin', Icons.work),
          _buildAccountTile('Facebook', 'facebook', Icons.facebook),
          _buildAccountTile('Instagram', 'instagram', Icons.photo_camera),
        ],
      ),
    );
  }

  Widget _buildAccountTile(String name, String platform, IconData icon) {
    final isConnected = _connectedAccounts[platform] ?? false;

    return Card(
      margin: EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, size: 32),
        title: Text(name, style: TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(isConnected ? 'Connected' : 'Not connected'),
        trailing: ElevatedButton(
          onPressed: () => isConnected ? null : _connectAccount(platform),
          child: Text(isConnected ? 'Connected' : 'Connect'),
          style: ElevatedButton.styleFrom(
            backgroundColor: isConnected ? Colors.green : null,
          ),
        ),
      ),
    );
  }
}
```

## API Service Updates

Add to `lib/services/api_service.dart`:

```dart
static Future<Map<String, bool>> getSocialAccountStatus() async {
  final response = await _authenticatedGet('/social-auth/status');
  return Map<String, bool>.from(response);
}

static Future<String> initiateSocialAuth(String platform) async {
  final response = await _authenticatedGet('/social-auth/$platform/connect');
  return response['authUrl'];
}
```

## Testing Checklist

- [ ] Pull-to-refresh works on trends screen
- [ ] Pull-to-refresh works on posts list screen
- [ ] Pull-to-refresh works on dashboard
- [ ] Firebase notifications received in foreground
- [ ] Firebase notifications received in background
- [ ] Firebase notifications received when app terminated
- [ ] Notification tap navigates to correct screen
- [ ] Social account connection works for each platform
- [ ] Social account status displays correctly
- [ ] OAuth callback handled properly

## Future Enhancements

1. **Offline Mode**: Cache data locally using `sqflite`
2. **Dark Mode**: Implement theme switching
3. **Localization**: Add multi-language support
4. **Analytics**: Track user behavior with Firebase Analytics
5. **Crash Reporting**: Integrate Firebase Crashlytics
6. **A/B Testing**: Use Firebase Remote Config
