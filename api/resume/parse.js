import { createRequire } from 'module';
import crypto from 'crypto';

// pdf-parse is CommonJS
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Per-instance in-memory cache (Vercel functions are stateless across cold starts)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { file, type } = req.body ?? {};
  if (!file) return res.status(400).json({ error: 'file is required' });

  try {
    const buffer = Buffer.from(file, 'base64');
    const cacheKey = crypto.createHash('md5').update(buffer).digest('hex');

    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < CACHE_TTL) {
      return res.json({ text: hit.text, cached: true });
    }

    let text = '';
    if (type === 'application/pdf') {
      const result = await pdfParse(buffer);
      text = result.text;
    } else {
      text = buffer.toString('utf-8');
    }

    const trimmed = text.trim();
    cache.set(cacheKey, { text: trimmed, ts: Date.now() });

    res.json({ text: trimmed, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};
