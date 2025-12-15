# Bigness (social-medAI) – Running Locally on Windows

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas URI)
- Optional: Redis (later for jobs/caching)
- Android Studio (SDK/Platform Tools) for running React Native on Android

## Backend API

1. Configure environment:
   - Copy `backend/.env.example` to `backend/.env` and set values.

2. Install and run:

```powershell
Push-Location "C:\Users\myind\Documents\GitHub\social-medAI\backend"
npm install
npm run dev
Pop-Location
```

3. Configure environment (edit `backend/.env`):

```powershell
Copy-Item .env.example .env
# Edit .env and set:
# - MONGODB_URI (or use local default)
# - JWT_SECRET
# - NEWSAPI_KEY (optional for richer trends)
# - REDIS_URL (for trends cache)
# - GROQ_API_KEY (required for copy generation)
# - STABILITY_API_KEY (required for image generation)
# - CLOUDINARY_URL (required for image upload)
npm run dev
Pop-Location
```

- API health: http://localhost:4000/health

## Mobile App (Expo React Native)

1. Set API URL for mobile (optional; defaults to http://localhost:4000):
   - Create `mobile/.env` with:
     
```
EXPO_PUBLIC_API_URL=http://localhost:4000
```

2. Install and start:

```powershell
Push-Location "C:\Users\myind\Documents\GitHub\social-medAI\mobile"
npm install
npm start
Pop-Location
```

- In Expo, press `a` to launch Android emulator or scan QR for Expo Go.

### Connect Twitter/LinkedIn (OAuth via ngrok)

1. Start an ngrok tunnel to your backend:

```powershell
ngrok http --domain YOUR-NGROK-SUBDOMAIN.ngrok-free.app 4000
```

2. Set callback URLs in `backend/.env`:
- `TWITTER_REDIRECT_URI=https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app/api/v1/oauth/public/twitter/callback`
- `LINKEDIN_REDIRECT_URI=https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app/api/v1/oauth/public/linkedin/callback`
 - `FACEBOOK_REDIRECT_URI=https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app/api/v1/oauth/public/facebook/callback`

3. In the RN app, from Onboarding choose "Connect Accounts" and follow provider prompts in the browser. After approving, the callback stores tokens and shows a "connected" message. Tap "Refresh Status" to confirm. Generate/Preview screens display connected account badges (TW/LI/FB/IG).

## First Test
1. Register a user via POST: `POST /api/v1/auth/register` with `{ email, password }`
2. In the app, login with same credentials.
3. Tap "Create Demo Brand".
4. Tap "Generate Draft" to create content via Groq/Stability (requires keys). Falls back if missing.
5. Tap "Load Trends" to hit `/api/v1/trends` (uses NewsAPI/Reddit + Redis cache).

## Next Steps
- Implement scheduled TrendDetector job and per-industry cache keys (Twitter/NewsAPI/Reddit).
- Hook Groq LLM + Stability AI pipelines (now wired; provide keys for full output).
- Add publish endpoints for Twitter/LinkedIn with per-user tokens.
- Build brand onboarding screens and influencer flows in mobile.
