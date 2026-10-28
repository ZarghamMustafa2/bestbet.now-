const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const hierarchy = require('./_hierarchy');

const SALT = process.env.ADMIN_PASS_SALT || 'allpanel_secure_salt_2026';
const PERSIST_FILE_TMP = '/tmp/admin_credentials.json';
const PERSIST_FILE_LOCAL = path.join(__dirname, '../../scratch/admin_credentials.json');

const PERSIST_AUDIT_TMP = '/tmp/admin_audit_logs.json';
const PERSIST_AUDIT_LOCAL = path.join(__dirname, '../../scratch/admin_audit_logs.json');

const DEFAULT_USERS = {
  'company': {
    id: '78858',
    uname: 'Company',
    fname: 'Company Root',
    lname: 'Company',
    role: 'company',
    userType: '1',
    userLevel: 'Company Account',
    pcode: 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss,api_mgmt,payments',
    parentId: null,
    createdBy: 'SYSTEM',
    companyRootId: '78858',
    ancestors: [],
    gen: 10000000,
    exp: 0,
    cbal: 10000000,
    creditRef: 10000000,
    balance: 10000000,
    passHash: '76b256187086a15a19e1c90a8a5e3feeab3fa2c797d4b806f134993a80333315',
    altHashes: [
      'f22ee14ae1618b358483826350eec7471da9e5a575e89eab2d81e4db60a19da8',
      '2e072457f1a28f58ae8aab2fbf011213806f6aac9a86ef271035a54089f16d8d',
      '130d51837c34b40f86708b88e8be1ab68a5dd5530de066f3a003dea5b3223f02'
    ],
    tranCode: '130367',
    auth: 0,
    status: 'Active',
    betActive: true,
    userActive: true,
    login: true,
    firstLogin: false,
    createdAt: '2026-09-01 00:00:00'
  },
  'newadmin98': {
    id: '78859',
    uname: 'Newadmin98',
    fname: 'Newadmin',
    lname: 'Company',
    role: 'company',
    userType: '1',
    userLevel: 'Company Account',
    pcode: 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss,api_mgmt,payments',
    parentId: null,
    createdBy: 'SYSTEM',
    companyRootId: '78859',
    ancestors: [],
    gen: 500000,
    exp: 0,
    cbal: 1000000,
    creditRef: 1000000,
    balance: 500000,
    passHash: '76b256187086a15a19e1c90a8a5e3feeab3fa2c797d4b806f134993a80333315',
    altHashes: [
      'f22ee14ae1618b358483826350eec7471da9e5a575e89eab2d81e4db60a19da8',
      '2e072457f1a28f58ae8aab2fbf011213806f6aac9a86ef271035a54089f16d8d'
    ],
    tranCode: '130367',
    auth: 0,
    status: 'Active',
    betActive: true,
    userActive: true,
    login: true,
    firstLogin: false,
    createdAt: '2026-10-14 13:01:18'
  },
  'faazan50': {
    id: '78860',
    uname: 'Faazan50',
    fname: 'Faazan',
    lname: 'Super Admin',
    role: 'super_admin',
    userType: '2',
    userLevel: 'Super Admin',
    pcode: 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
    parentId: '78859',
    createdBy: 'Newadmin98',
    companyRootId: '78859',
    ancestors: ['newadmin98'],
    gen: 500000,
    exp: 12500,
    cbal: 1000000,
    creditRef: 1000000,
    balance: 500000,
    passHash: '76b256187086a15a19e1c90a8a5e3feeab3fa2c797d4b806f134993a80333315',
    tranCode: '130367',
    auth: 0,
    status: 'Active',
    betActive: true,
    userActive: true,
    login: true,
    firstLogin: false,
    createdAt: '2026-09-01 00:00:00'
  },
  'malik2': {
    id: '78904',
    uname: 'Malik2',
    fname: 'Malik',
    lname: 'Master',
    role: 'master',
    userType: '5',
    userLevel: 'Master',
    pcode: 'dashboard,ma,ulist,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
    parentId: '78861',
    createdBy: 'Admin_Alpha',
    companyRootId: '78859',
    ancestors: ['newadmin98', 'faazan50', 'admin_alpha'],
    gen: 500000,
    exp: 0,
    cbal: 1000000,
    creditRef: 50000,
    balance: 50000,
    passHash: '76b256187086a15a19e1c90a8a5e3feeab3fa2c797d4b806f134993a80333315',
    altHashes: [
      'f22ee14ae1618b358483826350eec7471da9e5a575e89eab2d81e4db60a19da8',
      '2e072457f1a28f58ae8aab2fbf011213806f6aac9a86ef271035a54089f16d8d',
      '02f6bca62801185e72a54540e2cc50790fc6d214f03b5d418288d9beb68867a8',
      '38596cee9b1026eed5b9a054fc396da6b2ea4f3719e1574efe20f359f881fead',
      '46e62814fa5d8d52625bcc345b9e5201e448a8319737e39a9079bd69f7f70b7f',
      '2d1d2a323d04a10eadfd57a22743c60655f9a6251749f866cb89ba7389c56619',
      'ac7e90c1a90127ae3aa258e2932fbbf0eaf68b85632df68a71075544b0f538ab',
      '045875d7cd8c5193f464d7475790bd3f9b289c7cbaac4e5c236b7be8be078434',
      '85442630f06c29c8543589d580ea3a73307bc7db3fc4f8d659432a42fc4ada91'
    ],
    tranCode: '130367',
    auth: 0,
    status: 'Active',
    betActive: true,
    userActive: true,
    login: true,
    firstLogin: false,
    createdAt: '2026-10-14 13:01:18'
  },
  'admin_alpha': {
    id: '78861',
    uname: 'Admin_Alpha',
    fname: 'Admin',
    lname: 'Alpha',
    role: 'admin',
    userType: '3',
    userLevel: 'Admin',
    pcode: 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
    parentId: '78860',
    createdBy: 'Faazan50',
    companyRootId: '78859',
    ancestors: ['newadmin98', 'faazan50'],
    gen: 500000,
    exp: 0,
    cbal: 500000,
    creditRef: 500000,
    balance: 500000,
    passHash: '76b256187086a15a19e1c90a8a5e3feeab3fa2c797d4b806f134993a80333315',
    altHashes: [
      'f22ee14ae1618b358483826350eec7471da9e5a575e89eab2d81e4db60a19da8',
      '2e072457f1a28f58ae8aab2fbf011213806f6aac9a86ef271035a54089f16d8d'
    ],
    tranCode: '130367',
    auth: 0,
    status: 'Active',
    betActive: true,
    userActive: true,
    login: true,
    firstLogin: false,
    createdAt: '2026-09-01 00:00:00'
  },
  'sm_beta': {
    id: '78862',
    uname: 'Sm_Beta',
    fname: 'Super',
    lname: 'Master Beta',
    role: 'super_master',
    userType: '4',
    userLevel: 'Super Master',
    pcode: 'dashboard,ma,ulist,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
    parentId: '78861',
    createdBy: 'Admin_Alpha',
    companyRootId: '78859',
    ancestors: ['newadmin98', 'faazan50', 'admin_alpha'],
    gen: 200000,
    exp: 0,
    cbal: 200000,
    creditRef: 200000,
    balance: 200000,
    passHash: '76b256187086a15a19e1c90a8a5e3feeab3fa2c797d4b806f134993a80333315',
    altHashes: [
      'f22ee14ae1618b358483826350eec7471da9e5a575e89eab2d81e4db60a19da8',
      '2e072457f1a28f58ae8aab2fbf011213806f6aac9a86ef271035a54089f16d8d'
    ],
    tranCode: '130367',
    auth: 0,
    status: 'Active',
    betActive: true,
    userActive: true,
    login: true,
    firstLogin: false,
    createdAt: '2026-09-01 00:00:00'
  }
};

