/**
 * Canonical Role & Hierarchy Management Engine for SATS SPORT / BestBet9
 * 
 * FINAL HIERARCHY:
 * Level 1: COMPANY ACCOUNT (rank 100)
 * Level 2: SUPER ADMIN     (rank 80)
 * Level 3: ADMIN           (rank 60)
 * Level 4: SUPER MASTER    (rank 40)
 * Level 5: MASTER ACCOUNT  (rank 20)
 * Level 6: NORMAL USER     (rank 0)
 */

'use strict';

const ROLES = {
  COMPANY: 'company',
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SUPER_MASTER: 'super_master',
  MASTER: 'master',
  USER: 'user'
};

const ROLE_RANKS = {
  company: 100,
  super_admin: 80,
  admin: 60,
  super_master: 40,
  master: 20,
  user: 0
};

const ROLE_NUMERIC_MAP = {
  '1': 'company',
  '2': 'super_admin',
  '3': 'admin',
  '4': 'super_master',
  '5': 'master',
  '6': 'user'
};

const ROLE_TO_NUMERIC = {
  company: '1',
  super_admin: '2',
  admin: '3',
  super_master: '4',
  master: '5',
  user: '6'
};

const ROLE_LABELS = {
  company: 'Company Account',
  super_admin: 'Super Admin',
  admin: 'Admin',
  super_master: 'Super Master',
  master: 'Master',
  user: 'Normal User'
};

// Strict 5-Level Creation Permission Matrix
// Rule 1: Company Account -> Super Admin, Admin, Super Master, Master
// Rule 2: Super Admin -> Admin, Super Master, Master (CANNOT create Company or Super Admin)
// Rule 3: Admin -> Super Master, Master (CANNOT create Company, Super Admin, or Admin)
// Rule 4: Super Master & Master -> No account creation authority
const CREATION_PERMISSIONS = {
  company: ['super_admin', 'admin', 'super_master', 'master'],
  super_admin: ['admin', 'super_master', 'master'],
  admin: ['super_master', 'master'],
  super_master: [],
  master: [],
  user: []
};

// Special Feature Permissions
const FEATURE_PERMISSIONS = {
  apiManagement: ['company'],
  providerSettings: ['company'],
  financialControls: ['company', 'super_admin'],
  selfRecharge: ['company', 'super_admin'],
  paymentsManagement: ['company', 'super_admin'],
  depositWithdraw: ['company', 'super_admin', 'admin', 'super_master', 'master'],
  viewDownlineTree: ['company', 'super_admin', 'admin', 'super_master', 'master'],
  createAccount: ['company', 'super_admin', 'admin'],
  editAccount: ['company', 'super_admin', 'admin', 'super_master', 'master'],
  statusLock: ['company', 'super_admin', 'admin', 'super_master', 'master']
};

/**
 * Normalize any legacy userType or role string into canonical role
 */
function normalizeRole(roleOrType) {
  if (!roleOrType) return 'user';
  const s = String(roleOrType).trim().toLowerCase();
  if (s === '1' || s === 'company' || s === 'company account') return 'company';
  if (s === '2' || s === 'super_admin' || s === 'superadmin' || s === 'super admin') return 'super_admin';
  if (s === '3' || s === 'admin') return 'admin';
  if (s === '4' || s === 'super_master' || s === 'supermaster' || s === 'super master') return 'super_master';
  if (s === '5' || s === 'master' || s === 'master account' || s === 'agent') return 'master';
  if (s === '6' || s === 'user' || s === 'normal user' || s === 'client') return 'user';
  return 'user';
}

/**
 * Check if actor role is allowed to create target role.
 * Enforces singleton Company Account rule: NO ONE can create a Company Account.
 */
function canCreateRole(actorRole, targetRole) {
  const target = normalizeRole(targetRole);
  if (target === 'company') return false; // Singleton Company Account: ordinary creation strictly forbidden
  const actor = normalizeRole(actorRole);
  const allowed = CREATION_PERMISSIONS[actor] || [];
  return allowed.includes(target);
}

/**
 * Return array of canonical roles an actor is allowed to create
 */
function getAllowedCreationRoles(actorRole) {
  const actor = normalizeRole(actorRole);
  return CREATION_PERMISSIONS[actor] || [];
}

/**
 * Return role rank integer (0 - 100)
 */
