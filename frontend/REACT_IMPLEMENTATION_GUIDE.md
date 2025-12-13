# Bigness React Frontend - Complete Implementation Guide

## Project Setup

```bash
cd frontend
npx create-react-app . --template typescript
npm install axios react-router-dom recharts @headlessui/react @heroicons/react date-fns
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Directory Structure

```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Spinner.tsx
│   │   ├── dashboard/
│   │   │   ├── AnalyticsChart.tsx
│   │   │   ├── MetricsCard.tsx
│   │   │   ├── PostsTable.tsx
│   │   │   └── TrendsList.tsx
│   │   ├── posts/
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostEditor.tsx
│   │   │   └── PostPreview.tsx
│   │   ├── ads/
│   │   │   ├── CampaignCard.tsx
│   │   │   ├── CampaignForm.tsx
│   │   │   └── ROIChart.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Layout.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Trends.tsx
│   │   ├── Posts.tsx
│   │   ├── CreatePost.tsx
│   │   ├── Analytics.tsx
│   │   ├── AdsCampaigns.tsx
│   │   ├── Settings.tsx
│   │   └── SocialAccounts.tsx
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── posts.ts
│   │   ├── trends.ts
│   │   └── ads.ts
│   ├── store/
│   │   ├── authSlice.ts
│   │   ├── postsSlice.ts
│   │   ├── trendsSlice.ts
│   │   └── store.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── post.ts
│   │   ├── trend.ts
│   │   └── user.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── validators.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── routes.tsx
```

## Core Files Implementation

### 1. API Service (`src/services/api.ts`)

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  get(url: string, config?: AxiosRequestConfig) {
    return this.client.get(url, config);
  }

  post(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post(url, data, config);
  }

  put(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.put(url, data, config);
  }

  delete(url: string, config?: AxiosRequestConfig) {
    return this.client.delete(url, config);
  }
}

export default new ApiService();
```

### 2. Dashboard Page (`src/pages/Dashboard.tsx`)

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MetricsCard from '../components/dashboard/MetricsCard';
import AnalyticsChart from '../components/dashboard/AnalyticsChart';
import PostsTable from '../components/dashboard/PostsTable';
import TrendsList from '../components/dashboard/TrendsList';
import api from '../services/api';

interface DashboardMetrics {
  totalPosts: number;
  publishedPosts: number;
  totalImpressions: number;
  avgEngagementRate: number;
  activeCampaigns: number;
  totalAdSpend: number;
}

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsData, postsData, trendsData] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/posts/published?limit=5'),
        api.get('/trends?limit=10'),
      ]);

      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your content performance overview.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricsCard
          title="Total Posts"
          value={metrics?.totalPosts || 0}
          icon="📝"
          trend="+12%"
          trendUp={true}
        />
        <MetricsCard
          title="Published"
          value={metrics?.publishedPosts || 0}
          icon="🚀"
          trend="+8%"
          trendUp={true}
        />
        <MetricsCard
          title="Impressions"
          value={metrics?.totalImpressions.toLocaleString() || 0}
          icon="👁️"
          trend="+23%"
          trendUp={true}
        />
        <MetricsCard
          title="Engagement Rate"
          value={`${(metrics?.avgEngagementRate * 100).toFixed(1)}%` || '0%'}
          icon="💚"
          trend="+5.2%"
          trendUp={true}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Engagement Over Time</h2>
          <AnalyticsChart />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Trending Topics</h2>
          <TrendsList />
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Posts</h2>
          <button
            onClick={() => navigate('/posts')}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            View All →
          </button>
        </div>
        <PostsTable />
      </div>
    </div>
  );
};

export default Dashboard;
```

### 3. Analytics Chart Component (`src/components/dashboard/AnalyticsChart.tsx`)

```typescript
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const mockData = [
  { date: '2024-11-01', likes: 120, comments: 45, shares: 23 },
  { date: '2024-11-08', likes: 156, comments: 58, shares: 31 },
  { date: '2024-11-15', likes: 189, comments: 67, shares: 42 },
  { date: '2024-11-22', likes: 234, comments: 89, shares: 56 },
  { date: '2024-11-29', likes: 298, comments: 112, shares: 78 },
  { date: '2024-12-06', likes: 345, comments: 134, shares: 91 },
];

