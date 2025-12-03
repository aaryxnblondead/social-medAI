import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/analytics_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AnalyticsProvider()),
      ],
      child: MaterialApp(
        title: 'Bigness',
        theme: ThemeData(
          primaryColor: Color(0xFF10B981),
          useMaterial3: true,
          fontFamily: 'Roboto',
        ),
        home: Consumer<AuthProvider>(
          builder: (context, auth, _) {
            return auth.isLoggedIn ? DashboardScreen() : LoginScreen();
          },
        ),
        routes: {
          '/login': (_) => LoginScreen(),
          '/dashboard': (_) => DashboardScreen(),
        },
      ),
    );
  }
}
