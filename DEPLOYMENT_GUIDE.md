# Deployment Guide - Bigness Social Media Platform

Complete deployment guide for backend, frontend, and mobile applications.

## 📋 Pre-Deployment Checklist

- [ ] All OAuth credentials configured
- [ ] Environment variables set
- [ ] Database migrations completed
- [ ] Redis instance running
- [ ] Test all API endpoints
- [ ] Security audit completed
- [ ] SSL certificates obtained
- [ ] Domain DNS configured

---

## 🔧 Backend Deployment (Node.js/Express)

### Option 1: Deploy to Railway.app (Recommended for Quick Setup)

1. **Create Railway Account**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize Project**
   ```bash
   cd backend
   railway init
   ```

3. **Add Environment Variables**
   - Go to Railway dashboard
   - Click your project → Variables
   - Add all variables from `.env`

4. **Deploy**
   ```bash
   railway up
   ```

5. **Add Custom Domain** (Optional)
   - Railway dashboard → Settings → Domains
   - Add custom domain and configure DNS

### Option 2: Deploy to Render.com

1. **Create account** at https://render.com

2. **Create New Web Service**
   - Connect GitHub repository
   - Select `backend` directory
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Configure Environment**
   - Add all environment variables from `.env`
   - Set `NODE_ENV=production`

4. **Add Redis**
   - Dashboard → New → Redis
   - Copy Redis URL to `REDIS_URL` variable

5. **Deploy**
   - Click "Create Web Service"
   - Auto-deploys on every git push

### Option 3: Deploy to AWS EC2

1. **Launch EC2 Instance**
   ```bash
   # Amazon Linux 2 or Ubuntu 22.04
   # Instance type: t3.medium (minimum)
   ```

2. **Connect via SSH**
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

3. **Install Node.js**
   ```bash
   curl -sL https://rpm.nodesource.com/setup_20.x | sudo bash -
   sudo yum install -y nodejs
   ```

4. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

5. **Clone Repository**
   ```bash
   git clone https://github.com/yourusername/social-medAI.git
   cd social-medAI/backend
   npm install
   ```

6. **Configure Environment**
   ```bash
   nano .env
   # Paste all environment variables
   ```

7. **Start with PM2**
   ```bash
   pm2 start server.js --name bigness-api
   pm2 startup
   pm2 save
   ```

8. **Configure Nginx**
   ```bash
   sudo yum install nginx
   sudo nano /etc/nginx/conf.d/bigness.conf
   ```

   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

9. **Setup SSL with Let's Encrypt**
   ```bash
   sudo yum install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

---

## 🌐 Frontend Deployment (React)

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure Environment**
   ```bash
   cd frontend
   # Create .env.production
   echo "REACT_APP_API_URL=https://api.yourdomain.com/api" > .env.production
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Domain**
   - Vercel dashboard → Settings → Domains
   - Add custom domain

### Option 2: Netlify

1. **Build Application**
   ```bash
   cd frontend
   npm run build
   ```

2. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=build
   ```

4. **Configure Environment Variables**
   - Netlify dashboard → Site settings → Environment variables
   - Add `REACT_APP_API_URL`

### Option 3: AWS S3 + CloudFront

1. **Build Application**
   ```bash
   cd frontend
   npm run build
   ```

2. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://bigness-frontend
   aws s3 website s3://bigness-frontend --index-document index.html
   ```

3. **Upload Build**
   ```bash
   aws s3 sync build/ s3://bigness-frontend
   ```

4. **Configure CloudFront**
   - Create CloudFront distribution
   - Origin: S3 bucket
   - Enable HTTPS
   - Add custom domain

---

## 📱 Mobile Deployment (Flutter)

### Android (Google Play Store)

1. **Configure App Signing**
   ```bash
   cd bigness_mobile/android
   # Generate keystore
   keytool -genkey -v -keystore bigness-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias bigness
   ```

2. **Update build.gradle**
   ```gradle
   // android/app/build.gradle
   signingConfigs {
       release {
           storeFile file('bigness-release.jks')
           storePassword 'your_password'
           keyAlias 'bigness'
           keyPassword 'your_password'
       }
   }
   ```

3. **Build Release APK**
   ```bash
   flutter build apk --release
   ```

4. **Build App Bundle (AAB)**
   ```bash
   flutter build appbundle --release
   ```

5. **Upload to Play Store**
   - Create app in Google Play Console
   - Fill in app details, screenshots, description
   - Upload AAB file
   - Submit for review

### iOS (App Store)

1. **Configure Xcode**
   ```bash
   cd bigness_mobile/ios
   open Runner.xcworkspace
   ```

2. **Update Bundle ID**
   - In Xcode: Runner → General → Identity
   - Set unique Bundle Identifier

3. **Configure Signing**
   - Xcode → Signing & Capabilities
   - Select your development team
   - Enable automatic signing