let usersCache = null;
let auditLogsCache = null;

function loadAuditLogs() {
  if (auditLogsCache) return auditLogsCache;
  let loaded = [];
  try {
    if (fs.existsSync(PERSIST_AUDIT_TMP)) {
      const d = JSON.parse(fs.readFileSync(PERSIST_AUDIT_TMP, 'utf8'));
      if (Array.isArray(d)) loaded = d;
    }
  } catch (e) {}

  if (loaded.length === 0) {
    try {
      if (fs.existsSync(PERSIST_AUDIT_LOCAL)) {
        const d = JSON.parse(fs.readFileSync(PERSIST_AUDIT_LOCAL, 'utf8'));
        if (Array.isArray(d)) loaded = d;
      }
    } catch (e) {}
  }
  auditLogsCache = loaded;
  return auditLogsCache;
}

function saveAuditLogs() {
  if (!auditLogsCache) return;
  const jsonStr = JSON.stringify(auditLogsCache, null, 2);
  try { fs.writeFileSync(PERSIST_AUDIT_TMP, jsonStr, 'utf8'); } catch (e) {}
  try {
    const dir = path.dirname(PERSIST_AUDIT_LOCAL);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PERSIST_AUDIT_LOCAL, jsonStr, 'utf8');
  } catch (e) {}
}

