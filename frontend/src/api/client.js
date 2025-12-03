import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error.response?.data || error;
  }
);

// Auth endpoints
export const auth = {
  register: (email, password) => 
    client.post('/auth/register', { email, password }),
  login: (email, password) => 
    client.post('/auth/login', { email, password }),
  me: () => client.get('/auth/me'),
  logout: () => client.post('/auth/logout')
};

// Brand endpoints
export const brands = {
  list: () => client.get('/brands'),
  create: (data) => client.post('/brands', data),
  get: (id) => client.get(`/brands/${id}`),
  update: (id, data) => client.put(`/brands/${id}`, data),
  delete: (id) => client.delete(`/brands/${id}`)
};

// Trend endpoints
export const trends = {
  list: (source) => client.get('/trends', { params: { source } }),
  search: (query) => client.get(`/trends/search/${query}`),
  refresh: () => client.post('/trends/refresh')
};

// Copy generation endpoints
export const copy = {
  generate: (data) => client.post('/copy/generate', data),
  variations: (data) => client.post('/copy/variations', data),
  list: (params) => client.get('/copy/posts', { params }),
  get: (id) => client.get(`/copy/posts/${id}`),
  update: (id, data) => client.put(`/copy/posts/${id}`, data),
  delete: (id) => client.delete(`/copy/posts/${id}`)
};

// Publishing endpoints
export const publishing = {
  publishMulti: (postId, platforms) => 
    client.post('/publish/multi/multi', { postId, platforms }),
  publishSingle: (postId, platform) =>
    client.post(`/publish/multi/platform/${platform}`, { postId }),
  getPerformance: (postId) => client.get(`/publish/multi/${postId}/performance`),
  syncMetrics: (postId) => client.post(`/publish/multi/sync-metrics/${postId}`)
};

// Post management
export const posts = {
  schedule: (postId, scheduledTime, platforms) =>
    client.post('/posts/schedule', { postId, scheduledTime, platforms }),
  getDrafts: () => client.get('/posts/drafts'),
  getScheduled: () => client.get('/posts/scheduled'),
  getPublished: () => client.get('/posts/published'),
  getAnalytics: (postId) => client.get(`/posts/${postId}/analytics`),
  getQueueStats: () => client.get('/posts/queue/stats'),
  getJobStatus: (jobId) => client.get(`/posts/queue/job/${jobId}`)
};

// Analytics endpoints
export const analytics = {
  track: () => client.post('/analytics/track'),
  getBrandDashboard: (brandId) => client.get(`/analytics/brand/${brandId}`),
  getUserAnalytics: () => client.get('/analytics/user'),
  getTopPosts: (limit) => client.get('/analytics/top-posts', { params: { limit } }),
  getTrends: () => client.get('/analytics/trends'),
  compare: (postIds) => client.post('/analytics/compare', { postIds })
};

// RL endpoints
export const rl = {
  getTrainingData: () => client.get('/rl/training-data'),
  trainWeekly: () => client.post('/rl/train-weekly'),
  analyzePost: (postId) => client.get(`/rl/post/${postId}/analysis`),
  calculateReward: (metrics, impressions) =>
    client.post('/rl/calculate-reward', { metrics, impressions })
};

export default client;
