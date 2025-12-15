# Bigness Mobile App - Testing Checklist

## 📱 Visual & UI Testing

### Design System
- [ ] Color palette matches specification (Deep Purple, Electric Blue, etc.)
- [ ] Text hierarchy is clear (title → heading → body → caption)
- [ ] Consistent spacing and padding across screens
- [ ] Cards have proper shadows and elevation
- [ ] Buttons have correct colors and states
- [ ] Badges render with proper styling
- [ ] Status icons display correctly

### Components
- [ ] **LoadingState**: Animated dots pulse smoothly
- [ ] **LoadingState**: Messages rotate every 2 seconds
- [ ] **TrendCard**: Image displays with gradient overlay
- [ ] **TrendCard**: Score badge positioned correctly
- [ ] **PostGrid**: 7-day grid renders properly
- [ ] **PostGrid**: Status icons show for each day
- [ ] **FAB**: Positioned correctly (right: 20, bottom: 90)
- [ ] **FAB**: Shadow/elevation visible
- [ ] **BottomNav**: Sticky at bottom of screen
- [ ] **BottomNav**: Active state highlights current tab
- [ ] **EmptyState**: Icon, title, message display correctly

## 🚀 Navigation Testing

### Screen Flow
- [ ] Login → Onboarding → Dashboard flow works
- [ ] Dashboard → Generate navigation works
- [ ] Generate → Preview navigation works
- [ ] Preview → Analytics navigation works
- [ ] Bottom nav switches between all 4 tabs
- [ ] Back button behavior is correct
- [ ] Deep linking to specific screens works

### Navigation Persistence
- [ ] Route params passed correctly between screens
- [ ] API/token/brand state maintained across navigation
- [ ] No data loss when navigating back
- [ ] Bottom nav persists on main screens

## 🎨 Screen-Specific Testing

### Login Screen
- [ ] Email/password inputs render correctly
- [ ] Theme styles applied properly
- [ ] Login button works (any credentials in mock mode)
- [ ] Error messages display for invalid attempts
- [ ] Keyboard dismisses on submit

### Onboarding Screen
- [ ] Step 1: Brand name input works
- [ ] Step 1: Continue button validates input
- [ ] Progress bar shows 50% on Step 1
- [ ] Step 2: Industry grid displays (2x2)
- [ ] Step 2: Industry selection highlights card
- [ ] Progress bar shows 100% on Step 2
- [ ] Back button returns to Step 1
- [ ] Get Started button completes onboarding
- [ ] Navigates to Dashboard after completion

### Dashboard Screen
- [ ] Brand name displays in hero section
- [ ] Trending section loads top 5 trends
- [ ] TrendCards render with images
- [ ] PostGrid shows week activity
- [ ] Quick action buttons work
- [ ] FAB navigates to Generate
- [ ] Pull-to-refresh reloads data
- [ ] Bottom nav displays correctly
- [ ] Refresh indicator animates smoothly

### Generate Screen
- [ ] Category buttons render in row
- [ ] Active category highlights
- [ ] TrendCards display in list
- [ ] Tapping trend shows LoadingState
- [ ] LoadingState messages rotate
- [ ] Generation completes after delay
- [ ] Navigates to Preview after generation
- [ ] Pull-to-refresh reloads trends
- [ ] EmptyState shows when no trends
- [ ] Bottom nav displays correctly

### Preview/Publish Screen
- [ ] Draft content displays
- [ ] Copy is editable in TextInput
- [ ] Social mockup renders correctly
- [ ] Avatar placeholder shows
- [ ] Image preview displays
- [ ] Connection badges show status
- [ ] Platform buttons have correct colors:
  - [ ] Twitter: #1DA1F2
  - [ ] LinkedIn: #0A66C2
  - [ ] Facebook: #1877F2
  - [ ] Instagram: #E4405F
- [ ] Publish button shows loading state
- [ ] Success alert appears after publish
- [ ] Navigates to Analytics after publish

### Analytics Screen
- [ ] Hero metrics display (4 cards)
- [ ] Metric values show correctly
- [ ] Trend indicators (↑↓) display
- [ ] Platform breakdown renders
- [ ] Platform icons have correct colors
- [ ] Post counts are accurate
- [ ] AI Insights card shows tip
- [ ] Pull-to-refresh reloads data
- [ ] Bottom nav displays correctly

