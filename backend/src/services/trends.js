import axios from 'axios';
import crypto from 'crypto';
import { getRedis } from '../util/redis.js';

const CATEGORY_PROFILES = {
  technology: { reddit: ['technology', 'MachineLearning', 'Futurology'], hnQuery: 'AI', newsCategory: 'technology' },
  culture: { reddit: ['PopCulture', 'television', 'entertainment'], hnQuery: 'design', newsCategory: 'entertainment' },
  finance: { reddit: ['finance', 'investing', 'Fintech'], hnQuery: 'fintech', newsCategory: 'business' },
  travel: { reddit: ['travel', 'solotravel', 'digitalnomad'], hnQuery: 'travel', newsCategory: 'general', newsQuery: 'travel trends' },
  business: { reddit: ['Entrepreneur', 'marketing', 'startup'], hnQuery: 'marketing', newsCategory: 'business' },
  general: { reddit: ['worldnews', 'news'], hnQuery: 'innovation', newsCategory: 'general' }
};

function hashId(seed) {
  return crypto.createHash('sha1').update(seed).digest('hex');
}

function summarize(text = '', limit = 180) {
  if (!text) return '';
  return text.length <= limit ? text : `${text.slice(0, limit - 3)}...`;
}

function growthFromMetrics({ value = 0, hours = 1 }) {
  const normalized = Math.min(Math.max(value / Math.max(hours, 1), 0), 400);
  return `${normalized.toFixed(1)}%`;
}

function volumeFromMetrics(value = 0) {
  return `${Math.max(1, Math.round(value)).toLocaleString()} mentions`;
}

function defaultImage(category) {
  return `https://source.unsplash.com/featured/600x400?${encodeURIComponent(category)}`;
}

async function fetchRedditBlocks({ category, subreddits = [], limit = 12 }) {
  const slices = await Promise.all(subreddits.map(async (sub) => {
    try {
      const url = `https://www.reddit.com/r/${sub}/top.json`;
      const r = await axios.get(url, { params: { t: 'day', limit } });
      return (r.data?.data?.children || []).map((child) => child.data);
    } catch {
      return [];
    }
  }));
  const flattened = slices.flat();
  return flattened.map((item) => {
    const hoursLive = (Date.now() / 1000 - (item.created_utc || Date.now() / 1000)) / 3600;
    const upvotes = item.ups || item.score || 0;
    const comments = item.num_comments || 0;
    const ratio = item.upvote_ratio || 0.5;
    const sentiment = ratio > 0.75 ? 'Positive' : ratio < 0.45 ? 'Mixed' : 'Neutral';
    const imageCandidate = item.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&');
    const thumbnail = item.thumbnail && item.thumbnail.startsWith('http') ? item.thumbnail : null;
    return {
      id: hashId(`reddit:${item.id}`),
      title: item.title,
      description: summarize(item.selftext?.replace(/\n/g, ' ')),
      url: `https://reddit.com${item.permalink}`,
      source: 'reddit',
      category,
      imageUrl: imageCandidate || thumbnail || defaultImage(category),
      metrics: {
        growth: growthFromMetrics({ value: upvotes, hours: hoursLive }),
        volume: volumeFromMetrics(upvotes + comments * 2),
        sentiment
      }
    };
  });
}

async function fetchHackerNewsBlocks({ category, query }) {
  if (!query) return [];
  try {
    const r = await axios.get('https://hn.algolia.com/api/v1/search', {
      params: { query, tags: 'story', hitsPerPage: 6, restrictSearchableAttributes: 'title' }
    });
    return (r.data?.hits || []).map((hit) => {
      const points = hit.points || 0;
      const comments = hit.num_comments || 0;
      const hoursLive = (Date.now() - new Date(hit.created_at).getTime()) / (3600 * 1000);
      return {
        id: hashId(`hn:${hit.objectID}`),
        title: hit.title,
        description: summarize(hit.story_text || hit._highlightResult?.title?.value || ''),
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        source: 'hackernews',
        category,
        imageUrl: defaultImage(`${category},technology`),
        metrics: {
          growth: growthFromMetrics({ value: points, hours: hoursLive }),
          volume: volumeFromMetrics(points + comments * 3),
          sentiment: 'Engaged'
        }
      };
    });
  } catch {
    return [];
  }
}

async function fetchNewsApiBlocks({ category, query }) {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) return [];
  try {
    const params = { apiKey, pageSize: 6 };
    if (category) {
      Object.assign(params, { country: 'us', category });
    }
    if (query) {
      params.q = query;
    }
    if (!params.country) {
      Object.assign(params, { language: 'en', sortBy: 'publishedAt' });
    }
    const r = await axios.get('https://newsapi.org/v2/top-headlines', { params });
    return (r.data?.articles || []).map((article) => {
      const published = article.publishedAt ? new Date(article.publishedAt) : new Date();
      const hoursLive = (Date.now() - published.getTime()) / (3600 * 1000);
      return {
        id: hashId(`newsapi:${article.url}`),
        title: article.title,
        description: summarize(article.description || article.content || ''),
        url: article.url,
        source: 'newsapi',
        category: category || 'business',
        imageUrl: article.urlToImage || defaultImage(category || 'business'),
        metrics: {
          growth: growthFromMetrics({ value: 120, hours: hoursLive || 1 }),
          volume: volumeFromMetrics((article.source?.name?.length || 1) * 150),
          sentiment: 'Curated'
        }
      };
    });
  } catch {
    return [];
  }
}

export async function fetchTrendsFromSources({ category = 'technology', limit = 12, refresh = false } = {}) {
  const normalizedCategory = (category || 'technology').toLowerCase();
  const profile = CATEGORY_PROFILES[normalizedCategory] || CATEGORY_PROFILES.technology;
  const redis = getRedis();
  const cacheKey = `trends:${normalizedCategory}`;

  if (!refresh && redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return { items: JSON.parse(cached), source: 'cache' };
      }
    } catch {}
  }

  const [reddit, hackerNews, news] = await Promise.all([
    fetchRedditBlocks({ category: normalizedCategory, subreddits: profile.reddit || [], limit }),
    fetchHackerNewsBlocks({ category: normalizedCategory, query: profile.hnQuery }),
    fetchNewsApiBlocks({ category: profile.newsCategory, query: profile.newsQuery })
  ]);

  const merged = [...reddit, ...hackerNews, ...news]
    .filter(Boolean)
    .slice(0, limit);

  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(merged), 'EX', 60 * 20);
      for (const item of merged) {
        await redis.set(`trend:${item.id}`, JSON.stringify(item), 'EX', 60 * 30);
      }
    } catch {}
  }

  return { items: merged, source: 'live' };
}

export async function getTrendById(trendId) {
  if (!trendId) return null;
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(`trend:${trendId}`);
      if (cached) return JSON.parse(cached);
    } catch {}
  }
  // As a fallback, sweep each category until we locate the id.
  const categories = Object.keys(CATEGORY_PROFILES);
  for (const category of categories) {
    const { items } = await fetchTrendsFromSources({ category, refresh: true, limit: 20 });
    const match = items.find((item) => item.id === trendId);
    if (match) return match;
  }
  return null;
}
