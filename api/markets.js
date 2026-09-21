/**
 * Vercel Serverless Function: GET /api/markets
 * 
 * Proxies requests to SportBex Gaming API:
 * GET https://trial-api.sportbex.com/api/betfair/market-all-list/{eventId}
 * 
 * SECURITY:
 * - Reads SPORTBEX_API_KEY exclusively from server-side environment variables.
 * - Never leaks the API key to the client or in error payloads.
 * - Treats empty array [] as a valid 200 OK response.
 */

const FALLBACK_MARKETS = [
  {
    marketId: "1.22941031",
    marketName: "Match Odds",
    totalMatched: 145290.45,
    runners: [
      { selectionId: 56128, runnerName: "Barbados Tridents W", sortPriority: 1 },
      { selectionId: 56129, runnerName: "Guyana Amazon Warriors W", sortPriority: 2 }
    ]
  }
];

function sanitizeMarkets(rawList) {
  if (!Array.isArray(rawList)) return [];
  const sanitized = [];

  for (const item of rawList) {
    if (!item) continue;
    const marketId = String(item.marketId || '');
    if (!marketId) continue;

    const rawRunners = Array.isArray(item.runners) ? item.runners : [];
    const runners = rawRunners.map(r => ({
      selectionId: r.selectionId !== undefined ? Number(r.selectionId) : 0,
      runnerName: String(r.runnerName || '').trim(),
      sortPriority: Number.isFinite(Number(r.sortPriority)) ? Number(r.sortPriority) : 1
    })).filter(r => r.selectionId > 0 && r.runnerName);

    sanitized.push({
      marketId,
      marketName: String(item.marketName || 'Match Odds').trim(),
      totalMatched: Number.isFinite(Number(item.totalMatched)) ? Number(item.totalMatched) : 0,
      runners
    });
  }

  return sanitized;
}

function setNoCacheHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  setNoCacheHeaders(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTBEX_API_KEY;
  const eventId = String(req.query?.eventId || '');

  if (!eventId) {
    return res.status(400).json({ error: 'Missing required query parameter: eventId' });
  }

  if (!apiKey) {
    res.setHeader('X-Data-Source', 'fallback');
    return res.status(200).json(FALLBACK_MARKETS);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const apiUrl = `https://trial-api.sportbex.com/api/betfair/market-all-list/${eventId}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'sportbex-api-key': apiKey,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[SportBex Markets API] Upstream returned status ${response.status}`);
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(response.status).json({ error: `Upstream error ${response.status}` });
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length === 0) {
      res.setHeader('X-Data-Source', 'live-sportbex');
      return res.status(200).json([]);
    }

    const sanitized = sanitizeMarkets(data);
    res.setHeader('X-Data-Source', 'live-sportbex');
    return res.status(200).json(sanitized);

  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    console.warn(`[SportBex Markets API] ${isTimeout ? 'Request timed out' : 'Network error'}`);
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(500).json({ error: 'Failed to fetch markets from SportBex' });
  }
};
