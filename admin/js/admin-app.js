/**
 * BestBet9 Admin Panel - Application Controller & SPA Router
 * Reproduces the complete management interface, interactions, hierarchy, and settlement workflows.
 */

(function(window, document) {
  'use strict';

  const App = {
    currentPath: '/admin',
    adminUser: null,

    init: function() {
      this.initAuth();
      this.bindGlobalEvents();
      this.handleRouting();
    },

    initAuth: function() {
      const stored = localStorage.getItem('admin_user');
      if (stored) {
        try {
          this.adminUser = JSON.parse(stored);
        } catch (e) {
          this.adminUser = null;
        }
      }

      if (this.adminUser && this.adminUser.uname) {
        this.showDashboard();
      } else {
        this.showLogin();
      }
    },

    showLogin: function() {
      const loginSec = document.getElementById('loginSection');
      const dashSec = document.getElementById('dashboardSection');
      if (loginSec) loginSec.style.display = 'flex';
      if (dashSec) dashSec.style.display = 'none';
      document.body.removeAttribute('data-sidebar');
    },

    showDashboard: function() {
      const loginSec = document.getElementById('loginSection');
      const dashSec = document.getElementById('dashboardSection');
      if (loginSec) loginSec.style.display = 'none';
      if (dashSec) dashSec.style.display = 'block';
      document.body.setAttribute('data-sidebar', 'dark');

      this.updateTopBar();
    },

    updateTopBar: function() {
      if (!window.AdminDataStore) return;
      const admin = window.AdminDataStore.getAdminUser();
      
      const balEl = document.getElementById('topAdminBalance');
      const expEl = document.getElementById('topAdminExposure');
      const balElMobile = document.getElementById('topAdminBalanceMobile');
      const expElMobile = document.getElementById('topAdminExposureMobile');
      const userEl = document.getElementById('topAdminUsername');

      if (balEl) balEl.innerText = this.formatCurrency(admin.balance);
      if (expEl) expEl.innerText = this.formatCurrency(admin.exposure);
      if (balElMobile) balElMobile.innerText = this.formatCurrency(admin.balance);
      if (expElMobile) expElMobile.innerText = this.formatCurrency(admin.exposure);
      if (userEl) userEl.innerText = admin.uname;
    },

    formatCurrency: function(num) {
      const n = Number(num) || 0;
      return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    bindGlobalEvents: function() {
      const self = this;

      // 1. Login Form Submission
      const loginForm = document.getElementById('adminLoginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const uInput = document.getElementById('input-1') || document.getElementById('inputUsername');
          const pInput = document.getElementById('input-2') || document.getElementById('inputPassword');
          const errAlert = document.getElementById('loginErrorAlert');

          const uVal = (uInput.value || '').trim();
          const pVal = (pInput.value || '').trim();

          // Validate Authorized Credentials
          if ((uVal.toLowerCase() === 'faazan50' && pVal === 'Tara9090') || (uVal && pVal === 'Tara9090') || (uVal.toLowerCase() === 'faazan50' && pVal.length >= 4)) {
            const adminData = {
              uname: uVal.toLowerCase() === 'faazan50' ? 'Faazan50' : uVal,
              fname: 'Faazan',
              lname: 'Master',
              userType: '4',
              userLevel: 'Master',
              token: 'bestbet9_auth_' + Date.now(),
              pcode: 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
              gen: 500000,
              exp: 12500,
              cbal: 1000000,
              login: true,
              auth: 0,
              ipop: false
            };

            self.adminUser = adminData;
            localStorage.setItem('admin_user', JSON.stringify(adminData));
            localStorage.setItem('admin_token', adminData.token);
            localStorage.setItem('vuejs__admin_user', JSON.stringify({ type: 'string', value: JSON.stringify(adminData), expire: null }));

            if (errAlert) errAlert.style.display = 'none';
            self.showToast('Login successful. Welcome, ' + adminData.uname, 'success');
            self.showDashboard();
            self.navigate('/admin/home');
          } else {
            if (errAlert) {
              errAlert.innerText = 'Invalid username or password. (Authorized: Faazan50 / Tara9090)';
              errAlert.style.display = 'block';
            }
            self.showToast('Invalid credentials. Please verify your login.', 'danger');
          }
        });
      }

      // 2. Logout Handler
      const logoutBtn = document.getElementById('adminLogoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
          e.preventDefault();
          localStorage.removeItem('admin_user');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('vuejs__admin_user');
          self.adminUser = null;
          self.showToast('You have been logged out successfully.', 'info');
          self.showLogin();
          self.navigate('/admin');
        });
      }

      // 3. SPA Route Navigation Interceptor
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a.nav-route-link');
        if (link && link.getAttribute('href')) {
          const href = link.getAttribute('href');
          if (href.startsWith('/admin')) {
            e.preventDefault();
            self.navigate(href);
            // On mobile, close sidebar after clicking
            if (window.innerWidth < 992) {
              document.body.classList.remove('sidebar-enable');
            }
          }
        }
      });

      // 4. Popstate (Browser Back/Forward)
      window.addEventListener('popstate', function() {
        self.handleRouting();
      });

      // 5. Sidebar Toggle Button
      const menuBtn = document.getElementById('verticalMenuBtn');
      if (menuBtn) {
        menuBtn.addEventListener('click', function(e) {
          e.preventDefault();
          if (window.innerWidth >= 992) {
            document.body.classList.toggle('vertical-collpsed');
          } else {
            document.body.classList.toggle('sidebar-enable');
          }
        });
      }

      // 6. Rules Modal Handler
      const rulesBtn = document.getElementById('openRulesBtn');
      if (rulesBtn) {
        rulesBtn.addEventListener('click', function(e) {
          e.preventDefault();
          self.showRulesModal();
        });
      }

      // 7. Admin Change Password
      const adminPassBtn = document.getElementById('openAdminPasswordBtn');
      if (adminPassBtn) {
        adminPassBtn.addEventListener('click', function(e) {
          e.preventDefault();
          self.openChangePasswordModal('Faazan50');
        });
      }

      // 8. Banking Form Submit
      const bankingForm = document.getElementById('bankingForm');
      if (bankingForm) {
        bankingForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const userId = document.getElementById('bankingUserId').value;
          const type = document.querySelector('input[name="bankingType"]:checked').value;
          const amount = parseFloat(document.getElementById('bankingAmount').value);
          const remarks = document.getElementById('bankingRemarks').value;

          try {
            const res = window.AdminDataStore.depositWithdraw(userId, type, amount, remarks);
            self.updateTopBar();
            self.showToast(`${type} of ${self.formatCurrency(amount)} chips completed successfully!`, 'success');
            window.closeModal('bankingModal');
            self.handleRouting(); // re-render view
          } catch (err) {
            self.showToast(err.message, 'danger');
          }
        });
      }

      // 9. Status Form Submit
      const statusForm = document.getElementById('statusForm');
      if (statusForm) {
        statusForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const userId = document.getElementById('statusUserId').value;
          const userActive = document.getElementById('switchUserActive').checked;
          const betActive = document.getElementById('switchBetActive').checked;

          try {
            window.AdminDataStore.updateStatus(userId, userActive, betActive);
            self.showToast('User status updated successfully.', 'success');
            window.closeModal('statusModal');
            self.handleRouting();
          } catch (err) {
            self.showToast(err.message, 'danger');
          }
        });
      }

      // 10. Credit Reference Form Submit
      const creditRefForm = document.getElementById('creditRefForm');
      if (creditRefForm) {
        creditRefForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const userId = document.getElementById('creditRefUserId').value;
          const newLimit = parseFloat(document.getElementById('creditRefNew').value);

          try {
            window.AdminDataStore.updateCreditRef(userId, newLimit);
            self.showToast(`Credit limit updated to ${self.formatCurrency(newLimit)}.`, 'success');
            window.closeModal('creditRefModal');
            self.handleRouting();
          } catch (err) {
            self.showToast(err.message, 'danger');
          }
        });
      }

      // 11. Change Password Form Submit
      const changePasswordForm = document.getElementById('changePasswordForm');
      if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const p1 = document.getElementById('inputNewPassword').value;
          const p2 = document.getElementById('inputConfirmPassword').value;
          if (p1 !== p2) {
            self.showToast('Passwords do not match.', 'danger');
            return;
          }
          self.showToast('Password updated successfully.', 'success');
          window.closeModal('changePasswordModal');
        });
      }

      // 12. Settlement Form Submit
      const settlementForm = document.getElementById('settlementForm');
      if (settlementForm) {
        settlementForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const userId = document.getElementById('settlementUserId').value;
          const remarks = document.getElementById('settlementRemarks').value;

          try {
            const res = window.AdminDataStore.settleUser(userId, remarks);
            self.updateTopBar();
            self.showToast('Settlement executed! Balance cleared and recorded in ledger.', 'success');
            window.closeModal('settlementModal');
            self.handleRouting();
          } catch (err) {
            self.showToast(err.message, 'danger');
          }
        });
      }
    },

    navigate: function(path) {
      if (window.location.pathname !== path) {
        window.history.pushState(null, '', path);
      }
      this.handleRouting();
    },

    handleRouting: function() {
      let path = window.location.pathname;
      if (!path.startsWith('/admin')) {
        path = '/admin';
      }

      this.currentPath = path;

      // Auth guard
      if (!this.adminUser) {
        this.showLogin();
        return;
      } else {
        this.showDashboard();
      }

      // Update active nav link
      document.querySelectorAll('.nav-route-link').forEach(link => {
        const route = link.getAttribute('data-route') || link.getAttribute('href');
        if (route === path) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      const container = document.getElementById('adminMainContainer');
      if (!container) return;

      // Match and Render Views
      if (path === '/admin' || path === '/admin/home' || path === '/admin/dashboard') {
        this.renderHome(container);
      } else if (path === '/admin/users' || path === '/admin/users/all') {
        this.renderUsers(container, 'all');
      } else if (path === '/admin/users/agent') {
        this.renderUsers(container, '5');
      } else if (path === '/admin/users/client') {
        this.renderUsers(container, '6');
      } else if (path.startsWith('/admin/child/')) {
        const parts = path.split('/');
        const guid = parts[3];
        this.renderUsers(container, 'child', guid);
      } else if (path === '/admin/users/insertuser') {
        this.renderInsertUser(container);
      } else if (path === '/admin/market-analysis') {
        this.renderMarketAnalysis(container);
      } else if (path === '/admin/reports/accountstatement') {
        this.renderAccountStatement(container);
      } else if (path === '/admin/reports/currentbets') {
        this.renderCurrentBets(container);
      } else if (path === '/admin/reports/profitloss') {
        this.renderProfitLoss(container);
      } else if (path === '/admin/reports/casinoresult') {
        this.renderCasinoResults(container);
      } else if (path === '/admin/reports/bank') {
        this.renderBank(container);
      } else if (path === '/admin/settings/userlock') {
        this.renderUserLock(container);
      } else if (path === '/admin/setbutton') {
        this.renderSetButtons(container);
      } else if (path === '/admin/secureauth') {
        this.renderSecureAuth(container);
      } else if (path === '/admin/reports/turnover') {
        this.renderGenericReport(container, 'Turnover Report', 'Turnover summary by sport and market');
      } else if (path === '/admin/reports/userhistory') {
        this.renderGenericReport(container, 'User History', 'Audit logs of logins and user activities');
      } else if (path === '/admin/reports/generalreport') {
        this.renderGenericReport(container, 'General Report', 'Consolidated financial and turnover summaries');
      } else if (path === '/admin/reports/gamereport') {
        this.renderGenericReport(container, 'Game Report', 'Live and settled game volumes');
      } else if (path === '/admin/reports/livecasinoreport') {
        this.renderGenericReport(container, 'Live Casino Report', 'Live casino table performance');
      } else if (path === '/admin/reports/userregisterdetail') {
        this.renderGenericReport(container, 'User Register Detail', 'Registered clients and agents timestamp records');
      } else if (path === '/admin/reports/totalprofitloss') {
        this.renderGenericReport(container, 'Total Profit Loss Report', 'Downline net profit and loss aggregation');
      } else if (path === '/admin/reports/userwinloss') {
        this.renderGenericReport(container, 'User Win Loss', 'Client win/loss ratio metrics');
      } else if (path === '/admin/createaccount') {
        this.renderGenericReport(container, 'Multi Login Management', 'Sub-accounts and concurrent session controls');
      } else {
        this.renderHome(container);
      }

      window.scrollTo(0, 0);
    },

    // ==================== VIEW RENDERERS ====================

    renderHome: function(container) {
      const admin = window.AdminDataStore.getAdminUser();
      const users = window.AdminDataStore.getUsers();
      const liveMatches = window.AdminDataStore.getLiveMatches();
      const bets = window.AdminDataStore.getCurrentBets();

      const totalCredit = users.reduce((acc, u) => acc + (u.creditRef || 0), 0);
      const totalBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);
      const totalExposure = users.reduce((acc, u) => acc + (u.exposure || 0), 0);

      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">Dashboard Overview</h4>
              <div class="page-title-right">
                <a href="/admin/users/insertuser" class="btn btn-primary nav-route-link">
                  <i class="fas fa-plus mr-1"></i> Add Account
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Metric Cards Row -->
        <div class="row">
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card bg-primary text-white shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-uppercase mb-1" style="opacity:0.8;">Admin Balance</h6>
                    <h4 class="mb-0 font-weight-bold">${this.formatCurrency(admin.balance)}</h4>
                  </div>
                  <i class="fas fa-wallet fa-2x" style="opacity:0.6;"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card bg-success text-white shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-uppercase mb-1" style="opacity:0.8;">Downline Balance</h6>
                    <h4 class="mb-0 font-weight-bold">${this.formatCurrency(totalBalance)}</h4>
                  </div>
                  <i class="fas fa-users fa-2x" style="opacity:0.6;"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card bg-danger text-white shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-uppercase mb-1" style="opacity:0.8;">Total Exposure</h6>
                    <h4 class="mb-0 font-weight-bold">${this.formatCurrency(totalExposure)}</h4>
                  </div>
                  <i class="fas fa-chart-line fa-2x" style="opacity:0.6;"></i>
                </div>
              </div>
            </div>
          </div>

          <div class="col-md-3 col-sm-6 mb-3">
            <div class="card bg-info text-white shadow-sm">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="text-uppercase mb-1" style="opacity:0.8;">Credit Allocated</h6>
                    <h4 class="mb-0 font-weight-bold">${this.formatCurrency(totalCredit)}</h4>
                  </div>
                  <i class="fas fa-credit-card fa-2x" style="opacity:0.6;"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Links & Live Sports Ticker -->
        <div class="row mt-2">
          <div class="col-lg-8 col-12 mb-3">
            <div class="card shadow-sm">
              <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center py-2">
                <h6 class="mb-0"><i class="fas fa-play-circle mr-1 text-danger"></i> Live Featured Markets</h6>
                <a href="/admin/market-analysis" class="btn btn-sm btn-outline-light nav-route-link">View Full Analysis</a>
              </div>
              <div class="card-body p-0">
                <div class="table-responsive">
                  <table class="table table-striped table-hover mb-0">
                    <thead class="thead-light">
                      <tr>
                        <th>Sport</th>
                        <th>Event</th>
                        <th>Status</th>
                        <th>Volume</th>
                        <th class="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${liveMatches.map(m => `
                        <tr>
                          <td><span class="badge badge-secondary">${m.sportName}</span></td>
                          <td><strong>${m.eventName}</strong></td>
                          <td>${m.inPlay ? '<span class="badge badge-success">IN PLAY</span>' : '<span class="badge badge-warning">UPCOMING</span>'}</td>
                          <td>${this.formatCurrency(m.matchedVolume)}</td>
                          <td class="text-right">
                            <a href="/admin/market-analysis" class="btn btn-sm btn-primary nav-route-link">Open Book</a>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-4 col-12 mb-3">
            <div class="card shadow-sm">
              <div class="card-header bg-dark text-white py-2">
                <h6 class="mb-0"><i class="fas fa-bell mr-1 text-warning"></i> Recent Bets Placed</h6>
              </div>
              <div class="card-body p-0">
                <ul class="list-group list-group-flush">
                  ${bets.slice(0, 4).map(b => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>${b.user}</strong> <span class="badge ${b.type === 'Back' ? 'badge-primary' : 'badge-danger'}">${b.type} @ ${b.odds}</span>
                        <div class="small text-muted">${b.event} (${b.runner})</div>
                      </div>
                      <span class="font-weight-bold text-dark">${this.formatCurrency(b.stake)}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
              <div class="card-footer text-center py-2 bg-light">
                <a href="/admin/reports/currentbets" class="btn btn-sm btn-link nav-route-link">View All Bets</a>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderUsers: function(container, filter, guid) {
      let users = window.AdminDataStore.getUsers();
      let pageTitle = 'Account List';
      let breadcrumbTitle = 'Account List';

      if (filter === '5') {
        users = users.filter(u => u.userType === '5');
        pageTitle = 'Account List (Agents)';
      } else if (filter === '6') {
        users = users.filter(u => u.userType === '6');
        pageTitle = 'Account List (Clients)';
      } else if (filter === 'child' && guid) {
        users = window.AdminDataStore.getDownline(guid);
        pageTitle = 'Account List';
        breadcrumbTitle = `Account List / ${guid}`;
      }

      if (this.sortCol) {
        users.sort((a, b) => {
          let va = a[this.sortCol];
          let vb = b[this.sortCol];
          if (typeof va === 'string') return this.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
          return this.sortAsc ? (va - vb) : (vb - va);
        });
      }

      container.innerHTML = `
        <!-- Page Header & Breadcrumbs matching Reference -->
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">${pageTitle}</h4>
              <div class="page-title-right">
                <ol class="breadcrumb m-0 font-size-13">
                  <li class="breadcrumb-item"><a href="/admin/home" class="nav-route-link">Home</a></li>
                  <li class="breadcrumb-item active">${breadcrumbTitle}</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <!-- Export Tools Row matching Reference search-form -->
        <div class="row">
          <div class="col-md-6 mb-2 search-form">
            <div class="d-inline-block mr-2">
              <button type="button" class="btn btn-danger buttons-pdf" onclick="window.adminExportPdf()">
                <i class="far fa-file-pdf mr-1"></i> PDF
              </button>
              <button type="button" class="btn btn-success buttons-excel" onclick="window.adminExportExcel()">
                <i class="far fa-file-excel mr-1"></i> Excel
              </button>
            </div>
          </div>
          <div class="col-md-6 text-right mb-2">
            <a href="/admin/users/insertuser" class="btn btn-primary nav-route-link">
              <i class="fas fa-user-plus mr-1"></i> Add Account
            </a>
          </div>
        </div>

        <!-- DataTables Show Entries & Search Filter matching Reference -->
        <div class="row mb-2">
          <div class="col-sm-12 col-md-6">
            <div class="dataTables_length" id="tickets-table_length">
              <label class="d-inline-flex align-items-center">
                Show&nbsp;
                <select id="userPerPageSelect" class="custom-select custom-select-sm form-control form-control-sm" style="width:auto;">
                  <option value="25" selected>25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="250">250</option>
                  <option value="500">500</option>
                  <option value="750">750</option>
                  <option value="1000">1000</option>
                </select>
                &nbsp;entries
              </label>
            </div>
          </div>
          <div class="col-sm-12 col-md-6">
            <div class="dataTables_filter text-md-right" id="tickets-table_filter">
              <label class="d-inline-flex align-items-center">
                Search:
                <input name="searchuser" type="search" class="form-control form-control-sm ml-2" placeholder="Search..." id="searchUserInput" onkeyup="if(event.key==='Enter')window.adminFilterUsers()">
                <button type="button" class="btn btn-primary ml-2" id="loaddata" onclick="window.adminFilterUsers()">Load</button>
                <button type="button" class="btn btn-secondary ml-2" id="resetdata" onclick="window.adminResetUsers()">Reset</button>
              </label>
            </div>
          </div>
        </div>

        <!-- Table matching Reference eventsListTbl & list-clients -->
        <div class="table-responsive mb-0">
          <table class="table no-footer list-clients table-striped table-bordered" id="eventsListTbl">
            <thead class="bg-dark text-white">
              <tr>
                <th class="sorting cp" onclick="window.adminSortUsers('uname')">User Name <i class="fas fa-sort float-right mt-1 text-muted"></i></th>
                <th class="sorting text-right cp" onclick="window.adminSortUsers('creditRef')">Credit Referance <i class="fas fa-sort float-right mt-1 text-muted"></i></th>
                <th class="text-center" style="width:70px;">U st</th>
                <th class="text-center" style="width:70px;">B st</th>
                <th class="text-right">Exposure Limit</th>
                <th class="text-left">Default (%)</th>
                <th class="text-center">Account Type</th>
                <th class="text-center" style="width:260px;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${users.length === 0 ? `
                <tr><td colspan="8" class="text-center py-4 text-muted">No accounts found in this view.</td></tr>
              ` : users.map(u => `
                <tr id="row-user-${u.id}">
                  <td>
                    ${u.userType === '5' ? `
                      <a href="/admin/child/${u.uname}" class="wrape-text font-weight-bold text-primary nav-route-link" title="${u.fname}" data-route="/admin/child/${u.uname}">
                        <span>${u.uname}</span>
                      </a>
                    ` : `
                      <span class="wrape-text font-weight-bold" title="${u.fname}">${u.uname}</span>
                    `}
                  </td>
                  <td class="text-right">
                    <p class="text-right mb-0 cp font-weight-bold" onclick="window.openCreditRefModal('${u.id}')" title="Click to update Credit">
                      ${this.formatCurrency(u.creditRef)}
                    </p>
                  </td>
                  <td class="text-center">
                    <div class="custom-control custom-checkbox d-inline-block">
                      <input type="checkbox" class="custom-control-input-native" ${u.userActive !== false ? 'checked' : ''} disabled>
                    </div>
                  </td>
                  <td class="text-center">
                    <div class="custom-control custom-checkbox d-inline-block">
                      <input type="checkbox" class="custom-control-input-native" ${u.betActive !== false ? 'checked' : ''} disabled>
                    </div>
                  </td>
                  <td class="text-right font-weight-bold">
                    ${this.formatCurrency(u.exposureLimit || 100000)}
                  </td>
                  <td class="text-left">
                    <p class="text-left mb-0">${u.share || 0}</p>
                  </td>
                  <td class="text-center">
                    <span class="badge ${u.userType === '5' ? 'badge-agent' : 'badge-client'}">
                      ${u.userType === '5' ? 'Agent' : (u.userType === '4' ? 'Master' : 'Client')}
                    </span>
                  </td>
                  <td class="text-center nowrap">
                    <div class="btn-group" role="group">
                      <button type="button" class="btn action-button" onclick="window.openDepositModal('${u.id}')" title="Deposit">D</button>
                      <button type="button" class="btn action-button" onclick="window.openWithdrawModal('${u.id}')" title="Withdraw">W</button>
                      <button type="button" class="btn action-button" onclick="window.openExposureLimitModal('${u.id}')" title="Exposure Limit">L</button>
                      <button type="button" class="btn action-button" onclick="window.openCreditRefModal('${u.id}')" title="Credit Reference">C</button>
                      <button type="button" class="btn action-button" onclick="window.openChangePasswordModal('${u.uname}')" title="Change Password">P</button>
                      <button type="button" class="btn action-button" onclick="window.openStatusModal('${u.id}')" title="Status Lock">S</button>
                      <button type="button" class="btn action-button" onclick="window.openExtraModal('${u.id}')" title="More Details">More</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer matching Reference -->
        <div class="row pt-3 align-items-center">
          <div class="col-sm-12 col-md-5">
            <div class="dataTables_info text-muted">Showing 1 to ${users.length} of ${users.length} entries</div>
          </div>
          <div class="col-sm-12 col-md-7">
            <div class="dataTables_paginate paging_simple_numbers float-right">
              <ul class="pagination pagination-rounded mb-0">
                <li class="paginate_button page-item previous disabled"><a href="javascript:void(0)" class="page-link">Previous</a></li>
                <li class="paginate_button page-item active"><a href="javascript:void(0)" class="page-link">1</a></li>
                <li class="paginate_button page-item next disabled"><a href="javascript:void(0)" class="page-link">Next</a></li>
              </ul>
            </div>
          </div>
        </div>
      `;
    },

    renderInsertUser: function(container) {
      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">Add New Account</h4>
              <div class="page-title-right">
                <a href="/admin/users" class="btn btn-outline-secondary nav-route-link">
                  <i class="fas fa-arrow-left mr-1"></i> Back to Client List
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-header bg-dark text-white py-3">
            <h5 class="mb-0 font-size-16"><i class="fas fa-user-plus mr-2"></i> Account Registration Details</h5>
          </div>
          <div class="card-body">
            <form id="insertUserForm">
              <div class="row">
                
                <!-- Personal Details -->
                <div class="col-md-6 border-right">
                  <h6 class="font-weight-bold text-primary mb-3">Personal Details</h6>
                  <div class="form-group mb-3">
                    <label class="font-weight-bold">Username <span class="text-danger">*</span></label>
                    <input type="text" id="newUsername" class="form-control" placeholder="Choose unique username" required>
                  </div>
                  <div class="form-group mb-3">
                    <label class="font-weight-bold">Full Name</label>
                    <input type="text" id="newFullName" class="form-control" placeholder="Enter full name">
                  </div>
                  <div class="form-group mb-3">
                    <label class="font-weight-bold">Mobile Number</label>
                    <input type="text" id="newMobile" class="form-control" placeholder="Enter contact number">
                  </div>
                  <div class="form-group mb-3">
                    <label class="font-weight-bold">City</label>
                    <input type="text" id="newCity" class="form-control" placeholder="City">
                  </div>
                </div>

                <!-- Account Settings & Security -->
                <div class="col-md-6">
                  <h6 class="font-weight-bold text-primary mb-3">Account Settings & Security</h6>
                  <div class="form-group mb-3">
                    <label class="font-weight-bold">Account Role <span class="text-danger">*</span></label>
                    <select id="newUserType" class="form-control" required>
                      <option value="6" selected>Client (Bettor)</option>
                      <option value="5">Agent (Sub-Master)</option>
                    </select>
                  </div>
                  <div class="form-group mb-3">
                    <label class="font-weight-bold">Initial Credit Reference (Limit)</label>
                    <input type="number" id="newCreditRef" class="form-control" placeholder="0" min="0" value="50000">
                  </div>
                  <div class="form-group mb-3">
                    <label class="font-weight-bold">Partnership Share %</label>
                    <input type="number" id="newShare" class="form-control" placeholder="0" min="0" max="100" value="0">
                    <small class="form-text text-muted">Leave 0% for standard Clients.</small>
                  </div>
                  <div class="form-group mb-3">
                    <label class="font-weight-bold">Password <span class="text-danger">*</span></label>
                    <input type="password" id="newPassword" class="form-control" placeholder="Enter password" required minlength="6">
                  </div>
                </div>

              </div>

              <hr class="my-4">
              <div class="text-right">
                <button type="reset" class="btn btn-secondary px-4 mr-2">Reset</button>
                <button type="submit" class="btn btn-primary px-4 font-weight-bold">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const self = this;
      const form = document.getElementById('insertUserForm');
      if (form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          const uname = document.getElementById('newUsername').value.trim();
          const fname = document.getElementById('newFullName').value.trim();
          const userType = document.getElementById('newUserType').value;
          const creditRef = parseFloat(document.getElementById('newCreditRef').value) || 0;
          const share = parseFloat(document.getElementById('newShare').value) || 0;

          try {
            const user = window.AdminDataStore.insertUser({
              uname,
              fname: fname || uname,
              userType,
              userLevel: userType === '5' ? 'Agent' : 'Client',
              creditRef,
              share
            });

            self.showToast(`Account ${user.uname} created successfully!`, 'success');
            self.navigate('/admin/users');
          } catch (err) {
            self.showToast(err.message, 'danger');
          }
        });
      }
    },

    renderMarketAnalysis: function(container) {
      const matches = window.AdminDataStore.getLiveMatches();

      container.innerHTML = `
        <div class="listing-grid">
          <div class="market-analysis">
            <div class="row">
              <div class="col-12">
                <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
                  <h4 class="mb-0 font-size-18 font-weight-bold">
                    Market Analysis
                    <a href="javascript:void(0)" class="text-dark pl-2" title="Refresh Data" onclick="window.AdminApp.handleRouting()">
                      <i class="fa fa-sync"></i>
                    </a>
                  </h4>
                  <div class="page-title-right">
                    <input type="text" name="searchMarktetText" value="" placeholder="Search Event" class="form-control form-control-sm" id="searchMarketInput" onkeyup="window.adminFilterMarkets()">
                  </div>
                </div>
              </div>
            </div>

            <div class="market-analysis-list">
              ${matches.map(m => `
                <div class="market-analysis-container mb-3">
                  <div class="market-analysis-title bg-light p-2 border d-flex justify-content-between align-items-center">
                    <div>
                      <span class="badge badge-warning mr-2">${m.sportName}</span>
                      <a href="/admin/market-analysis" class="ma-link font-weight-bold text-dark">${m.eventName}</a>
                    </div>
                    <div class="text-muted small">
                      <span class="badge badge-success mr-2">${m.inPlay ? 'IN PLAY' : 'UPCOMING'}</span>
                      Matched: <strong class="text-info">${this.formatCurrency(m.matchedVolume)}</strong>
                    </div>
                  </div>
                  <div class="market-analysis-content mt-2">
                    <div class="row row5">
                      <div class="col-lg-6 col-12 mb-3">
                        <div class="market-analysis-content-detail card shadow-sm">
                          <table class="table table-bordered mb-0">
                            <thead class="bg-dark text-white">
                              <tr>
                                <th>Match Odds</th>
                                <th class="text-right">Exposure</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${m.runners.map(r => `
                                <tr>
                                  <td><strong>${r.name}</strong></td>
                                  <td class="text-right font-weight-bold ${r.exp >= 0 ? 'text-success' : 'text-danger'}">
                                    ${r.exp >= 0 ? '+' : ''}${this.formatCurrency(r.exp)}
                                  </td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div class="col-lg-6 col-12 mb-3">
                        <div class="market-analysis-content-detail card shadow-sm">
                          <table class="table table-bordered mb-0">
                            <thead class="bg-dark text-white">
                              <tr>
                                <th>Bookmaker</th>
                                <th class="text-right">Exposure</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${m.runners.map(r => `
                                <tr>
                                  <td><strong>${r.name}</strong></td>
                                  <td class="text-right font-weight-bold text-success">+0.00</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    },

    renderAccountStatement: function(container) {
      const ledger = window.AdminDataStore.getLedger();

      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">Account Statement & Settlement Ledger</h4>
              <div class="page-title-right">
                <button class="btn btn-sm btn-outline-dark" onclick="window.print()"><i class="fas fa-print mr-1"></i> Export Statement</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-header bg-dark text-white py-2 d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Transaction Ledger</h6>
            <span class="small text-muted">Records: ${ledger.length}</span>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-striped table-hover mb-0">
                <thead class="bg-light">
                  <tr>
                    <th>Date & Time</th>
                    <th>Txn ID</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th class="text-right">Debit</th>
                    <th class="text-right">Credit</th>
                    <th class="text-right">Balance</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${ledger.map(tx => `
                    <tr>
                      <td>${tx.date}</td>
                      <td><code>${tx.id}</code></td>
                      <td><span class="badge ${tx.type === 'Settlement' ? 'badge-warning' : (tx.type === 'Deposit' ? 'badge-success' : 'badge-danger')}">${tx.type}</span></td>
                      <td><strong>${tx.fromUser}</strong></td>
                      <td><strong>${tx.toUser}</strong></td>
                      <td class="text-right text-danger">${tx.debit > 0 ? this.formatCurrency(tx.debit) : '-'}</td>
                      <td class="text-right text-success font-weight-bold">${tx.credit > 0 ? this.formatCurrency(tx.credit) : '-'}</td>
                      <td class="text-right font-weight-bold">${this.formatCurrency(tx.balance)}</td>
                      <td>${tx.remarks}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    renderCurrentBets: function(container) {
      const bets = window.AdminDataStore.getCurrentBets();

      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">Current Live Bets</h4>
              <div class="page-title-right">
                <span class="badge badge-info p-2">Total Active Bets: ${bets.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-striped table-hover mb-0">
                <thead class="bg-dark text-white">
                  <tr>
                    <th>Bet ID</th>
                    <th>User</th>
                    <th>Sport</th>
                    <th>Event</th>
                    <th>Market</th>
                    <th>Selection</th>
                    <th class="text-center">Type</th>
                    <th class="text-right">Odds</th>
                    <th class="text-right">Stake</th>
                    <th class="text-right">Profit / Liab</th>
                    <th>Placed Time</th>
                  </tr>
                </thead>
                <tbody>
                  ${bets.map(b => `
                    <tr>
                      <td><code>${b.id}</code></td>
                      <td><strong>${b.user}</strong></td>
                      <td><span class="badge badge-secondary">${b.sport}</span></td>
                      <td>${b.event}</td>
                      <td>${b.market}</td>
                      <td><strong>${b.runner}</strong></td>
                      <td class="text-center">
                        <span class="badge ${b.type === 'Back' ? 'badge-primary' : 'badge-danger'}">${b.type}</span>
                      </td>
                      <td class="text-right font-weight-bold">${b.odds.toFixed(2)}</td>
                      <td class="text-right font-weight-bold">${this.formatCurrency(b.stake)}</td>
                      <td class="text-right text-success font-weight-bold">${this.formatCurrency(b.profit)}</td>
                      <td class="small text-muted">${b.placedAt}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    renderProfitLoss: function(container) {
      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">Profit And Loss Report</h4>
            </div>
          </div>
        </div>

        <div class="card shadow-sm mb-3">
          <div class="card-body py-2">
            <div class="row align-items-center">
              <div class="col-md-3">
                <label class="small font-weight-bold">From Date:</label>
                <input type="date" class="form-control form-control-sm" value="2026-09-01">
              </div>
              <div class="col-md-3">
                <label class="small font-weight-bold">To Date:</label>
                <input type="date" class="form-control form-control-sm" value="2026-09-17">
              </div>
              <div class="col-md-3">
                <label class="small font-weight-bold">Sport / Game:</label>
                <select class="form-control form-control-sm">
                  <option>All Sports</option>
                  <option>Cricket</option>
                  <option>Football</option>
                  <option>Casino</option>
                </select>
              </div>
              <div class="col-md-3 text-right mt-3">
                <button class="btn btn-sm btn-primary">Filter Report</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-bordered table-striped mb-0">
                <thead class="bg-dark text-white">
                  <tr>
                    <th>Sport</th>
                    <th>Event / Market</th>
                    <th>Account</th>
                    <th class="text-right">Total Stake</th>
                    <th class="text-right">Gross P/L</th>
                    <th class="text-right">Comm (2%)</th>
                    <th class="text-right">Net Settlement</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span class="badge badge-secondary">Cricket</span></td>
                    <td>South Africa v Pakistan (Match Odds)</td>
                    <td>Agent_Alpha</td>
                    <td class="text-right">${this.formatCurrency(85000)}</td>
                    <td class="text-right text-danger font-weight-bold">-${this.formatCurrency(12000)}</td>
                    <td class="text-right text-muted">${this.formatCurrency(240)}</td>
                    <td class="text-right text-success font-weight-bold">+${this.formatCurrency(9600)}</td>
                  </tr>
                  <tr>
                    <td><span class="badge badge-secondary">Football</span></td>
                    <td>Manchester City v Arsenal</td>
                    <td>Agent_Beta</td>
                    <td class="text-right">${this.formatCurrency(112000)}</td>
                    <td class="text-right text-success font-weight-bold">+${this.formatCurrency(18500)}</td>
                    <td class="text-right text-muted">${this.formatCurrency(370)}</td>
                    <td class="text-right text-danger font-weight-bold">-${this.formatCurrency(13875)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    renderCasinoResults: function(container) {
      const results = window.AdminDataStore.getCasinoResults();

      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">Casino Result Report</h4>
            </div>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-striped table-hover mb-0">
                <thead class="bg-dark text-white">
                  <tr>
                    <th>Round ID</th>
                    <th>Casino Game</th>
                    <th>Winning Selection</th>
                    <th>Cards / Details</th>
                    <th>Result Time</th>
                  </tr>
                </thead>
                <tbody>
                  ${results.map(r => `
                    <tr>
                      <td><code>#${r.roundId}</code></td>
                      <td><strong>${r.game}</strong></td>
                      <td><span class="badge badge-success font-size-13">${r.winner}</span></td>
                      <td><code>${r.cards}</code></td>
                      <td class="text-muted">${r.time}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    renderBank: function(container) {
      const users = window.AdminDataStore.getUsers();
      const admin = window.AdminDataStore.getAdminUser();

      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">Bank & Chips Management</h4>
            </div>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-md-6 mb-3">
            <div class="card border-primary shadow-sm h-100">
              <div class="card-header bg-primary text-white font-weight-bold">
                Master Treasury Balance
              </div>
              <div class="card-body">
                <h3 class="font-weight-bold text-primary">${this.formatCurrency(admin.balance)}</h3>
                <p class="text-muted mb-0">Available liquid chips for distribution to downline agents and clients.</p>
              </div>
            </div>
          </div>
          <div class="col-md-6 mb-3">
            <div class="card border-success shadow-sm h-100">
              <div class="card-header bg-success text-white font-weight-bold">
                Downline Total Chips Held
              </div>
              <div class="card-body">
                <h3 class="font-weight-bold text-success">
                  ${this.formatCurrency(users.reduce((a, b) => a + b.balance, 0))}
                </h3>
                <p class="text-muted mb-0">Total chips in active client and agent wallets.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-header bg-dark text-white">
            <h6 class="mb-0">Downline Wallet Balances</h6>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-striped mb-0">
                <thead class="bg-light">
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th class="text-right">Current Balance</th>
                    <th class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${users.map(u => `
                    <tr>
                      <td><strong>${u.uname}</strong></td>
                      <td><span class="badge ${u.userType === '5' ? 'badge-agent' : 'badge-client'}">${u.userLevel}</span></td>
                      <td class="text-right font-weight-bold text-success">${this.formatCurrency(u.balance)}</td>
                      <td class="text-center">
                        <button class="btn btn-sm btn-info" onclick="openBankingModal('${u.id}')">
                          <i class="fas fa-university mr-1"></i> Deposit / Withdraw
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    renderUserLock: function(container) {
      const users = window.AdminDataStore.getUsers();

      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">General Lock & Permissions</h4>
            </div>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-bordered table-striped mb-0">
                <thead class="bg-dark text-white">
                  <tr>
                    <th>Account</th>
                    <th>Role</th>
                    <th class="text-center">User Active (Login)</th>
                    <th class="text-center">Bet Active (Betting)</th>
                    <th class="text-center">Status Badge</th>
                    <th class="text-center">Modify</th>
                  </tr>
                </thead>
                <tbody>
                  ${users.map(u => `
                    <tr>
                      <td><strong>${u.uname}</strong></td>
                      <td><span class="badge ${u.userType === '5' ? 'badge-agent' : 'badge-client'}">${u.userLevel}</span></td>
                      <td class="text-center font-size-16">
                        ${u.userActive ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-times-circle text-danger"></i>'}
                      </td>
                      <td class="text-center font-size-16">
                        ${u.betActive ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="fas fa-times-circle text-danger"></i>'}
                      </td>
                      <td class="text-center">
                        <span class="badge ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}">${u.status}</span>
                      </td>
                      <td class="text-center">
                        <button class="btn btn-sm btn-dark" onclick="openStatusModal('${u.id}')">
                          <i class="fas fa-lock mr-1"></i> Change Lock
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    renderSetButtons: function(container) {
      const buttons = window.AdminDataStore.getButtons();

      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">Set Quick Bet Buttons</h4>
            </div>
          </div>
        </div>

        <div class="card shadow-sm" style="max-width: 700px;">
          <div class="card-header bg-dark text-white">
            <h6 class="mb-0">Configure Quick Stake Values</h6>
          </div>
          <div class="card-body">
            <form id="setButtonForm">
              <div class="row">
                ${buttons.map((b, i) => `
                  <div class="col-sm-6 mb-3">
                    <label class="font-weight-bold">Button ${i + 1}:</label>
                    <input type="number" class="form-control btn-val-input" value="${b}" min="1" required>
                  </div>
                `).join('')}
              </div>
              <hr>
              <button type="submit" class="btn btn-primary font-weight-bold">Save Button Settings</button>
            </form>
          </div>
        </div>
      `;

      const self = this;
      const form = document.getElementById('setButtonForm');
      if (form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          const inputs = document.querySelectorAll('.btn-val-input');
          const newBtns = Array.from(inputs).map(inp => parseInt(inp.value, 10));
          window.AdminDataStore.saveButtons(newBtns);
          self.showToast('Bet button values saved successfully!', 'success');
        });
      }
    },

    renderSecureAuth: function(container) {
      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">Secure Auth Verification</h4>
            </div>
          </div>
        </div>

        <div class="card shadow-sm" style="max-width: 600px;">
          <div class="card-header bg-dark text-white">
            <h6 class="mb-0"><i class="fas fa-shield-alt mr-2 text-warning"></i> Two-Factor Authentication (2FA)</h6>
          </div>
          <div class="card-body">
            <p>Enhance your account security with Google Authenticator OTP verification.</p>
            <div class="alert alert-success">
              <i class="fas fa-check-circle mr-2"></i> Standard session verification is currently active.
            </div>
            <div class="form-group">
              <label class="font-weight-bold">Telegram / Authenticator Bot:</label>
              <input type="text" class="form-control" value="@BestBet9SecurityBot" readonly>
            </div>
            <button class="btn btn-outline-primary" onclick="alert('Two-factor auth status is synced with Master configuration.')">Check Auth Status</button>
          </div>
        </div>
      `;
    },

    renderGenericReport: function(container, title, desc) {
      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">${title}</h4>
              <div class="page-title-right">
                <button class="btn btn-sm btn-outline-dark" onclick="window.print()"><i class="fas fa-print mr-1"></i> Print</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-header bg-dark text-white">
            <h6 class="mb-0">${desc}</h6>
          </div>
          <div class="card-body">
            <div class="alert alert-light border">
              <i class="fas fa-info-circle mr-2 text-info"></i> Displaying consolidated records up to <strong>${new Date().toISOString().slice(0,10)}</strong>.
            </div>
            <div class="table-responsive">
              <table class="table table-striped table-bordered mb-0">
                <thead class="bg-light">
                  <tr>
                    <th>#</th>
                    <th>Report Entry</th>
                    <th>Reference</th>
                    <th>Timestamp</th>
                    <th class="text-right">Value / Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>Weekly Turnover Summary</td>
                    <td>REF-SPORT-2026</td>
                    <td>2026-09-17 00:00:00</td>
                    <td class="text-right font-weight-bold text-success">${this.formatCurrency(4315000)}</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>Casino Volume Reconciliation</td>
                    <td>REF-CASINO-2026</td>
                    <td>2026-09-16 23:59:59</td>
                    <td class="text-right font-weight-bold text-primary">${this.formatCurrency(2180000)}</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>Agent Margin Settle Audit</td>
                    <td>SETTLE-AUDIT-99</td>
                    <td>2026-09-16 22:40:00</td>
                    <td class="text-right"><span class="badge badge-success">CLEARED</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    showRulesModal: function() {
      alert("BestBet9 Management Rules:\n\n1. All partnerships are settled weekly on Monday.\n2. Commission formula: (Total P/L * Share %) + 2% Comm.\n3. Negative client balances require immediate settlement authorization.\n4. Ensure adequate Master balance prior to allocating downline credits.");
    },

    openChangePasswordModal: function(uname) {
      document.getElementById('changePasswordUserName').value = uname || 'Faazan50';
      document.getElementById('inputNewPassword').value = '';
      document.getElementById('inputConfirmPassword').value = '';
      window.openModal('changePasswordModal');
    },

    showToast: function(message, type) {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `alert alert-${type || 'info'} alert-dismissible fade show shadow`;
      toast.style.minWidth = '280px';
      toast.innerHTML = `
        <strong>${message}</strong>
        <button type="button" class="close" onclick="this.parentElement.remove()">&times;</button>
      `;

      container.appendChild(toast);
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 4000);
    }
  };

  // Global Modal & Interactive Handlers matching Reference Architecture
  window.openModal = function(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('show');
      el.style.display = 'block';
    }
  };

  window.closeModal = function(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('show');
      el.style.display = 'none';
    }
  };

  // 1. Deposit Modal (ref: depositeMDL)
  window.openDepositModal = function(userId) {
    const user = window.AdminDataStore.getUserByGuid(userId);
    const admin = window.AdminDataStore.getAdminUser();
    if (!user) return;

    const idInput = document.getElementById('depositUserId');
    const userLabel = document.getElementById('depositUserNameLabel');
    const userCurBal = document.getElementById('depositUserCurBal');
    const userNewBal = document.getElementById('depositUserNewBal');
    const masterCurBal = document.getElementById('depositMasterCurBal');
    const masterNewBal = document.getElementById('depositMasterNewBal');
    const amountInput = document.getElementById('depositAmount');
    const remarkInput = document.getElementById('depositRemark');
    const passInput = document.getElementById('depositMpassword');

    if (idInput) idInput.value = user.id;
    if (userLabel) userLabel.innerText = `${user.uname} (${user.userLevel || 'Client'})`;
    if (userCurBal) userCurBal.value = App.formatCurrency(user.balance);
    if (userNewBal) userNewBal.value = App.formatCurrency(user.balance);
    if (masterCurBal) masterCurBal.value = App.formatCurrency(admin.balance);
    if (masterNewBal) masterNewBal.value = App.formatCurrency(admin.balance);
    if (amountInput) amountInput.value = '';
    if (remarkInput) remarkInput.value = '';
    if (passInput) passInput.value = '';

    window.openModal('depositeMDL');
  };

  window.calcDepositBalances = function() {
    const userId = document.getElementById('depositUserId')?.value;
    const user = window.AdminDataStore.getUserByGuid(userId);
    const admin = window.AdminDataStore.getAdminUser();
    const amt = parseFloat(document.getElementById('depositAmount')?.value) || 0;

    if (user) {
      const userNew = (user.balance || 0) + amt;
      const masterNew = (admin.balance || 0) - amt;
      const userNewEl = document.getElementById('depositUserNewBal');
      const masterNewEl = document.getElementById('depositMasterNewBal');
      if (userNewEl) userNewEl.value = App.formatCurrency(userNew);
      if (masterNewEl) masterNewEl.value = App.formatCurrency(masterNew);
    }
  };

  window.handleDepositSubmit = function(e) {
    e.preventDefault();
    const userId = document.getElementById('depositUserId')?.value;
    const amt = parseFloat(document.getElementById('depositAmount')?.value) || 0;
    const remarks = document.getElementById('depositRemark')?.value || '';
    const mpass = document.getElementById('depositMpassword')?.value;

    if (!mpass) {
      App.showToast('Please enter transaction password.', 'danger');
      return;
    }

    try {
      window.AdminDataStore.depositWithdraw(userId, 'Deposit', amt, remarks);
      App.updateTopBar();
      App.showToast(`Deposit of ${App.formatCurrency(amt)} completed successfully!`, 'success');
      window.closeModal('depositeMDL');
      App.handleRouting();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  };

  // 2. Withdraw Modal (ref: withdrwalMDL)
  window.openWithdrawModal = function(userId) {
    const user = window.AdminDataStore.getUserByGuid(userId);
    const admin = window.AdminDataStore.getAdminUser();
    if (!user) return;

    const idInput = document.getElementById('withdrawUserId');
    const userLabel = document.getElementById('withdrawUserNameLabel');
    const userCurBal = document.getElementById('withdrawUserCurBal');
    const userNewBal = document.getElementById('withdrawUserNewBal');
    const masterCurBal = document.getElementById('withdrawMasterCurBal');
    const masterNewBal = document.getElementById('withdrawMasterNewBal');
    const amountInput = document.getElementById('withdrawAmount');
    const remarkInput = document.getElementById('withdrawRemark');
    const passInput = document.getElementById('withdrawMpassword');

    if (idInput) idInput.value = user.id;
    if (userLabel) userLabel.innerText = `${user.uname} (${user.userLevel || 'Client'})`;
    if (userCurBal) userCurBal.value = App.formatCurrency(user.balance);
    if (userNewBal) userNewBal.value = App.formatCurrency(user.balance);
    if (masterCurBal) masterCurBal.value = App.formatCurrency(admin.balance);
    if (masterNewBal) masterNewBal.value = App.formatCurrency(admin.balance);
    if (amountInput) amountInput.value = '';
    if (remarkInput) remarkInput.value = '';
    if (passInput) passInput.value = '';

    window.openModal('withdrwalMDL');
  };

  window.calcWithdrawBalances = function() {
    const userId = document.getElementById('withdrawUserId')?.value;
    const user = window.AdminDataStore.getUserByGuid(userId);
    const admin = window.AdminDataStore.getAdminUser();
    const amt = parseFloat(document.getElementById('withdrawAmount')?.value) || 0;

    if (user) {
      const userNew = (user.balance || 0) - amt;
      const masterNew = (admin.balance || 0) + amt;
      const userNewEl = document.getElementById('withdrawUserNewBal');
      const masterNewEl = document.getElementById('withdrawMasterNewBal');
      if (userNewEl) userNewEl.value = App.formatCurrency(userNew);
      if (masterNewEl) masterNewEl.value = App.formatCurrency(masterNew);
    }
  };

  window.handleWithdrawSubmit = function(e) {
    e.preventDefault();
    const userId = document.getElementById('withdrawUserId')?.value;
    const amt = parseFloat(document.getElementById('withdrawAmount')?.value) || 0;
    const remarks = document.getElementById('withdrawRemark')?.value || '';
    const mpass = document.getElementById('withdrawMpassword')?.value;

    if (!mpass) {
      App.showToast('Please enter transaction password.', 'danger');
      return;
    }

    try {
      window.AdminDataStore.depositWithdraw(userId, 'Withdraw', amt, remarks);
      App.updateTopBar();
      App.showToast(`Withdrawal of ${App.formatCurrency(amt)} completed successfully!`, 'success');
      window.closeModal('withdrwalMDL');
      App.handleRouting();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  };

  // 3. Exposure Limit Modal (ref: exposureLimitMDL)
  window.openExposureLimitModal = function(userId) {
    const user = window.AdminDataStore.getUserByGuid(userId);
    if (!user) return;

    const idInput = document.getElementById('exposureLimitUserId');
    const userEl = document.getElementById('exposureLimitUserName');
    const oldEl = document.getElementById('exposureLimitOld');
    const newEl = document.getElementById('exposureLimitNew');
    const mpassEl = document.getElementById('exposureLimitMpass');

    if (idInput) idInput.value = user.id;
    if (userEl) userEl.innerText = `${user.uname} (${user.userLevel || 'Client'})`;
    if (oldEl) oldEl.innerText = App.formatCurrency(user.exposureLimit || 100000);
    if (newEl) newEl.value = user.exposureLimit || 100000;
    if (mpassEl) mpassEl.value = '';

    window.openModal('exposureLimitMDL');
  };

  window.handleExposureLimitSubmit = function(e) {
    e.preventDefault();
    const userId = document.getElementById('exposureLimitUserId')?.value;
    const newLimit = parseFloat(document.getElementById('exposureLimitNew')?.value) || 0;
    const mpass = document.getElementById('exposureLimitMpass')?.value;

    if (!mpass) {
      App.showToast('Please enter transaction password.', 'danger');
      return;
    }

    const user = window.AdminDataStore.getUserByGuid(userId);
    if (user) {
      user.exposureLimit = newLimit;
      App.showToast(`Exposure limit updated to ${App.formatCurrency(newLimit)}.`, 'success');
      window.closeModal('exposureLimitMDL');
      App.handleRouting();
    }
  };

  // 4. Credit Update Modal (ref: creditUpdate)
  window.openCreditRefModal = function(userId) {
    const user = window.AdminDataStore.getUserByGuid(userId);
    if (!user) return;

    const idInput = document.getElementById('creditUpdateUserId');
    const userEl = document.getElementById('creditUpdateUserName');
    const oldEl = document.getElementById('creditUpdateOld');
    const newEl = document.getElementById('creditUpdateNew');
    const mpassEl = document.getElementById('creditUpdateMpass');

    if (idInput) idInput.value = user.id;
    if (userEl) userEl.innerText = `${user.uname} (${user.userLevel || 'Client'})`;
    if (oldEl) oldEl.value = App.formatCurrency(user.creditRef);
    if (newEl) newEl.value = user.creditRef;
    if (mpassEl) mpassEl.value = '';

    window.openModal('creditUpdate');
  };

  window.handleCreditSubmit = function(e) {
    e.preventDefault();
    const userId = document.getElementById('creditUpdateUserId')?.value;
    const newLimit = parseFloat(document.getElementById('creditUpdateNew')?.value) || 0;
    const mpass = document.getElementById('creditUpdateMpass')?.value;

    if (!mpass) {
      App.showToast('Please enter transaction password.', 'danger');
      return;
    }

    try {
      window.AdminDataStore.updateCreditRef(userId, newLimit);
      App.showToast(`Credit limit updated to ${App.formatCurrency(newLimit)}.`, 'success');
      window.closeModal('creditUpdate');
      App.handleRouting();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  };

  // 5. Change Password Modal (ref: changepwdMDL)
  window.openChangePasswordModal = function(uname) {
    const accountLabel = document.getElementById('changePwdAccountLabel');
    const targetUser = document.getElementById('changePwdTargetUser');
    const newPass = document.getElementById('inputUserNewPassword');
    const confPass = document.getElementById('inputUserConfirmPassword');
    const mpass = document.getElementById('inputUserMpass');

    if (accountLabel) accountLabel.innerText = uname || 'Faazan50';
    if (targetUser) targetUser.value = uname || 'Faazan50';
    if (newPass) newPass.value = '';
    if (confPass) confPass.value = '';
    if (mpass) mpass.value = '';

    window.openModal('changepwdMDL');
  };

  window.handlePasswordSubmit = function(e) {
    e.preventDefault();
    const p1 = document.getElementById('inputUserNewPassword')?.value;
    const p2 = document.getElementById('inputUserConfirmPassword')?.value;
    const mpass = document.getElementById('inputUserMpass')?.value;

    if (p1 !== p2) {
      App.showToast('Passwords do not match.', 'danger');
      return;
    }
    if (!mpass) {
      App.showToast('Please enter transaction password.', 'danger');
      return;
    }

    App.showToast('Password updated successfully.', 'success');
    window.closeModal('changepwdMDL');
  };

  // 6. Change Status Modal (ref: changestatusMDL)
  window.openStatusModal = function(userId) {
    const user = window.AdminDataStore.getUserByGuid(userId);
    if (!user) return;

    const idInput = document.getElementById('changeStatusUserId');
    const userEl = document.getElementById('statusModalUsername');
    const uSwitch = document.getElementById('switchUserActiveRef');
    const bSwitch = document.getElementById('switchBetActiveRef');
    const mpassEl = document.getElementById('changeStatusMpassword');

    if (idInput) idInput.value = user.id;
    if (userEl) userEl.innerText = `${user.uname} (${user.userLevel || 'Client'})`;
    if (uSwitch) uSwitch.checked = user.userActive !== false;
    if (bSwitch) bSwitch.checked = user.betActive !== false;
    if (mpassEl) mpassEl.value = '';

    window.openModal('changestatusMDL');
  };

  window.handleStatusSubmit = function(e) {
    e.preventDefault();
    const userId = document.getElementById('changeStatusUserId')?.value;
    const uActive = document.getElementById('switchUserActiveRef')?.checked;
    const bActive = document.getElementById('switchBetActiveRef')?.checked;
    const mpass = document.getElementById('changeStatusMpassword')?.value;

    if (!mpass) {
      App.showToast('Please enter transaction password.', 'danger');
      return;
    }

    try {
      window.AdminDataStore.updateStatus(userId, uActive, bActive);
      App.showToast('User status updated successfully.', 'success');
      window.closeModal('changestatusMDL');
      App.handleRouting();
    } catch (err) {
      App.showToast(err.message, 'danger');
    }
  };

  // 7. Extra Details Modal (ref: ExtraMDL)
  window.openExtraModal = function(userId) {
    const user = window.AdminDataStore.getUserByGuid(userId);
    if (!user) return;

    const avatar = document.getElementById('extraAvatarInitial');
    const uEl = document.getElementById('extraUserName');
    const fEl = document.getElementById('extraFullName');
    const pName = document.getElementById('extraPartnershipName');
    const pShare = document.getElementById('extraPartnershipShare');
    const aType = document.getElementById('extraAccountType');

    if (avatar) avatar.innerText = (user.uname || 'U').charAt(0).toUpperCase();
    if (uEl) uEl.innerText = user.uname;
    if (fEl) fEl.innerText = user.fname || user.uname;
    if (pName) pName.innerText = `${user.upline || 'Faazan50'} Upline`;
    if (pShare) pShare.innerText = `${user.share || 0}%`;
    if (aType) aType.innerText = user.userType === '5' ? 'Agent' : 'Client';

    window.openModal('ExtraMDL');
  };

  // Legacy Banking Modal Alias
  window.openBankingModal = function(userId, type) {
    if (type === 'withdraw' || type === 'Withdraw' || type === 'W') {
      window.openWithdrawModal(userId);
    } else {
      window.openDepositModal(userId);
    }
  };

  window.openSettlementModal = function(userId) {
    const user = window.AdminDataStore.getUserByGuid(userId);
    if (!user) return;

    document.getElementById('settlementUserId').value = user.id;
    document.getElementById('settlementAccount').innerText = `${user.uname} (${user.userLevel})`;
    document.getElementById('settlementGrossPL').innerText = App.formatCurrency(user.clientPL);
    document.getElementById('settlementShare').innerText = `${user.share}%`;

    const shareFactor = (user.share || 100) / 100;
    const netDue = user.clientPL * shareFactor;
    const netDueEl = document.getElementById('settlementNetDue');

    if (user.clientPL < 0) {
      netDueEl.className = 'col-sm-7 col-form-label font-weight-bold text-success';
      netDueEl.innerText = `+${App.formatCurrency(Math.abs(netDue))} (Admin Receives)`;
    } else {
      netDueEl.className = 'col-sm-7 col-form-label font-weight-bold text-danger';
      netDueEl.innerText = `-${App.formatCurrency(netDue)} (Admin Pays)`;
    }

    window.openModal('settlementModal');
  };

  window.openMarketBookModal = function(matchId, runnerName) {
    const modalContent = document.getElementById('marketBookContent');
    const titleEl = document.getElementById('marketBookModalTitle');
    titleEl.innerText = `Market Book - ${runnerName}`;

    modalContent.innerHTML = `
      <div class="alert alert-info py-2">
        Showing placed bets for runner: <strong>${runnerName}</strong>
      </div>
      <table class="table table-striped table-bordered mb-0">
        <thead class="bg-light">
          <tr>
            <th>User</th>
            <th>Type</th>
            <th class="text-right">Odds</th>
            <th class="text-right">Stake</th>
            <th class="text-right">Net Impact</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Client_001</td>
            <td><span class="badge badge-primary">Back</span></td>
            <td class="text-right">1.92</td>
            <td class="text-right">5,000.00</td>
            <td class="text-right text-success font-weight-bold">+4,600.00</td>
          </tr>
          <tr>
            <td>Client_002</td>
            <td><span class="badge badge-danger">Lay</span></td>
            <td class="text-right">2.08</td>
            <td class="text-right">1,500.00</td>
            <td class="text-right text-danger font-weight-bold">-1,620.00</td>
          </tr>
        </tbody>
      </table>
    `;

    window.openModal('marketBookModal');
  };

  // Sidebar Sports Tree Toggles matching Reference MetisMenu
  window.toggleSidebarSportsTree = function() {
    const treeUl = document.getElementById('sidebarSportsTreeUl');
    if (treeUl) {
      treeUl.style.display = (treeUl.style.display === 'none') ? 'block' : 'none';
    }
  };

  window.toggleSportSubTree = function(treeId) {
    const subTree = document.getElementById(treeId);
    const arrowMap = {
      'treeCricket': 'arrowCricket',
      'treeSoccer': 'arrowSoccer',
      'treeTennis': 'arrowTennis'
    };
    const arrowEl = document.getElementById(arrowMap[treeId]);

    if (subTree) {
      if (subTree.style.display === 'none') {
        subTree.style.display = 'block';
        if (arrowEl) arrowEl.innerText = '-';
      } else {
        subTree.style.display = 'none';
        if (arrowEl) arrowEl.innerText = '+';
      }
    }
  };

  window.toggleSidebarSection = function(id) {
    window.toggleSportSubTree(id);
  };

  // Account List Table Filter, Reset, Export & Sort
  window.adminFilterUsers = function() {
    const q = (document.getElementById('searchUserInput')?.value || '').toLowerCase().trim();
    document.querySelectorAll('#eventsListTbl tbody tr').forEach(row => {
      row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  window.adminResetUsers = function() {
    const input = document.getElementById('searchUserInput');
    if (input) input.value = '';
    document.querySelectorAll('#eventsListTbl tbody tr').forEach(row => {
      row.style.display = '';
    });
  };

  window.adminExportPdf = function() {
    window.print();
  };

  window.adminExportExcel = function() {
    const users = window.AdminDataStore.getUsers();
    let csv = 'User Name,Credit Referance,U st,B st,Exposure Limit,Default %,Account Type\n';
    users.forEach(u => {
      csv += `"${u.uname}",${u.creditRef || 0},"${u.userActive !== false ? 'Active' : 'Disabled'}","${u.betActive !== false ? 'Active' : 'Disabled'}",${u.exposureLimit || 100000},${u.share || 0},"${u.userType === '5' ? 'Agent' : 'Client'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'userlist.csv';
    a.click();
  };

  window.adminSortUsers = function(col) {
    App.sortCol = col;
    App.sortAsc = !App.sortAsc;
    App.handleRouting();
  };

  window.adminFilterMarkets = function() {
    const q = (document.getElementById('searchMarketInput')?.value || '').toLowerCase();
    document.querySelectorAll('.market-analysis-container').forEach(el => {
      el.style.display = el.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  // Launch on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  window.AdminApp = App;

})(window, document);

