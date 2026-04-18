import { Router } from 'express';
import { LRUCache } from '../cache/LRUCache.js';

// Cache HN top stories for 10 minutes (single key — everyone gets the same feed)
const newsCache = new LRUCache(1, 10 * 60 * 1000);
const CACHE_KEY = 'hn_top';

const router = Router();

router.get('/', async (req, res, next) => {
  const cached = newsCache.get(CACHE_KEY);
  if (cached) {
    return res.json({ stories: cached, cached: true, cacheStats: newsCache.stats() });
  }

  try {
    const ids = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json'
    ).then((r) => r.json());

    const stories = await Promise.all(
      ids.slice(0, 12).map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json())
      )
    );

    const filtered = stories
      .filter((s) => s && s.title && s.type === 'story')
      .slice(0, 6);

    newsCache.set(CACHE_KEY, filtered);

    res.json({ stories: filtered, cached: false, cacheStats: newsCache.stats() });
  } catch (err) {
    next(err);
  }
});

export default router;