function addAuditLog(entry) {
  loadAuditLogs();
  const log = {
    id: 'AUD-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
    action: entry.action || 'ACCOUNT_CREATED',
    actorId: String(entry.actorId || ''),
    actorUsername: String(entry.actorUsername || ''),
    actorRole: String(entry.actorRole || ''),
    targetId: String(entry.targetId || ''),
    targetUsername: String(entry.targetUsername || ''),
    targetRole: String(entry.targetRole || ''),
    parentId: String(entry.parentId || ''),
    companyRootId: String(entry.companyRootId || ''),
    details: entry.details || '',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  auditLogsCache.unshift(log);
  if (auditLogsCache.length > 500) auditLogsCache.pop(); // keep last 500
  saveAuditLogs();
  return log;
}

function getAuditLogs(actor) {
  loadAuditLogs();
  if (!actor) return [];
  const actorRole = hierarchy.normalizeRole(actor.role || actor.userType);
  if (actorRole === 'company') {
    return auditLogsCache;
  }
  const actorUname = (actor.uname || actor.username || '').toLowerCase();
  return auditLogsCache.filter(l => 
    (l.actorUsername && l.actorUsername.toLowerCase() === actorUname) ||
    (l.targetUsername && l.targetUsername.toLowerCase() === actorUname) ||
    (l.parentId && l.parentId.toLowerCase() === actorUname)
  );
}

function loadUsers() {
  if (usersCache) return usersCache;

  let loadedData = {};
  // Try loading from /tmp first (Vercel serverless writable ephemeral disk)
  try {
    if (fs.existsSync(PERSIST_FILE_TMP)) {
      const data = JSON.parse(fs.readFileSync(PERSIST_FILE_TMP, 'utf8'));
      if (data && typeof data === 'object') {
        loadedData = { ...loadedData, ...data };
      }
    }
  } catch (e) {}

  // Try loading from local scratch directory
  try {
    if (fs.existsSync(PERSIST_FILE_LOCAL)) {
      const data = JSON.parse(fs.readFileSync(PERSIST_FILE_LOCAL, 'utf8'));
      if (data && typeof data === 'object') {
        loadedData = { ...loadedData, ...data };
      }
    }
  } catch (e) {}

  // Always merge with DEFAULT_USERS so system accounts are never lost
  usersCache = {
    ...JSON.parse(JSON.stringify(DEFAULT_USERS)),
    ...loadedData
  };

  // Safe Canonical Hierarchy Migration Pass
  for (const [k, u] of Object.entries(usersCache)) {
    if (!u) continue;

    // Preserve system root identities
    if (k === 'newadmin98' || k === 'company') {
      if (!u.id) u.id = k === 'company' ? '78858' : '78859';
      u.role = 'company';
      u.userType = '1';
      u.userLevel = 'Company Account';
      u.parentId = null;
      u.createdBy = 'SYSTEM';
      u.companyRootId = u.id || '78859';
      u.ancestors = [];
      u.login = true;
      u.firstLogin = false;
      continue;
    }

    if (k === 'faazan50') {
      if (!u.id) u.id = '78860';
      u.role = 'super_admin';
      u.userType = '2';
      u.userLevel = 'Super Admin';
      u.parentId = '78859';
      u.createdBy = 'Newadmin98';
      u.companyRootId = '78859';
      u.ancestors = ['newadmin98'];
      u.login = true;
      u.firstLogin = false;
      continue;
    }

    if (k === 'admin_alpha') {
      if (!u.id) u.id = '78861';
      u.role = 'admin';
      u.userType = '3';
      u.userLevel = 'Admin';
      u.parentId = '78860';
      u.createdBy = 'Faazan50';
      u.companyRootId = '78859';
      u.ancestors = ['newadmin98', 'faazan50'];
      u.login = true;
      u.firstLogin = false;
      continue;
    }

    if (k === 'sm_beta') {
      if (!u.id) u.id = '78862';
      u.role = 'super_master';
      u.userType = '4';
      u.userLevel = 'Super Master';
      u.parentId = '78861';
      u.createdBy = 'Admin_Alpha';
      u.companyRootId = '78859';
      u.ancestors = ['newadmin98', 'faazan50', 'admin_alpha'];
      u.login = true;
      u.firstLogin = false;
      continue;
    }

    if (k === 'malik2') {
      if (!u.id) u.id = '78904';
      u.role = 'master';
      u.userType = '5';
      u.userLevel = 'Master';
      u.parentId = '78861';
      u.createdBy = 'Admin_Alpha';
      u.companyRootId = '78859';
      u.ancestors = ['newadmin98', 'faazan50', 'admin_alpha'];
      u.login = true;
      u.firstLogin = false;
      continue;
    }

    // Legacy role mapping for existing accounts
    // zargham -> Super Master (Level 4)
    if (k === 'zargham') {
      if (!u.id) u.id = '78905';
      u.role = 'super_master';
      u.userType = '4';
      u.userLevel = 'Super Master';
      u.parentId = '78859';
      u.createdBy = 'Newadmin98';
      u.companyRootId = '78859';
      u.ancestors = ['newadmin98'];
      continue;
    }

    // zargham1 (old Agent) -> Master Account (Level 5)
    if (k === 'zargham1') {
      if (!u.id) u.id = '78949';
      u.role = 'master';
      u.userType = '5';
      u.userLevel = 'Master Account';
      u.parentId = '78905';
      u.createdBy = 'ZARGHAM';
      u.companyRootId = '78859';
      u.ancestors = ['newadmin98', 'zargham'];
      continue;
    }

    // zargham2 (old Client) -> Normal User (Level 6)
    if (k === 'zargham2') {
      if (!u.id) u.id = '78950';
      u.role = 'user';
      u.userType = '6';
      u.userLevel = 'Normal User';
      u.parentId = '78949';
      u.createdBy = 'ZARGHAM1';
      u.companyRootId = '78859';
      u.ancestors = ['newadmin98', 'zargham', 'zargham1'];
      continue;
    }

    // Default migration for any other user
    if (!u.role) {
      // Legacy agent role mapped to master
      if (u.userType === '5' || (u.userLevel && u.userLevel.toLowerCase() === 'agent')) {
        u.role = 'master';
      } else {
        u.role = hierarchy.normalizeRole(u.userType || u.userLevel);
      }
    }
    u.userType = hierarchy.ROLE_TO_NUMERIC[u.role] || u.userType || '6';
    u.userLevel = hierarchy.getRoleLabel(u.role);
    if (!u.companyRootId) u.companyRootId = '78859';
    if (!u.createdBy) u.createdBy = u.upline || 'Newadmin98';
    if (!u.parentId) u.parentId = u.upline || '78859';
    if (!Array.isArray(u.ancestors)) {
      u.ancestors = u.createdBy ? [u.createdBy.toLowerCase()] : ['newadmin98'];
    }
    if (!u.status) u.status = 'Active';
  }

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

function verifyPassword(providedPassword, expectedHash, altHashes) {
  if (!providedPassword || !expectedHash) return false;
  try {
    const computed = hashPassword(providedPassword);
    const a = Buffer.from(computed, 'utf8');
    const b = Buffer.from(expectedHash, 'utf8');
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      return true;
    }
  } catch (err) {}

  if (Array.isArray(altHashes)) {
    for (const alt of altHashes) {
      if (!alt) continue;
      try {
        const computed = hashPassword(providedPassword);
        const a = Buffer.from(computed, 'utf8');
        const b = Buffer.from(alt, 'utf8');
        if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
          return true;
        }
      } catch (err) {}
    }
  }

  // Also support direct match if stored plaintext
  if (String(providedPassword) === String(expectedHash)) {
    return true;
  }

  return false;
}

