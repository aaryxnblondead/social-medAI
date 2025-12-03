const axios = require('axios');
const { Trend } = require('../models');

class TrendDetectorService {
  constructor() {
    this.twitterApiUrl = 'https://api.twitter.com/2';
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN;
    this.newsApiUrl = 'https://newsapi.org/v2';
    this.newsApiKey = process.env.NEWSAPI_KEY;
  }

  // Fetch trending topics from Twitter
  async fetchTwitterTrends() {
    try {
      console.log('🔍 Fetching Twitter trends...');

      // Fetch tweets about tech, AI, startups
      const response = await axios.get(
        `${this.twitterApiUrl}/tweets/search/recent?query=tech OR AI OR startup&max_results=100`,
        {
          headers: {
            Authorization: `Bearer ${this.bearerToken}`
          },
          params: {
            'tweet.fields': 'created_at,public_metrics',
            'expansions': 'author_id',
            'user.fields': 'username'
          }
        }
      );

      const trends = [];
      if (response.data.data) {
        response.data.data.forEach(tweet => {
          trends.push({
            title: tweet.text.substring(0, 100),
            source: 'twitter',
            url: `https://twitter.com/i/web/status/${tweet.id}`,
            engagement: tweet.public_metrics?.like_count || 0,
            score: (tweet.public_metrics?.like_count || 0) + 
                   (tweet.public_metrics?.retweet_count || 0)
          });
        });
      }

      console.log(`✅ Found ${trends.length} Twitter trends`);
      return trends;
    } catch (error) {
      console.error('❌ Twitter fetch error:', error.response?.data || error.message);
      return [];
    }
  }

  // Fetch trending news from NewsAPI
  async fetchNewsTrends() {
    try {
      console.log('🔍 Fetching news trends...');

      const response = await axios.get(`${this.newsApiUrl}/top-headlines`, {
        params: {
          category: 'technology',
          sortBy: 'popularity',
          pageSize: 20,
          apiKey: this.newsApiKey
        }
      });

      const trends = [];
      if (response.data.articles) {
        response.data.articles.forEach(article => {
          trends.push({
            title: article.title,
            description: article.description,
            source: 'newsapi',
            url: article.url,
            imageUrl: article.urlToImage,
            publishedAt: article.publishedAt,
            score: 50 // Base score for news
          });
        });
      }

      console.log(`✅ Found ${trends.length} news trends`);
      return trends;
    } catch (error) {
      console.error('❌ NewsAPI fetch error:', error.response?.data || error.message);
      return [];
    }
  }

  // Combine and save all trends to database
  async detectAndSaveTrends() {
    try {
      console.log('📊 Starting trend detection...');

      // Fetch from both sources
      const twitterTrends = await this.fetchTwitterTrends();
      const newsTrends = await this.fetchNewsTrends();

      const allTrends = [...twitterTrends, ...newsTrends];

      if (allTrends.length === 0) {
        console.log('⚠️ No trends found');
        return [];
      }

      // Clear old trends (older than 24 hours)
      await Trend.deleteMany({
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      // Save new trends
      const savedTrends = await Trend.insertMany(
        allTrends.map(trend => ({
          ...trend,
          createdAt: new Date()
        }))
      );

      console.log(`✅ Saved ${savedTrends.length} trends to database`);
      return savedTrends;
    } catch (error) {
      console.error('❌ Trend detection error:', error.message);
      return [];
    }
  }

  // Get all current trends from database
  async getCurrentTrends(limit = 50) {
    try {
      const trends = await Trend.find()
        .sort({ score: -1, createdAt: -1 })
        .limit(limit);

      return trends;
    } catch (error) {
      console.error('❌ Get trends error:', error.message);
      return [];
    }
  }

  // Get trends by source
  async getTrendsBySource(source, limit = 20) {
    try {
      const trends = await Trend.find({ source })
        .sort({ score: -1 })
        .limit(limit);

      return trends;
    } catch (error) {
      console.error('❌ Get source trends error:', error.message);
      return [];
    }
  }
}

module.exports = new TrendDetectorService();
