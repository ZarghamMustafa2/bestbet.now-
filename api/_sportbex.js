/**
 * SportBex API Configuration & Credential Resolver
 * 
 * Secure server-side credential discovery:
 * - Checks SPORTBEX_API_KEY
 * - Checks alias environment variable names (SPORTBEX_KEY, SPORT_BEX_API_KEY, SPORTBEX_TOKEN, etc.)
 * - Case-insensitive regex scan of process.env for any sportbex-related keys
 * - Never leaks or logs the key to client, logs, or error responses
 */

function getSportBexApiKey() {
  if (process.env.SPORTBEX_API_KEY && process.env.SPORTBEX_API_KEY.trim()) {
    return process.env.SPORTBEX_API_KEY.trim();
  }
  if (process.env.SPORTBEX_KEY && process.env.SPORTBEX_KEY.trim()) {
    return process.env.SPORTBEX_KEY.trim();
  }
  if (process.env.SPORT_BEX_API_KEY && process.env.SPORT_BEX_API_KEY.trim()) {
    return process.env.SPORT_BEX_API_KEY.trim();
  }
  if (process.env.SPORTBEX_TOKEN && process.env.SPORTBEX_TOKEN.trim()) {
    return process.env.SPORTBEX_TOKEN.trim();
  }
  if (process.env.SPORTBEX_API && process.env.SPORTBEX_API.trim()) {
    return process.env.SPORTBEX_API.trim();
  }
  if (process.env.SPORTBEX_SECRET && process.env.SPORTBEX_SECRET.trim()) {
    return process.env.SPORTBEX_SECRET.trim();
  }
  if (process.env.BETFAIR_API_KEY && process.env.BETFAIR_API_KEY.trim()) {
    return process.env.BETFAIR_API_KEY.trim();
  }

  // Scan process.env for any key matching sportbex
  for (const [k, v] of Object.entries(process.env)) {
    if (/sportbex/i.test(k) && typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }

  return null;
}

function setNoCacheHeaders(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = {
  getSportBexApiKey,
  setNoCacheHeaders,
  setCorsHeaders
};