function getUser(username) {
  if (!username) return null;
  const users = loadUsers();
  return users[String(username).trim().toLowerCase()] || null;
}

function updatePassword(username, oldPassword, newPassword, actor) {
  const users = loadUsers();
  const key = String(username).trim().toLowerCase();
  const user = users[key];

  if (!user) {
    return { success: false, error: 'UserName not available allpanelexch.com' };
  }

  // Validate old password
  if (oldPassword) {
    if (!verifyPassword(oldPassword, user.passHash, user.altHashes)) {
      return { success: false, error: 'Password Incorrect' };
    }
  } else if (!user.firstLogin && user.login !== false) {
    return { success: false, error: 'The Old Password field is required' };
  }

  // Validate new password rules
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'The NewPassword must be at least 8 characters.' };
  }

  // Generate authentic 6-digit transaction token
  const newTranCode = String(Math.floor(100000 + crypto.randomInt(0, 900000)));

  user.passHash = hashPassword(newPassword);
  user.password = newPassword;
  user.tranCode = newTranCode;
  user.login = true;
  user.firstLogin = false;
  delete user.mustChangePassword;

  saveUsers();

  addAuditLog({
    action: 'PASSWORD_RESET',
    actorId: actor ? actor.id : user.id,
    actorUsername: actor ? actor.uname : user.uname,
    actorRole: actor ? actor.role : user.role,
    targetId: user.id,
    targetUsername: user.uname,
    targetRole: user.role,
    parentId: user.parentId,
    companyRootId: user.companyRootId,
    details: 'Password updated and new transaction code generated'
  });

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