### Connect Accounts Screen
- [ ] Platform cards display (4 platforms)
- [ ] Platform icons have correct colors
- [ ] Connection status shows correctly
- [ ] Connect buttons work
- [ ] Connected badge displays when connected
- [ ] Refresh button updates status
- [ ] Bottom nav displays correctly
- [ ] External URLs open for OAuth (in mock mode)

## 🎭 Interaction Testing

### Touch Feedback
- [ ] All buttons show active opacity (0.7-0.9)
- [ ] Cards scale slightly on press
- [ ] No double-tap issues
- [ ] Touch targets meet 44x44px minimum
- [ ] Proper spacing between interactive elements

### Scroll Behavior
- [ ] All ScrollViews scroll smoothly
- [ ] Pull-to-refresh works on all data screens
- [ ] Refresh indicator animates correctly
- [ ] Scroll doesn't interfere with bottom nav
- [ ] Content doesn't hide behind bottom nav
- [ ] FAB doesn't block content

### Input Handling
- [ ] TextInputs focus correctly
- [ ] Keyboard appears for text inputs
- [ ] Keyboard dismisses appropriately
- [ ] Multi-line inputs work (Preview screen)
- [ ] Input validation prevents empty submissions

## 🔄 State Management Testing

### Loading States
- [ ] Initial screen loads show appropriate state
- [ ] LoadingState component animates during generation
- [ ] RefreshControl shows during refresh
- [ ] Publishing button shows "Publishing..." state
- [ ] Disabled states prevent multiple submissions

### Data Persistence
- [ ] User data persists across navigation
- [ ] Brand data available on all screens
- [ ] Token maintained for API calls
- [ ] Generated posts saved to drafts
- [ ] Connection status updates correctly

### Error Handling
- [ ] Network errors show alerts
- [ ] Invalid inputs show validation messages
- [ ] Failed API calls handled gracefully
- [ ] Empty states show when no data
- [ ] Retry mechanisms work

## 📊 Mock API Testing

### Authentication
- [ ] Register creates new user
- [ ] Login accepts any credentials
- [ ] JWT token returned and stored
- [ ] /me endpoint returns user data
- [ ] Social accounts structure correct

### Brands
- [ ] Onboard creates brand
- [ ] Brand data includes all fields
- [ ] Brand persists for session

### Trends
- [ ] /trends returns items by category
- [ ] Each category has different trends
- [ ] Trend structure includes title/description/imageUrl
- [ ] Search parameter filters results

### Posts
- [ ] Generate creates draft post
- [ ] Draft includes content (copy, graphicUrl)
- [ ] Publish updates post status
- [ ] Published posts have platformPostId
- [ ] Draft list persists

### Analytics
- [ ] Returns total/published/drafts counts
- [ ] byPlatform array includes all platforms
- [ ] Metrics include likes/comments/shares
- [ ] avgReward calculated correctly

### OAuth
- [ ] Auth URL endpoint returns URL
- [ ] Recommended scopes endpoint works
- [ ] Callback simulates connection
- [ ] Connection status updates

### Meta (Facebook/Instagram)
- [ ] Pages list endpoint returns data
- [ ] Select page endpoint works
- [ ] Instagram account resolution works

## 🎨 Animation Testing

### LoadingState Animations
- [ ] Dots fade in/out smoothly (500ms)
- [ ] Dots scale up/down (1.0 ↔ 1.2)
- [ ] Animation loops continuously
- [ ] Messages change every 2 seconds
- [ ] No performance issues

### Transition Animations
- [ ] Screen transitions are smooth
- [ ] Card press feedback is instant
- [ ] Pull-to-refresh is fluid
- [ ] Bottom nav transitions are smooth
- [ ] FAB appears/disappears correctly

### Progress Indicators
- [ ] Onboarding progress bar fills correctly
- [ ] RefreshControl spins smoothly
- [ ] Loading states don't freeze UI

## 📱 Platform-Specific Testing

### iOS
- [ ] Safe area padding correct (bottom nav)
- [ ] Status bar color appropriate
- [ ] Keyboard behavior correct
- [ ] Scroll bounce enabled
- [ ] Shadows render correctly
- [ ] Haptics work (if implemented)

### Android
- [ ] Back button behavior correct
- [ ] Status bar color appropriate
- [ ] Elevation shadows work
- [ ] Keyboard behavior correct
- [ ] No iOS-specific styling issues

