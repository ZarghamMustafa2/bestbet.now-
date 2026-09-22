/**
 * Vercel Serverless Function: GET /api/competitions
 * 
 * Proxies requests to SportBex Gaming API:
 * GET https://trial-api.sportbex.com/api/betfair/competition-list/4
 * 
 * SECURITY:
 * - Reads SPORTBEX_API_KEY exclusively from server-side environment variables.
 * - Never returns or leaks the API key to the client or in error payloads.
 * - Validates and sanitizes outgoing data according to the Betfair Competition schema.
 */

const { getSportBexApiKey, setNoCacheHeaders, setCorsHeaders } = require('./_sportbex');

const FALLBACK_COMPETITIONS = [
  {
    competition: { id: "12444379", name: "The Ashes" },
    competitionRegion: "International",
    marketCount: 1
  },
  {
    competition: { id: "1136561", name: "Caribbean Premier League" },
    competitionRegion: "West Indies",
    marketCount: 12
  },
  {
    competition: { id: "101480", name: "Indian Premier League" },
    competitionRegion: "India",
    marketCount: 8
  },
  {
    competition: { id: "992814", name: "T5 XI Series" },
    competitionRegion: "Virtual",
    marketCount: 4
  },
  {
    competition: { id: "1225566", name: "Big Bash League" },
    competitionRegion: "Australia",
    marketCount: 6
  },
  {
    competition: { id: "1144433", name: "Pakistan Super League" },
    competitionRegion: "Pakistan",
    marketCount: 5
  }
];

function sanitizeCompetitions(rawList) {
  if (!Array.isArray(rawList)) return null;
  const sanitized = [];

  for (const item of rawList) {
    if (!item) continue;
    const comp = item.competition || {};
    const id = String(comp.id || item.id || '');
    const name = String(comp.name || item.name || '').trim();
    if (!id || !name) continue;

    sanitized.push({
      competition: {
        id,
        name
      },
      competitionRegion: String(item.competitionRegion || item.region || 'International').trim(),
      marketCount: Number.isFinite(Number(item.marketCount)) ? Number(item.marketCount) : 1
    });
  }

  return sanitized.length > 0 ? sanitized : null;
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  setNoCacheHeaders(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = getSportBexApiKey();
  const eventTypeId = (req.query && (req.query.sportId || req.query.eventTypeId)) || '4'; // Default 4 = Cricket

  // If no API key configured in environment, return fallback with indicator
  if (!apiKey) {
    res.setHeader('X-Data-Source', 'fallback');
    return res.status(200).json(FALLBACK_COMPETITIONS);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const apiUrl = `https://trial-api.sportbex.com/api/betfair/competition-list/${eventTypeId}`;
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
      console.warn(`[SportBex API] Upstream returned status ${response.status}`);
      return res.status(response.status).json({ error: `SportBex upstream error ${response.status}` });
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length === 0) {
      res.setHeader('X-Data-Source', 'live-sportbex');
      return res.status(200).json([]);
    }

    const sanitized = sanitizeCompetitions(data);

    if (!sanitized) {
      console.warn('[SportBex API] Received invalid schema from upstream');
      res.setHeader('X-Data-Source', 'live-sportbex');
      return res.status(200).json([]);
    }

    res.setHeader('X-Data-Source', 'live-sportbex');
    return res.status(200).json(sanitized);

  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    console.warn(`[SportBex API] ${isTimeout ? 'Request timed out' : 'Network error'}`);
    return res.status(502).json({ error: 'SportBex API network timeout or connection failure' });
  }
};
