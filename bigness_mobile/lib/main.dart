import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/analytics_provider.dart';
import 'providers/brand_provider.dart';
import 'providers/trends_provider.dart';
import 'providers/copy_provider.dart';
import 'providers/publishing_provider.dart';
import 'providers/posts_provider.dart';
import 'providers/image_provider.dart';
import 'providers/onboarding_provider.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/generate_post_screen.dart';
import 'screens/publish_screen.dart';
import 'screens/posts_list_screen.dart';
import 'screens/post_detail_screen.dart';
import 'screens/onboarding/role_selection_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AnalyticsProvider()),
        ChangeNotifierProvider(create: (_) => BrandProvider()),
        ChangeNotifierProvider(create: (_) => TrendsProvider()),
        ChangeNotifierProvider(create: (_) => CopyProvider()),
        ChangeNotifierProvider(create: (_) => PublishingProvider()),
        ChangeNotifierProvider(create: (_) => PostsProvider()),
        ChangeNotifierProvider(create: (_) => ImageProvider()),
        ChangeNotifierProvider(create: (_) => OnboardingProvider()),
      ],
      child: MaterialApp(
        title: 'Bigness',
        theme: ThemeData(
          primaryColor: Color(0xFF10B981),
          useMaterial3: true,
          fontFamily: 'Roboto',
          appBarTheme: AppBarTheme(
            backgroundColor: Colors.white,
            foregroundColor: Colors.black,
            elevation: 1,
          ),
        ),
        home: Consumer<AuthProvider>(
          builder: (context, auth, _) {
            if (!auth.isLoggedIn) {
              return LoginScreen();
            }
            // TODO: Check if onboarding is complete
            // For now, go to dashboard
            return HomeScreen();
          },
        ),
        routes: {
          '/login': (_) => LoginScreen(),
          '/signup': (_) => SignupScreen(),
          '/home': (_) => HomeScreen(),
          '/dashboard': (_) => HomeScreen(),
          '/onboarding': (_) => RoleSelectionScreen(),
        },
      ),
    );
  }
}

class HomeScreen extends StatefulWidget {
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    DashboardScreen(),
    GeneratePostScreen(),
    PostManagementScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.add_circle),
            label: 'Generate',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list),
            label: 'Posts',
          ),
        ],
      ),
    );
  }
}

class PostManagementScreen extends StatefulWidget {
  @override
  State<PostManagementScreen> createState() => _PostManagementScreenState();
}

class _PostManagementScreenState extends State<PostManagementScreen> with TickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Posts'),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Drafts'),
            Tab(text: 'Scheduled'),
            Tab(text: 'Published'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          PostsListScreen(tab: 'drafts'),
          PostsListScreen(tab: 'scheduled'),
          PostsListScreen(tab: 'published'),
        ],
      ),
    );
  }
}
