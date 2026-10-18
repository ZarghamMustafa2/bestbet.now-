const crypto = require('crypto');
let CryptoJS;
try {
  CryptoJS = require('crypto-js');
} catch (e) {
  CryptoJS = null;
}

const creds = require('./_credentials');
const hierarchy = require('./_hierarchy');
const ENC_KEY = process.env.ADMIN_ENC_KEY || 'cae7b808-8b1e-4f47-87a5-1a4b6a08030e';
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'allpanelexch_jwt_secure_key_2026';


function generateToken(user) {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload = {
    id: user.id,
    uname: user.uname,
    role: user.role || hierarchy.normalizeRole(user.userType),
    userType: user.userType,
    userLevel: user.userLevel,
    parentId: user.parentId,
    createdBy: user.createdBy,
    companyRootId: user.companyRootId,
    ancestors: user.ancestors || [],
    exp: expiresAt,
    iat: Date.now()
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(str).digest('base64url');
  return `${str}.${sig}`;
}

function evpBytesToKey(passphrase, salt, keyLen, ivLen) {
  let d = Buffer.alloc(0);
  let d_i = Buffer.alloc(0);
  while (d.length < keyLen + ivLen) {
    const hash = crypto.createHash('md5');
    hash.update(d_i);
    hash.update(passphrase);
    hash.update(salt);
    d_i = hash.digest();
    d = Buffer.concat([d, d_i]);
  }
  return {
    key: d.slice(0, keyLen),
    iv: d.slice(keyLen, keyLen + ivLen)
  };
}

function nativeDecrypt(cipherBase64, passphrase) {
  try {
    const buf = Buffer.from(cipherBase64, 'base64');
    if (buf.length < 16 || buf.slice(0, 8).toString('utf8') !== 'Salted__') return null;
    const salt = buf.slice(8, 16);
    const data = buf.slice(16);
    const { key, iv } = evpBytesToKey(Buffer.from(passphrase, 'utf8'), salt, 32, 16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let dec = decipher.update(data);
    dec = Buffer.concat([dec, decipher.final()]);
    return JSON.parse(dec.toString('utf8'));
  } catch (e) {
    return null;
  }
}

function nativeEncrypt(obj, passphrase) {
  try {
    const plainText = typeof obj === 'string' ? obj : JSON.stringify(obj);
    const salt = crypto.randomBytes(8);
    const { key, iv } = evpBytesToKey(Buffer.from(passphrase, 'utf8'), salt, 32, 16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let enc = cipher.update(Buffer.from(plainText, 'utf8'));
    enc = Buffer.concat([enc, cipher.final()]);
    return Buffer.concat([Buffer.from('Salted__', 'utf8'), salt, enc]).toString('base64');
  } catch (e) {
    return null;
  }
}

function decryptCipher(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') return null;
  if (CryptoJS) {
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, ENC_KEY);
      const dec = bytes.toString(CryptoJS.enc.Utf8);
      if (dec) return JSON.parse(dec);
    } catch (e) {}
  }
  return nativeDecrypt(cipherText, ENC_KEY);
}

function decryptPayload(dataStr) {
  if (!dataStr) return null;
  // If JSON object already parsed
  if (typeof dataStr === 'object') {
    if (dataStr.username) return dataStr;
    if (dataStr.data) {
      const res = decryptCipher(dataStr.data);
      if (res) return res;
    }
  }

  // If string
  try {
    const obj = JSON.parse(dataStr);
    if (obj.username) return obj;
    if (obj.data) {
      const res = decryptCipher(obj.data);
      if (res) return res;
    }
  } catch (e) {}

  if (typeof dataStr === 'string') {
    const res = decryptCipher(dataStr);
    if (res) return res;
  }

  return null;
}

function encryptResponse(obj) {
  let cipher = null;
  if (CryptoJS) {
    try {
      cipher = CryptoJS.AES.encrypt(JSON.stringify(obj), ENC_KEY).toString();
    } catch (e) {}
  }
  if (!cipher) {
    cipher = nativeEncrypt(obj, ENC_KEY);
  }
  return cipher ? { data: cipher, ...obj } : obj;
}

module.exports = async function handler(req, res) {
  if (!res.status) { res.status = function(c) { res.statusCode = c; return res; }; }
  if (!res.json) { res.json = function(d) { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(d)); }; }
  if (!res.send) { res.send = function(d) { return res.end(d); }; }

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
  if (!body) {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const raw = Buffer.concat(buffers).toString('utf8');
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch (e) {
          body = raw;
        }
      }
    } catch (e) {
      body = {};
    }
  } else if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {}
  }

  const credentials = decryptPayload(body) || body || {};
  const username = String(credentials.username || '').trim();
  const password = String(credentials.password || '').trim();

  // Dynamically sync accounts created on client
  if (Array.isArray(credentials.clientAccounts) && credentials.clientAccounts.length > 0) {
    for (const acc of credentials.clientAccounts) {
      if (acc && (acc.uname || acc.username)) {
        creds.registerClientUser(acc);
      }
    }
  }

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

  const userRecord = creds.getUser(username);
  if (!userRecord) {
    return res.status(400).json(encryptResponse({
      status: 400,
      msg: 'UserName not available allpanelexch.com'
    }));
  }

  // Normal Users cannot access Admin panel or management APIs
  const userRole = hierarchy.normalizeRole(userRecord.role || userRecord.userType);
  if (userRole === 'user') {
    return res.status(403).json(encryptResponse({
      status: 403,
      msg: 'Access Denied: Normal User accounts cannot access the admin management portal.'
    }));
  }

  const isValid = creds.verifyPassword(password, userRecord.passHash, userRecord.altHashes);
  if (!isValid) {
    return res.status(400).json(encryptResponse({
      status: 400,
      msg: 'Password Incorrect'
    }));
  }

  // Successful Authentication
  const token = generateToken(userRecord);
  const responseData = {
    id: userRecord.id,
    uname: userRecord.uname,
    fname: userRecord.fname,
    lname: userRecord.lname,
    role: userRole,
    roleLabel: hierarchy.getRoleLabel(userRole),
    roleRank: hierarchy.getRoleRank(userRole),
    userType: userRecord.userType,
    userLevel: userRecord.userLevel,
    parentId: userRecord.parentId,
    createdBy: userRecord.createdBy,
    companyRootId: userRecord.companyRootId,
    ancestors: userRecord.ancestors || [],
    pcode: userRecord.pcode,
    gen: userRecord.gen != null ? userRecord.gen : (userRecord.creditRef || 500000),
    exp: userRecord.exp != null ? userRecord.exp : 0,
    cbal: userRecord.cbal != null ? userRecord.cbal : (userRecord.balance || 1000000),
    login: userRecord.login === false ? false : true,
    firstLogin: !!userRecord.firstLogin,
    auth: userRecord.auth || 0,
    ipop: false,
    token: token
  };

  return res.status(200).json(encryptResponse({
    status: 200,
    msg: 'Success',
    data: responseData
  }));
};
