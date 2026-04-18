import { Router } from 'express';
import { createRequire } from 'module';
import crypto from 'crypto';
import { LRUCache } from '../cache/LRUCache.js';

// pdf-parse is CommonJS — use createRequire for ESM compatibility
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Cache up to 50 parsed resumes for 1 hour (keyed by MD5 of file content)
const resumeCache = new LRUCache(50, 60 * 60 * 1000);

const router = Router();

router.post('/parse', async (req, res, next) => {
  const { file, type } = req.body;

  if (!file) return res.status(400).json({ error: 'file is required' });

  try {
    const buffer = Buffer.from(file, 'base64');
    const cacheKey = crypto.createHash('md5').update(buffer).digest('hex');

    const cached = resumeCache.get(cacheKey);
    if (cached) {
      return res.json({ text: cached, cached: true, cacheStats: resumeCache.stats() });
    }

    let text = '';
    if (type === 'application/pdf') {
      const result = await pdfParse(buffer);
      text = result.text;
    } else {
      text = buffer.toString('utf-8');
    }

    const trimmed = text.trim();
    resumeCache.set(cacheKey, trimmed);

    res.json({ text: trimmed, cached: false, cacheStats: resumeCache.stats() });
  } catch (err) {
    next(err);
  }
});

export default router;
