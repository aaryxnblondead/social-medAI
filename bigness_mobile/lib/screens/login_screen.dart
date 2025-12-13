import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _showPassword = false;
  final _serverUrlController = TextEditingController();
  bool _serverExpanded = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _serverUrlController.dispose();
    super.dispose();
  }

  void _handleLogin(BuildContext context) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.login(
      _emailController.text,
      _passwordController.text,
    );

    if (authProvider.isLoggedIn) {
      Navigator.of(context).pushReplacementNamed('/dashboard');
    }
  }

  Future<void> _loadCurrentServerUrl() async {
    await ApiService.init();
    setState(() {
      _serverUrlController.text = ApiService.baseUrl;
    });
  }

  @override
  void initState() {
    super.initState();
    _loadCurrentServerUrl();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(gradient: AppTheme.blackToTealGradient),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo area
                  Container(
                    padding: EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.teal.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.teal, width: 2),
                    ),
                    child: Text(
                      '✨',
                      style: TextStyle(fontSize: 48),
                    ),
                  ),
                  SizedBox(height: 24),
                  Text(
                    'Bigness',
                    style: TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.white,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'AI-Powered Social Media',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.teal,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 48),

                  // Server URL advanced setting
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton.icon(
                      onPressed: () => setState(() => _serverExpanded = !_serverExpanded),
                      icon: Icon(_serverExpanded ? Icons.expand_less : Icons.expand_more, color: AppTheme.teal),
                      label: Text('Server Settings', style: TextStyle(color: AppTheme.teal)),
                    ),
                  ),
                  AnimatedCrossFade(
                    crossFadeState: _serverExpanded ? CrossFadeState.showFirst : CrossFadeState.showSecond,
                    duration: const Duration(milliseconds: 200),
                    firstChild: Column(
                      children: [
                        TextField(
                          controller: _serverUrlController,
                          style: TextStyle(color: AppTheme.black),
                          decoration: InputDecoration(
                            hintText: 'http://10.0.2.2:5000/api or http://<PC_IP>:5000/api',
                            filled: true,
                            fillColor: AppTheme.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                            prefixIcon: Icon(Icons.link, color: AppTheme.teal),
                          ),
                          keyboardType: TextInputType.url,
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () async {
                                  final url = _serverUrlController.text.trim();
                                  if (url.isEmpty) return;
                                  await ApiService.setBaseUrl(url);
                                  if (!mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('✅ Server URL saved')),
                                  );
                                },
                                child: const Text('Save Server URL'),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () async {
                                  await ApiService.init();
                                  setState(() {
                                    _serverUrlController.text = ApiService.baseUrl;
                                  });
                                  if (!mounted) return;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('🔄 Server URL refreshed')),
                                  );
                                },
                                child: const Text('Use Default'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                    secondChild: const SizedBox.shrink(),
                  ),

                  // Email field
                  TextField(
                    controller: _emailController,
                    style: TextStyle(color: AppTheme.black),
                    decoration: InputDecoration(
                      hintText: 'Email',
                      filled: true,
                      fillColor: AppTheme.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      prefixIcon: Icon(Icons.email, color: AppTheme.teal),
                    ),
                  ),
                  SizedBox(height: 16),

                  // Password field
                  TextField(
                    controller: _passwordController,
                    obscureText: !_showPassword,
                    style: TextStyle(color: AppTheme.black),
                    decoration: InputDecoration(
                      hintText: 'Password',
                      filled: true,
                      fillColor: AppTheme.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      prefixIcon: Icon(Icons.lock, color: AppTheme.teal),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _showPassword ? Icons.visibility : Icons.visibility_off,
                          color: AppTheme.teal,
                        ),
                        onPressed: () {
                          setState(() => _showPassword = !_showPassword);
                        },
                      ),
                    ),
                  ),
                  SizedBox(height: 24),

                  // Error message
                  Consumer<AuthProvider>(
                    builder: (context, auth, _) {
                      return auth.error != null
                          ? Container(
                              padding: EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.error.withOpacity(0.1),
                                border: Border.all(color: AppTheme.error),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  Icon(Icons.error, color: AppTheme.error, size: 20),
                                  SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      auth.error!,
                                      style: TextStyle(
                                        color: AppTheme.error,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            )
                          : SizedBox.shrink();
                    },
                  ),
                  SizedBox(height: 24),

                  // Login button
                  Consumer<AuthProvider>(
                    builder: (context, auth, _) {
                      return SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: auth.isLoading ? null : () => _handleLogin(context),
                          style: AppTheme.primaryButtonStyle.copyWith(
                            minimumSize: MaterialStateProperty.all(Size.fromHeight(48)),
                          ),
                          child: auth.isLoading
                              ? SizedBox(
                                  height: 24,
                                  width: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(AppTheme.white),
                                  ),
                                )
                              : Text(
                                  'Login',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                      );
                    },
                  ),

                  SizedBox(height: 16),
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).pushNamed('/signup');
                    },
                    child: Text(
                      "Don't have an account? Sign up",
                      style: TextStyle(
                        color: Color(0xFF10B981),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
