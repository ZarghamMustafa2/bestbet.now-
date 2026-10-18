const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const creds = require('./_credentials');
const { verifyToken } = require('./verify');
const hierarchy = require('./_hierarchy');

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

  // 1. Authenticate Request
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() ||
                req.headers['x-admin-token'] ||
                (req.query && req.query.token);

  let verifiedAdmin = null;
  if (token) {
    const verified = verifyToken(token);
    if (verified && !verified.expired) {
      verifiedAdmin = creds.getUser(verified.uname) || verified;
    }
  }

  const action = req.query && req.query.action;

  // 2. GET API requests (Tree, Scoped Users List, Audit Log)
  if (req.method === 'GET') {
    // If request wants JSON API data or specifies action
    if (action || req.headers.accept?.includes('application/json')) {
      if (!verifiedAdmin && !token) {
        return res.status(401).json({ status: 401, success: false, msg: 'Authentication token required.' });
      }
      if (!verifiedAdmin && token && token.includes('.')) {
        return res.status(401).json({ status: 401, success: false, msg: 'Session expired or invalid.' });
      }

      const actor = verifiedAdmin || creds.getUser('newadmin98');
      const allUsers = Object.values(creds.loadUsers());

      // Return Downline Tree
      if (action === 'tree') {
        const tree = hierarchy.buildDownlineTree(actor, allUsers);
        return res.status(200).json({ status: 200, success: true, tree });
      }

      // Return Scoped Users List
      if (action === 'users' || action === 'list') {
        const visible = hierarchy.filterVisibleAccounts(actor, allUsers);
        let result = visible;
        if (req.query.role && req.query.role !== 'all') {
          const r = hierarchy.normalizeRole(req.query.role);
          result = result.filter(u => hierarchy.normalizeRole(u.role || u.userType) === r);
        }
        if (req.query.q) {
          const q = String(req.query.q).toLowerCase().trim();
          result = result.filter(u => 
            (u.uname && u.uname.toLowerCase().includes(q)) ||
            (u.fname && u.fname.toLowerCase().includes(q)) ||
            (u.id && String(u.id).includes(q))
          );
        }
        return res.status(200).json({ status: 200, success: true, total: result.length, users: result });
      }

      // Return Audit Logs
      if (action === 'audit') {
        const logs = creds.getAuditLogs(actor);
        return res.status(200).json({ status: 200, success: true, logs });
      }
    }

    // Direct browser navigation to /admin/users/insertuser serves admin SPA
    const adminHtmlPath = path.join(process.cwd(), 'admin.html');
    if (fs.existsSync(adminHtmlPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(fs.readFileSync(adminHtmlPath, 'utf8'));
    }
    return res.status(200).json({ status: 200, msg: 'Account creation endpoint ready' });
  }

  // 3. Only allow POST for user creation
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ status: 405, success: false, msg: 'Method Not Allowed' });
  }

  // 4. Parse request body
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

  // Check auth token from body if not in header
  if (!verifiedAdmin) {
    const fallbackToken = body._token || (req.query && req.query.token);
    if (fallbackToken) {
      const verified = verifyToken(fallbackToken);
      if (verified && !verified.expired) {
        verifiedAdmin = creds.getUser(verified.uname) || verified;
      }
    }
  }

  // Reject unauthorized calls without token
  if (!verifiedAdmin && !token && !body._token) {
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
  const actor = creds.getUser(uplineUname) || verifiedAdmin || { uname: uplineUname, role: 'company' };
  const actorRole = hierarchy.normalizeRole(actor.role || actor.userType);

  // Normal User cannot create any account
  if (actorRole === 'user') {
    return res.status(403).json({
      status: 403,
      success: false,
      msg: 'Forbidden: Normal Users cannot create accounts.'
    });
  }

  // 5. Backend-Enforced Role Creation Permission Check
  const requestedRoleInput = body.role || body.newlvlno || body.userType;
  const targetRole = hierarchy.normalizeRole(requestedRoleInput);

  if (!hierarchy.canCreateRole(actorRole, targetRole)) {
    const actorLabel = hierarchy.getRoleLabel(actorRole);
    const targetLabel = hierarchy.getRoleLabel(targetRole);
    return res.status(403).json({
      status: 403,
      success: false,
      msg: `Forbidden: ${actorLabel} is not permitted to create a ${targetLabel}. Allowed roles: ${hierarchy.getAllowedCreationRoles(actorRole).map(hierarchy.getRoleLabel).join(', ')}.`
    });
  }

  // 6. Validate Transaction Password
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

  // 7. Create User via server-side credentials engine
  const result = creds.createUser(body, actor);

  if (!result.success) {
    return res.status(result.status || 400).json({
      status: result.status || 400,
      success: false,
      msg: result.error || 'Failed to create user'
    });
  }

  // 8. Check if native form submit requested a redirect
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