function getRoleRank(role) {
  const r = normalizeRole(role);
  return ROLE_RANKS[r] !== undefined ? ROLE_RANKS[r] : 0;
}

/**
 * Return user-friendly role label
 */
function getRoleLabel(role) {
  const r = normalizeRole(role);
  return ROLE_LABELS[r] || 'Normal User';
}

/**
 * Check if target account is a descendant in actor's downline tree
 */
function isDescendant(actor, target, allUsersMap) {
  if (!actor || !target) return false;
  const actorUname = (actor.uname || actor.username || '').trim().toLowerCase();
  const targetUname = (target.uname || target.username || '').trim().toLowerCase();

  // An account is not its own descendant
  if (actorUname === targetUname) return false;

  const actorRole = normalizeRole(actor.role || actor.userType || actor.userLevel);
  // Company Account is root and sees all downline accounts
  if (actorRole === 'company') return true;

  // Normal Users have no downline and cannot view other accounts
  if (actorRole === 'user') return false;

  // Direct parent check
  const targetParent = (target.createdBy || target.upline || '').trim().toLowerCase();
  const targetParentId = String(target.parentId || '').trim().toLowerCase();
  const actorId = String(actor.id || '').trim().toLowerCase();

  if (targetParent === actorUname || (targetParentId && targetParentId === actorId)) {
    return true;
  }

  // Check ancestors array if populated
  if (Array.isArray(target.ancestors)) {
    const normAncestors = target.ancestors.map(a => String(a).trim().toLowerCase());
    if (normAncestors.includes(actorUname) || (actorId && normAncestors.includes(actorId))) {
      return true;
    }
  }

  // Walk up parent chain if map provided
  if (allUsersMap && typeof allUsersMap === 'object') {
    let curr = target;
    const visited = new Set();
    while (curr && (curr.createdBy || curr.upline || curr.parentId) && !visited.has((curr.uname || '').toLowerCase())) {
      const uKey = (curr.uname || '').toLowerCase();
      visited.add(uKey);

      const pUname = (curr.createdBy || curr.upline || '').trim().toLowerCase();
      const pId = String(curr.parentId || '').trim().toLowerCase();
      if (pUname === actorUname || (pId && pId === actorId)) {
        return true;
      }

      // Find next parent
      let nextParent = null;
      if (pUname && allUsersMap[pUname]) {
        nextParent = allUsersMap[pUname];
      } else {
        nextParent = Object.values(allUsersMap).find(u => 
          (u.uname && u.uname.toLowerCase() === pUname) ||
          (pId && String(u.id).toLowerCase() === pId)
        );
      }
      curr = nextParent;
    }
  }

  return false;
}

function canViewAccount(actor, target, allUsersMap) {
  if (!actor || !target) return false;
  const actorUname = (actor.uname || actor.username || '').trim().toLowerCase();
  const targetUname = (target.uname || target.username || '').trim().toLowerCase();
  if (actorUname === targetUname) return true;
  return isDescendant(actor, target, allUsersMap);
}

function canEditAccount(actor, target, allUsersMap) {
  if (!actor || !target) return false;
  const actorRole = normalizeRole(actor.role || actor.userType);
  const targetRole = normalizeRole(target.role || target.userType);

  // Nobody can edit Company Account role except root
  if (targetRole === 'company' && actorRole !== 'company') return false;

  // Lower or equal role cannot edit higher or peer account
  if (ROLE_RANKS[actorRole] <= ROLE_RANKS[targetRole] && actor.uname?.toLowerCase() !== target.uname?.toLowerCase()) {
    return false;
  }

  return isDescendant(actor, target, allUsersMap);
}

function canDisableAccount(actor, target, allUsersMap) {
  if (!actor || !target) return false;
  const actorRole = normalizeRole(actor.role || actor.userType);
  const targetRole = normalizeRole(target.role || target.userType);

  // Company Account cannot be deleted or disabled
  if (targetRole === 'company') return false;

  // Lower or equal role cannot disable superior or peer
  if (ROLE_RANKS[actorRole] <= ROLE_RANKS[targetRole]) return false;

  return isDescendant(actor, target, allUsersMap);
}

function hasFeaturePermission(actorRole, feature) {
  const role = normalizeRole(actorRole);
  const allowed = FEATURE_PERMISSIONS[feature] || [];
  return allowed.includes(role);
}

/**
 * Filter a list of accounts to only downline accounts visible to the actor
 */
