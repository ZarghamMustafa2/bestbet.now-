const crypto = require('crypto');
let CryptoJS;
try {
  CryptoJS = require('crypto-js');
} catch (e) {
  CryptoJS = null;
}

const ENC_KEY = process.env.ADMIN_ENC_KEY || 'cae7b808-8b1e-4f47-87a5-1a4b6a08030e';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'allpanelexch_jwt_secure_key_2026';
const SALT = process.env.ADMIN_PASS_SALT || 'allpanel_secure_salt_2026';

// PBKDF2 hash of authorized password (never store plaintext)
const AUTHORIZED_USERS = {
  'faazan50': {
    uname: 'Faazan50',
    fname: 'Faazan',
    lname: 'Master',
    userType: '4',
    userLevel: 'Master',
    pcode: 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
    gen: 500000,
    exp: 12500,
    cbal: 1000000,
    // PBKDF2 10000 iterations sha256 of authorized password
    passHash: '76b256187086a15a19e1c90a8a5e3feeab3fa2c797d4b806f134993a80333315'
  }
};

function verifyPassword(providedPassword, expectedHash) {
  try {
    const computed = crypto.pbkdf2Sync(providedPassword, SALT, 10000, 32, 'sha256').toString('hex');
    const a = Buffer.from(computed, 'utf8');
    const b = Buffer.from(expectedHash, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    return false;
  }
}

function generateToken(user) {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload = {
    uname: user.uname,
    userType: user.userType,
    exp: expiresAt,
    iat: Date.now()
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(str).digest('base64url');
  return `${str}.${sig}`;
}

function decryptPayload(dataStr) {
  if (!dataStr) return null;
  // If JSON object already parsed
  if (typeof dataStr === 'object') {
    if (dataStr.username) return dataStr;
    if (dataStr.data && CryptoJS) {
      const bytes = CryptoJS.AES.decrypt(dataStr.data, ENC_KEY);
      const dec = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(dec);
    }
  }

  // If string
  try {
    const obj = JSON.parse(dataStr);
    if (obj.username) return obj;
    if (obj.data && CryptoJS) {
      const bytes = CryptoJS.AES.decrypt(obj.data, ENC_KEY);
      const dec = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(dec);
    }
  } catch (e) {}

  if (CryptoJS) {
    try {
      const bytes = CryptoJS.AES.decrypt(dataStr, ENC_KEY);
      const dec = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(dec);
    } catch (e) {}
  }
  return null;
}

function encryptResponse(obj) {
  if (CryptoJS) {
    const cipher = CryptoJS.AES.encrypt(JSON.stringify(obj), ENC_KEY).toString();
    return { data: cipher, ...obj };
  }
  return obj;
}

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ status: 405, msg: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {}
  }

  const credentials = decryptPayload(body) || body || {};
  const username = String(credentials.username || '').trim();
  const password = String(credentials.password || '').trim();

  if (!username) {
    return res.status(400).json(encryptResponse({
      status: 400,
      msg: 'The username field is required'
    }));
  }

  if (!password) {
    return res.status(400).json(encryptResponse({
      status: 400,
      msg: 'The password field is required'
    }));
  }

  const userRecord = AUTHORIZED_USERS[username.toLowerCase()];
  if (!userRecord) {
    return res.status(400).json(encryptResponse({
      status: 400,
      msg: 'UserName not available allpanelexch.com'
    }));
  }

  const isValid = verifyPassword(password, userRecord.passHash);
  if (!isValid) {
    return res.status(400).json(encryptResponse({
      status: 400,
      msg: 'Password Incorrect'
    }));
  }

  // Successful Authentication
  const token = generateToken(userRecord);
  const responseData = {
    uname: userRecord.uname,
    fname: userRecord.fname,
    lname: userRecord.lname,
    userType: userRecord.userType,
    userLevel: userRecord.userLevel,
    pcode: userRecord.pcode,
    gen: userRecord.gen,
    exp: userRecord.exp,
    cbal: userRecord.cbal,
    login: true,
    auth: 0,
    ipop: false,
    token: token
  };

  return res.status(200).json(encryptResponse({
    status: 200,
    msg: 'Success',
    data: responseData
  }));
};
