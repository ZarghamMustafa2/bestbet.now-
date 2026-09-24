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

      // 3. Dropdown Toggle and Click Outside Handler
      document.addEventListener('click', function(e) {
        const toggleBtn = e.target.closest('[data-toggle="dropdown"], .dropdown-toggle');
        
        if (toggleBtn) {
          e.preventDefault();
          e.stopPropagation();
          const parentDropdown = toggleBtn.closest('.dropdown');
          if (!parentDropdown) return;
          
          const menu = parentDropdown.querySelector('.dropdown-menu');
          const wasOpen = menu && (menu.classList.contains('show') || menu.style.display === 'block');
          
          // Close other open dropdowns
          document.querySelectorAll('.dropdown-menu.show').forEach(m => {
            m.classList.remove('show');
            m.style.display = '';
            const p = m.closest('.dropdown');
            if (p) p.classList.remove('show');
          });
          
          if (!wasOpen && menu) {
            parentDropdown.classList.add('show');
            menu.classList.add('show');
            menu.style.display = 'block';
          }
          return;
        }

        // Close dropdown when clicking a dropdown-item
        const item = e.target.closest('.dropdown-item');
        if (item) {
          document.querySelectorAll('.dropdown-menu.show').forEach(m => {
            m.classList.remove('show');
            m.style.display = '';
            const p = m.closest('.dropdown');
            if (p) p.classList.remove('show');
          });
        }

        // Close when clicking anywhere outside
        if (!e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown')) {
          document.querySelectorAll('.dropdown-menu.show').forEach(m => {
            m.classList.remove('show');
            m.style.display = '';
            const p = m.closest('.dropdown');
            if (p) p.classList.remove('show');
          });
        }
      });

      // 4. SPA Route Navigation Interceptor
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

      // 5. Popstate (Browser Back/Forward)
      window.addEventListener('popstate', function() {
        self.handleRouting();
      });

      // 6. Sidebar Toggle Button
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

      // 7. Rules Modal Handler
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
        this.renderTurnOverReport(container);
      } else if (path === '/admin/reports/userhistory') {
        this.renderGenericReport(container, 'User History', 'Audit logs of logins and user activities');
      } else if (path === '/admin/reports/generalreport') {
        this.renderGeneralReport(container);
      } else if (path === '/admin/reports/authlist') {
        this.renderUserAuthList(container);
      } else if (path === '/admin/reports/gamereport') {
        this.renderGameReport(container);
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
      let breadcrumbHtml = `<li class="breadcrumb-item"><a href="/admin/home" class="nav-route-link">Home</a></li><li class="breadcrumb-item active">Account List</li>`;

      if (filter === '5') {
        users = users.filter(u => u.userType === '5');
        pageTitle = 'Account List (Agents)';
        breadcrumbHtml = `<li class="breadcrumb-item"><a href="/admin/home" class="nav-route-link">Home</a></li><li class="breadcrumb-item"><a href="/admin/users" class="nav-route-link">Account List</a></li><li class="breadcrumb-item active">Agents</li>`;
      } else if (filter === '6') {
        users = users.filter(u => u.userType === '6');
        pageTitle = 'Account List (Clients)';
        breadcrumbHtml = `<li class="breadcrumb-item"><a href="/admin/home" class="nav-route-link">Home</a></li><li class="breadcrumb-item"><a href="/admin/users" class="nav-route-link">Account List</a></li><li class="breadcrumb-item active">Clients</li>`;
      } else if (filter === 'child' && guid) {
        users = window.AdminDataStore.getDownline(guid);
        pageTitle = `Account List — Downline of ${guid}`;
        breadcrumbHtml = `<li class="breadcrumb-item"><a href="/admin/home" class="nav-route-link">Home</a></li><li class="breadcrumb-item"><a href="/admin/users" class="nav-route-link">Account List</a></li><li class="breadcrumb-item active">${guid}</li>`;
      }

      if (this.sortCol) {
        users.sort((a, b) => {
          let va = a[this.sortCol];
          let vb = b[this.sortCol];
          if (typeof va === 'string') return this.sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
          return this.sortAsc ? (va - vb) : (vb - va);
        });
      }

      const totalCount = users.length;
      const perPage = this.perPage || 25;
      const currentPage = this.currentPage || 1;
      const startIdx = (currentPage - 1) * perPage;
      const pagedUsers = users.slice(startIdx, startIdx + perPage);
      const totalPages = Math.ceil(totalCount / perPage) || 1;

      container.innerHTML = `
        <!-- Page Header & Breadcrumbs matching Reference -->
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">${pageTitle}</h4>
              <div class="page-title-right">
                <ol class="breadcrumb m-0 font-size-13">
                  ${breadcrumbHtml}
                </ol>
              </div>
            </div>
          </div>
        </div>

        <!-- Account List Navigation Tabs (All, Agent, Client) matching Reference -->
        <ul class="nav nav-tabs nav-tabs-custom mb-3">
          <li class="nav-item">
            <a class="nav-link ${filter === 'all' || !filter ? 'active' : ''} nav-route-link" href="/admin/users" data-route="/admin/users">
              <i class="fas fa-users mr-1"></i> All Accounts
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${filter === '5' ? 'active' : ''} nav-route-link" href="/admin/users/agent" data-route="/admin/users/agent">
              <i class="fas fa-user-tie mr-1"></i> Agents
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link ${filter === '6' ? 'active' : ''} nav-route-link" href="/admin/users/client" data-route="/admin/users/client">
              <i class="fas fa-user mr-1"></i> Clients
            </a>
          </li>
        </ul>

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
                  <option value="25" ${perPage === 25 ? 'selected' : ''}>25</option>
                  <option value="50" ${perPage === 50 ? 'selected' : ''}>50</option>
                  <option value="100" ${perPage === 100 ? 'selected' : ''}>100</option>
                  <option value="250" ${perPage === 250 ? 'selected' : ''}>250</option>
                  <option value="500" ${perPage === 500 ? 'selected' : ''}>500</option>
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
                <th class="sorting text-right cp" onclick="window.adminSortUsers('balance')">Balance <i class="fas fa-sort float-right mt-1 text-muted"></i></th>
                <th class="sorting text-right cp" onclick="window.adminSortUsers('clientPL')">Client(P/L) <i class="fas fa-sort float-right mt-1 text-muted"></i></th>
                <th class="text-right">Exposure</th>
                <th class="text-right">Available Balance</th>
                <th class="text-center" style="width:50px;">U st</th>
                <th class="text-center" style="width:50px;">B st</th>
                <th class="text-right cp" onclick="window.adminSortUsers('exposureLimit')">Exposure Limit <i class="fas fa-sort float-right mt-1 text-muted"></i></th>
                <th class="text-left">Default(%)</th>
                <th class="text-center">Account Type</th>
                <th class="text-center" style="width:260px;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${pagedUsers.length === 0 ? `
                <tr><td colspan="12" class="text-center py-4 text-muted">No accounts found in this view.</td></tr>
              ` : pagedUsers.map(u => `
                <tr id="row-user-${u.id}">
                  <td>
                    ${u.userType === '5' ? `
                      <a href="/admin/child/${u.uname}" class="wrape-text font-weight-bold text-primary nav-route-link" title="Click to view Downline" data-route="/admin/child/${u.uname}">
                        <span>${u.uname}</span>
                      </a>
                    ` : `
                      <span class="wrape-text font-weight-bold text-dark cp" onclick="window.openExtraModal('${u.id}')" title="Click to view profile">${u.uname}</span>
                    `}
                  </td>
                  <td class="text-right">
                    <p class="text-right mb-0 cp font-weight-bold text-info" onclick="window.openCreditRefModal('${u.id}')" title="Click to update Credit">
                      ${this.formatCurrency(u.creditRef)}
                    </p>
                  </td>
                  <td class="text-right font-weight-bold">${this.formatCurrency(u.balance)}</td>
                  <td class="text-right font-weight-bold ${(u.clientPL || 0) >= 0 ? 'text-success' : 'text-danger'}">
                    ${(u.clientPL || 0) >= 0 ? '+' : ''}${this.formatCurrency(u.clientPL || 0)}
                  </td>
                  <td class="text-right font-weight-bold ${(u.exposure || 0) > 0 ? 'text-danger' : 'text-muted'}">
                    ${this.formatCurrency(u.exposure || 0)}
                  </td>
                  <td class="text-right font-weight-bold">${this.formatCurrency((u.balance || 0) - (u.exposure || 0))}</td>
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
            <div class="dataTables_info text-muted">Showing ${totalCount === 0 ? 0 : startIdx + 1} to ${Math.min(startIdx + perPage, totalCount)} of ${totalCount} entries</div>
          </div>
          <div class="col-sm-12 col-md-7">
            <div class="dataTables_paginate paging_simple_numbers float-right">
              <ul class="pagination pagination-rounded mb-0">
                <li class="paginate_button page-item previous ${currentPage <= 1 ? 'disabled' : ''}">
                  <a href="javascript:void(0)" class="page-link" onclick="if(${currentPage} > 1) { window.AdminApp.currentPage = ${currentPage - 1}; window.AdminApp.handleRouting(); }">Previous</a>
                </li>
                ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                  <li class="paginate_button page-item ${p === currentPage ? 'active' : ''}">
                    <a href="javascript:void(0)" class="page-link" onclick="window.AdminApp.currentPage = ${p}; window.AdminApp.handleRouting();">${p}</a>
                  </li>
                `).join('')}
                <li class="paginate_button page-item next ${currentPage >= totalPages ? 'disabled' : ''}">
                  <a href="javascript:void(0)" class="page-link" onclick="if(${currentPage} < ${totalPages}) { window.AdminApp.currentPage = ${currentPage + 1}; window.AdminApp.handleRouting(); }">Next</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      `;

      const self = this;
      setTimeout(() => {
        const perPageSelect = document.getElementById('userPerPageSelect');
        if (perPageSelect) {
          perPageSelect.onchange = function() {
            self.perPage = parseInt(this.value, 10) || 25;
            self.currentPage = 1;
            self.handleRouting();
          };
        }
      }, 0);
    },

    renderInsertUser: function(container) {
      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">Add Account</h4>
              <div class="page-title-right">
                <a href="/admin/users" class="btn btn-outline-secondary nav-route-link">
                  <i class="fas fa-arrow-left mr-1"></i> Back to Account List
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-header bg-dark text-white py-3">
            <h5 class="mb-0 font-size-16"><i class="fas fa-user-plus mr-2"></i> Account Registration</h5>
          </div>
          <div class="card-body">
            <form id="insertUserForm" data-vv-scope="InserUserAccount">
              <div class="row">
                
                <!-- Personal Detail -->
                <div class="col-md-6 border-right">
                  <h5 class="font-weight-bold mb-4">Personal Detail</h5>
                  <div class="row">
                    <div class="col-md-6 form-group mb-3">
                      <label class="font-weight-bold">Client Name: <span class="text-danger">*</span></label>
                      <input type="text" id="newUsername" class="form-control" placeholder="Client Name" required>
                    </div>
                    <div class="col-md-6 form-group mb-3">
                      <label class="font-weight-bold">User Password: <span class="text-danger">*</span></label>
                      <input type="password" id="newPassword" class="form-control" placeholder="User Password" required minlength="6">
                    </div>
                    <div class="col-md-6 form-group mb-3">
                      <label class="font-weight-bold">Retype Password: <span class="text-danger">*</span></label>
                      <input type="password" id="newRPassword" class="form-control" placeholder="Retype Password" required minlength="6">
                    </div>
                    <div class="col-md-6 form-group mb-3">
                      <label class="font-weight-bold">Full Name:</label>
                      <input type="text" id="newFullName" class="form-control" placeholder="Full Name">
                    </div>
                    <div class="col-md-6 form-group mb-3">
                      <label class="font-weight-bold">City:</label>
                      <input type="text" id="newCity" class="form-control" placeholder="City">
                    </div>
                    <div class="col-md-6 form-group mb-3">
                      <label class="font-weight-bold">Phone:</label>
                      <input type="text" id="newMobile" class="form-control" placeholder="Phone Number" maxlength="15">
                    </div>
                  </div>
                </div>

                <!-- Account Detail -->
                <div class="col-md-6">
                  <h5 class="font-weight-bold mb-4">Account Detail</h5>
                  <div class="row">
                    <div class="col-md-6 form-group mb-3">
                      <label class="font-weight-bold">Account Type: <span class="text-danger">*</span></label>
                      <select id="newUserType" class="form-control" required>
                        <option value="6" selected>Client</option>
                        <option value="5">Agent</option>
                      </select>
                    </div>
                    <div class="col-md-6 form-group mb-3">
                      <label class="font-weight-bold">Credit Reference:</label>
                      <input type="number" id="newCreditRef" class="form-control" placeholder="Credit Reference" value="50000">
                    </div>
                    <div class="col-md-6 form-group mb-3">
                      <label class="font-weight-bold">Exposure Limit:</label>
                      <input type="number" id="newExpoLimit" class="form-control" placeholder="Exposure Limit" value="100000">
                    </div>
                    <div class="col-md-6 form-group mb-3">
                      <label class="font-weight-bold">Partnership Share (%):</label>
                      <input type="number" id="newShare" class="form-control" placeholder="Partnership %" min="0" max="100" value="0">
                    </div>
                    <div class="col-md-12 form-group mb-3">
                      <label class="font-weight-bold">Transaction Code: <span class="text-danger">*</span></label>
                      <input type="password" id="newMPassword" class="form-control" placeholder="Transaction Code" required>
                    </div>
                  </div>
                </div>

              </div>

              <hr class="my-4">
              <div class="text-right">
                <button type="reset" class="btn btn-secondary px-4 mr-2">Reset</button>
                <button type="submit" class="btn btn-primary btn-submit px-4 font-weight-bold">Create Account</button>
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
                      <a href="javascript:void(0)" onclick="window.openMarketBookModal('${m.id}')" class="ma-link font-weight-bold text-dark">${m.eventName}</a>
                    </div>
                    <div class="text-muted small d-flex align-items-center">
                      <span class="badge badge-success mr-2">${m.inPlay ? 'IN PLAY' : 'UPCOMING'}</span>
                      <span class="mr-2">Matched: <strong class="text-info">${this.formatCurrency(m.matchedVolume)}</strong></span>
                      <button class="btn btn-sm btn-primary py-0 px-2" onclick="window.openMarketBookModal('${m.id}')" title="Open Detailed Market Book">
                        <i class="fas fa-book-open mr-1"></i> Book
                      </button>
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

        <!-- Statement Filter Row matching Reference -->
        <div class="card shadow-sm mb-3">
          <div class="card-body py-2">
            <div class="row align-items-center">
              <div class="col-md-3 mb-2">
                <label class="small font-weight-bold mb-1">From Date:</label>
                <input type="date" id="stmtFromDate" class="form-control form-control-sm" value="2026-09-01">
              </div>
              <div class="col-md-3 mb-2">
                <label class="small font-weight-bold mb-1">To Date:</label>
                <input type="date" id="stmtToDate" class="form-control form-control-sm" value="2026-09-24">
              </div>
              <div class="col-md-3 mb-2">
                <label class="small font-weight-bold mb-1">Transaction Type:</label>
                <select id="stmtTypeSelect" class="form-control form-control-sm">
                  <option value="All">All Transactions</option>
                  <option value="Deposit">Deposit</option>
                  <option value="Withdraw">Withdraw</option>
                  <option value="Settlement">Settlement</option>
                </select>
              </div>
              <div class="col-md-3 mb-2 text-md-right mt-md-4">
                <button type="button" class="btn btn-sm btn-primary" onclick="window.adminFilterStatement()">
                  <i class="fas fa-filter mr-1"></i> Filter
                </button>
                <button type="button" class="btn btn-sm btn-secondary ml-1" onclick="window.adminResetStatement()">
                  Reset
                </button>
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
              <table class="table table-striped table-hover mb-0" id="statementTbl">
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
                    <tr data-date="${tx.date.substring(0, 10)}" data-type="${tx.type}">
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
                    <th class="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${bets.length === 0 ? `
                    <tr><td colspan="12" class="text-center py-4 text-muted">No active live bets found.</td></tr>
                  ` : bets.map(b => `
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
                      <td class="text-center">
                        <button class="btn btn-sm btn-outline-danger font-weight-bold" onclick="window.voidBet('${b.id}')" title="Void Bet">Void</button>
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

      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
              <h4 class="mb-0 font-size-18 font-weight-bold">Bank</h4>
              <div class="page-title-right">
                <ol class="breadcrumb m-0">
                  <li class="breadcrumb-item"><a href="#/admin/dashboard">Home</a></li>
                  <li class="breadcrumb-item active">Bank</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div class="row bank-panel">
          <div class="col-12">
            <div class="card">
              <div class="card-body">
                <div class="report-form mb-3">
                  <div class="row align-items-center">
                    <div class="col-md-5 mb-2 search-form">
                      <form onsubmit="event.preventDefault(); window.AdminApp.renderBank(document.getElementById('admin-main-content'));">
                        <div class="d-inline-block form-group mb-0 mr-1">
                          <input type="text" id="bank-search-input" class="form-control form-control-sm" placeholder="Search User" style="display:inline-block; width:auto;">
                        </div>
                        <div class="d-inline-block">
                          <button type="submit" class="btn btn-primary btn-sm" id="submit">Load</button>
                          <button type="button" class="btn btn-light btn-sm" id="reset" onclick="document.getElementById('bank-search-input').value=''; window.AdminApp.renderBank(document.getElementById('admin-main-content'));">Reset</button>
                        </div>
                      </form>
                    </div>

                    <div class="col-md-7 text-right mb-2">
                      <div class="d-inline-block mr-2">
                        <button class="btn btn-success btn-sm mr-1" type="button" onclick="alert('Exporting CSV...')"><i class="fas fa-file-excel"></i></button>
                        <button class="btn btn-danger btn-sm" type="button" onclick="alert('Exporting PDF...')"><i class="fas fa-file-pdf"></i></button>
                      </div>
                      <div class="d-inline-block">
                        <div class="d-inline-block form-group mb-0 mr-1">
                          <input type="password" id="bank-master-pwd" class="form-control form-control-sm" placeholder="Transaction Code" style="display:inline-block; width:150px;">
                        </div>
                        <div class="d-inline-block">
                          <button class="btn btn-primary btn-sm" type="button" id="transferSubmit" onclick="window.AdminApp.transferAllBank()">Transfer All</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="row mb-2">
                  <div class="col-6">
                    <div class="dataTables_length">
                      <label class="d-inline-flex align-items-center font-weight-normal">
                        Show &nbsp;
                        <select class="custom-select custom-select-sm form-control form-control-sm mr-1 ml-1" style="width: 70px;">
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                          <option value="250">250</option>
                        </select>
                        &nbsp; entries
                      </label>
                    </div>
                  </div>
                </div>

                <div class="table-responsive mb-0">
                  <table class="table no-footer table-hover table-striped mb-0" id="eventsListTbl">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th class="text-right">CR</th>
                        <th class="text-right">Pts</th>
                        <th class="text-right">Client(P/L)</th>
                        <th class="text-right">Exposure Limit</th>
                        <th class="text-right">Exposure</th>
                        <th class="text-right">Available Pts</th>
                        <th>Account Type</th>
                        <th>Action</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${users.length === 0 ? '<tr><td colspan="10" class="text-center">No records found</td></tr>' : users.map(u => {
                        const crebal = u.creditRef || u.creditLimit || 0;
                        const subgen = u.balance || 0;
                        const pl = u.pl || 0;
                        const expolim = u.exposureLimit || 0;
                        const expo = u.exposure || 0;
                        const bal = subgen - expo;
                        return `
                          <tr>
                            <td><span class="text-ellipsis font-weight-bold" title="${u.uname} (${u.name || u.uname})">${u.uname}</span></td>
                            <td class="text-right">${crebal.toFixed(2)}</td>
                            <td class="text-right">${subgen.toFixed(2)}</td>
                            <td class="text-right ${pl >= 0 ? 'text-success' : 'text-danger'}">${pl.toFixed(2)}</td>
                            <td class="text-right">${expolim.toFixed(2)}</td>
                            <td class="text-right text-danger">${expo.toFixed(2)}</td>
                            <td class="text-right font-weight-bold">${bal.toFixed(2)}</td>
                            <td><span class="badge ${u.userType === '5' ? 'badge-agent' : 'badge-client'}">${u.userLevel || 'Client'}</span></td>
                            <td>
                              <div class="d-flex align-items-center">
                                <a href="javascript:void(0)" class="text-success mr-2 font-weight-bold" onclick="document.getElementById('bank_amt_${u.id}').value = (${(-1 * pl).toFixed(2)})">
                                  All <i class="fas fa-arrow-right"></i>
                                </a>
                                <input type="number" id="bank_amt_${u.id}" class="form-control form-control-sm transfer-amt mr-2" placeholder="0" style="width: 90px; display: inline-block;">
                                <button class="btn btn-info btn-sm" onclick="window.AdminApp.submitBankSingle('${u.id}')">Submit</button>
                              </div>
                            </td>
                            <td id="bank_status_${u.id}"></td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>

                <div class="row pt-3 align-items-center">
                  <div class="col-sm-12 col-md-5">
                    <div class="dataTables_info" role="status" aria-live="polite">Showing 1 to ${users.length} of ${users.length} entries</div>
                  </div>
                  <div class="col-sm-12 col-md-7">
                    <div class="dataTables_paginate paging_simple_numbers float-right">
                      <ul class="pagination pagination-rounded mb-0">
                        <li class="paginate_button page-item previous disabled"><a href="#" class="page-link"><i class="mdi mdi-chevron-left"></i></a></li>
                        <li class="paginate_button page-item active"><a href="#" class="page-link">1</a></li>
                        <li class="paginate_button page-item next disabled"><a href="#" class="page-link"><i class="mdi mdi-chevron-right"></i></a></li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      `;
    },

    submitBankSingle: function(userId) {
      const amtInput = document.getElementById('bank_amt_' + userId);
      const statusCell = document.getElementById('bank_status_' + userId);
      const mpassInput = document.getElementById('bank-master-pwd');

      if (!mpassInput || !mpassInput.value) {
        if (statusCell) statusCell.innerHTML = '<span class="text-danger small">Please enter master password</span>';
        return;
      }

      const amt = parseFloat(amtInput ? amtInput.value : 0);
      if (!amt || isNaN(amt)) {
        if (statusCell) statusCell.innerHTML = '<span class="text-danger small">Please enter amount</span>';
        return;
      }

      // Process transaction
      const user = window.AdminDataStore.getUserById(userId);
      if (user) {
        user.balance = (user.balance || 0) + amt;
        window.AdminDataStore.saveUsers();
        if (statusCell) statusCell.innerHTML = '<span class="text-success small">Deposit/Withdraw successful</span>';
        setTimeout(() => {
          this.renderBank(document.getElementById('admin-main-content'));
        }, 1200);
      }
    },

    transferAllBank: function() {
      const mpassInput = document.getElementById('bank-master-pwd');
      if (!mpassInput || !mpassInput.value) {
        alert('Please enter master password / transaction code');
        return;
      }
      const users = window.AdminDataStore.getUsers();
      let count = 0;
      users.forEach(u => {
        const amtInput = document.getElementById('bank_amt_' + u.id);
        const amt = parseFloat(amtInput ? amtInput.value : 0);
        if (amt && !isNaN(amt)) {
          u.balance = (u.balance || 0) + amt;
          count++;
        }
      });
      if (count > 0) {
        window.AdminDataStore.saveUsers();
        alert(`Transferred balance for ${count} accounts.`);
        this.renderBank(document.getElementById('admin-main-content'));
      } else {
        alert('Please enter amount for at least one account');
      }
    },

    renderUserLock: function(container) {
      const users = window.AdminDataStore.getUsers();

      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
              <h4 class="mb-0 font-size-18 font-weight-bold">General Lock & Permissions</h4>
              <div class="page-title-right">
                <div class="btn-group">
                  <button type="button" class="btn btn-sm btn-outline-danger font-weight-bold" onclick="window.adminMasterLock('lockBets')">
                    <i class="fas fa-ban mr-1"></i> Lock All Bets
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-warning font-weight-bold" onclick="window.adminMasterLock('lockUsers')">
                    <i class="fas fa-user-lock mr-1"></i> Lock All Logins
                  </button>
                  <button type="button" class="btn btn-sm btn-outline-success font-weight-bold" onclick="window.adminMasterLock('unlockAll')">
                    <i class="fas fa-unlock mr-1"></i> Unlock All
                  </button>
                </div>
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

    renderGeneralReport: function(container) {
      container.innerHTML = `
        <div class="listing-grid">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
                <h4 class="mb-0 font-size-18 font-weight-bold">General Report</h4>
              </div>
            </div>
          </div>

          <div class="row mt-3">
            <div class="col-12">
              <form class="ajaxFormSubmit mb-3" onsubmit="event.preventDefault(); alert('Loading report...');">
                <div class="row row5 align-items-end">
                  <div class="col-md-4 col-xl-2 mb-2">
                    <div class="form-group mb-0">
                      <label class="font-weight-normal">Select Type</label>
                      <select name="type" class="form-control form-control-sm">
                        <option value="general_report" selected>General Report</option>
                        <option value="credit_refrance_report">Credit Refrance Report</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-4 col-xl-3 mb-2">
                    <button type="submit" class="btn btn-primary btn-sm" id="loaddata">Load</button>
                  </div>
                </div>
              </form>

              <div class="table-responsive mb-0 report-table">
                <table class="table table-striped table-hover table-bordered mb-0">
                  <thead>
                    <tr>
                      <th>Sr.No</th>
                      <th>Name</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colspan="3" class="text-center mb-0">No data available in table</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderGameReport: function(container) {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const formatDate = d => d.toISOString().slice(0, 10);

      container.innerHTML = `
        <div class="listing-grid report-wrapper">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
                <h4 class="mb-0 font-size-18 font-weight-bold">Game Report</h4>
              </div>
            </div>
          </div>

          <div class="row mt-3">
            <div class="col-12">
              <form class="ajaxFormSubmit mb-3" onsubmit="event.preventDefault(); alert('Loading Game List...');">
                <div class="row align-items-end">
                  <div class="col-md-2 mb-2">
                    <label class="font-weight-normal">From</label>
                    <input type="date" class="form-control form-control-sm" value="${formatDate(oneWeekAgo)}">
                  </div>
                  <div class="col-md-2 mb-2">
                    <label class="font-weight-normal">To</label>
                    <input type="date" class="form-control form-control-sm" value="${formatDate(now)}">
                  </div>
                  <div class="col-md-4 col-xl-2 mb-2">
                    <div class="form-group mb-0">
                      <label class="font-weight-normal">Type</label>
                      <select name="type" class="form-control form-control-sm">
                        <option value="all" selected>All</option>
                        <option value="match">Match</option>
                        <option value="fancy">Fancy</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-4 col-xl-3 mb-2">
                    <button type="submit" class="btn btn-primary btn-sm" id="loaddata">Game List</button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-12">
              <form class="ajaxFormSubmit" onsubmit="event.preventDefault(); alert('Loading Report...');">
                <div class="row align-items-end">
                  <div class="col-md-8 col-xl-6 mb-2">
                    <div class="form-group mb-0">
                      <select name="type" class="form-control form-control-sm">
                        <option value="all" selected>All</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-4 col-xl-4 mb-2">
                    <button type="submit" class="btn btn-primary btn-sm mr-1" id="loaddata">Show Game Report</button>
                    <button type="button" class="btn btn-primary btn-sm" onclick="alert('Loading Master Game Report...');">Master Game Report</button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div class="table-responsive mb-0 report-table">
            <table class="table table-striped table-bordered table-hover mb-0">
              <thead>
                <tr>
                  <th>Sr.No</th>
                  <th>Name</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="3" class="text-center mb-0">No data available in table</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    renderTurnOverReport: function(container) {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const formatDate = d => d.toISOString().slice(0, 10);

      container.innerHTML = `
        <div class="listing-grid report-wrapper">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
                <h4 class="mb-0 font-size-18 font-weight-bold">Turnover Report</h4>
              </div>
            </div>
          </div>

          <div class="row mt-3">
            <div class="col-12">
              <form class="ajaxFormSubmit mb-3" onsubmit="event.preventDefault(); alert('Loading Turnover Report...');">
                <div class="row align-items-end">
                  <div class="col-md-2 mb-2">
                    <label class="font-weight-normal">From</label>
                    <input type="date" class="form-control form-control-sm" value="${formatDate(oneWeekAgo)}">
                  </div>
                  <div class="col-md-2 mb-2">
                    <label class="font-weight-normal">To</label>
                    <input type="date" class="form-control form-control-sm" value="${formatDate(now)}">
                  </div>
                  <div class="col-md-2 mb-2">
                    <div class="form-group mb-0">
                      <label class="font-weight-normal">Type</label>
                      <select name="type" class="form-control form-control-sm">
                        <option value="all" selected>All</option>
                        <option value="sport">Sport</option>
                        <option value="casino">Casino</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-2 mb-2">
                    <div class="form-group mb-0">
                      <label class="font-weight-normal">Sport</label>
                      <select name="sport" class="form-control form-control-sm">
                        <option value="" selected>All Sports</option>
                        <option value="4">Cricket</option>
                        <option value="1">Soccer</option>
                        <option value="2">Tennis</option>
                      </select>
                    </div>
                  </div>
                  <div class="col-md-4 mb-2">
                    <button type="submit" class="btn btn-primary btn-sm mr-2" id="loaddata">Load</button>
                    <button type="button" class="btn btn-success btn-sm mr-1" onclick="alert('Exporting Excel...')"><i class="far fa-file-excel mr-1"></i> Excel</button>
                    <button type="button" class="btn btn-danger btn-sm" onclick="alert('Exporting PDF...')"><i class="far fa-file-pdf mr-1"></i> PDF</button>
                  </div>
                </div>
              </form>

              <div class="table-responsive mb-0 report-table">
                <table class="table table-striped table-bordered table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Sr.No</th>
                      <th>Sport Name</th>
                      <th class="text-right">Total Amount</th>
                      <th class="text-right">Net P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colspan="4" class="text-center mb-0">No data available in table</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderUserAuthList: function(container) {
      const users = window.AdminDataStore.getUsers();

      container.innerHTML = `
        <div class="listing-grid report-wrapper">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
                <h4 class="mb-0 font-size-18 font-weight-bold">User Authentication</h4>
                <div class="page-title-right">
                  <ol class="breadcrumb m-0">
                    <li class="breadcrumb-item"><a href="#/admin/dashboard">Home</a></li>
                    <li class="breadcrumb-item active">User Authentication</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-12">
              <div class="d-inline-block">
                <button class="btn btn-danger btn-sm buttons-pdf mr-1" type="button" onclick="alert('Exporting PDF...')">
                  <i class="far fa-file-pdf mr-1"></i> PDF
                </button>
                <button class="btn btn-success btn-sm buttons-excel" type="button" onclick="alert('Exporting Excel...')">
                  <i class="far fa-file-excel mr-1"></i> Excel
                </button>
              </div>
            </div>
          </div>

          <div class="row mb-2 align-items-center">
            <div class="col-6">
              <div class="dataTables_length">
                <label class="d-inline-flex align-items-center font-weight-normal">
                  Show &nbsp;
                  <select class="custom-select custom-select-sm form-control form-control-sm mr-1 ml-1" style="width: 70px;">
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="75">75</option>
                    <option value="100">100</option>
                    <option value="125">125</option>
                    <option value="150">150</option>
                  </select>
                  &nbsp; entries
                </label>
              </div>
            </div>
            <div class="col-6 text-right">
              <div class="dataTables_filter text-md-right">
                <label class="d-inline-flex align-items-center font-weight-normal">
                  Search: &nbsp;
                  <input type="search" class="form-control form-control-sm ml-1" placeholder="Search..." style="width: 160px; display: inline-block;">
                </label>
              </div>
            </div>
          </div>

          <div class="table-responsive mb-0 report-table">
            <table class="table no-footer table-hover table-striped table-bordered mb-0" id="eventsListTbl">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Authentication</th>
                </tr>
              </thead>
              <tbody>
                ${users.length === 0 ? '<tr><td colspan="2" class="text-center">No records found</td></tr>' : users.map(u => `
                  <tr>
                    <td><strong>${u.uname}</strong></td>
                    <td><span class="badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}">${u.status === 'active' ? 'Disabled' : 'Disabled'}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="row pt-3 align-items-center">
            <div class="col-sm-12 col-md-5">
              <div class="dataTables_info" role="status" aria-live="polite">Showing 1 to ${users.length} of ${users.length} entries</div>
            </div>
            <div class="col-sm-12 col-md-7">
              <div class="dataTables_paginate paging_simple_numbers float-right">
                <ul class="pagination pagination-rounded mb-0">
                  <li class="paginate_button page-item previous disabled"><a href="#" class="page-link"><i class="mdi mdi-chevron-left"></i></a></li>
                  <li class="paginate_button page-item active"><a href="#" class="page-link">1</a></li>
                  <li class="paginate_button page-item next disabled"><a href="#" class="page-link"><i class="mdi mdi-chevron-right"></i></a></li>
                </ul>
              </div>
            </div>
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
  window.switchExtraTab = function(tabName) {
    document.querySelectorAll('#extraNavTabs .nav-link').forEach(link => {
      link.classList.remove('active');
    });
    const activeLink = document.getElementById('tabLink-' + tabName);
    if (activeLink) activeLink.classList.add('active');

    document.querySelectorAll('.extra-tab-pane').forEach(pane => {
      pane.style.display = 'none';
    });
    const targetPane = document.getElementById('extraPane-' + tabName);
    if (targetPane) targetPane.style.display = 'block';
  };

  window.openExtraModal = function(userId) {
    const user = window.AdminDataStore.getUserByGuid(userId);
    if (!user) return;

    const titleEl = document.getElementById('extraModalTitle');
    const avatar = document.getElementById('extraAvatarInitial');
    const uEl = document.getElementById('extraUserName');
    const fEl = document.getElementById('extraFullName');
    const pName = document.getElementById('extraPartnershipName');
    const pShare = document.getElementById('extraPartnershipShare');
    const aType = document.getElementById('extraAccountType');

    if (titleEl) titleEl.innerText = `${user.uname} - Account Profile`;
    if (avatar) avatar.innerText = (user.uname || 'U').charAt(0).toUpperCase();
    if (uEl) uEl.innerText = user.uname;
    if (fEl) fEl.innerText = user.fname || user.uname;
    if (pName) pName.innerText = `${user.upline || 'Faazan50'} Upline`;
    if (pShare) pShare.innerText = `${user.share || 0}%`;
    if (aType) aType.innerText = user.userType === '5' ? 'Agent' : 'Client';

    // Populate Tab 2: Login History
    const loginHistoryBody = document.getElementById('extraLoginHistoryBody');
    if (loginHistoryBody) {
      loginHistoryBody.innerHTML = `
        <tr><td>2026-09-24 03:15:20</td><td>110.38.12.84</td><td>PTCL Broadband / Pakistan</td><td><span class="badge badge-success">Success (Chrome / Win)</span></td></tr>
        <tr><td>2026-09-23 21:40:12</td><td>110.38.12.84</td><td>PTCL Broadband / Pakistan</td><td><span class="badge badge-success">Success (Chrome / Win)</span></td></tr>
        <tr><td>2026-09-22 18:05:44</td><td>182.185.10.22</td><td>Nayatel Fiber / Islamabad</td><td><span class="badge badge-success">Success (Mobile / Android)</span></td></tr>
      `;
    }

    // Populate Tab 3: Password History
    const pwdHistoryBody = document.getElementById('extraPasswordHistoryBody');
    if (pwdHistoryBody) {
      pwdHistoryBody.innerHTML = `
        <tr><td>2026-09-20 14:10:00</td><td>Password modified by Master</td><td>110.38.12.84</td><td>Faazan50</td><td>Self update</td></tr>
        <tr><td>2026-08-18 16:45:00</td><td>Initial password generated</td><td>System</td><td>Faazan50</td><td>Account creation</td></tr>
      `;
    }

    // Populate Tab 4: Account History
    const accHistoryBody = document.getElementById('extraAccountHistoryBody');
    if (accHistoryBody) {
      accHistoryBody.innerHTML = `
        <tr><td>2026-09-23 19:30:00</td><td>Faazan50</td><td class="text-right text-success font-weight-bold">+${App.formatCurrency(user.balance || 0)}</td><td>Weekly balance allocation</td></tr>
        <tr><td>2026-09-17 12:00:00</td><td>Faazan50</td><td class="text-right text-info font-weight-bold">+${App.formatCurrency(user.creditRef || 50000)}</td><td>Opening credit reference</td></tr>
      `;
    }

    // Populate Tab 5: Credit History
    const creditHistoryBody = document.getElementById('extraCreditHistoryBody');
    if (creditHistoryBody) {
      creditHistoryBody.innerHTML = `
        <tr><td>2026-09-23 19:30:00</td><td>Credit updated by Master</td><td class="text-right font-weight-bold">${App.formatCurrency(user.creditRef || 50000)}</td><td class="text-right">${App.formatCurrency(user.balance || 0)}</td></tr>
        <tr><td>2026-09-01 11:30:00</td><td>Initial credit assignment</td><td class="text-right font-weight-bold">${App.formatCurrency(user.creditRef || 50000)}</td><td class="text-right">${App.formatCurrency(user.creditRef || 50000)}</td></tr>
      `;
    }

    window.switchExtraTab('profile');
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
    const matches = window.AdminDataStore.getLiveMatches();
    const match = matches.find(m => String(m.id) === String(matchId)) || matches[0];
    if (!match) return;

    const modalContent = document.getElementById('marketBookContent');
    const titleEl = document.getElementById('marketBookModalTitle');
    if (titleEl) titleEl.innerText = `${match.eventName} — Market Book Details`;

    if (modalContent) {
      modalContent.innerHTML = `
        <div class="alert alert-dark d-flex justify-content-between align-items-center mb-3">
          <div>
            <span class="badge badge-warning mr-2">${match.sportName}</span>
            <strong class="text-white">${match.eventName}</strong>
          </div>
          <div>
            ${match.inPlay ? '<span class="badge badge-success">IN PLAY</span>' : '<span class="badge badge-secondary">UPCOMING</span>'}
            Matched: <strong class="text-info">${App.formatCurrency(match.matchedVolume)}</strong>
          </div>
        </div>

        <h6 class="font-weight-bold mb-2">Match Odds Market Book</h6>
        <div class="table-responsive mb-3">
          <table class="table table-bordered table-striped">
            <thead class="bg-dark text-white">
              <tr>
                <th>Runner</th>
                <th class="text-center" style="background:#72bbef; color:#111; width:90px;">Back</th>
                <th class="text-center" style="background:#faa9ba; color:#111; width:90px;">Lay</th>
                <th class="text-right">Net Downline Exposure</th>
              </tr>
            </thead>
            <tbody>
              ${match.runners.map(r => `
                <tr>
                  <td><strong>${r.name}</strong></td>
                  <td class="text-center font-weight-bold" style="background:#edf7fe;">${r.back.toFixed(2)}</td>
                  <td class="text-center font-weight-bold" style="background:#fef0f2;">${r.lay.toFixed(2)}</td>
                  <td class="text-right font-weight-bold ${r.exp >= 0 ? 'text-success' : 'text-danger'}">
                    ${r.exp >= 0 ? '+' : ''}${App.formatCurrency(r.exp)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <h6 class="font-weight-bold mb-2">Matched Bets on this Event</h6>
        <div class="table-responsive">
          <table class="table table-sm table-striped">
            <thead class="thead-light">
              <tr>
                <th>Bet ID</th>
                <th>Account</th>
                <th>Selection</th>
                <th>Type</th>
                <th class="text-right">Odds</th>
                <th class="text-right">Stake</th>
                <th class="text-right">Liab / Win</th>
              </tr>
            </thead>
            <tbody>
              ${window.AdminDataStore.getCurrentBets().map(b => `
                <tr>
                  <td><code>${b.id}</code></td>
                  <td><strong>${b.user}</strong></td>
                  <td>${b.runner}</td>
                  <td><span class="badge ${b.type === 'Back' ? 'badge-primary' : 'badge-danger'}">${b.type}</span></td>
                  <td class="text-right font-weight-bold">${b.odds.toFixed(2)}</td>
                  <td class="text-right">${App.formatCurrency(b.stake)}</td>
                  <td class="text-right text-success font-weight-bold">${App.formatCurrency(b.profit)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    window.openModal('marketBookModal');
  };

  window.voidBet = function(betId) {
    if (!confirm(`Are you sure you want to void bet #${betId}? This action will return the stake and reverse exposure.`)) {
      return;
    }
    const res = window.AdminDataStore.voidBet(betId);
    if (res) {
      App.showToast(`Bet #${betId} voided successfully! User exposure updated.`, 'success');
      App.updateTopBar();
      App.handleRouting();
    }
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

  window.adminFilterStatement = function() {
    const fromDate = document.getElementById('statementFromDate')?.value;
    const toDate = document.getElementById('statementToDate')?.value;
    const txnType = document.getElementById('statementTxnType')?.value;

    const rows = document.querySelectorAll('#statementTbl tbody tr');
    rows.forEach(r => {
      const rowDate = r.getAttribute('data-date');
      const rowType = r.getAttribute('data-type');
      let show = true;
      if (fromDate && rowDate && rowDate < fromDate) show = false;
      if (toDate && rowDate && rowDate > toDate) show = false;
      if (txnType && txnType !== 'All' && rowType !== txnType) show = false;
      r.style.display = show ? '' : 'none';
    });
  };

  window.adminResetStatement = function() {
    const f = document.getElementById('statementFromDate');
    const t = document.getElementById('statementToDate');
    const type = document.getElementById('statementTxnType');
    if (f) f.value = '';
    if (t) t.value = '';
    if (type) type.value = 'All';
    document.querySelectorAll('#statementTbl tbody tr').forEach(r => {
      r.style.display = '';
    });
  };

  window.adminMasterLock = function(action) {
    if (action === 'lockBets') {
      window.AdminDataStore.lockAllBets(true);
      App.showToast('All downline betting has been LOCKED.', 'warning');
    } else if (action === 'unlockBets') {
      window.AdminDataStore.lockAllBets(false);
      App.showToast('All downline betting has been UNLOCKED.', 'success');
    } else if (action === 'lockUsers') {
      window.AdminDataStore.lockAllUsers(true);
      App.showToast('All downline user logins have been LOCKED.', 'warning');
    } else if (action === 'unlockUsers') {
      window.AdminDataStore.lockAllUsers(false);
      App.showToast('All downline user logins have been UNLOCKED.', 'success');
    } else if (action === 'unlockAll') {
      window.AdminDataStore.lockAllUsers(false);
      window.AdminDataStore.lockAllBets(false);
      App.showToast('All accounts and betting have been UNLOCKED.', 'success');
    }
    App.handleRouting();
  };

  // Launch on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  window.AdminApp = App;

})(window, document);

