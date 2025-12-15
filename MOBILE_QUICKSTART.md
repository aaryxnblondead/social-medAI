# Bigness Mobile - Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- Expo Go app installed on your mobile device
- Git installed

## Installation

### 1. Clone and Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start Development Server
```bash
npm start
```

This will:
- Start Metro bundler
- Show QR code in terminal
- Open Expo DevTools in browser

### 3. Run on Your Device

#### iOS (iPhone/iPad)
1. Open Camera app
2. Scan the QR code from terminal
3. Tap the notification to open in Expo Go

#### Android
1. Open Expo Go app
2. Tap "Scan QR Code"
3. Scan the QR code from terminal

## Mock API Mode (Default)

The app runs in **mock mode** by default, which means:
- ✅ No backend server needed
- ✅ All features work with fake data
- ✅ Perfect for UI/UX development
- ✅ Instant response times

Mock mode is enabled when `EXPO_PUBLIC_API_URL` is unset or set to `'mock'`.

## Connecting to Real Backend

To connect to the backend server:

1. Start the backend server (see backend README)
2. Get your local IP address:
   - Mac/Linux: `ifconfig | grep "inet "`
   - Windows: `ipconfig`
3. Update `.env` file in mobile folder:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_IP:3000
   ```
4. Restart Expo: `npm start`

## App Navigation

### Main Screens
1. **Login** - Email/password authentication
2. **Onboarding** - Brand setup (2-step flow)
3. **Dashboard** - Home with trends and activity
4. **Generate** - Browse trends and create content
5. **Preview/Publish** - Review and publish to platforms
6. **Analytics** - View performance metrics
7. **Connect Accounts** - Link social platforms

### Bottom Navigation
- 🏠 **Dashboard** - Quick overview
- ✨ **Generate** - Create content
- 📊 **Analytics** - View insights
- ⚙️ **Settings** - Connect accounts

### FAB (Floating Action Button)
- Appears on Dashboard, Generate, and Analytics screens
- **+** button - Quick access to Generate screen

## Features Demonstrated

### ✅ Working in Mock Mode
- User registration and login
- Brand onboarding (name, industry)
- Trend browsing by category
- Post generation with loading states
- Social media preview
- Analytics dashboard
- Account connection UI

### 🔄 Requires Backend
- Real OAuth flows (Twitter, LinkedIn, Facebook, Instagram)
- Actual content generation (Groq AI, Stability AI)
- Real publishing to social platforms
- Live engagement data
- RL policy training

## Testing Credentials (Mock Mode)

Any email/password will work in mock mode. Example:
```
Email: demo@bigness.ai
Password: password123
```

## Troubleshooting

### "Network request failed"
- Ensure your device is on the same WiFi as your computer
- Check firewall settings
- Try setting `EXPO_PUBLIC_API_URL='mock'`

### "Unable to resolve module"
- Clear cache: `npm start -- --clear`
- Reinstall: `rm -rf node_modules && npm install`

### "SDK version mismatch"
- App uses Expo SDK 54
- Ensure Expo Go app is updated to latest version

### Metro bundler errors
- Restart: `npm start -- --reset-cache`
- Check for syntax errors in code

## Development Tips

### Hot Reload
- Changes to JS files auto-reload
- Shake device and tap "Reload" to manually refresh
- Press `r` in terminal to reload

### Debug Menu
Shake your device or press `Cmd+D` (iOS) / `Cmd+M` (Android) to access:
- Reload
- Debug Remote JS
- Toggle Performance Monitor
- Toggle Element Inspector

### Viewing Logs
```bash
# All logs
npx react-native log-ios
npx react-native log-android

# Or in Expo DevTools
npm start
# Click "Logs" tab in browser
```

## Code Structure

```
mobile/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── BottomNav.js   # Bottom navigation bar
│   │   ├── EmptyState.js  # Empty state placeholder
│   │   ├── FAB.js         # Floating action button
│   │   ├── LoadingState.js # Loading with animations
│   │   ├── PostGrid.js    # Week view grid
│   │   └── TrendCard.js   # Trend display card
│   ├── screens/           # App screens
│   │   ├── LoginScreen.js
│   │   ├── OnboardingScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── GenerateScreen.js
│   │   ├── PreviewPublishScreen.js
│   │   ├── AnalyticsScreen.js
│   │   └── ConnectAccountsScreen.js
│   ├── theme/
│   │   └── colors.js      # Design system
│   └── lib/
│       └── setupMockApi.js # Mock API layer
├── App.js                 # Root component
├── app.json               # Expo configuration
└── package.json           # Dependencies
```

## Key Features to Test

### 1. Onboarding Flow
- Enter brand name (Step 1)
- Select industry (Step 2)
- Progress bar updates
- Navigate to Dashboard

### 2. Dashboard
- View trending topics
- See week activity grid
- Pull to refresh
- Tap FAB to generate
- Use bottom nav

### 3. Generate Content
- Filter by category (Technology, Business, etc.)
- Tap trend card to generate
- Watch loading animation with messages
- Wait for generation (mock: 3s)
- Navigate to Preview

### 4. Preview & Publish
- Edit post copy
- See social mockup
- View platform buttons (colored)
- See connection status
- Test publish flow

### 5. Analytics
- View metric cards with trends
- See platform breakdown
- Read AI insights
- Pull to refresh

### 6. Connect Accounts
- See platform cards
- View connection status
- Test connect buttons (opens URLs in mock)
- Refresh status

## Performance

### Expected Load Times (Mock Mode)
- App startup: 2-3s
- Screen navigation: <100ms
- API calls: 300ms (simulated)
- Content generation: 3s (simulated)
- Pull-to-refresh: 1s

### Optimization Tips
- Images are cached automatically
- Use `React.memo()` for expensive components
- Implement `FlatList` for long lists (if needed)
- Lazy load screens with React Lazy

## Next Steps

1. ✅ Run app in mock mode
2. ✅ Test all screens and flows
3. 🔄 Set up backend environment
4. 🔄 Connect to real APIs
5. 🔄 Test OAuth flows
6. 🔄 Deploy to TestFlight/Play Store

## Support

For issues or questions:
1. Check `MOBILE_UI_IMPROVEMENTS.md` for feature details
2. Review `DEPLOYMENT_GUIDE.md` for backend setup
3. See `ARCHITECTURE.md` for system design

## Build for Production

### Using EAS Build

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Configure:
   ```bash
   eas build:configure
   ```

3. Build:
   ```bash
   # iOS
   eas build --platform ios --profile production
   
   # Android
   eas build --platform android --profile production
   ```

### Using Expo Build (Classic)

```bash
# iOS
expo build:ios

# Android
expo build:android -t apk
```

## Environment Variables

Create `.env` file in mobile folder:

```bash
# Mock mode (default)
EXPO_PUBLIC_API_URL=mock

# Real backend
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000

# Production
EXPO_PUBLIC_API_URL=https://api.bigness.ai
```

## Enjoy Building! 🚀

The Bigness mobile app is ready for development and testing. All UI/UX improvements are implemented, and the app works perfectly in mock mode. Happy coding! ✨
