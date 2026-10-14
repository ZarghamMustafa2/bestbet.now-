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
    passHash: '76b256187086a15a19e1c90a8a5e3feeab3fa2c797d4b806f134993a80333315',
    tranCode: '130367',
    auth: 0,
    login: true
  },
  'newadmin98': {
    uname: 'Newadmin98',
    fname: 'Newadmin',
    lname: 'Master',
    userType: '4',
    userLevel: 'Master',
    pcode: 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
    gen: 500000,
    exp: 0,
    cbal: 1000000,
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

function createUser(userData, uplineAdmin) {
  const users = loadUsers();
  const rawUname = String(userData.clientname || userData.uname || '').trim();
  const key = rawUname.toLowerCase();

  if (!rawUname) {
    return { success: false, status: 400, error: 'Client Name is required.' };
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(rawUname)) {
    return { success: false, status: 400, error: 'Client Name must be 3-20 alphanumeric characters or underscores.' };
  }
  if (users[key]) {
    return { success: false, status: 409, error: 'Username already exists. Please choose a different name.' };
  }

  const password = String(userData.password || '');
  const rpassword = String(userData.rpassword || '');
  if (!password || password.length < 6) {
    return { success: false, status: 400, error: 'Password must be at least 6 characters.' };
  }
  if (password !== rpassword) {
    return { success: false, status: 400, error: 'Password and Retype Password not matching' };
  }

  const fullname = String(userData.fullname || '').trim();
  if (!fullname) {
    return { success: false, status: 400, error: 'Full Name is required.' };
  }

  const userType = String(userData.newlvlno || userData.userType || '6');
  if (!['4', '5', '6'].includes(userType)) {
    return { success: false, status: 400, error: 'Invalid Account Type selected.' };
  }

  const creditRef = parseFloat(userData.camt != null ? userData.camt : userData.creditRef) || 0;
  if (creditRef < 0) {
    return { success: false, status: 400, error: 'Credit Reference cannot be negative.' };
  }

  const levelMap = { '4': 'Master', '5': 'Agent', '6': 'Client' };
  const userLevel = levelMap[userType] || 'Client';

  const newUser = {
    id: String(Date.now()).slice(-5),
    uname: rawUname,
    fname: fullname,
    lname: '',
    city: String(userData.city || '').trim(),
    mono: String(userData.mono || '').trim(),
    userType: userType,
    userLevel: userLevel,
    upline: uplineAdmin ? uplineAdmin.uname : 'Newadmin98',
    creditRef: creditRef,
    balance: creditRef,
    exposure: 0,
    clientPL: 0,
    share: parseFloat(userData.spart1 || userData.share || 0),
    comm: parseFloat(userData.comm || 0),
    casinoShare: 0,
    status: 'Active',
    betActive: true,
    userActive: true,
    passHash: hashPassword(password),
    tranCode: '130367',
    auth: 0,
    login: true,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  users[key] = newUser;
  saveUsers();

  return {
    success: true,
    status: 200,
    msg: 'User created successfully',
    user: {
      id: newUser.id,
      uname: newUser.uname,
      fname: newUser.fname,
      userType: newUser.userType,
      userLevel: newUser.userLevel,
      upline: newUser.upline,
      creditRef: newUser.creditRef,
      balance: newUser.balance,
      share: newUser.share,
      status: newUser.status,
      betActive: newUser.betActive,
      userActive: newUser.userActive,
      createdAt: newUser.createdAt
    }
  };
}

module.exports = {
  SALT,
  hashPassword,
  verifyPassword,
  getUser,
  updatePassword,
  verifyTranCode,
  createUser
};