4. **Build Archive**
   ```bash
   flutter build ios --release
   ```

5. **Upload to App Store**
   - Xcode → Product → Archive
   - Distribute App → App Store Connect
   - Upload

6. **Submit for Review**
   - Go to App Store Connect
   - Fill in app metadata
   - Add screenshots
   - Submit for review

---

## 🔒 Security Hardening

### Backend Security

1. **Enable CORS**
   ```javascript
   // Already in server.js
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```

2. **Rate Limiting**
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api/', limiter);
   ```

3. **Helmet for Headers**
   ```bash
   npm install helmet
   ```

   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

4. **Environment Variables**
   - Never commit `.env` files
   - Use secrets managers (AWS Secrets Manager, Vault)
   - Rotate credentials regularly

### Database Security

1. **MongoDB Atlas**
   - Enable IP whitelist
   - Use strong passwords
   - Enable authentication
   - Regular backups

2. **Redis Security**
   ```bash
   # requirepass in redis.conf
   requirepass your_strong_password
   ```

### API Security

1. **JWT Token Expiry**
   ```javascript
   // Already configured in auth.js
   jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
   ```

2. **Input Validation**
   ```bash
   npm install express-validator
   ```

3. **SQL Injection Prevention**
   - Using Mongoose (already protected)
   - Never use string concatenation for queries

---

## 📊 Monitoring & Logging

### Sentry (Already Integrated)

1. **Verify Sentry**
   - Check `SENTRY_DSN` is set
   - Test error reporting:
   ```bash
   curl http://localhost:5000/api/test-error
   ```

2. **Configure Alerts**
   - Sentry dashboard → Alerts
   - Set up email/Slack notifications

### Application Performance Monitoring

1. **New Relic** (Optional)
   ```bash
   npm install newrelic
   ```

2. **DataDog** (Optional)
   ```bash
   npm install dd-trace
   ```

### Logging

1. **Winston Logger**
   ```bash
   npm install winston
   ```

   ```javascript
   const winston = require('winston');
   
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });
   ```

---

## 🚀 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'

    - name: Install Dependencies
      run: |
        cd backend
        npm ci

    - name: Run Tests
      run: |
        cd backend
        npm test

    - name: Deploy to Railway
      run: |
        npm install -g @railway/cli
        railway up --service backend
      env:
        RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 📈 Performance Optimization

### Backend

1. **Enable Compression**
   ```bash
   npm install compression
   ```

   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Redis Caching** (Already implemented)
   - Cache trends for 30 minutes
   - Cache posts for 5 minutes

3. **Database Indexing**
   ```javascript
   // Add indexes in models
   trendSchema.index({ score: -1, createdAt: -1 });
   postSchema.index({ brandProfileId: 1, status: 1 });
   ```

### Frontend

1. **Code Splitting**
   ```javascript
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   ```

2. **Image Optimization**
   - Use WebP format
   - Lazy load images
   - Compress images

3. **Bundle Analysis**
   ```bash
   npm install --save-dev webpack-bundle-analyzer
   npm run build -- --stats
   ```

---

## 🔄 Backup Strategy

### Database Backups

1. **MongoDB Atlas**
   - Enable automatic backups (daily)
   - Retention: 30 days minimum

2. **Manual Backup**
   ```bash
   mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/bigness"
   ```

### Redis Backups

```bash
# Automatic snapshots
redis-cli BGSAVE
```

### Code Backups

- GitHub repository (already configured)
- Enable branch protection
- Require pull request reviews

---

## 🆘 Rollback Procedures

### Backend Rollback

1. **Railway/Render**
   - Dashboard → Deployments
   - Click previous deployment
   - Redeploy

2. **PM2 Rollback**
   ```bash
   pm2 delete bigness-api
   git checkout previous-commit
   npm install
   pm2 start server.js --name bigness-api
   ```

### Frontend Rollback

1. **Vercel**
   ```bash
   vercel rollback
   ```

2. **Manual**
   ```bash
   git revert HEAD
   vercel --prod
   ```

---

## 📞 Support & Maintenance

### Health Monitoring

```bash
# Check API health
curl https://api.yourdomain.com/api/health/detailed

# Check job status
curl https://api.yourdomain.com/api/health/jobs
```

### Regular Maintenance Tasks

- [ ] Weekly: Review error logs
- [ ] Monthly: Update dependencies
- [ ] Monthly: Rotate OAuth tokens
- [ ] Quarterly: Security audit
- [ ] Quarterly: Performance review

---

## 🎯 Post-Deployment Checklist

- [ ] All services running
- [ ] SSL certificates valid
- [ ] OAuth flows working
- [ ] Background jobs executing
- [ ] Monitoring alerts configured
- [ ] Backup strategy implemented
- [ ] Documentation updated
- [ ] Team notified
- [ ] Load testing completed
- [ ] Incident response plan ready
