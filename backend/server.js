require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const redis = require('redis');

// Import models
const { User, BrandProfile, Trend, GeneratedPost } = require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'checking...',
      redis: 'checking...'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    console.log('✅ User model loaded');
    console.log('✅ BrandProfile model loaded');
    console.log('✅ Trend model loaded');
    console.log('✅ GeneratedPost model loaded');
  })
  .catch(err => console.error('❌ MongoDB error:', err.message));

// Connect to Redis
const redisClient = redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect()
  .then(() => console.log('✅ Redis connected'))
  .catch(err => console.error('❌ Redis error:', err.message));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
