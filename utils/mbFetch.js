const APP_NAME = 'melloFiles/1.0 (https://github.com/mellofiles)';
const RATE_LIMIT_MS = 1100; // MusicBrainz requires >= 1 req/sec
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const cache = new Map();
let lastRequestTime = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function mbFetch(url) {
  // Check cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Enforce rate limit
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await sleep(RATE_LIMIT_MS - elapsed);
  }

  lastRequestTime = Date.now();

  const response = await fetch(url, {
    headers: {
      'User-Agent': APP_NAME,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz request failed: ${response.status} ${response.statusText} for ${url}`);
  }

  const data = await response.json();

  // Store in cache
  cache.set(url, { data, timestamp: Date.now() });

  return data;
}

module.exports = { mbFetch };