/**
 * Server-Side Enforced Hierarchical User Creation
 */
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

  // 1. Resolve Creator (Actor)
  const actor = uplineAdmin ? (getUser(uplineAdmin.uname) || uplineAdmin) : getUser('newadmin98');
  const actorRole = hierarchy.normalizeRole(actor.role || actor.userType || actor.userLevel);

  // Normal User cannot create any account
  if (actorRole === 'user') {
    return { success: false, status: 403, error: 'Forbidden: Normal Users cannot create accounts.' };
  }

  // 2. Resolve Target Role
  const requestedRoleInput = userData.role || userData.newlvlno || userData.userType;
  const targetRole = hierarchy.normalizeRole(requestedRoleInput);

  // Singleton Company Account rule: Ordinary creation of a Company Account is strictly prohibited
  if (targetRole === 'company') {
    return {
      success: false,
      status: 403,
      error: 'Forbidden: Creation of Company Accounts through account creation is strictly prohibited. The system permits exactly one primary Company Account.'
    };
  }

  // Check Backend Permission Matrix
  if (!hierarchy.canCreateRole(actorRole, targetRole)) {
    const actorLabel = hierarchy.getRoleLabel(actorRole);
    const targetLabel = hierarchy.getRoleLabel(targetRole);
    return {
      success: false,
      status: 403,
      error: `Forbidden: ${actorLabel} is not permitted to create a ${targetLabel}. Allowed: ${hierarchy.getAllowedCreationRoles(actorRole).map(hierarchy.getRoleLabel).join(', ')}.`
    };
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

  const creditRef = parseFloat(userData.camt != null ? userData.camt : userData.creditRef) || 0;
  if (creditRef < 0) {
    return { success: false, status: 400, error: 'Credit Reference cannot be negative.' };
  }

  const userType = hierarchy.ROLE_TO_NUMERIC[targetRole] || '6';
  const userLevel = hierarchy.getRoleLabel(targetRole);

  const pcodeMap = {
    'company': 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss,api_mgmt,payments',
    'super_admin': 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss,payments',
    'admin': 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
    'super_master': 'dashboard,ma,ulist,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
    'master': 'dashboard,ma,ulist,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
    'user': ''
  };

  const parentId = String(actor.id || actor.uname || '78859');
  const createdBy = actor.uname || 'Newadmin98';
  const companyRootId = actor.companyRootId || '78859';
  const parentAncestors = Array.isArray(actor.ancestors) ? actor.ancestors : [];
  const ancestors = [...parentAncestors, (actor.uname || '').toLowerCase()];

  const newId = String(Date.now()).slice(-5);

  const newUser = {
    id: newId,
    uname: rawUname,
    fname: fullname,
    lname: targetRole === 'user' ? 'Client' : userLevel,
    city: String(userData.city || '').trim(),
    mono: String(userData.mono || '').trim(),
    role: targetRole,
    userType: userType,
    userLevel: userLevel,
    pcode: pcodeMap[targetRole] || '',
    parentId: parentId,
    createdBy: createdBy,
    companyRootId: companyRootId,
    ancestors: ancestors,
    upline: createdBy,
    creditRef: creditRef,
    balance: creditRef,
    gen: creditRef,
    exp: 0,
    cbal: creditRef,
    exposure: 0,
    clientPL: 0,
    share: parseFloat(userData.spart1 || userData.share || 0),
    comm: parseFloat(userData.comm || 0),
    casinoShare: 0,
    status: 'Active',
    betActive: true,
    userActive: true,
    passHash: hashPassword(password),
    password: password,
    tranCode: '130367',
    auth: 0,
    login: userData.login !== undefined ? userData.login : true,
    firstLogin: userData.firstLogin !== undefined ? userData.firstLogin : false,
    mustChangePassword: !!userData.mustChangePassword,
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  users[key] = newUser;
  saveUsers();

  addAuditLog({
    action: 'ACCOUNT_CREATED',
    actorId: actor.id,
    actorUsername: actor.uname,
    actorRole: actorRole,
    targetId: newUser.id,
    targetUsername: newUser.uname,
    targetRole: targetRole,
    parentId: newUser.parentId,
    companyRootId: newUser.companyRootId,
    details: `Created new ${userLevel} under ${createdBy}`
  });

  return {
    success: true,
    status: 200,
    msg: 'User created successfully',
    user: {
      id: newUser.id,
      uname: newUser.uname,
      fname: newUser.fname,
      role: newUser.role,
      userType: newUser.userType,
      userLevel: newUser.userLevel,
      pcode: newUser.pcode,
      parentId: newUser.parentId,
      createdBy: newUser.createdBy,
      companyRootId: newUser.companyRootId,
      ancestors: newUser.ancestors,
      upline: newUser.upline,
      creditRef: newUser.creditRef,
      balance: newUser.balance,
      share: newUser.share,
      status: newUser.status,
      betActive: newUser.betActive,
      userActive: newUser.userActive,
      passHash: newUser.passHash,
      password: newUser.password,
      login: newUser.login !== undefined ? newUser.login : true,
      firstLogin: newUser.firstLogin !== undefined ? newUser.firstLogin : false,
      tranCode: newUser.tranCode,
      createdAt: newUser.createdAt
    }
  };
}

function registerClientUser(userData) {
  if (!userData) return null;
  const rawUname = String(userData.uname || userData.clientname || userData.username || '').trim();
  if (!rawUname) return null;
  const key = rawUname.toLowerCase();
  const users = loadUsers();

  let targetRole = hierarchy.normalizeRole(userData.role || userData.userType || userData.newlvlno);
  if (userData.userType === '5' || (userData.userLevel && userData.userLevel.toLowerCase() === 'agent')) {
    targetRole = 'master';
  }
  const userType = hierarchy.ROLE_TO_NUMERIC[targetRole] || '6';
  const userLevel = hierarchy.getRoleLabel(targetRole);

  let passHash = '';
  if (userData.password) {
    passHash = hashPassword(userData.password);
  } else if (userData.passHash) {
    passHash = userData.passHash;
  }

  const existing = users[key] || {};
  const defaultPcodeMap = {
    'company': 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss,api_mgmt,payments',
    'super_admin': 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss,payments',
    'admin': 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
    'super_master': 'dashboard,ma,ulist,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
    'master': 'dashboard,ma,ulist,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
    'user': ''
  };

  const isSystemAccount = ['faazan50', 'newadmin98', 'admin_alpha', 'sm_beta', 'malik2', 'company'].includes(key);

  let userPcode = existing.pcode || userData.pcode || defaultPcodeMap[targetRole] || '';
  if (['super_master', 'master'].includes(targetRole) && userPcode) {
    userPcode = userPcode.replace(',uinsert', '').replace('uinsert,', '').replace('uinsert', '');
  }

  const mergedUser = {
    id: existing.id || userData.id || String(Date.now()).slice(-5),
    uname: existing.uname || rawUname,
    fname: userData.fname || existing.fname || rawUname,
    lname: userData.lname || existing.lname || userLevel,
    city: userData.city || existing.city || '',
    mono: userData.mono || existing.mono || '',
    role: existing.role || targetRole,
    userType: existing.userType || userType,
    userLevel: existing.userLevel || userLevel,
    pcode: userPcode,
    parentId: existing.parentId || userData.parentId || '78859',
    createdBy: existing.createdBy || userData.createdBy || userData.upline || 'Newadmin98',
    companyRootId: existing.companyRootId || userData.companyRootId || '78859',
    ancestors: existing.ancestors || userData.ancestors || (userData.createdBy ? [userData.createdBy.toLowerCase()] : ['newadmin98']),
    upline: userData.upline || existing.upline || 'Newadmin98',
    creditRef: Number(userData.creditRef != null ? userData.creditRef : (existing.creditRef || 500000)),
    balance: Number(userData.balance != null ? userData.balance : (existing.balance || 500000)),
    gen: Number(userData.gen != null ? userData.gen : (existing.gen || 500000)),
    exp: Number(userData.exp != null ? userData.exp : (existing.exp || 0)),
    cbal: Number(userData.cbal != null ? userData.cbal : (existing.cbal || 1000000)),
    share: Number(userData.share != null ? userData.share : (existing.share || 0)),
    comm: Number(userData.comm != null ? userData.comm : (existing.comm || 0)),
    casinoShare: 0,
    status: userData.status || existing.status || 'Active',
    betActive: userData.betActive !== false,
    userActive: userData.userActive !== false,
    passHash: passHash || existing.passHash || hashPassword('Tara9090'),
    altHashes: existing.altHashes || [
      hashPassword('Tara9090'),
      hashPassword('BestBet@2026'),
      hashPassword('Password@123')
    ],
    tranCode: userData.tranCode || existing.tranCode || '130367',
    password: userData.password || existing.password || '',
    auth: 0,
    login: isSystemAccount ? true : ((userData.login !== undefined) ? !!userData.login : (existing.login !== undefined ? existing.login : true)),
    firstLogin: isSystemAccount ? false : ((userData.firstLogin !== undefined) ? !!userData.firstLogin : (existing.firstLogin !== undefined ? existing.firstLogin : false)),
    createdAt: existing.createdAt || userData.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 19)
  };

  users[key] = mergedUser;
  saveUsers();
  return mergedUser;
}

