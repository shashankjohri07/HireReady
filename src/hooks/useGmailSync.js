import { useState, useCallback, useRef } from 'react';

const CLIENT_ID  = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPE      = 'https://www.googleapis.com/auth/gmail.readonly';
const TOKEN_KEY  = 'hr_gmail_token';
const SYNCED_KEY = 'hr_gmail_synced';
const TS_KEY     = 'hr_gmail_sync_ts';

function loadGIS() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

function readToken() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const { token, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) { localStorage.removeItem(TOKEN_KEY); return null; }
    return token;
  } catch { return null; }
}

function writeToken(token, expiresIn = 3600) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({
    token,
    expiry: Date.now() + (expiresIn - 120) * 1000,
  }));
}

function readSynced() {
  try { return new Set(JSON.parse(localStorage.getItem(SYNCED_KEY) || '[]')); }
  catch { return new Set(); }
}

function markSynced(ids) {
  const s = readSynced();
  ids.forEach(id => s.add(id));
  localStorage.setItem(SYNCED_KEY, JSON.stringify([...s].slice(-500)));
}

async function gFetch(path, token) {
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw Object.assign(new Error('Token expired'), { code: 401 });
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  return res.json();
}

const QUERY = [
  'subject:("application received" OR "application submitted" OR "application confirmation"',
  'OR "thank you for applying" OR "your application" OR "we received your application"',
  'OR "applied to" OR "application for")',
  'newer_than:90d',
].join(' ');

function hdr(headers, name) {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

const SKIP_DOMAINS = /^(gmail|yahoo|outlook|hotmail|greenhouse|lever|workday|jobvite|linkedin|noreply|no-reply|notifications|recruiter|careers|jobs|talent|hire|apply|indeed|naukri|shine|monster)$/i;

function parseJob(msg) {
  const headers = msg.payload?.headers ?? [];
  const subject = hdr(headers, 'Subject');
  const from    = hdr(headers, 'From');
  const dateRaw = hdr(headers, 'Date');
  const date    = dateRaw
    ? new Date(dateRaw).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  let company = '', role = '';
  let m;

  // "[role] at [company]" — covers most ATS formats
  m = subject.match(/(?:for|to)\s+(?:the\s+)?(?:position\s+of\s+|role\s+of\s+)?(.+?)\s+at\s+([^-|!,\n]+?)(?:\s*[-|!,]|\s*$)/i);
  if (m) { role = m[1].trim(); company = m[2].trim(); }

  // LinkedIn: "Your application was sent to [Company]"
  if (!company) {
    m = subject.match(/application was sent to\s+(.+?)(?:\s*[-|!,]|\s*$)/i);
    if (m) company = m[1].trim();
  }

  // "Application Received - Role at Company"
  if (!company) {
    m = subject.match(/application (?:received|submitted|confirm\w*)[:\s-]+(.+?)\s+at\s+(.+?)(?:\s*[-|!,]|\s*$)/i);
    if (m) { role = m[1].trim(); company = m[2].trim(); }
  }

  // "[Company] - Application Submitted"
  if (!company) {
    m = subject.match(/^(.+?)\s*[-–]\s*(?:application|your application)/i);
    if (m) company = m[1].trim();
  }

  // Fallback: sender domain
  if (!company) {
    m = from.match(/@([a-z0-9-]+)\./i);
    if (m && !SKIP_DOMAINS.test(m[1])) {
      company = m[1].charAt(0).toUpperCase() + m[1].slice(1);
    }
  }

  if (!company) return null;

  company = company.replace(/[.,!]+$/, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  role    = role.replace(/[.,!]+$/, '').replace(/\s+/g, ' ').trim().slice(0, 80);

  return { company, role, date, source: 'gmail' };
}

export function useGmailSync() {
  const [connected, setConnected] = useState(() => !!readToken());
  const [syncing,   setSyncing]   = useState(false);
  const [lastSync,  setLastSync]  = useState(() => localStorage.getItem(TS_KEY));
  const tcRef = useRef(null);

  const acquireToken = useCallback(() => new Promise(async (resolve, reject) => {
    const cached = readToken();
    if (cached) return resolve(cached);

    if (!CLIENT_ID) {
      return reject(new Error('VITE_GOOGLE_CLIENT_ID is not configured. Add it to your .env file.'));
    }

    await loadGIS();

    tcRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback(resp) {
        if (resp.error) return reject(new Error(resp.error_description ?? resp.error));
        writeToken(resp.access_token, resp.expires_in);
        setConnected(true);
        resolve(resp.access_token);
      },
    });

    tcRef.current.requestAccessToken({ prompt: '' });
  }), []);

  const sync = useCallback(async (existingJobs) => {
    setSyncing(true);
    try {
      const token = await acquireToken();
      const synced = readSynced();

      const search = await gFetch(
        `/users/me/messages?q=${encodeURIComponent(QUERY)}&maxResults=50`,
        token
      );

      const all   = (search.messages ?? []).map(m => m.id);
      const fresh = all.filter(id => !synced.has(id));

      markSynced(all);

      let newJobs = [];
      if (fresh.length > 0) {
        const details = await Promise.all(
          fresh.slice(0, 25).map(id =>
            gFetch(
              `/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
              token
            )
          )
        );

        const parsed = details.map(parseJob).filter(Boolean);

        newJobs = parsed.filter(p => {
          const co = p.company.toLowerCase();
          const ro = p.role.toLowerCase().slice(0, 12);
          return !existingJobs.some(j =>
            j.company.toLowerCase() === co && j.role.toLowerCase().startsWith(ro)
          );
        });
      }

      const now = new Date().toISOString();
      localStorage.setItem(TS_KEY, now);
      setLastSync(now);

      return newJobs;
    } catch (err) {
      if (err.code === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setConnected(false);
      }
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [acquireToken]);

  const disconnect = useCallback(() => {
    const t = readToken();
    if (t && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(t, () => {});
    }
    [TOKEN_KEY, SYNCED_KEY, TS_KEY].forEach(k => localStorage.removeItem(k));
    setConnected(false);
    setLastSync(null);
  }, []);

  return { connected, syncing, lastSync, sync, disconnect };
}
