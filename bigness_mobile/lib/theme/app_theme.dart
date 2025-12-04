import 'package:flutter/material.dart';

class AppTheme {
  // Primary Colors
  static const Color black = Color(0xFF1A1A1A);
  static const Color teal = Color(0xFF00BCD4);
  static const Color white = Color(0xFFFFFFFF);
  static const Color offWhite = Color(0xFFF5F5F5);

  // AI/Generate Colors
  static const Color mustard = Color(0xFFD4A574);
  static const Color darkMustard = Color(0xFFA68860);

  // Neutrals
  static const Color darkGray = Color(0xFF2A2A2A);
  static const Color mediumGray = Color(0xFF666666);
  static const Color lightGray = Color(0xFFE0E0E0);
  static const Color veryLightGray = Color(0xFFF9F9F9);

  // Status Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color error = Color(0xFFE53935);
  static const Color warning = Color(0xFFFFA726);
  static const Color info = Color(0xFF42A5F5);

  // Gradients
  static LinearGradient blackToTealGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [black, Color(0xFF0A4D57)],
  );

  static LinearGradient blackToMustardGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [black, Color(0xFF5A4A3A)],
  );

  static LinearGradient tealToBlackGradient = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [teal, black],
  );

  static LinearGradient mustardToBlackGradient = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [mustard, black],
  );

  // ThemeData
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      primaryColor: teal,
      scaffoldBackgroundColor: white,
      appBarTheme: AppBarTheme(
        backgroundColor: black,
        foregroundColor: white,
        elevation: 0,
        centerTitle: false,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: teal,
          foregroundColor: white,
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: teal,
          side: BorderSide(color: teal, width: 2),
          padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: teal,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: offWhite,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: lightGray),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: lightGray),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: teal, width: 2),
        ),
        contentPadding: EdgeInsets.all(16),
        hintStyle: TextStyle(color: mediumGray),
        labelStyle: TextStyle(color: black),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: offWhite,
        disabledColor: lightGray,
        selectedColor: teal,
        labelStyle: TextStyle(color: black),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      fontFamily: 'Roboto',
      textTheme: TextTheme(
        displayLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: black,
        ),
        displayMedium: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: black,
        ),
        headlineSmall: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: black,
        ),
        titleLarge: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: black,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          color: black,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          color: mediumGray,
        ),
      ),
    );
  }

  // Custom button styles
  static ButtonStyle primaryButtonStyle = ElevatedButton.styleFrom(
    backgroundColor: teal,
    foregroundColor: white,
    padding: EdgeInsets.symmetric(horizontal: 32, vertical: 14),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 0,
  );

  static ButtonStyle aiButtonStyle = ElevatedButton.styleFrom(
    backgroundColor: mustard,
    foregroundColor: white,
    padding: EdgeInsets.symmetric(horizontal: 32, vertical: 14),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 0,
  );

  static ButtonStyle secondaryButtonStyle = ElevatedButton.styleFrom(
    backgroundColor: offWhite,
    foregroundColor: black,
    padding: EdgeInsets.symmetric(horizontal: 32, vertical: 14),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    elevation: 0,
    side: BorderSide(color: lightGray),
  );
}