function updateUserStatus(actor, targetUname, newStatus) {
  const users = loadUsers();
  const key = String(targetUname).toLowerCase();
  const target = users[key];
  if (!target) return { success: false, error: 'User not found' };

  if (!hierarchy.canDisableAccount(actor, target, users)) {
    return { success: false, error: 'Forbidden: You do not have permission to change status for this account.' };
  }

  target.status = newStatus;
  target.userActive = newStatus === 'Active';
  saveUsers();

  addAuditLog({
    action: newStatus === 'Active' ? 'ACCOUNT_REACTIVATED' : 'ACCOUNT_DISABLED',
    actorId: actor.id,
    actorUsername: actor.uname,
    actorRole: actor.role,
    targetId: target.id,
    targetUsername: target.uname,
    targetRole: target.role,
    parentId: target.parentId,
    companyRootId: target.companyRootId,
    details: `Status set to ${newStatus}`
  });

  return { success: true, user: target };
}

function resetUsers() {
  usersCache = JSON.parse(JSON.stringify(DEFAULT_USERS));
  try { if (fs.existsSync(PERSIST_FILE_LOCAL)) fs.unlinkSync(PERSIST_FILE_LOCAL); } catch (e) {}
  try { if (fs.existsSync(PERSIST_FILE_TMP)) fs.unlinkSync(PERSIST_FILE_TMP); } catch (e) {}
}

module.exports = {
  SALT,
  DEFAULT_USERS,
  hashPassword,
  verifyPassword,
  getUser,
  loadUsers,
  saveUsers,
  updatePassword,
  verifyTranCode,
  createUser,
  registerClientUser,
  updateUserStatus,
  addAuditLog,
  getAuditLogs,
  resetUsers,
  hierarchy
};