function filterVisibleAccounts(actor, accountsList) {
  if (!actor || !Array.isArray(accountsList)) return [];
  const actorRole = normalizeRole(actor.role || actor.userType || actor.userLevel);
  const actorUname = (actor.uname || actor.username || '').trim().toLowerCase();

  const usersMap = {};
  for (const u of accountsList) {
    if (u && u.uname) usersMap[u.uname.toLowerCase()] = u;
  }

  return accountsList.filter(target => {
    if (!target || !target.uname) return false;
    const targetUname = target.uname.trim().toLowerCase();
    // Exclude self from client/downline list
    if (targetUname === actorUname) return false;
    // Exclude internal legacy placeholder account
    if (targetUname === 'company') return false;

    if (actorRole === 'company') {
      return true;
    }
    return isDescendant(actor, target, usersMap);
  });
}

/**
 * Build a hierarchical downline tree rooted at actor
 */
function buildDownlineTree(actor, accountsList) {
  if (!actor || !Array.isArray(accountsList)) return null;

  const visible = filterVisibleAccounts(actor, accountsList);
  const actorUname = (actor.uname || actor.username || '').toLowerCase();

  // Create node lookup
  const nodes = {};
  for (const u of visible) {
    const key = (u.uname || '').toLowerCase();
    nodes[key] = {
      id: u.id,
      uname: u.uname,
      fname: u.fname || u.uname,
      role: normalizeRole(u.role || u.userType || u.userLevel),
      roleLabel: getRoleLabel(u.role || u.userType || u.userLevel),
      userType: ROLE_TO_NUMERIC[normalizeRole(u.role || u.userType || u.userLevel)],
      parentId: u.parentId || null,
      createdBy: u.createdBy || u.upline || null,
      companyRootId: u.companyRootId || null,
      creditRef: u.creditRef != null ? u.creditRef : 0,
      balance: u.balance != null ? u.balance : 0,
      status: u.status || 'Active',
      createdAt: u.createdAt || '',
      children: [],
      directCount: 0,
      totalDescendants: 0
    };
  }

  // Ensure root actor is represented in nodes
  if (!nodes[actorUname]) {
    nodes[actorUname] = {
      id: actor.id || 'root',
      uname: actor.uname,
      fname: actor.fname || actor.uname,
      role: normalizeRole(actor.role || actor.userType || actor.userLevel),
      roleLabel: getRoleLabel(actor.role || actor.userType || actor.userLevel),
      userType: ROLE_TO_NUMERIC[normalizeRole(actor.role || actor.userType || actor.userLevel)],
      parentId: null,
      createdBy: null,
      companyRootId: actor.companyRootId || null,
      creditRef: actor.creditRef || 0,
      balance: actor.balance || 0,
      status: 'Active',
      createdAt: '',
      children: [],
      directCount: 0,
      totalDescendants: 0
    };
  }

  // Connect child nodes to parent
  for (const [key, node] of Object.entries(nodes)) {
    if (key === actorUname) continue;
    const parentUname = (node.createdBy || node.upline || '').toLowerCase();
    if (parentUname && nodes[parentUname] && parentUname !== key) {
      nodes[parentUname].children.push(node);
      nodes[parentUname].directCount++;
    } else if (actorRole(actor) === 'company') {
      // Connect to root if parent not found or is company
      if (node !== nodes[actorUname]) {
        nodes[actorUname].children.push(node);
        nodes[actorUname].directCount++;
      }
    }
  }

  // Calculate total descendants recursively
  function calcDescendants(node) {
    let count = node.children.length;
    for (const child of node.children) {
      count += calcDescendants(child);
    }
    node.totalDescendants = count;
    return count;
  }

  calcDescendants(nodes[actorUname]);
  return nodes[actorUname];
}

function actorRole(actor) {
  return normalizeRole(actor?.role || actor?.userType || actor?.userLevel);
}

module.exports = {
  ROLES,
  ROLE_RANKS,
  ROLE_NUMERIC_MAP,
  ROLE_TO_NUMERIC,
  ROLE_LABELS,
  CREATION_PERMISSIONS,
  FEATURE_PERMISSIONS,
  normalizeRole,
  canCreateRole,
  getAllowedCreationRoles,
  getRoleRank,
  getRoleLabel,
  isDescendant,
  canViewAccount,
  canEditAccount,
  canDisableAccount,
  hasFeaturePermission,
  filterVisibleAccounts,
  buildDownlineTree
};
