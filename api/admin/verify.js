const crypto = require('crypto');

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'allpanelexch_jwt_secure_key_2026';

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadStr, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadStr).digest('base64url');

  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) {
      return { expired: true };
    }
    return payload;
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || req.query.token;

  if (!token) {
    return res.status(401).json({ status: 401, valid: false, msg: 'Authentication token required' });
  }

  const verified = verifyToken(token);
  if (!verified) {
    return res.status(401).json({ status: 401, valid: false, msg: 'Invalid token' });
  }

  if (verified.expired) {
    return res.status(401).json({ status: 401, valid: false, msg: 'Session expired' });
  }

  let userPayload = verified;
  try {
    const creds = require('./_credentials');
    const u = creds.getUser(verified.uname);
    if (u) {
      userPayload = {
        ...verified,
        id: u.id,
        uname: u.uname,
        role: u.role,
        userType: u.userType,
        userLevel: u.userLevel,
        parentId: u.parentId,
        createdBy: u.createdBy,
        companyRootId: u.companyRootId,
        ancestors: u.ancestors || []
      };
    }
  } catch (e) {}

  return res.status(200).json({ status: 200, valid: true, user: userPayload });
};

module.exports.verifyToken = verifyToken;