const AnalyticsChart: React.FC = () => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={mockData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="likes" stroke="#10B981" strokeWidth={2} />
        <Line type="monotone" dataKey="comments" stroke="#3B82F6" strokeWidth={2} />
        <Line type="monotone" dataKey="shares" stroke="#F59E0B" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AnalyticsChart;
```

### 4. Create Post Page (`src/pages/CreatePost.tsx`)

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Trend {
  id: string;
  title: string;
  description: string;
  source: string;
  score: number;
}

const CreatePost: React.FC = () => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [platform, setPlatform] = useState('twitter');
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      const data = await api.get('/trends?limit=20');
      setTrends(data.trends);
    } catch (error) {
      console.error('Error loading trends:', error);
    }
  };

  const handleGenerateCopy = async () => {
    if (!selectedTrend) return;

    try {
      setLoading(true);
      const result = await api.post('/copy/generate', {
        trendId: selectedTrend.id,
        platform,
      });

      setGeneratedCopy(result.copy);
      
      // Auto-generate image
      const imageResult = await api.post('/images/generate', {
        postId: result.postId,
        prompt: result.copy.substring(0, 100),
      });

      setImageUrl(imageResult.imageUrl);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      await api.post('/publish/multi/multi', {
        postId: selectedTrend.id,
        platforms: [platform],
        scheduleTime: null, // Publish immediately
      });

      alert('Post published successfully!');
      navigate('/posts');
    } catch (error) {
      console.error('Error publishing:', error);
      alert('Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Post</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Select Trending Topic</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {trends.map((trend) => (
              <div
                key={trend.id}
                onClick={() => setSelectedTrend(trend)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedTrend?.id === trend.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <h3 className="font-semibold">{trend.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{trend.description}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span className="mr-3">🔥 {trend.score}</span>
                  <span>{trend.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Post Generation */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Generate Content</h2>

          {/* Platform Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="twitter">Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateCopy}
            disabled={!selectedTrend || loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {loading ? 'Generating...' : 'Generate Copy & Image'}
          </button>

          {/* Generated Content */}
          {generatedCopy && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Generated Copy</label>
                <textarea
                  value={generatedCopy}
                  onChange={(e) => setGeneratedCopy(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              {imageUrl && (
                <div>
                  <label className="block text-sm font-medium mb-2">Generated Image</label>
                  <img src={imageUrl} alt="Generated" className="w-full rounded-lg" />
                </div>
              )}

              <button
                onClick={handlePublish}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Publish Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
```

### 5. Ads Campaigns Page (`src/pages/AdsCampaigns.tsx`)

```typescript
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import CampaignCard from '../components/ads/CampaignCard';
import ROIChart from '../components/ads/ROIChart';

interface Campaign {
  _id: string;
  campaignName: string;
  platform: 'meta' | 'google';
  status: string;
  budget: { daily: number; total: number };
  metrics: {
    impressions: number;
    clicks: number;
    spend: number;
  };
  createdAt: string;
}

const AdsCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
    loadPerformance();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await api.get('/ads/campaigns');
      setCampaigns(data.campaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPerformance = async () => {
    try {
      const data = await api.get('/ads/performance');
      setPerformance(data);
    } catch (error) {
      console.error('Error loading performance:', error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Ad Campaigns</h1>

      {/* Performance Summary */}
      {performance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Total Campaigns</h3>
            <p className="text-3xl font-bold mt-2">{performance.summary.totalCampaigns}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Total Spend</h3>
            <p className="text-3xl font-bold mt-2">${performance.summary.totalSpend.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Total Impressions</h3>
            <p className="text-3xl font-bold mt-2">{performance.summary.totalImpressions.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-600 text-sm font-medium">Avg CTR</h3>
            <p className="text-3xl font-bold mt-2">{performance.summary.avgCTR.toFixed(2)}%</p>
          </div>
        </div>
      )}

      {/* ROI Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Performance Over Time</h2>
        <ROIChart />
      </div>

      {/* Campaigns List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign._id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
};

export default AdsCampaigns;
```

## Environment Variables

Create `.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

## Tailwind Configuration

`tailwind.config.js`:

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#10B981',
        secondary: '#3B82F6',
      },
    },
  },
  plugins: [],
};
```

## Package Scripts

Update `package.json`:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

## Deployment

### Vercel Deployment

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Environment Variables (Vercel)

Set in Vercel dashboard:
- `REACT_APP_API_URL`: Production API URL

## Testing

```bash
npm install -D @testing-library/react @testing-library/jest-dom
npm test
```

## Build for Production

```bash
npm run build
```

Output goes to `build/` directory.
