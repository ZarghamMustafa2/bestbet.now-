const crypto = require('crypto');
let CryptoJS;
try {
  CryptoJS = require('crypto-js');
} catch (e) {
  CryptoJS = null;
}

const creds = require('./_credentials');
const ENC_KEY = process.env.ADMIN_ENC_KEY || 'cae7b808-8b1e-4f47-87a5-1a4b6a08030e';

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
  if (typeof dataStr === 'object') {
    if (dataStr.uname || dataStr.username || dataStr.password) return dataStr;
    if (dataStr.data) {
      const res = decryptCipher(dataStr.data);
      if (res) return res;
    }
  }

  try {
    const obj = JSON.parse(dataStr);
    if (obj.uname || obj.username || obj.password) return obj;
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

  const payload = decryptPayload(body) || body || {};
  const uname = String(payload.uname || payload.username || '').trim();
  const oldPassword = String(payload.password || payload.OldPassword || '').trim();
  const newPassword = String(payload.newPassword || payload.NewPassword || '').trim();
  const newPasswordConfirm = String(payload.newPasswordConfirm || payload.ConfirmNewPassword || '').trim();

  if (!uname) {
    return res.status(400).json(encryptResponse({
      status: 400,
      msg: 'The username field is required'
    }));
  }

  if (!oldPassword) {
    return res.status(400).json(encryptResponse({
      status: 400,
      msg: 'The Old Password field is required'
    }));
  }

  if (!newPassword) {
    return res.status(400).json(encryptResponse({
      status: 400,
      msg: 'The New Password field is required'
    }));
  }

  if (newPassword.length < 8) {
    return res.status(400).json(encryptResponse({
      status: 400,
      msg: 'The New Password must be at least 8 characters.'
    }));
  }

  if (newPasswordConfirm && newPassword !== newPasswordConfirm) {
    return res.status(400).json(encryptResponse({
      status: 400,
      msg: 'The Confirm Password does not match.'
    }));
  }

  const updateResult = creds.updatePassword(uname, oldPassword, newPassword);
  if (!updateResult.success) {
    return res.status(400).json(encryptResponse({
      status: 400,
      msg: updateResult.error || 'Failed to update password'
    }));
  }

  return res.status(200).json(encryptResponse({
    status: 200,
    data: {
      msg: 'Password updated successfully',
      tran: updateResult.tranCode
    }
  }));
};
