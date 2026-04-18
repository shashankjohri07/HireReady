// Simple in-memory cache per function instance
let cached = null;
let cachedAt = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (cached && Date.now() - cachedAt < CACHE_TTL) {
    return res.json({ stories: cached, cached: true });
  }

  try {
    const ids = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json').then(r => r.json());

    const stories = await Promise.all(
      ids.slice(0, 12).map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
      )
    );

    const filtered = stories.filter(s => s && s.title && s.type === 'story').slice(0, 6);

    cached = filtered;
    cachedAt = Date.now();

    res.json({ stories: filtered, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
