/**
 * Vercel Serverless Function: GET/POST /api/odds
 * 
 * Proxies requests to SportBex Gaming API:
 * Single market: GET https://trial-api.sportbex.com/api/betfair/market-odds/{eventId}/{marketId}
 * Batch markets: POST https://trial-api.sportbex.com/api/betfair/listMarketBook
 * 
 * SECURITY:
 * - Reads SPORTBEX_API_KEY exclusively from server-side environment variables.
 * - Never leaks the API key to the client or in error payloads.
 * - Treats empty array [] as a valid 200 OK response.
 */

const FALLBACK_ODDS = [
  {
    marketId: "1.22941031",
    status: "OPEN",
    inplay: true,
    totalMatched: 145290.45,
    runners: [
      {
        selectionId: 56128,
        status: "ACTIVE",
        ex: {
          availableToBack: [
            { price: 1.72, size: 3730 },
            { price: 1.70, size: 7460 },
            { price: 1.66, size: 29870 }
          ],
          availableToLay: [
            { price: 1.79, size: 75820 },
            { price: 1.82, size: 298310 },
            { price: 1.85, size: 3270 }
          ]
        }
      },
      {
        selectionId: 56129,
        status: "ACTIVE",
        ex: {
          availableToBack: [
            { price: 2.28, size: 1680 },
            { price: 2.26, size: 58360 },
            { price: 2.20, size: 246780 }
          ],
          availableToLay: [
            { price: 2.40, size: 2670 },
            { price: 2.44, size: 5200 },
            { price: 2.50, size: 7460 }
          ]
        }
      }
    ]
  }
];

function sanitizeMarketBooks(raw) {
  const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  const sanitized = [];

  for (const item of list) {
    if (!item) continue;
    const marketId = String(item.marketId || '');
    if (!marketId) continue;

    const rawRunners = Array.isArray(item.runners) ? item.runners : [];
    const runners = rawRunners.map(r => {
      const ex = r.ex || {};
      const backs = Array.isArray(ex.availableToBack) ? ex.availableToBack : [];
      const lays = Array.isArray(ex.availableToLay) ? ex.availableToLay : [];

      return {
        selectionId: r.selectionId !== undefined ? Number(r.selectionId) : 0,
        status: String(r.status || 'ACTIVE'),
        lastPriceTraded: Number.isFinite(Number(r.lastPriceTraded)) ? Number(r.lastPriceTraded) : null,
        ex: {
          availableToBack: backs.map(b => ({
            price: Number.isFinite(Number(b.price)) ? Number(b.price) : 0,
            size: Number.isFinite(Number(b.size)) ? Number(b.size) : 0
          })).filter(b => b.price > 0),
          availableToLay: lays.map(l => ({
            price: Number.isFinite(Number(l.price)) ? Number(l.price) : 0,
            size: Number.isFinite(Number(l.size)) ? Number(l.size) : 0
          })).filter(l => l.price > 0)
        }
      };
    });

    sanitized.push({
      marketId,
      status: String(item.status || 'OPEN'),
      inplay: Boolean(item.inplay),
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  setNoCacheHeaders(res);

  const apiKey = process.env.SPORTBEX_API_KEY;

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) {}
    }
    const marketIds = body?.marketIds || '';
    if (!marketIds) {
      return res.status(400).json({ error: 'Missing required field: marketIds' });
    }

    if (!apiKey) {
      res.setHeader('X-Data-Source', 'fallback');
      return res.status(200).json(FALLBACK_ODDS);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const apiUrl = 'https://trial-api.sportbex.com/api/betfair/listMarketBook';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'sportbex-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ marketIds }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.warn(`[SportBex Batch Odds API] Upstream returned status ${response.status}`);
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(response.status).json({ error: `Upstream error ${response.status}` });
      }

      const data = await response.json();
      const sanitized = sanitizeMarketBooks(data);
      res.setHeader('X-Data-Source', 'live-sportbex');
      return res.status(200).json(sanitized);

    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      console.warn(`[SportBex Batch Odds API] ${isTimeout ? 'Request timed out' : 'Network error'}`);
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(500).json({ error: 'Failed to fetch batch odds from SportBex' });
    }
  }

  // GET method: single market or query-based batch
  if (req.method === 'GET') {
    const marketIds = req.query?.marketIds;
    const eventId = String(req.query?.eventId || '');
    const marketId = String(req.query?.marketId || '');

    if (marketIds) {
      // Proxy to listMarketBook via POST
      if (!apiKey) {
        res.setHeader('X-Data-Source', 'fallback');
        return res.status(200).json(FALLBACK_ODDS);
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const apiUrl = 'https://trial-api.sportbex.com/api/betfair/listMarketBook';
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'sportbex-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ marketIds }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[SportBex Batch Odds API] Upstream returned status ${response.status}`);
          res.setHeader('Cache-Control', 'no-cache');
          return res.status(response.status).json({ error: `Upstream error ${response.status}` });
        }

        const data = await response.json();
        const sanitized = sanitizeMarketBooks(data);
        res.setHeader('X-Data-Source', 'live-sportbex');
        return res.status(200).json(sanitized);

      } catch (err) {
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(500).json({ error: 'Failed to fetch batch odds from SportBex' });
      }
    }

    if (!eventId || !marketId) {
      return res.status(400).json({ error: 'Missing required query parameters: eventId, marketId' });
    }

    if (!apiKey) {
      res.setHeader('X-Data-Source', 'fallback');
      return res.status(200).json(FALLBACK_ODDS);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const apiUrl = `https://trial-api.sportbex.com/api/betfair/market-odds/${eventId}/${marketId}`;
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
        console.warn(`[SportBex Single Odds API] Upstream returned status ${response.status}`);
        res.setHeader('Cache-Control', 'no-cache');
        return res.status(response.status).json({ error: `Upstream error ${response.status}` });
      }

      const data = await response.json();
      const sanitized = sanitizeMarketBooks(data);
      res.setHeader('X-Data-Source', 'live-sportbex');
      return res.status(200).json(sanitized);

    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      console.warn(`[SportBex Single Odds API] ${isTimeout ? 'Request timed out' : 'Network error'}`);
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(500).json({ error: 'Failed to fetch market odds from SportBex' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
