/**
 * Vercel Serverless Function: GET /api/fancy
 * 
 * Proxies requests to SportBex Gaming API:
 * GET https://trial-api.sportbex.com/api/betfair/fancy-bookmaker-odds/{eventId}
 * 
 * Provides Cricket Bookmaker and Session Fancy odds.
 * 
 * SECURITY:
 * - Reads SPORTBEX_API_KEY exclusively from server-side environment variables.
 * - Never leaks the API key to the client or in error payloads.
 * - Treats empty array [] as a valid 200 OK response.
 */

const FALLBACK_FANCY = {
  bookmaker: [
    {
      marketId: "bm_1",
      marketName: "Bookmaker",
      status: "OPEN",
      min: 100,
      max: 100000,
      runners: [
        { selectionId: 56128, runnerName: "Barbados Tridents W", backPrice: 1.72, layPrice: 1.79, status: "ACTIVE" },
        { selectionId: 56129, runnerName: "Guyana Amazon Warriors W", backPrice: 2.28, layPrice: 2.40, status: "ACTIVE" }
      ]
    }
  ],
  fancy: [
    {
      marketId: "fn_1",
      marketName: "Match 1st over run",
      status: "OPEN",
      min: 100,
      max: 25000,
      runsNo: 5,
      runsYes: 6,
      noPrice: 100,
      yesPrice: 100
    }
  ]
};

function setNoCacheHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

function normalizeFancyData(data) {
  if (!data) return { bookmaker: [], fancy: [] };

  let bookmaker = [];
  let fancy = [];

  if (Array.isArray(data.bookmaker)) {
    bookmaker = data.bookmaker;
  } else if (Array.isArray(data.bm)) {
    bookmaker = data.bm;
  } else if (Array.isArray(data)) {
    bookmaker = data.filter(m => (m.marketType || m.type || '').toUpperCase() === 'BOOKMAKER');
  }

  if (Array.isArray(data.fancy)) {
    fancy = data.fancy;
  } else if (Array.isArray(data.session)) {
    fancy = data.session;
  } else if (Array.isArray(data)) {
    fancy = data.filter(m => (m.marketType || m.type || '').toUpperCase() !== 'BOOKMAKER');
  }

  return { bookmaker, fancy };
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
    return res.status(200).json(FALLBACK_FANCY);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Primary: GET /betfair/fancy-bookmaker-odds/{eventId}
    const apiUrl = `https://trial-api.sportbex.com/api/betfair/fancy-bookmaker-odds/${eventId}`;
    let response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'sportbex-api-key': apiKey,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    // If V1 returns 404 or empty, attempt V2
    if (!response.ok && response.status === 404) {
      const v2Url = `https://trial-api.sportbex.com/api/betfair/fancy-all-bookmaker-odds-v2/${eventId}`;
      const v2Response = await fetch(v2Url, {
        method: 'GET',
        headers: {
          'sportbex-api-key': apiKey,
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      if (v2Response.ok) {
        response = v2Response;
      }
    }

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[SportBex Fancy API] Upstream returned status ${response.status}`);
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(response.status).json({ error: `Upstream error ${response.status}` });
    }

    const data = await response.json();
    const normalized = normalizeFancyData(data);
    res.setHeader('X-Data-Source', 'live-sportbex');
    return res.status(200).json(normalized);

  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    console.warn(`[SportBex Fancy API] ${isTimeout ? 'Request timed out' : 'Network error'}`);
    res.setHeader('Cache-Control', 'no-cache');
    return res.status(500).json({ error: 'Failed to fetch fancy odds from SportBex' });
  }
};
