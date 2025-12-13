# OAuth Setup Guide - Bigness Social Media Platform

Complete guide to configure OAuth for all social platforms and advertising APIs.

## 🔐 Important: App-Level vs User-Level Credentials

**This guide sets up APP-LEVEL OAuth credentials** that enable your application to use OAuth flows.

### Architecture Overview:

**App-Level Credentials (in .env):**
- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` - Your app's credentials
- `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` - Your app's credentials
- `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` - Your app's credentials

These credentials identify **YOUR APPLICATION** to each platform. They enable the OAuth flow but don't give access to any user's account.

**User-Level Tokens (stored in MongoDB User.socialAccounts):**
- `accessToken` - Unique to each user/brand
- `refreshToken` - Unique to each user/brand
- `userId` / `username` - User's platform identity

When a brand connects their Twitter account:
1. They click "Connect Twitter" in your app
2. Your app uses `TWITTER_CLIENT_ID` to redirect them to Twitter
3. They authorize YOUR APP to access THEIR account
4. Twitter returns tokens specific to THAT USER
5. Your app stores those tokens in that user's database record
6. When publishing, you use THAT USER's tokens, not app credentials

**This is correct multi-tenant architecture:** Each brand manages their own social accounts independently.

## Table of Contents
1. [Twitter OAuth 2.0](#twitter-oauth-20)
2. [LinkedIn OAuth 2.0](#linkedin-oauth-20)
3. [Facebook OAuth 2.0](#facebook-oauth-20)
4. [Instagram Business API](#instagram-business-api)
5. [Meta Ads API](#meta-ads-api)
6. [Google Ads API](#google-ads-api)
7. [Environment Variables Summary](#environment-variables-summary)

---

## Twitter OAuth 2.0

### 1. Create Twitter Developer Account
- Go to https://developer.twitter.com/en/portal/dashboard
- Sign in with your Twitter account
- Apply for Developer access (select "Making a bot" or "Building tools for Twitter users")

### 2. Create a New App
- Click "Create App" or "Create Project"
- Fill in app details:
  - **App name**: Bigness Social AI
  - **Description**: AI-powered social media content generator
  - **Website**: Your domain or http://localhost:5000

### 3. Enable OAuth 2.0
- Go to **App Settings** → **User authentication settings**
- Click **Set up**
- Select **OAuth 2.0** as authentication type
- **Type of App**: Web App
- **Callback URL**: `http://localhost:5000/api/social-auth/twitter/callback`
  - For production: `https://yourdomain.com/api/social-auth/twitter/callback`
- **Website URL**: Your website
- **Scopes**: Select:
  - `tweet.read`
  - `tweet.write`
  - `users.read`
  - `offline.access` (for refresh tokens)

### 4. Get Credentials
- Copy **Client ID** → Set as `TWITTER_CLIENT_ID`
- Copy **Client Secret** → Set as `TWITTER_CLIENT_SECRET`

### 5. Update .env
```env
TWITTER_CLIENT_ID=your_client_id_from_step_4
TWITTER_CLIENT_SECRET=your_client_secret_from_step_4
```

---

## LinkedIn OAuth 2.0

### 1. Create LinkedIn App
- Go to https://www.linkedin.com/developers/apps
- Click **Create app**
- Fill in details:
  - **App name**: Bigness
  - **LinkedIn Page**: Your company page (create one if needed)
  - **Privacy policy URL**: Your privacy policy
  - **App logo**: Upload a logo

### 2. Get Credentials
- Go to **Auth** tab
- Copy **Client ID** → Set as `LINKEDIN_CLIENT_ID`
- Copy **Client Secret** → Set as `LINKEDIN_CLIENT_SECRET`

### 3. Configure OAuth 2.0
- In **Auth** tab, add **Redirect URLs**:
  - Development: `http://localhost:5000/api/social-auth/linkedin/callback`
  - Production: `https://yourdomain.com/api/social-auth/linkedin/callback`

### 4. Request API Access
- Go to **Products** tab
- Request access to:
  - **Sign In with LinkedIn using OpenID Connect**
  - **Share on LinkedIn** (for posting)
  - **Advertising API** (if using LinkedIn Ads)

### 5. Update .env
```env
LINKEDIN_CLIENT_ID=your_client_id_from_step_2
LINKEDIN_CLIENT_SECRET=your_client_secret_from_step_2
```

---

## Facebook OAuth 2.0

### 1. Create Facebook App
- Go to https://developers.facebook.com/apps/
- Click **Create App**
- Select **Business** type
- Fill in details:
  - **App name**: Bigness
  - **Contact email**: Your email

### 2. Add Facebook Login Product
- In app dashboard, click **Add Product**
- Select **Facebook Login** → Click **Set Up**
- Choose **Web** platform

