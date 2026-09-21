/**
 * Vercel Serverless Function: GET /api/events
 * 
 * Proxies requests to SportBex Gaming API:
 * GET https://trial-api.sportbex.com/api/betfair/event-list/{sportId}/{competitionId}
 * 
 * SECURITY:
 * - Reads SPORTBEX_API_KEY exclusively from server-side environment variables.
 * - Never leaks the API key to the client or in error payloads.
 * - Treats empty array [] as a valid 200 OK response.
 */

const FALLBACK_EVENTS = [
  {
    event: {
      id: "33145920",
      name: "Australia v England",
      countryCode: "AU",
      timezone: "UTC",
      openDate: new Date(Date.now() + 86400000).toISOString()
    },
    marketCount: 14
  }
];

function sanitizeEvents(rawList) {
  if (!Array.isArray(rawList)) return [];
  const sanitized = [];

  for (const item of rawList) {
    if (!item) continue;
    const evt = item.event || item;
    const id = String(evt.id || '');
    const name = String(evt.name || '').trim();
    if (!id || !name) continue;

    sanitized.push({
      event: {
        id,
        name,
        countryCode: String(evt.countryCode || ''),
        timezone: String(evt.timezone || 'UTC'),
        openDate: String(evt.openDate || '')
      },
      marketCount: Number.isFinite(Number(item.marketCount)) ? Number(item.marketCount) : 1
    });
  }

  return sanitized;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.SPORTBEX_API_KEY;
  const sportId = String(req.query?.sportId || '4');
  const competitionId = String(req.query?.competitionId || '');

  if (!competitionId) {
    return res.status(400).json({ error: 'Missing required query parameter: competitionId' });
  }

  if (!apiKey) {
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.setHeader('X-Data-Source', 'fallback');
    return res.status(200).json(FALLBACK_EVENTS);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let endpointPath = `/betfair/event-list/${sportId}/${competitionId}`;
    if (sportId === '7' || sportId === '4339') {
      endpointPath = `/betfair/racing-event-list/${sportId}/${competitionId}`;
    } else if (!['1', '2', '4'].includes(sportId)) {
      endpointPath = `/other-sports/event-list/${sportId}/${competitionId}`;
    }

    const apiUrl = `https://trial-api.sportbex.com/api${endpointPath}`;
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
      console.warn(`[SportBex Events API] Upstream returned status ${response.status}`);
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(response.status).json({ error: `Upstream error ${response.status}` });
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length === 0) {
      res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
      res.setHeader('X-Data-Source', 'live-sportbex');
      return res.status(200).json([]);
    }

    const sanitized = sanitizeEvents(data);
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.setHeader('X-Data-Source', 'live-sportbex');
    return res.status(200).json(sanitized);

  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    console.warn(`[SportBex Events API] ${isTimeout ? 'Request timed out' : 'Network error'}`);
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(500).json({ error: 'Failed to fetch events from SportBex' });
  }
};
