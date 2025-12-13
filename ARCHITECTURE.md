# Bigness Architecture Documentation

## 🏗️ Multi-Tenant OAuth Architecture

### Overview

Bigness is a **multi-tenant SaaS platform** where each brand/user manages their own social media accounts independently. This document explains how OAuth credentials and tokens are managed.

---

## 🔑 Two Types of Credentials

### 1. App-Level Credentials (Platform Developer Accounts)

**Stored in:** `.env` file (server-side, never exposed)

**Purpose:** Identifies YOUR APPLICATION to each social platform

**Who owns them:** You (the platform owner)

**Examples:**
```env
TWITTER_CLIENT_ID=abc123xyz        # YOUR app's Twitter credentials
TWITTER_CLIENT_SECRET=secret456    # YOUR app's Twitter secret
LINKEDIN_CLIENT_ID=def789          # YOUR app's LinkedIn credentials
FACEBOOK_APP_ID=123456789          # YOUR app's Facebook credentials
```

**Analogy:** These are like your business license - they prove your application is registered with Twitter/LinkedIn/Facebook.

### 2. User-Level OAuth Tokens (Individual Brand Accounts)

**Stored in:** MongoDB `User.socialAccounts` field (per-user, encrypted)

**Purpose:** Grants access to THAT SPECIFIC USER's social media account

**Who owns them:** Each individual brand/user

**Examples:**
```javascript
// User A (Nike)
{
  socialAccounts: {
    twitter: {
      accessToken: "user_a_specific_token",
      username: "@Nike"
    }
  }
}

// User B (Adidas)
{
  socialAccounts: {
    twitter: {
      accessToken: "user_b_specific_token",
      username: "@Adidas"
    }
  }
}
```

**Analogy:** These are like user-specific keys - each brand has their own key to their own account.

---

## 🔄 OAuth Flow Explained

### Step-by-Step Example: Brand Connects Twitter

1. **Brand A (Nike) clicks "Connect Twitter"**
   ```
   User: Nike team member
   Action: Clicks button in dashboard
   ```

2. **Your app initiates OAuth flow**
   ```javascript
   // Uses YOUR app credentials to create auth URL
   const authUrl = `https://twitter.com/oauth2/authorize?
     client_id=${TWITTER_CLIENT_ID}&           // Your app's ID
     redirect_uri=https://yourapp.com/callback&
     state=nike_user_id_encrypted`
   ```

3. **Twitter shows authorization screen**
   ```
   "Bigness App wants to access your Twitter account (@Nike)"
   [Authorize] [Deny]
   ```

4. **User authorizes, Twitter redirects back**
   ```
   https://yourapp.com/callback?code=temp_auth_code&state=nike_user_id
   ```

5. **Your app exchanges code for tokens**
   ```javascript
   // Uses YOUR app credentials + auth code
   const response = await axios.post('https://api.twitter.com/oauth2/token', {
     code: 'temp_auth_code',
     client_id: TWITTER_CLIENT_ID,      // Your app
     client_secret: TWITTER_CLIENT_SECRET, // Your app secret
     grant_type: 'authorization_code'
   });
   
   // Response contains USER-SPECIFIC tokens
   {
     access_token: "nike_specific_access_token",
     refresh_token: "nike_specific_refresh_token",
     expires_in: 7200
   }
   ```

6. **Your app stores tokens in Nike's user record**
   ```javascript
   await User.findByIdAndUpdate(nikeUserId, {
     'socialAccounts.twitter': {
       connected: true,
       accessToken: 'nike_specific_access_token',
       refreshToken: 'nike_specific_refresh_token',
       username: '@Nike'
     }
   });
   ```

7. **When Nike publishes a tweet**
   ```javascript
   // Retrieve Nike's specific tokens
   const user = await User.findById(nikeUserId);
   const nikeToken = user.socialAccounts.twitter.accessToken;
   
   // Use Nike's tokens to post as @Nike
   await twitterClient.post('/tweets', {
     text: 'Just Do It!'
   }, {
     headers: { Authorization: `Bearer ${nikeToken}` }
   });
   ```

---

## 🏢 Multi-Tenant Data Isolation

### Database Schema

