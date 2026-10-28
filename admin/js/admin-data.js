/**
 * BestBet9 Admin Panel - Data Store & Canonical Hierarchy Engine
 * Handles state persistence, hierarchy, downline scoping, settlement calculations, and ledger.
 *
 * FINAL HIERARCHY:
 * Level 1: COMPANY ACCOUNT (rank 100)
 * Level 2: SUPER ADMIN     (rank 80)
 * Level 3: ADMIN           (rank 60)
 * Level 4: SUPER MASTER    (rank 40)
 * Level 5: MASTER ACCOUNT  (rank 20)
 * Level 6: NORMAL USER     (rank 0)
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'bestbet9_admin_state_v4';

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
  const CREATION_PERMISSIONS = {
    company: ['super_admin', 'admin', 'super_master', 'master'],
    super_admin: ['admin', 'super_master', 'master'],
    admin: ['super_master', 'master'],
    super_master: [],
    master: [],
    user: []
  };

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

  const defaultState = {
    currentAdmin: {
      id: '78859',
      uname: 'Newadmin98',
      fname: 'Newadmin',
      lname: 'Company',
      role: 'company',
      userType: '1',
      userLevel: 'Company Account',
      parentId: null,
      createdBy: 'SYSTEM',
      companyRootId: '78859',
      ancestors: [],
      upline: 'SYSTEM',
      creditRef: 1000000,
      balance: 500000,
      exposure: 0,
      share: 85,
      pcode: 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss,api_mgmt,payments'
    },
    users: [
      {
        id: '101',
        uname: 'ZARGHAM',
        fname: 'ZARGHAM',
        role: 'master',
        userType: '5',
        userLevel: 'Master',
        parentId: '78859',
        createdBy: 'Newadmin98',
        companyRootId: '78859',
        ancestors: ['newadmin98'],
        upline: 'Newadmin98',
        creditRef: 79,
        balance: 0,
        exposure: 0,
        exposureLimit: 0,
        clientPL: -79,
        availBalance: 0,
        defaultPercent: 0,
        share: 0,
        casinoShare: 0,
        status: 'Active',
        betActive: true,
        userActive: true,
        passHash: '76b256187086a15a19e1c90a8a5e3feeab3fa2c797d4b806f134993a80333315',
        pcode: 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
        createdAt: '2026-09-01 10:00:00'
      },
      {
        id: '102',
        uname: 'ZARGHAM1',
        fname: 'ZARGHAM1',
        role: 'agent',
        userType: '4',
        userLevel: 'Agent',
        parentId: '101',
        createdBy: 'ZARGHAM',
        companyRootId: '78859',
        ancestors: ['newadmin98', 'zargham'],
        upline: 'ZARGHAM',
        creditRef: 2,
        balance: 0,
        exposure: 0,
        exposureLimit: 0,
        clientPL: -2,
        availBalance: 0,
        defaultPercent: 0,
        share: 0,
        casinoShare: 0,
        status: 'Active',
        betActive: true,
        userActive: true,
        createdAt: '2026-09-05 11:30:00'
      },
      {
        id: '103',
        uname: 'ZARGHAM2',
        fname: 'ZARGHAM2',
        role: 'user',
        userType: '6',
        userLevel: 'User',
        parentId: '102',
        createdBy: 'ZARGHAM1',
        companyRootId: '78859',
        ancestors: ['newadmin98', 'zargham', 'zargham1'],
        upline: 'ZARGHAM1',
        creditRef: 2,
        balance: 0,
        exposure: 0,
        exposureLimit: 0,
        clientPL: -2,
        availBalance: 0,
        defaultPercent: 0,
        share: 0,
        casinoShare: 0,
        status: 'Active',
        betActive: true,
        userActive: true,
        createdAt: '2026-09-10 14:15:00'
      },
      {
        id: '104',
        uname: 'ZARGHAM3',
        fname: 'ZARGHAM3',
        role: 'master',
        userType: '5',
        userLevel: 'Master',
        parentId: '78859',
        createdBy: 'Newadmin98',
        companyRootId: '78859',
        ancestors: ['newadmin98'],
        upline: 'Newadmin98',
        creditRef: 76,
        balance: 0,
        exposure: 0,
        exposureLimit: 0,
        clientPL: -76,
        availBalance: 0,
        defaultPercent: 0,
        share: 0,
        casinoShare: 0,
        status: 'Active',
        betActive: true,
        userActive: true,
        createdAt: '2026-09-12 16:00:00'
      }
    ],
    ledger: [
      {
        id: 'TXN-901',
        date: '2026-09-17 01:15:00',
        fromUser: 'Newadmin98',
        toUser: 'ZARGHAM',
        type: 'Deposit',
        debit: 50000,
        credit: 0,
        balance: 500000,
        remarks: 'Credit balance topup'
      },
      {
        id: 'TXN-902',
        date: '2026-09-16 22:40:00',
        fromUser: 'ZARGHAM1',
        toUser: 'Newadmin98',
        type: 'Settlement',
        debit: 0,
        credit: 18500,
        balance: 550000,
        remarks: 'Weekly cricket match settlement'
      },
      {
        id: 'TXN-903',
        date: '2026-09-16 18:20:00',
        fromUser: 'Newadmin98',
        toUser: 'ZARGHAM2',
        type: 'Deposit',
        debit: 20000,
        credit: 0,
        balance: 531500,
        remarks: 'Direct client chip allocation'
      },
      {
        id: 'TXN-904',
        date: '2026-09-15 21:00:00',
        fromUser: 'ZARGHAM',
        toUser: 'Newadmin98',
        type: 'Settlement',
        debit: 0,
        credit: 12000,
        balance: 551500,
        remarks: 'Casino weekly settlement'
      }
    ],
    liveMatches: [
      {
        id: '601999990',
        sportId: '4',
        sportName: 'Cricket',
        eventName: 'South Africa v Pakistan',
        date: '2026-09-17 19:30:00',
        runners: [
          { name: 'South Africa', back: 1.92, lay: 1.94, exp: -4500 },
          { name: 'Pakistan', back: 2.06, lay: 2.08, exp: 3800 }
        ],
        matchedVolume: 1245000,
        inPlay: true
      },
      {
        id: '601999991',
        sportId: '1',
        sportName: 'Football',
        eventName: 'Manchester City v Arsenal',
        date: '2026-09-17 21:00:00',
        runners: [
          { name: 'Manchester City', back: 1.85, lay: 1.87, exp: -5200 },
          { name: 'Draw', back: 3.40, lay: 3.45, exp: 1200 },
          { name: 'Arsenal', back: 4.20, lay: 4.30, exp: 4100 }
        ],
        matchedVolume: 2180000,
        inPlay: true
      },
      {
        id: '601999992',
        sportId: '2',
        sportName: 'Tennis',
        eventName: 'Novak Djokovic v Carlos Alcaraz',
        date: '2026-09-17 18:00:00',
        runners: [
          { name: 'Novak Djokovic', back: 1.95, lay: 1.97, exp: -2800 },
          { name: 'Carlos Alcaraz', back: 1.98, lay: 2.00, exp: 2500 }
        ],
        matchedVolume: 890000,
        inPlay: false
      }
    ],
    currentBets: [
      {
        id: 'BET-80124',
        user: 'ZARGHAM2',
        sport: 'Cricket',
        event: 'South Africa v Pakistan',
        market: 'Match Odds',
        runner: 'South Africa',
        type: 'Back',
        odds: 1.92,
        stake: 5000,
        profit: 4600,
        liability: 5000,
        placedAt: '2026-09-17 02:40:12'
      },
      {
        id: 'BET-80125',
        user: 'ZARGHAM2',
        sport: 'Football',
        event: 'Manchester City v Arsenal',
        market: 'Match Odds',
        runner: 'Manchester City',
        type: 'Back',
        odds: 1.85,
        stake: 6000,
        profit: 5100,
        liability: 6000,
        placedAt: '2026-09-17 02:44:30'
      },
      {
        id: 'BET-80126',
        user: 'ZARGHAM2',
        sport: 'Cricket',
        event: 'South Africa v Pakistan',
        market: 'Match Odds',
        runner: 'Pakistan',
        type: 'Lay',
        odds: 2.08,
        stake: 1500,
        profit: 1500,
        liability: 1620,
        placedAt: '2026-09-17 02:50:05'
      }
    ],
    casinoResults: [
      { roundId: '7829101', game: 'Super Over 2', winner: 'Batsman B', cards: '6, 4, 1', time: '2026-09-17 02:51:00' },
      { roundId: '7829100', game: 'Teenpatti 1-Day', winner: 'Player A', cards: 'A-K-Q', time: '2026-09-17 02:50:00' },
      { roundId: '7829099', game: 'Dragon Tiger', winner: 'Dragon', cards: 'K vs 7', time: '2026-09-17 02:49:00' },
      { roundId: '7829098', game: 'Roulette', winner: '17 Black', cards: '17', time: '2026-09-17 02:48:00' },
      { roundId: '7829097', game: 'Baccarat', winner: 'Banker', cards: '8 vs 5', time: '2026-09-17 02:47:00' }
    ],
    buttons: [100, 500, 1000, 5000, 10000, 25000, 50000, 100000]
  };

  class AdminDataStore {
    constructor() {
      this.ROLES = ROLES;
      this.ROLE_RANKS = ROLE_RANKS;
      this.ROLE_LABELS = ROLE_LABELS;
      this.ROLE_NUMERIC_MAP = ROLE_NUMERIC_MAP;
      this.ROLE_TO_NUMERIC = ROLE_TO_NUMERIC;
      this.CREATION_PERMISSIONS = CREATION_PERMISSIONS;
      this.state = this.loadState();
    }

    normalizeRole(roleOrType) {
      return normalizeRole(roleOrType);
    }

    canCreateRole(actorRole, targetRole) {
      const a = normalizeRole(actorRole);
      const t = normalizeRole(targetRole);
      if (t === 'company') return false; // Singleton Company Account
      return (CREATION_PERMISSIONS[a] || []).includes(t);
    }

    getAllowedCreationRoles(actorRole) {
      const a = normalizeRole(actorRole);
      return CREATION_PERMISSIONS[a] || [];
    }

    getRoleRank(role) {
      const r = normalizeRole(role);
      return ROLE_RANKS[r] !== undefined ? ROLE_RANKS[r] : 0;
    }

    getRoleLabel(role) {
      const r = normalizeRole(role);
      return ROLE_LABELS[r] || 'Normal User';
    }

    isDescendant(actor, target) {
      if (!actor || !target) return false;
      const actorUname = (actor.uname || actor.username || '').toLowerCase();
      const targetUname = (target.uname || target.username || '').toLowerCase();
      if (actorUname === targetUname) return false;

      const actorRole = normalizeRole(actor.role || actor.userType || actor.userLevel);
      if (actorRole === 'company') return true;
      if (actorRole === 'user') return false;

      const targetParent = (target.createdBy || target.upline || '').toLowerCase();
      const targetParentId = String(target.parentId || '').toLowerCase();
      const actorId = String(actor.id || '').toLowerCase();

      if (targetParent === actorUname || (targetParentId && targetParentId === actorId)) {
        return true;
      }

      if (Array.isArray(target.ancestors)) {
        const norm = target.ancestors.map(a => String(a).toLowerCase());
        if (norm.includes(actorUname) || (actorId && norm.includes(actorId))) {
          return true;
        }
      }

      // Walk parent tree
      let curr = target;
      const visited = new Set();
      const allUsers = this.state.users || [];
      while (curr && (curr.createdBy || curr.upline || curr.parentId) && !visited.has((curr.uname || '').toLowerCase())) {
        visited.add((curr.uname || '').toLowerCase());
        const pUname = (curr.createdBy || curr.upline || '').toLowerCase();
        const pId = String(curr.parentId || '').toLowerCase();
        if (pUname === actorUname || (pId && pId === actorId)) return true;
        curr = allUsers.find(u => 
          (u.uname && u.uname.toLowerCase() === pUname) || 
          (pId && String(u.id).toLowerCase() === pId)
        );
      }

      return false;
    }

    canViewAccount(actor, target) {
      if (!actor || !target) return false;
      const actorUname = (actor.uname || actor.username || '').toLowerCase();
      const targetUname = (target.uname || target.username || '').toLowerCase();
      if (actorUname === targetUname) return true;
      return this.isDescendant(actor, target);
    }

    canEditAccount(actor, target) {
      if (!actor || !target) return false;
      const actorRole = normalizeRole(actor.role || actor.userType);
      const targetRole = normalizeRole(target.role || target.userType);
      if (targetRole === 'company' && actorRole !== 'company') return false;
      if (ROLE_RANKS[actorRole] <= ROLE_RANKS[targetRole] && actor.uname?.toLowerCase() !== target.uname?.toLowerCase()) {
        return false;
      }
      return this.isDescendant(actor, target);
    }

    canDisableAccount(actor, target) {
      if (!actor || !target) return false;
      const actorRole = normalizeRole(actor.role || actor.userType);
      const targetRole = normalizeRole(target.role || target.userType);
      if (targetRole === 'company') return false;
      if (ROLE_RANKS[actorRole] <= ROLE_RANKS[targetRole]) return false;
      return this.isDescendant(actor, target);
    }

    loadState() {
      try {
        let state = JSON.parse(JSON.stringify(defaultState));
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          state = { ...defaultState, ...parsed };
        }

        // Safe Canonical Hierarchy Migration Pass
        if (state.currentAdmin) {
          const a = state.currentAdmin;
          const aRole = normalizeRole(a.role || a.userType || a.userLevel);
          a.role = aRole;
          a.userType = ROLE_TO_NUMERIC[aRole] || '1';
          a.userLevel = ROLE_LABELS[aRole] || 'Company Account';
        }

        if (Array.isArray(state.users)) {
          for (const u of state.users) {
            if (!u) continue;
            const uKey = (u.uname || '').toLowerCase();
            // Legacy mapping
            if (uKey === 'zargham') {
              u.role = 'super_master';
            } else if (uKey === 'zargham1' || u.userType === '5' || (u.userLevel && u.userLevel.toLowerCase() === 'agent')) {
              u.role = 'master';
            } else if (uKey === 'zargham2' || u.userType === '6' || (u.userLevel && u.userLevel.toLowerCase() === 'client')) {
              u.role = 'user';
            } else if (uKey === 'malik2') {
              u.role = 'master';
            } else if (!u.role) {
              u.role = normalizeRole(u.userType || u.userLevel);
            }

            u.userType = ROLE_TO_NUMERIC[u.role] || u.userType || '6';
            u.userLevel = ROLE_LABELS[u.role] || 'Normal User';
            if (!u.companyRootId) u.companyRootId = '78859';
            if (!u.createdBy) u.createdBy = u.upline || 'Newadmin98';
            if (!u.parentId) u.parentId = u.upline || '78859';
            if (!Array.isArray(u.ancestors)) {
              u.ancestors = u.createdBy ? [u.createdBy.toLowerCase()] : ['newadmin98'];
            }
            if (!u.status) u.status = 'Active';
          }
        }

        return state;
      } catch (e) {
        console.error('Failed to load admin state from storage:', e);
      }
      return JSON.parse(JSON.stringify(defaultState));
    }

    saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (e) {
        console.error('Failed to save admin state to storage:', e);
      }
    }

    getAdminUser() {
      return this.state.currentAdmin;
    }

    setCurrentAdmin(admin) {
      if (!admin) return;
      const canonicalRole = normalizeRole(admin.role || admin.userType || admin.userLevel);
      const userType = ROLE_TO_NUMERIC[canonicalRole] || '1';
      const userLevel = ROLE_LABELS[canonicalRole] || 'Company Account';

      const prevUname = (this.state.currentAdmin?.uname || '').toLowerCase();
      const newUname = (admin.uname || '').toLowerCase();
      if (prevUname !== newUname) {
        // Clear cached downlines when switching accounts to ensure zero cross-account data leakage
        this.state.users = [];
      }

      this.state.currentAdmin = {
        id: admin.id || '78859',
        uname: admin.uname,
        fname: admin.fname || admin.uname,
        lname: admin.lname || userLevel,
        role: canonicalRole,
        roleLabel: userLevel,
        roleRank: ROLE_RANKS[canonicalRole] || 100,
        userType: userType,
        userLevel: userLevel,
        parentId: admin.parentId || null,
        createdBy: admin.createdBy || 'SYSTEM',
        companyRootId: admin.companyRootId || '78859',
        ancestors: admin.ancestors || [],
        upline: admin.upline || 'SYSTEM',
        creditRef: Number(admin.creditRef != null ? admin.creditRef : (admin.gen || admin.cbal || 1000000)),
        balance: Number(admin.balance != null ? admin.balance : (admin.cbal || admin.gen || 500000)),
        exposure: Number(admin.exposure != null ? admin.exposure : (admin.exp || 0)),
        share: Number(admin.share || 85),
        pcode: admin.pcode || 'dashboard,ma,ulist,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss'
      };
      this.saveState();
    }

    async syncUsersFromServer(token) {
      try {
        const authToken = token || localStorage.getItem('admin_token');
        if (!authToken) return [];
        const res = await fetch('/api/admin/insertuser?action=users', {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.users)) {
            this.state.users = data.users;
            this.saveState();
            return data.users;
          }
        }
      } catch (e) {
        console.warn('Failed to sync users from server:', e);
      }
      return this.state.users || [];
    }

    getAuthUsers() {
      const list = [];
      if (this.state.currentAdmin) {
        list.push({
          id: this.state.currentAdmin.id,
          uname: this.state.currentAdmin.uname,
          fname: this.state.currentAdmin.fname,
          role: this.state.currentAdmin.role,
          userType: this.state.currentAdmin.userType,
          userLevel: this.state.currentAdmin.userLevel,
          parentId: this.state.currentAdmin.parentId,
          createdBy: this.state.currentAdmin.createdBy,
          companyRootId: this.state.currentAdmin.companyRootId,
          ancestors: this.state.currentAdmin.ancestors,
          creditRef: this.state.currentAdmin.creditRef,
          balance: this.state.currentAdmin.balance,
          pcode: this.state.currentAdmin.pcode
        });
      }
      for (const u of (this.state.users || [])) {
        list.push({
          id: u.id,
          uname: u.uname,
          fname: u.fname,
          role: u.role,
          userType: u.userType,
          userLevel: u.userLevel,
          parentId: u.parentId,
          createdBy: u.createdBy,
          companyRootId: u.companyRootId,
          ancestors: u.ancestors,
          creditRef: u.creditRef,
          balance: u.balance,
          pcode: u.pcode,
          passHash: u.passHash,
          password: u.password,
          status: u.status,
          login: u.login !== undefined ? u.login : true,
          firstLogin: u.firstLogin !== undefined ? u.firstLogin : false,
          tranCode: u.tranCode || '130367'
        });
      }
      return list;
    }

    /**
     * Get Users Scoped to current admin's authorized branch
     */
    getUsers(filterType) {
      const current = this.state.currentAdmin;
      const allUsers = this.state.users || [];
      const currentUname = (current?.uname || '').toLowerCase();

      // Downline / Branch Authorization Filter - exclude self from client list
      let scopedUsers = allUsers.filter(u => {
        if (!u || !u.uname) return false;
        if (u.uname.toLowerCase() === currentUname) return false;
        return this.isDescendant(current, u);
      });

      if (!filterType || filterType === 'all') {
        return scopedUsers;
      }

      const normFilter = normalizeRole(filterType);
      return scopedUsers.filter(u => normalizeRole(u.role || u.userType) === normFilter);
    }

    getUserByGuid(guid) {
      const current = this.state.currentAdmin;
      const found = (this.state.users || []).find(u => u.id === String(guid) || u.uname.toLowerCase() === String(guid).toLowerCase());
      if (found && this.canViewAccount(current, found)) {
        return found;
      }
      return null;
    }

    getDownline(uplineUname) {
      const current = this.state.currentAdmin;
      const uplineKey = String(uplineUname).toLowerCase();
      return (this.state.users || []).filter(u => 
        ((u.createdBy || u.upline || '').toLowerCase() === uplineKey || String(u.parentId).toLowerCase() === uplineKey) &&
        this.canViewAccount(current, u)
      );
    }

    buildDownlineTree(actor) {
      const root = actor || this.state.currentAdmin;
      const visible = (this.state.users || []).filter(u => this.canViewAccount(root, u));
      const rootKey = (root.uname || '').toLowerCase();

      const nodes = {};
      for (const u of visible) {
        const k = (u.uname || '').toLowerCase();
        nodes[k] = {
          id: u.id,
          uname: u.uname,
          fname: u.fname || u.uname,
          role: normalizeRole(u.role || u.userType),
          roleLabel: ROLE_LABELS[normalizeRole(u.role || u.userType)],
          userType: ROLE_TO_NUMERIC[normalizeRole(u.role || u.userType)],
          parentId: u.parentId,
          createdBy: u.createdBy || u.upline,
          companyRootId: u.companyRootId,
          creditRef: u.creditRef != null ? u.creditRef : 0,
          balance: u.balance != null ? u.balance : 0,
          status: u.status || 'Active',
          createdAt: u.createdAt || '',
          children: [],
          directCount: 0,
          totalDescendants: 0
        };
      }

      if (!nodes[rootKey]) {
        nodes[rootKey] = {
          id: root.id || 'root',
          uname: root.uname,
          fname: root.fname || root.uname,
          role: normalizeRole(root.role || root.userType),
          roleLabel: ROLE_LABELS[normalizeRole(root.role || root.userType)],
          userType: ROLE_TO_NUMERIC[normalizeRole(root.role || root.userType)],
          parentId: null,
          createdBy: null,
          companyRootId: root.companyRootId,
          creditRef: root.creditRef || 0,
          balance: root.balance || 0,
          status: 'Active',
          createdAt: '',
          children: [],
          directCount: 0,
          totalDescendants: 0
        };
      }

      for (const [key, node] of Object.entries(nodes)) {
        if (key === rootKey) continue;
        const parentUname = (node.createdBy || '').toLowerCase();
        if (parentUname && nodes[parentUname] && parentUname !== key) {
          nodes[parentUname].children.push(node);
          nodes[parentUname].directCount++;
        } else if (normalizeRole(root.role) === 'company') {
          if (node !== nodes[rootKey]) {
            nodes[rootKey].children.push(node);
            nodes[rootKey].directCount++;
          }
        }
      }

      function calcDescendants(node) {
        let count = node.children.length;
        for (const child of node.children) {
          count += calcDescendants(child);
        }
        node.totalDescendants = count;
        return count;
      }

      calcDescendants(nodes[rootKey]);
      return nodes[rootKey];
    }

    updateUserPassword(uname, newPassword, newTranCode) {
      if (!uname) return false;
      const key = String(uname).trim().toLowerCase();
      const u = (this.state.users || []).find(x => (x.uname || '').toLowerCase() === key);
      if (u) {
        u.password = newPassword;
        u.passHash = '';
        u.login = true;
        u.firstLogin = false;
        if (newTranCode) u.tranCode = newTranCode;
        this.saveState();
        return true;
      }
      if (this.state.currentAdmin && (this.state.currentAdmin.uname || '').toLowerCase() === key) {
        this.state.currentAdmin.password = newPassword;
        this.state.currentAdmin.passHash = '';
        this.state.currentAdmin.login = true;
        this.state.currentAdmin.firstLogin = false;
        if (newTranCode) this.state.currentAdmin.tranCode = newTranCode;
        this.saveState();
        return true;
      }
      return false;
    }

    insertUser(userData) {
      const current = this.state.currentAdmin;
      const actorRole = normalizeRole(current.role || current.userType);

      if (actorRole === 'user') {
        throw new Error('Forbidden: Normal Users cannot create accounts.');
      }

      const targetRole = normalizeRole(userData.role || userData.userType || userData.newlvlno);
      if (!this.canCreateRole(actorRole, targetRole)) {
        throw new Error(`Forbidden: ${ROLE_LABELS[actorRole]} cannot create ${ROLE_LABELS[targetRole]}.`);
      }

      const newId = String(Date.now()).slice(-5);
      const userType = ROLE_TO_NUMERIC[targetRole] || '6';
      const userLevel = ROLE_LABELS[targetRole] || 'Normal User';

      const parentAncestors = Array.isArray(current.ancestors) ? current.ancestors : [];
      const ancestors = [...parentAncestors, current.uname.toLowerCase()];

      const user = {
        id: newId,
        uname: userData.uname,
        fname: userData.fname || userData.uname,
        lname: userData.lname || userLevel,
        role: targetRole,
        userType: userType,
        userLevel: userLevel,
        pcode: userData.pcode || '',
        parentId: current.id || current.uname,
        createdBy: current.uname,
        companyRootId: current.companyRootId || '78859',
        ancestors: ancestors,
        upline: current.uname,
        creditRef: Number(userData.creditRef != null ? userData.creditRef : (userData.camt || 0)),
        balance: Number(userData.balance != null ? userData.balance : (userData.creditRef || userData.camt || 0)),
        exposure: 0,
        clientPL: 0,
        share: Number(userData.share != null ? userData.share : (userData.spart1 || 0)),
        comm: Number(userData.comm || 0),
        casinoShare: Number(userData.casinoShare || 0),
        status: userData.status || 'Active',
        betActive: true,
        userActive: true,
        passHash: userData.passHash || '',
        password: userData.password || '',
        login: userData.login !== undefined ? userData.login : true,
        firstLogin: userData.firstLogin !== undefined ? userData.firstLogin : false,
        tranCode: userData.tranCode || '130367',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      const existingIdx = this.state.users.findIndex(u => (u.uname || '').toLowerCase() === user.uname.toLowerCase());
      if (existingIdx >= 0) {
        this.state.users[existingIdx] = { ...this.state.users[existingIdx], ...user };
      } else {
        this.state.users.unshift(user);
      }
      this.saveState();
      return user;
    }

    depositWithdraw(userId, type, amount, remarks) {
      const user = this.state.users.find(u => u.id === String(userId));
      if (!user) throw new Error('User not found');

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) throw new Error('Invalid amount');

      if (type === 'Deposit') {
        if (this.state.currentAdmin.balance < numAmount) {
          throw new Error('Insufficient Admin balance for deposit');
        }
        this.state.currentAdmin.balance -= numAmount;
        user.balance += numAmount;
      } else if (type === 'Withdraw') {
        if (user.balance < numAmount) {
          throw new Error('Insufficient User balance for withdrawal');
        }
        user.balance -= numAmount;
        this.state.currentAdmin.balance += numAmount;
      } else {
        throw new Error('Invalid transaction type');
      }

      const txn = {
        id: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        fromUser: type === 'Deposit' ? this.state.currentAdmin.uname : user.uname,
        toUser: type === 'Deposit' ? user.uname : this.state.currentAdmin.uname,
        type: type,
        debit: type === 'Deposit' ? numAmount : 0,
        credit: type === 'Withdraw' ? numAmount : 0,
        balance: this.state.currentAdmin.balance,
        remarks: remarks || `${type} transaction`
      };

      this.state.ledger.unshift(txn);
      this.saveState();
      return { user, adminBalance: this.state.currentAdmin.balance, txn };
    }

    updateCreditRef(userId, newCreditRef, remarks) {
      const user = this.state.users.find(u => u.id === String(userId));
      if (!user) throw new Error('User not found');
      user.creditRef = Number(newCreditRef);
      this.saveState();
      return user;
    }

    updateStatus(userId, userActive, betActive) {
      const user = this.state.users.find(u => u.id === String(userId));
      if (!user) throw new Error('User not found');
      if (!this.canDisableAccount(this.state.currentAdmin, user)) {
        throw new Error('Forbidden: You do not have permission to change status for this account.');
      }
      user.userActive = !!userActive;
      user.betActive = !!betActive;
      user.status = userActive ? (betActive ? 'Active' : 'Bet Locked') : 'Inactive';
      this.saveState();
      return user;
    }

    settleUser(userId, remarks) {
      const user = this.state.users.find(u => u.id === String(userId));
      if (!user) throw new Error('User not found');

      const settlementAmount = user.clientPL;
      if (settlementAmount === 0) throw new Error('No outstanding settlement amount');

      if (settlementAmount > 0) {
        this.state.currentAdmin.balance -= settlementAmount;
        user.balance += settlementAmount;
      } else {
        this.state.currentAdmin.balance += Math.abs(settlementAmount);
        user.balance -= Math.abs(settlementAmount);
      }

      user.clientPL = 0;

      const txn = {
        id: 'SETTLE-' + Math.floor(1000 + Math.random() * 9000),
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        fromUser: settlementAmount > 0 ? this.state.currentAdmin.uname : user.uname,
        toUser: settlementAmount > 0 ? user.uname : this.state.currentAdmin.uname,
        type: 'Settlement',
        debit: settlementAmount > 0 ? settlementAmount : 0,
        credit: settlementAmount < 0 ? Math.abs(settlementAmount) : 0,
        balance: this.state.currentAdmin.balance,
        remarks: remarks || 'Settlement executed'
      };

      this.state.ledger.unshift(txn);
      this.saveState();
      return { user, txn };
    }

    getLedger() {
      return this.state.ledger;
    }

    getLiveMatches() {
      return this.state.liveMatches;
    }

    getCurrentBets() {
      return this.state.currentBets;
    }

    getCasinoResults() {
      return this.state.casinoResults;
    }

    getButtons() {
      return this.state.buttons;
    }

    saveButtons(buttons) {
      this.state.buttons = buttons;
      this.saveState();
    }

    voidBet(betId) {
      const idx = this.state.currentBets.findIndex(b => b.id === betId);
      if (idx !== -1) {
        const removed = this.state.currentBets.splice(idx, 1)[0];
        const user = this.state.users.find(u => u.uname === removed.user);
        if (user && user.exposure > 0) {
          user.exposure = Math.max(0, user.exposure - (removed.stake || 0));
        }
        this.saveState();
        return removed;
      }
      return null;
    }

    updateExposureLimit(userId, newLimit) {
      const user = this.state.users.find(u => u.id === String(userId));
      if (!user) throw new Error('User not found');
      user.exposureLimit = Number(newLimit);
      this.saveState();
      return user;
    }

    changePassword(userIdOrUname, newPassword) {
      const user = this.state.users.find(u => u.id === String(userIdOrUname) || u.uname === String(userIdOrUname));
      if (user) {
        user.password = newPassword;
        this.saveState();
        return user;
      }
      return null;
    }

    lockAllUsers(isLock) {
      this.state.users.forEach(u => {
        if (this.canDisableAccount(this.state.currentAdmin, u)) {
          u.userActive = !isLock;
          u.status = isLock ? 'Inactive' : 'Active';
        }
      });
      this.saveState();
    }

    lockAllBets(isLock) {
      this.state.users.forEach(u => {
        if (this.canDisableAccount(this.state.currentAdmin, u)) {
          u.betActive = !isLock;
        }
      });
      this.saveState();
    }
  }

  window.AdminDataStore = new AdminDataStore();

})(window);