## 🔍 Edge Case Testing

### Network Scenarios
- [ ] App works offline (shows cached data or empty states)
- [ ] Slow network doesn't freeze UI
- [ ] Network errors show user-friendly messages
- [ ] Retry mechanisms available

### Data Scenarios
- [ ] Empty trends list shows EmptyState
- [ ] No analytics data handled gracefully
- [ ] Missing images show placeholders
- [ ] Long text truncates appropriately
- [ ] Special characters in input handled

### User Scenarios
- [ ] New user flow works (no brand)
- [ ] Returning user bypasses onboarding
- [ ] Multiple brands supported (if implemented)
- [ ] Logout clears state correctly

## 🎯 Accessibility Testing

### Visual
- [ ] Text contrast meets WCAG AA (4.5:1 for body text)
- [ ] Icon meanings clear without color
- [ ] Status indicators have icons + color
- [ ] Focus indicators visible

### Interaction
- [ ] Touch targets large enough (44x44px)
- [ ] Buttons have clear labels
- [ ] Error messages are descriptive
- [ ] Success feedback provided

### Screen Reader
- [ ] All images have alt text (if applicable)
- [ ] Buttons have descriptive labels
- [ ] Form inputs have labels
- [ ] Navigation landmarks clear

## ⚡ Performance Testing

### Rendering
- [ ] Initial render < 3 seconds
- [ ] Screen transitions < 100ms
- [ ] Scroll performance smooth (60fps)
- [ ] No jank during animations
- [ ] Image loading doesn't block UI

### Memory
- [ ] No memory leaks on navigation
- [ ] Images released when off-screen
- [ ] Listeners cleaned up properly

### Battery
- [ ] Animations don't drain battery
- [ ] Background tasks minimal
- [ ] Location services not running (unless needed)

## 🐛 Known Issues / Limitations

### Mock Mode Limitations
- ⚠️ OAuth redirects don't actually connect accounts
- ⚠️ Generated content is static/placeholder
- ⚠️ Analytics data is static
- ⚠️ No real-time updates
- ⚠️ Data resets on app restart

### Features Not Implemented
- ⚠️ Dark mode toggle
- ⚠️ Haptic feedback
- ⚠️ Confetti animations
- ⚠️ Chart visualizations
- ⚠️ Skeleton loading screens
- ⚠️ Swipe gestures
- ⚠️ Push notifications

## ✅ Sign-Off Checklist

### Before Demo
- [ ] All screens tested and working
- [ ] No console errors
- [ ] No crashes
- [ ] Mock data is realistic
- [ ] Animations are smooth
- [ ] Navigation is intuitive
- [ ] Visual design matches spec

### Before Backend Integration
- [ ] API endpoints match backend
- [ ] Token auth implemented correctly
- [ ] Error handling robust
- [ ] Loading states appropriate
- [ ] Success/failure feedback clear

### Before Production
- [ ] Environment variables configured
- [ ] API URLs correct for production
- [ ] Error tracking integrated (Sentry, etc.)
- [ ] Analytics integrated (Amplitude, Mixpanel, etc.)
- [ ] Crash reporting enabled
- [ ] App icons and splash screen ready
- [ ] App store descriptions written
- [ ] Privacy policy linked
- [ ] Terms of service linked

## 📝 Bug Report Template

When you find an issue:

```
**Title**: Brief description

**Screen**: Name of screen where bug occurs

**Steps to Reproduce**:
1. Navigate to...
2. Tap...
3. Observe...

**Expected**: What should happen

**Actual**: What actually happens

**Screenshots**: (attach if visual)

**Device**: iOS/Android, version

**Severity**: Critical / High / Medium / Low
```

## 🎉 Testing Complete!

Once all checkboxes are marked:
- [ ] Visual & UI ✅
- [ ] Navigation ✅
- [ ] All Screens ✅
- [ ] Interactions ✅
- [ ] State Management ✅
- [ ] Mock API ✅
- [ ] Animations ✅
- [ ] Platform-Specific ✅
- [ ] Edge Cases ✅
- [ ] Accessibility ✅
- [ ] Performance ✅

**App Status**: 🚀 Ready for Production!

---

**Last Updated**: [Current Date]
**Tested By**: [Your Name]
**App Version**: 1.0.0
**Expo SDK**: 54.0.0
