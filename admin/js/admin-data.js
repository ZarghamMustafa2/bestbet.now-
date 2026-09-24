/**
 * BestBet9 Admin Panel - Data Store & State Engine
 * Handles state persistence, hierarchy, settlement calculations, and ledger.
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'bestbet9_admin_state_v1';

  const defaultState = {
    currentAdmin: {
      uname: 'Faazan50',
      fname: 'Faazan',
      lname: 'Master',
      userType: '4',
      userLevel: 'Master',
      upline: 'SuperMaster_Apex',
      creditRef: 1000000,
      balance: 500000,
      exposure: 12500,
      share: 85,
      pcode: 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss'
    },
    users: [
      {
        id: '101',
        uname: 'Agent_Alpha',
        fname: 'Alpha Services',
        userType: '5',
        userLevel: 'Agent',
        upline: 'Faazan50',
        creditRef: 200000,
        balance: 145000,
        exposure: 4200,
        clientPL: -12000,
        share: 80,
        casinoShare: 80,
        status: 'Active',
        betActive: true,
        userActive: true,
        createdAt: '2026-08-10 14:20:00'
      },
      {
        id: '102',
        uname: 'Agent_Beta',
        fname: 'Beta Operations',
        userType: '5',
        userLevel: 'Agent',
        upline: 'Faazan50',
        creditRef: 300000,
        balance: 210000,
        exposure: 6100,
        clientPL: 18500,
        share: 75,
        casinoShare: 75,
        status: 'Active',
        betActive: true,
        userActive: true,
        createdAt: '2026-08-14 09:15:00'
      },
      {
        id: '103',
        uname: 'Client_Direct',
        fname: 'Direct VIP Client',
        userType: '6',
        userLevel: 'Client',
        upline: 'Faazan50',
        creditRef: 50000,
        balance: 42000,
        exposure: 2200,
        clientPL: -3400,
        share: 0,
        casinoShare: 0,
        status: 'Active',
        betActive: true,
        userActive: true,
        createdAt: '2026-09-01 11:30:00'
      },
      {
        id: '104',
        uname: 'Client_001',
        fname: 'Ravi Sharma',
        userType: '6',
        userLevel: 'Client',
        upline: 'Agent_Alpha',
        creditRef: 50000,
        balance: 48000,
        exposure: 1500,
        clientPL: -2000,
        share: 0,
        casinoShare: 0,
        status: 'Active',
        betActive: true,
        userActive: true,
        createdAt: '2026-08-18 16:45:00'
      },
      {
        id: '105',
        uname: 'Client_002',
        fname: 'Amit Verma',
        userType: '6',
        userLevel: 'Client',
        upline: 'Agent_Alpha',
        creditRef: 50000,
        balance: 35000,
        exposure: 2700,
        clientPL: -10000,
        share: 0,
        casinoShare: 0,
        status: 'Active',
        betActive: true,
        userActive: true,
        createdAt: '2026-08-20 12:10:00'
      },
      {
        id: '106',
        uname: 'Client_003',
        fname: 'Karan Singh',
        userType: '6',
        userLevel: 'Client',
        upline: 'Agent_Beta',
        creditRef: 100000,
        balance: 112000,
        exposure: 3800,
        clientPL: 12000,
        share: 0,
        casinoShare: 0,
        status: 'Active',
        betActive: true,
        userActive: true,
        createdAt: '2026-08-25 10:00:00'
      },
      {
        id: '107',
        uname: 'Client_004',
        fname: 'Deepak Patel',
        userType: '6',
        userLevel: 'Client',
        upline: 'Agent_Beta',
        creditRef: 80000,
        balance: 74000,
        exposure: 2300,
        clientPL: 6500,
        share: 0,
        casinoShare: 0,
        status: 'Inactive',
        betActive: false,
        userActive: true,
        createdAt: '2026-08-28 15:30:00'
      }
    ],
    ledger: [
      {
        id: 'TXN-901',
        date: '2026-09-17 01:15:00',
        fromUser: 'Faazan50',
        toUser: 'Agent_Alpha',
        type: 'Deposit',
        debit: 50000,
        credit: 0,
        balance: 500000,
        remarks: 'Credit balance topup'
      },
      {
        id: 'TXN-902',
        date: '2026-09-16 22:40:00',
        fromUser: 'Agent_Beta',
        toUser: 'Faazan50',
        type: 'Settlement',
        debit: 0,
        credit: 18500,
        balance: 550000,
        remarks: 'Weekly cricket match settlement'
      },
      {
        id: 'TXN-903',
        date: '2026-09-16 18:20:00',
        fromUser: 'Faazan50',
        toUser: 'Client_Direct',
        type: 'Deposit',
        debit: 20000,
        credit: 0,
        balance: 531500,
        remarks: 'Direct client chip allocation'
      },
      {
        id: 'TXN-904',
        date: '2026-09-15 21:00:00',
        fromUser: 'Agent_Alpha',
        toUser: 'Faazan50',
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
        user: 'Client_001',
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
        user: 'Client_003',
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
        user: 'Client_002',
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
      this.state = this.loadState();
    }

    loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { ...defaultState, ...parsed };
        }
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

    getUsers(filterType) {
      if (!filterType || filterType === 'all') {
        return this.state.users;
      }
      return this.state.users.filter(u => u.userType === String(filterType) || u.userLevel.toLowerCase() === String(filterType).toLowerCase());
    }

    getUserByGuid(guid) {
      return this.state.users.find(u => u.id === String(guid) || u.uname.toLowerCase() === String(guid).toLowerCase());
    }

    getDownline(uplineUname) {
      return this.state.users.filter(u => u.upline.toLowerCase() === uplineUname.toLowerCase());
    }

    insertUser(userData) {
      const newId = String(Date.now()).slice(-5);
      const user = {
        id: newId,
        uname: userData.uname,
        fname: userData.fname || userData.uname,
        userType: String(userData.userType || '6'),
        userLevel: userData.userLevel || (userData.userType === '5' ? 'Agent' : 'Client'),
        upline: userData.upline || this.state.currentAdmin.uname,
        creditRef: Number(userData.creditRef || 0),
        balance: Number(userData.balance || 0),
        exposure: 0,
        clientPL: 0,
        share: Number(userData.share || 0),
        casinoShare: Number(userData.casinoShare || 0),
        status: 'Active',
        betActive: true,
        userActive: true,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      this.state.users.unshift(user);
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
        // Client won, admin pays
        this.state.currentAdmin.balance -= settlementAmount;
        user.balance += settlementAmount;
      } else {
        // Client lost, admin receives
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
        // Reduce user exposure
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
        u.userActive = !isLock;
        u.status = isLock ? 'Inactive' : 'Active';
      });
      this.saveState();
    }

    lockAllBets(isLock) {
      this.state.users.forEach(u => {
        u.betActive = !isLock;
      });
      this.saveState();
    }
  }

  window.AdminDataStore = new AdminDataStore();

})(window);
