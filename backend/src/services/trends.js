import axios from 'axios';

export async function fetchTrendsFromSources({ category = 'technology' } = {}) {
  const items = [];
  // Twitter API would require credentials; stubbed
  // NewsAPI
  try {
    const apiKey = process.env.NEWSAPI_KEY;
    if (apiKey) {
      const r = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: { country: 'us', category, pageSize: 10, apiKey }
      });
      (r.data.articles || []).forEach(a => items.push({ title: a.title, source: 'newsapi', url: a.url }));
    }
  } catch {}
  // Reddit
  try {
    const subreddit = category === 'business' ? 'business' : 'technology';
    const r = await axios.get(`https://www.reddit.com/r/${subreddit}/top.json?limit=10`);
    (r.data.data.children || []).forEach(c => items.push({ title: c.data.title, source: 'reddit', url: 'https://reddit.com' + c.data.permalink }));
  } catch {}
  return items;
}