### 3. Configure OAuth Settings
- Go to **Facebook Login** → **Settings**
- Add **Valid OAuth Redirect URIs**:
  - Development: `http://localhost:5000/api/social-auth/facebook/callback`
  - Production: `https://yourdomain.com/api/social-auth/facebook/callback`

### 4. Get Credentials
- Go to **Settings** → **Basic**
- Copy **App ID** → Set as `FACEBOOK_APP_ID`
- Copy **App Secret** → Set as `FACEBOOK_APP_SECRET`

### 5. Request Permissions
- Go to **App Review** → **Permissions and Features**
- Request these permissions:
  - `pages_show_list` - List user's pages
  - `pages_read_engagement` - Read page engagement
  - `pages_manage_posts` - Publish to pages
  - `pages_read_user_content` - Read page content
  - `instagram_basic` - Instagram basic access
  - `instagram_content_publish` - Post to Instagram

### 6. Add Test Users (Development)
- Go to **Roles** → **Test Users**
- Add test users for development

### 7. Update .env
```env
FACEBOOK_APP_ID=your_app_id_from_step_4
FACEBOOK_APP_SECRET=your_app_secret_from_step_4
```

---

## Instagram Business API

Instagram API access is through Facebook. Follow the Facebook setup above, then:

### 1. Prerequisites
- Facebook Page connected to Instagram Business Account
- Instagram account must be a **Business** or **Creator** account

### 2. Convert to Business Account
- Open Instagram app
- Go to **Settings** → **Account**
- Tap **Switch to Professional Account**
- Select **Business**
- Connect to your Facebook Page

### 3. Link in Facebook
- Go to your Facebook Page
- **Settings** → **Instagram**
- Click **Connect Account**
- Log in to Instagram

### 4. Test Connection
- Use Facebook Graph API Explorer: https://developers.facebook.com/tools/explorer/
- Get Page Access Token
- Call: `GET /me/accounts` to get page ID
- Call: `GET /{page-id}?fields=instagram_business_account` to verify connection

### 5. No Additional .env Needed
Instagram uses the same Facebook credentials.

---

## Meta Ads API

For automated ad campaign creation on Facebook/Instagram.

### 1. Prerequisites
- Facebook Business Manager account
- Ad account created
- App with **Marketing API** access

### 2. Add Marketing API
- In Facebook App dashboard
- Click **Add Product** → **Marketing API**

### 3. Get Ad Account ID
- Go to https://business.facebook.com/settings/ad-accounts
- Select your ad account
- Copy the **Ad Account ID** (format: `act_123456789`)

### 4. Generate Access Token
- Go to https://developers.facebook.com/tools/explorer/
- Select your app
- Add permissions:
  - `ads_management`
  - `ads_read`
  - `business_management`
- Click **Generate Access Token**
- Get **Long-Lived Token**:
  ```bash
  curl -i -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id={FACEBOOK_APP_ID}&client_secret={FACEBOOK_APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}"
  ```

### 5. Update .env
```env
META_ADS_ACCESS_TOKEN=your_long_lived_access_token
META_ADS_ACCOUNT_ID=act_your_ad_account_id
```

---

## Google Ads API

For automated Google Ads campaigns.

### 1. Create Google Cloud Project
- Go to https://console.cloud.google.com/
- Click **Create Project**
- Name: Bigness Ads Integration

### 2. Enable Google Ads API
- In project dashboard, go to **APIs & Services** → **Library**
- Search for "Google Ads API"
- Click **Enable**

### 3. Create OAuth 2.0 Credentials
- Go to **APIs & Services** → **Credentials**
- Click **Create Credentials** → **OAuth client ID**
- Application type: **Web application**
- **Authorized redirect URIs**:
  - Development: `http://localhost:5000/api/social-auth/google-ads/callback`
  - Production: `https://yourdomain.com/api/social-auth/google-ads/callback`
- Copy **Client ID** and **Client Secret**

### 4. Apply for Developer Token
- Go to https://ads.google.com/
- Click **Tools & Settings** → **API Center**
- Apply for **Developer Token**
- Fill in the application form
- Wait for approval (can take 24-48 hours)

### 5. Get Customer ID
- In Google Ads account, find your **Customer ID** (10-digit number at top-right)
- Format: `123-456-7890` → Use as `1234567890`

### 6. Update .env
```env
GOOGLE_ADS_CLIENT_ID=your_client_id_from_step_3
GOOGLE_ADS_CLIENT_SECRET=your_client_secret_from_step_3
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_from_step_4
GOOGLE_ADS_CUSTOMER_ID=your_customer_id_without_hyphens
```

---