```javascript
// User Collection - Each brand is isolated
{
  _id: "nike_user_id",
  email: "marketing@nike.com",
  socialAccounts: {
    twitter: {
      accessToken: "nike_token",     // Nike's Twitter access
      username: "@Nike"
    },
    linkedin: {
      accessToken: "nike_linkedin",   // Nike's LinkedIn access
    }
  }
}

{
  _id: "adidas_user_id",
  email: "social@adidas.com",
  socialAccounts: {
    twitter: {
      accessToken: "adidas_token",    // Adidas's Twitter access
      username: "@Adidas"
    }
  }
}
```

### API Request Flow

```javascript
// 1. User authenticates with YOUR app
POST /api/auth/login
Body: { email: "marketing@nike.com", password: "..." }
Response: { token: "nike_jwt_token" }

// 2. User makes authenticated request
GET /api/posts
Headers: { Authorization: "Bearer nike_jwt_token" }

// 3. Your middleware extracts user ID
verifyToken(nike_jwt_token) → userId = "nike_user_id"

// 4. Query only shows Nike's data
const posts = await Post.find({ userId: "nike_user_id" });

// 5. Publishing uses Nike's social tokens
const nikeUser = await User.findById("nike_user_id");
publishTweet(nikeUser.socialAccounts.twitter.accessToken);
```

---

## 🔒 Security Model

### What's Shared (App-Level)
- ✅ OAuth Client ID/Secret (identifies your app)
- ✅ Database connection (logically isolated by userId)
- ✅ Redis cache (namespaced by userId)
- ✅ API endpoints (filtered by authentication)

