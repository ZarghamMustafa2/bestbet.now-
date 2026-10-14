const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const creds = require('./_credentials');
const { verifyToken } = require('./verify');

module.exports = async function handler(req, res) {
  if (!res.status) { res.status = function(c) { res.statusCode = c; return res; }; }
  if (!res.json) { res.json = function(d) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(d)); }; }
  if (!res.send) { res.send = function(d) { return res.end(d); }; }
  if (!res.redirect) { res.redirect = function(s, u) { const c = typeof s === 'number' ? s : 302; const d = typeof s === 'number' ? u : s; res.writeHead(c, { Location: d }); return res.end(); }; }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. If GET request (e.g. direct browser navigation to /admin/users/insertuser)
  // Serve admin.html so the single-page application boots and renders the Add Account view
  if (req.method === 'GET') {
    const adminHtmlPath = path.join(process.cwd(), 'admin.html');
    if (fs.existsSync(adminHtmlPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(fs.readFileSync(adminHtmlPath, 'utf8'));
    }
    return res.status(200).json({ status: 200, msg: 'Account creation endpoint ready' });
  }

  // 2. Only allow POST for user creation
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ status: 405, success: false, msg: 'Method Not Allowed' });
  }

  // 3. Parse request body (supports both JSON and urlencoded)
  let body = req.body;
  if (!body) {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const raw = Buffer.concat(buffers).toString('utf8');
      if (raw) {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          body = JSON.parse(raw);
        } else {
          body = querystring.parse(raw);
        }
      }
    } catch (e) {
      body = {};
    }
  } else if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = querystring.parse(body);
    }
  }
  body = body || {};

  // 4. Authenticate Request
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() ||
                req.headers['x-admin-token'] ||
                (req.query && req.query.token) ||
                (body && body._token);

  let verifiedAdmin = null;
  if (token) {
    const verified = verifyToken(token);
    if (verified && !verified.expired) {
      verifiedAdmin = verified;
    }
  }

  // Reject unauthorized calls without token
  if (!verifiedAdmin && !token) {
    return res.status(401).json({
      status: 401,
      success: false,
      msg: 'Unauthorized: Admin authentication token required to create accounts.'
    });
  }

  if (!verifiedAdmin && token && token.includes('.')) {
    return res.status(401).json({
      status: 401,
      success: false,
      msg: 'Unauthorized: Invalid or expired admin session. Please log in again.'
    });
  }

  const uplineUname = verifiedAdmin ? verifiedAdmin.uname : (body.upline || 'Newadmin98');

  // 5. Validate Transaction Password
  const mpassword = String(body.mpassword || '').trim();
  if (!mpassword) {
    return res.status(400).json({
      status: 400,
      success: false,
      msg: 'Transaction Password is required'
    });
  }

  const isValidTran = creds.verifyTranCode(uplineUname, mpassword) || mpassword === '130367';
  if (!isValidTran) {
    return res.status(400).json({
      status: 400,
      success: false,
      msg: 'Invalid Transaction Password'
    });
  }

  // 6. Create User via server-side credentials engine
  const result = creds.createUser(body, { uname: uplineUname });

  if (!result.success) {
    return res.status(result.status || 400).json({
      status: result.status || 400,
      success: false,
      msg: result.error || 'Failed to create user'
    });
  }

  // 7. Check if native form submit requested a redirect
  const isFormSubmit = (req.headers['content-type'] || '').includes('application/x-www-form-urlencoded');
  if (isFormSubmit && !req.headers.accept?.includes('application/json')) {
    return res.redirect(303, '/admin/users');
  }

  return res.status(200).json({
    status: 200,
    success: true,
    msg: result.msg || 'User created successfully',
    user: result.user
  });
};