## Environment Variables Summary

Your complete `.env` file should look like this:

```env
# Existing variables
MONGODB_URI=mongodb+srv://...
PORT=5000
REDIS_URL=redis://...
GROQ_API_KEY=gsk_...
CLOUDINARY_URL=cloudinary://...
STABILITY_API_KEY=sk-...
NEWSAPI_KEY=...
SENTRY_DSN=https://...
JWT_SECRET=...

# OAuth Configuration
FRONTEND_URL=http://localhost:3000

# Twitter OAuth 2.0
TWITTER_CLIENT_ID=your_twitter_oauth2_client_id
TWITTER_CLIENT_SECRET=your_twitter_oauth2_client_secret

# LinkedIn OAuth 2.0
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Facebook OAuth 2.0 (also used for Instagram)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Meta Ads API
META_ADS_ACCESS_TOKEN=your_long_lived_token
META_ADS_ACCOUNT_ID=act_your_ad_account_id

# Google Ads API
GOOGLE_ADS_CLIENT_ID=your_google_ads_client_id
GOOGLE_ADS_CLIENT_SECRET=your_google_ads_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token
GOOGLE_ADS_CUSTOMER_ID=your_customer_id
```

---

## Testing OAuth Flows

### 1. Start Backend Server
```bash
cd backend
npm start
```

### 2. Test Each Platform

#### Twitter
```bash
# Open in browser
http://localhost:5000/api/social-auth/twitter/connect
```

#### LinkedIn
```bash
# Open in browser
http://localhost:5000/api/social-auth/linkedin/connect
```

#### Facebook
```bash
# Open in browser
http://localhost:5000/api/social-auth/facebook/connect
```

#### Instagram (through Facebook)
```bash
# First connect Facebook, then Instagram will be available
http://localhost:5000/api/social-auth/facebook/connect
```

### 3. Verify Connection
```bash
# Check authentication status
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/social-auth/status
```

Expected response:
```json
{
  "twitter": { "connected": true, "username": "@yourhandle" },
  "linkedin": { "connected": true, "userId": "..." },
  "facebook": { "connected": true, "pageId": "..." },
  "instagram": { "connected": true, "accountId": "..." }
}
```

---

## Troubleshooting

### Twitter Issues
- **Error: invalid_client** → Check Client ID/Secret are correct
- **Error: redirect_uri_mismatch** → Ensure callback URL matches exactly in Twitter app settings
- **No refresh token** → Enable "offline.access" scope

### LinkedIn Issues
- **Error: invalid_redirect_uri** → Add exact callback URL in LinkedIn app Auth tab
- **Cannot post** → Request "Share on LinkedIn" product access
- **401 Unauthorized** → Token may have expired, reconnect account

### Facebook/Instagram Issues
- **Error: Invalid OAuth access token** → Generate new long-lived token
- **Cannot find Instagram account** → Ensure page is linked to Instagram Business account
- **Permissions denied** → Request specific permissions in App Review

### Meta Ads Issues
- **Error: Insufficient permissions** → Add ads_management permission
- **Invalid ad account** → Verify ad account ID format (must include 'act_')

### Google Ads Issues
- **Developer token not approved** → Wait for approval or use test account
- **Invalid customer ID** → Remove hyphens from customer ID
- **OAuth error** → Check redirect URI matches exactly

---

## Security Best Practices

1. **Never commit .env file** - Add to `.gitignore`
2. **Use environment-specific configs** - Different tokens for dev/staging/prod
3. **Rotate tokens regularly** - Refresh tokens every 60-90 days
4. **Store tokens encrypted** - Backend already encrypts in MongoDB
5. **Use HTTPS in production** - All OAuth callbacks must use HTTPS
6. **Implement rate limiting** - Protect OAuth endpoints from abuse
7. **Monitor token usage** - Set up alerts for failed authentications

---

## Next Steps After OAuth Setup

1. ✅ Configure all OAuth credentials in `.env`
2. ✅ Test each platform connection
3. ✅ Create test posts on each platform
4. ✅ Verify engagement tracking works
5. ✅ Test ads automation (wait 24h for engagement data)
6. ✅ Set up production environment with HTTPS
7. ✅ Deploy to production server
8. ✅ Update OAuth callback URLs to production domain

## Support Resources

- **Twitter API**: https://developer.twitter.com/en/docs
- **LinkedIn API**: https://docs.microsoft.com/en-us/linkedin/
- **Facebook API**: https://developers.facebook.com/docs/graph-api
- **Instagram API**: https://developers.facebook.com/docs/instagram-api
- **Meta Ads**: https://developers.facebook.com/docs/marketing-apis
- **Google Ads**: https://developers.google.com/google-ads/api/docs/start