### What's Isolated (User-Level)
- 🔐 OAuth access tokens (unique per user)
- 🔐 Social media posts (filtered by userId)
- 🔐 Brand profiles (owned by specific user)
- 🔐 Analytics data (scoped to user's content)
- 🔐 Ad campaigns (user's ad accounts)

### Token Storage Security

```javascript
// MongoDB User model (already implemented)
userSchema = {
  socialAccounts: {
    twitter: {
      accessToken: String,      // Encrypted at rest by MongoDB
      refreshToken: String,     // Encrypted at rest
      tokenExpiry: Date         // Automatic cleanup
    }
  }
}

// Best practices already implemented:
// 1. Tokens stored in database, not .env
// 2. Each user has separate tokens
// 3. Automatic token refresh before expiry
// 4. Tokens never exposed to frontend
// 5. HTTPS required for all OAuth callbacks
```

---

## 🚀 Scaling Considerations

### Current Architecture (Single App, Multiple Brands)

```
Your App (single deployment)
├── App OAuth Credentials (1 set per platform)
│   ├── TWITTER_CLIENT_ID
│   ├── LINKEDIN_CLIENT_ID
│   └── FACEBOOK_APP_ID
│
└── User Database
    ├── Brand A
    │   ├── Twitter Token (for @BrandA)
    │   ├── LinkedIn Token (for Brand A LinkedIn)
    │   └── Posts (only Brand A's posts)
    │
    ├── Brand B
    │   ├── Twitter Token (for @BrandB)
    │   └── Posts (only Brand B's posts)
    │
    └── Brand C
        └── ... (isolated data)
```

### Why This Works

**Platforms allow unlimited users per app:**
- ✅ Twitter: Unlimited OAuth connections with one Client ID
- ✅ LinkedIn: Unlimited connections per app
- ✅ Facebook: Unlimited page connections per app
- ✅ Instagram: Unlimited business accounts per app

**Your app acts as intermediary:**
```
Brand A → [Your App] → Twitter API (using Brand A's token)
Brand B → [Your App] → Twitter API (using Brand B's token)
Brand C → [Your App] → LinkedIn API (using Brand C's token)
```

### When You Need Multiple App Credentials

**Only needed for:**
- 🏢 White-label deployments (separate branding)
- 🌍 Regional compliance (EU vs US instances)
- 📊 Rate limit distribution (extremely high volume)

**Current capacity per platform:**
- Twitter API v2: 300 requests/15min per user token
- LinkedIn: 500 requests/day per user token
- Facebook: 200 calls/hour per user token

With proper caching and job scheduling, you can support **hundreds of brands** with a single set of app credentials.

---

## 🔄 Token Refresh Strategy

### Automatic Refresh (Already Implemented)

```javascript
// From twitter-service.js
async function ensureValidToken(user) {
  const twitterAccount = user.socialAccounts.twitter;
  
  // Check if token expired
  if (new Date() >= twitterAccount.tokenExpiry) {
    // Refresh using refresh token
    const newTokens = await refreshTwitterToken(
      twitterAccount.refreshToken
    );
    
    // Update user's tokens
    await User.findByIdAndUpdate(user._id, {
      'socialAccounts.twitter.accessToken': newTokens.access_token,
      'socialAccounts.twitter.tokenExpiry': new Date(Date.now() + newTokens.expires_in * 1000)
    });
  }
  
  return user.socialAccounts.twitter.accessToken;
}
```

**Benefits:**
- ✅ No user interaction needed
- ✅ Tokens stay fresh automatically
- ✅ Each user's tokens refreshed independently
- ✅ Failures isolated to individual users

---

## 📊 Data Access Patterns

### Reading User Data

```javascript
// CORRECT: Filtered by authenticated user
router.get('/posts', verifyToken, async (req, res) => {
  const posts = await Post.find({ 
    userId: req.userId  // From JWT token
  });
  res.json(posts);
});

// WRONG: Would expose all users' data
router.get('/posts', async (req, res) => {
  const posts = await Post.find({});  // ❌ No filter!
  res.json(posts);
});
```

### Publishing with User Tokens

```javascript
// CORRECT: Use individual user's token
async function publishTweet(userId, content) {
  const user = await User.findById(userId);
  const token = user.socialAccounts.twitter.accessToken;
  
  return twitterClient.post('/tweets', { text: content }, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

// WRONG: Would use app credentials (not possible with OAuth 2.0)
async function publishTweet(content) {
  return twitterClient.post('/tweets', { text: content }, {
    headers: { Authorization: `Bearer ${TWITTER_APP_TOKEN}` }  // ❌ No such thing
  });
}
```

---

## 🎯 Key Takeaways

1. **App credentials (in .env)** = Your application's identity on each platform
2. **User tokens (in database)** = Individual brand's access to their own accounts
3. **Each brand is isolated** = No cross-contamination of data or tokens
4. **Scales to thousands of brands** = Single app deployment, unlimited user connections
5. **Security by design** = Tokens stored encrypted, never shared between users
6. **Automatic token management** = Refresh tokens keep access alive without user intervention

---

## 🛡️ Compliance & Privacy

### GDPR Compliance

**User data deletion:**
```javascript
// When user requests data deletion
router.delete('/account', verifyToken, async (req, res) => {
  // Revoke OAuth tokens
  await revokeTwitterToken(user.socialAccounts.twitter.accessToken);
  
  // Delete all user data
  await Post.deleteMany({ userId: req.userId });
  await User.findByIdAndDelete(req.userId);
  
  res.json({ message: 'Account deleted' });
});
```

### Token Scoping

**Request minimum permissions:**
```javascript
// Twitter scopes
'tweet.read tweet.write users.read offline.access'

// LinkedIn scopes  
'r_liteprofile w_member_social'

// Facebook scopes
'pages_manage_posts pages_read_engagement'
```

**Principle of least privilege:** Only request what you need for core functionality.

---

## 📞 Common Questions

**Q: Do I need separate app credentials for each brand?**
A: No! One set of app credentials supports unlimited brands.

**Q: Can Brand A access Brand B's tokens?**
A: No, tokens are stored per-user in the database with strict access control.

**Q: What if I hit rate limits?**
A: Rate limits are per-user-token, so each brand has independent quotas.

**Q: How do I add a new platform?**
A: Register one app with that platform, add Client ID/Secret to .env, implement OAuth flow. All users benefit.

**Q: Is this secure for enterprise clients?**
A: Yes, this is the standard OAuth 2.0 multi-tenant pattern used by major SaaS platforms.

---

**Summary:** You configure app-level OAuth once. Each brand connects their own accounts independently. Tokens are isolated and secure. This architecture scales to support your entire customer base. ✅
