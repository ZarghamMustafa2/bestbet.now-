const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SALT = process.env.ADMIN_PASS_SALT || 'allpanel_secure_salt_2026';
const PERSIST_FILE_TMP = '/tmp/admin_credentials.json';
const PERSIST_FILE_LOCAL = path.join(__dirname, '../../scratch/admin_credentials.json');

const DEFAULT_USERS = {
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
    // PBKDF2 10000 iterations sha256 of "Tara9090" with SALT
    passHash: '76b256187086a15a19e1c90a8a5e3feeab3fa2c797d4b806f134993a80333315',
    tranCode: '130367',
    auth: 0,
    login: true
  }
};

let usersCache = null;

function loadUsers() {
  if (usersCache) return usersCache;

  // Try loading from /tmp first (Vercel serverless writable ephemeral disk)
  try {
    if (fs.existsSync(PERSIST_FILE_TMP)) {
      const data = JSON.parse(fs.readFileSync(PERSIST_FILE_TMP, 'utf8'));
      if (data && typeof data === 'object') {
        usersCache = data;
        return usersCache;
      }
    }
  } catch (e) {}

  // Try loading from local scratch directory
  try {
    if (fs.existsSync(PERSIST_FILE_LOCAL)) {
      const data = JSON.parse(fs.readFileSync(PERSIST_FILE_LOCAL, 'utf8'));
      if (data && typeof data === 'object') {
        usersCache = data;
        return usersCache;
      }
    }
  } catch (e) {}

  // Fallback to clone of defaults
  usersCache = JSON.parse(JSON.stringify(DEFAULT_USERS));
  return usersCache;
}

function saveUsers() {
  if (!usersCache) return;
  const jsonStr = JSON.stringify(usersCache, null, 2);

  // Attempt save to /tmp
  try {
    fs.writeFileSync(PERSIST_FILE_TMP, jsonStr, 'utf8');
  } catch (e) {}

  // Attempt save to local scratch
  try {
    const dir = path.dirname(PERSIST_FILE_LOCAL);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PERSIST_FILE_LOCAL, jsonStr, 'utf8');
  } catch (e) {}
}

function hashPassword(password) {
  return crypto.pbkdf2Sync(password, SALT, 10000, 32, 'sha256').toString('hex');
}

function verifyPassword(providedPassword, expectedHash) {
  try {
    const computed = hashPassword(providedPassword);
    const a = Buffer.from(computed, 'utf8');
    const b = Buffer.from(expectedHash, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    return false;
  }
}

function getUser(username) {
  if (!username) return null;
  const users = loadUsers();
  return users[String(username).trim().toLowerCase()] || null;
}

function updatePassword(username, oldPassword, newPassword) {
  const users = loadUsers();
  const key = String(username).trim().toLowerCase();
  const user = users[key];

  if (!user) {
    return { success: false, error: 'UserName not available allpanelexch.com' };
  }

  // Validate old password
  if (!verifyPassword(oldPassword, user.passHash)) {
    return { success: false, error: 'Password Incorrect' };
  }

  // Validate new password rules
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'The NewPassword must be at least 8 characters.' };
  }

  // Generate authentic 6-digit transaction token
  // Use 130367 if first update or generate cryptographically secure 6-digit code
  const newTranCode = String(Math.floor(100000 + crypto.randomInt(0, 900000)));

  user.passHash = hashPassword(newPassword);
  user.tranCode = newTranCode;
  user.login = true;

  saveUsers();

  return {
    success: true,
    tranCode: newTranCode,
    msg: 'Password updated successfully'
  };
}

function verifyTranCode(username, code) {
  const user = getUser(username);
  if (!user) return false;
  return String(user.tranCode || '130367').trim() === String(code).trim();
}

module.exports = {
  SALT,
  hashPassword,
  verifyPassword,
  getUser,
  updatePassword,
  verifyTranCode
};
