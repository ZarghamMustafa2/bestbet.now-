/**
 * ALLPANELEXCH Admin Panel - Application Controller & SPA Router
 * Reproduces the complete management interface, interactions, hierarchy, and settlement workflows.
 */

(function(window, document) {
  'use strict';

  const App = {
    currentPath: '/admin/users',
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
          const token = localStorage.getItem('admin_token');
          if (token && token.includes('.')) {
            const parts = token.split('.');
            try {
              const payload = JSON.parse(atob(parts[0]));
              if (payload.exp && payload.exp < Date.now()) {
                console.warn('Admin session expired');
                this.adminUser = null;
                localStorage.removeItem('admin_user');
                localStorage.removeItem('admin_token');
                localStorage.removeItem('vuejs__admin_user');
              }
            } catch (err) {}
          }
        } catch (e) {
          this.adminUser = null;
        }
      }

      if (this.adminUser && this.adminUser.uname) {
        if (window.AdminDataStore) {
          window.AdminDataStore.setCurrentAdmin(this.adminUser);
          const token = localStorage.getItem('admin_token');
          if (token) {
            window.AdminDataStore.syncUsersFromServer(token);
          }
        }
        if (this.adminUser.login === false) {
          this.showLogin();
          this.showLoginStep('changePassword', this.adminUser.uname);
        } else {
          this.showDashboard();
        }
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

    showLoginStep: function(step, data) {
      this.showLogin();
      const stepSignIn = document.getElementById('loginStepSignIn');
      const stepChangePass = document.getElementById('loginStepChangePassword');
      const stepSuccess = document.getElementById('loginStepSuccess');
      const stepAuth = document.getElementById('loginStepAuth');
      const loginSection = document.getElementById('loginSection');

      if (stepSignIn) stepSignIn.style.display = 'none';
      if (stepChangePass) stepChangePass.style.display = 'none';
      if (stepSuccess) stepSuccess.style.display = 'none';
      if (stepAuth) stepAuth.style.display = 'none';
      if (loginSection) loginSection.classList.remove('success-mode');

      if (step === 'signIn') {
        if (stepSignIn) stepSignIn.style.display = 'block';
        if (window.location.pathname.startsWith('/admin/change-password-success') || window.location.pathname.startsWith('/admin/loginauth')) {
          window.history.pushState(null, '', '/admin');
        }
        if (data && typeof data === 'string') {
          const uField = document.getElementById('input-1');
          if (uField) uField.value = data;
        } else if (!data) {
          const uField = document.getElementById('input-1');
          if (uField) uField.value = '';
        }
        const pField = document.getElementById('input-2');
        if (pField) pField.value = '';
        const uErr = document.getElementById('usernameError');
        const pErr = document.getElementById('passwordError');
        if (uErr) uErr.style.display = 'none';
        if (pErr) pErr.style.display = 'none';
      } else if (step === 'changePassword') {
        if (stepChangePass) stepChangePass.style.display = 'block';
        const cpUser = document.getElementById('cp-input-username');
        const cpOld = document.getElementById('cp-input-old');
        const cpNew = document.getElementById('cp-input-new');
        const cpConfirm = document.getElementById('cp-input-confirm');

        let uName = 'Faazan50';
        let oldPass = '';
        if (typeof data === 'string' && data) {
          uName = data;
        } else if (data && typeof data === 'object') {
          uName = data.username || data.uname || 'Faazan50';
          oldPass = data.password || data.oldPassword || '';
        } else {
          const uField = document.getElementById('input-1');
          if (uField && uField.value) uName = uField.value;
        }

        if (!oldPass) {
          oldPass = this.pendingFirstTimePassword || sessionStorage.getItem('pending_first_time_password') || '';
        }

        if (cpUser) cpUser.value = uName;
        if (cpOld) cpOld.value = oldPass;
        if (cpNew) cpNew.value = '';
        if (cpConfirm) cpConfirm.value = '';
      } else if (step === 'success') {
        if (loginSection) loginSection.classList.add('success-mode');
        if (stepSuccess) stepSuccess.style.display = 'flex';
        const token = (typeof data === 'string' && data) ? data : (data && data.token ? data.token : '130367');
        const tokenEn = document.getElementById('successTranTokenEn');
        const tokenHi = document.getElementById('successTranTokenHi');
        if (tokenEn) tokenEn.textContent = token;
        if (tokenHi) tokenHi.textContent = token;
        const targetUrl = '/admin/change-password-success/' + token;
        if (window.location.pathname !== targetUrl) {
          window.history.pushState(null, '', targetUrl);
        }
      } else if (step === 'auth') {
        if (stepAuth) stepAuth.style.display = 'flex';
        const authId = (data && data.authId) ? data.authId : '1';
        const targetUrl = '/admin/loginauth/' + authId;
        if (window.location.pathname !== targetUrl) {
          window.history.pushState(null, '', targetUrl);
        }
        setTimeout(() => {
          const d1 = document.getElementById('authDigit1');
          if (d1) d1.focus();
        }, 100);
      }
    },

    showDashboard: function() {
      const loginSec = document.getElementById('loginSection');
      const dashSec = document.getElementById('dashboardSection');
      if (loginSec) loginSec.style.display = 'none';
      if (dashSec) dashSec.style.display = 'block';
      document.body.removeAttribute('data-sidebar');

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
      if (userEl) {
        const role = admin.role || 'company';
        const roleLabel = window.AdminDataStore ? window.AdminDataStore.getRoleLabel(role) : (admin.userLevel || 'Company Account');
        const username = admin.uname || admin.username || 'Newadmin98';
        userEl.innerHTML = `${username} <span class="role-badge role-badge-${role} ml-1 d-none d-md-inline" style="font-size:10px; vertical-align:middle;">${roleLabel}</span>`;
      }
    },

    formatCurrency: function(num) {
      const n = Number(num) || 0;
      return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    bindGlobalEvents: function() {
      const self = this;

      // Real-time error dismissal on input
      const uInput = document.getElementById('input-1') || document.getElementById('inputUsername');
      const pInput = document.getElementById('input-2') || document.getElementById('inputPassword');
      if (uInput) {
        uInput.addEventListener('input', function() {
          const err = document.getElementById('usernameError');
          if (err) err.style.display = 'none';
        });
      }
      if (pInput) {
        pInput.addEventListener('input', function() {
          const err = document.getElementById('passwordError');
          if (err) err.style.display = 'none';
        });
      }

      // 1. Login Form Submission
      const loginForm = document.getElementById('adminLoginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          const uField = document.getElementById('input-1') || document.getElementById('inputUsername');
          const pField = document.getElementById('input-2') || document.getElementById('inputPassword');
          const submitBtn = document.getElementById('loginSubmitBtn') || loginForm.querySelector('button[type="submit"]');

          const uVal = (uField.value || '').trim();
          const pVal = (pField.value || '').trim();

          const uErr = document.getElementById('usernameError');
          const pErr = document.getElementById('passwordError');
          if (uErr) uErr.style.display = 'none';
          if (pErr) pErr.style.display = 'none';

          let hasError = false;
          if (!uVal) {
            if (uErr) uErr.style.display = 'block';
            hasError = true;
          }
          if (!pVal) {
            if (pErr) pErr.style.display = 'block';
            hasError = true;
          }
          if (hasError) return;

          // Loading state on button
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Login <i class="fas fa-spinner fa-spin ml-1"></i>';
          }

          try {
            // Attempt server-side login API with client-synced accounts
            const ENC_KEY = 'cae7b808-8b1e-4f47-87a5-1a4b6a08030e';
            const authUsers = (window.AdminDataStore && window.AdminDataStore.getAuthUsers)
              ? window.AdminDataStore.getAuthUsers()
              : [];
            const loginPayload = {
              username: uVal,
              password: pVal,
              clientAccounts: authUsers
            };
            let reqBody;
            if (window.CryptoJS) {
              const cipher = CryptoJS.AES.encrypt(JSON.stringify(loginPayload), ENC_KEY).toString();
              reqBody = JSON.stringify({ data: cipher });
            } else {
              reqBody = JSON.stringify(loginPayload);
            }

            const response = await fetch('/api/admin/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: reqBody
            });

            const json = await response.json();
            let res = json;
            if (json.data && typeof json.data === 'string' && window.CryptoJS) {
              try {
                const bytes = CryptoJS.AES.decrypt(json.data, ENC_KEY);
                res = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
              } catch (err) {}
            }

            if (response.ok && res.status === 200 && res.data) {
              const adminData = res.data;
              if (adminData.login === false) {
                // First-time login / password change required
                self.pendingFirstTimeUser = uVal;
                self.pendingFirstTimePassword = pVal;
                sessionStorage.setItem('pending_first_time_user', uVal);
                sessionStorage.setItem('pending_first_time_password', pVal);
                self.showToast('Welcome, You are logged in first time. Please change your password to continue.', 'success');
                self.showLoginStep('changePassword', { username: uVal, password: pVal });
                return;
              }

              if (adminData.auth === 1 || adminData.auth === 2 || adminData.auth === 3) {
                self.showLoginStep('auth', { authId: adminData.auth, username: uVal });
                return;
              }

              self.adminUser = adminData;
              localStorage.setItem('admin_user', JSON.stringify(adminData));
              if (adminData.token) localStorage.setItem('admin_token', adminData.token);
              localStorage.setItem('vuejs__admin_user', JSON.stringify({ type: 'string', value: JSON.stringify(adminData), expire: null }));

              if (window.AdminDataStore) {
                window.AdminDataStore.setCurrentAdmin(adminData);
                if (adminData.token) {
                  window.AdminDataStore.syncUsersFromServer(adminData.token);
                }
              }

              self.showDashboard();
              let redirectRoute = sessionStorage.getItem('admin_redirect') || '/admin/users';
              sessionStorage.removeItem('admin_redirect');
              if (redirectRoute === '/admin' || redirectRoute === '/admin/' || redirectRoute === '/admin/home' || redirectRoute === '/admin/dashboard') {
                redirectRoute = '/admin/users';
              }
              self.navigate(redirectRoute);
              self.showToast('Logged in successfully.', 'success');
            } else {
              const errMsg = res.msg || 'Invalid username or password';
              self.showToast(errMsg, 'danger');
            }
          } catch (netErr) {
            console.error('Login network error:', netErr);
            self.showToast('Unable to connect to authentication server.', 'danger');
          } finally {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = 'Login <i class="fas fa-sign-in-alt ml-1"></i>';
            }
          }
        });
      }

      // 1b. Switch to Change Password Screen
      const btnGoToChangePass = document.getElementById('btnGoToChangePass');
      if (btnGoToChangePass) {
        btnGoToChangePass.addEventListener('click', function(e) {
          e.preventDefault();
          const uField = document.getElementById('input-1');
          const uVal = (uField?.value || 'Faazan50').trim();
          self.showLoginStep('changePassword', uVal);
        });
      }

      // 1c. Change Password Form Submission
      const cpForm = document.getElementById('adminChangePasswordForm');
      if (cpForm) {
        cpForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          const uField = document.getElementById('cp-input-username');
          const oField = document.getElementById('cp-input-old');
          const nField = document.getElementById('cp-input-new');
          const cField = document.getElementById('cp-input-confirm');
          const submitBtn = document.getElementById('cpSubmitBtn');

          const uVal = (uField?.value || '').trim();
          let oVal = (oField?.value || '').trim();
          if (!oVal) {
            oVal = (self.pendingFirstTimePassword || sessionStorage.getItem('pending_first_time_password') || '').trim();
            if (oField && oVal) oField.value = oVal;
          }
          const nVal = (nField?.value || '').trim();
          const cVal = (cField?.value || '').trim();

          const uErr = document.getElementById('cpUserError');
          const oErr = document.getElementById('cpOldError');
          const nErr = document.getElementById('cpNewError');
          const cErr = document.getElementById('cpConfirmError');
          if (uErr) uErr.style.display = 'none';
          if (oErr) oErr.style.display = 'none';
          if (nErr) nErr.style.display = 'none';
          if (cErr) cErr.style.display = 'none';

          let hasError = false;
          if (!uVal) { if (uErr) uErr.style.display = 'block'; hasError = true; }
          const isPendingFirst = !!(self.pendingFirstTimeUser || sessionStorage.getItem('pending_first_time_user'));
          if (!oVal && !isPendingFirst) { if (oErr) oErr.style.display = 'block'; hasError = true; }
          if (!nVal || nVal.length < 8) { if (nErr) nErr.style.display = 'block'; hasError = true; }
          if (nVal !== cVal) { if (cErr) cErr.style.display = 'block'; hasError = true; }
          if (hasError) return;

          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Updating <i class="fas fa-spinner fa-spin ml-1"></i>';
          }

          try {
            const ENC_KEY = 'cae7b808-8b1e-4f47-87a5-1a4b6a08030e';
            const authUsers = (window.AdminDataStore && typeof window.AdminDataStore.getAuthUsers === 'function')
              ? window.AdminDataStore.getAuthUsers()
              : ((window.AdminDataStore && typeof window.AdminDataStore.getUsers === 'function')
                ? window.AdminDataStore.getUsers()
                : []);
            const payloadObj = {
              uname: uVal,
              password: oVal,
              newPassword: nVal,
              newPasswordConfirm: cVal,
              clientAccounts: authUsers
            };
            let reqBody;
            if (window.CryptoJS) {
              const cipher = CryptoJS.AES.encrypt(JSON.stringify(payloadObj), ENC_KEY).toString();
              reqBody = JSON.stringify({ data: cipher });
            } else {
              reqBody = JSON.stringify(payloadObj);
            }

            const response = await fetch('/api/admin/changepass-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: reqBody
            });

            const json = await response.json();
            let res = json;
            if (json.data && typeof json.data === 'string' && window.CryptoJS) {
              try {
                const bytes = CryptoJS.AES.decrypt(json.data, ENC_KEY);
                res = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
              } catch (err) {}
            }

            if (response.ok && res.status === 200 && res.data) {
              const tranToken = res.data.tran || '130367';
              if (window.AdminDataStore && typeof window.AdminDataStore.updateUserPassword === 'function') {
                window.AdminDataStore.updateUserPassword(uVal, nVal, tranToken);
              }
              self.pendingFirstTimeUser = null;
              sessionStorage.removeItem('pending_first_time_user');
              self.showToast(res.data.msg || 'Password updated successfully.', 'success');
              self.showLoginStep('success', tranToken);
            } else {
              self.showToast(res.msg || 'Failed to update password', 'danger');
            }
          } catch (netErr) {
            console.error('Change password error:', netErr);
            self.showToast('Unable to connect to password server.', 'danger');
          } finally {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = 'Change Password';
            }
          }
        });
      }

      // 1d. Back Button from Change Password to Sign In
      const cpBackBtn = document.getElementById('cpBackBtn');
      if (cpBackBtn) {
        cpBackBtn.addEventListener('click', function(e) {
          e.preventDefault();
          self.pendingFirstTimeUser = null;
          sessionStorage.removeItem('pending_first_time_user');
          const cpUser = (document.getElementById('cp-input-username')?.value || '').trim();
          self.showLoginStep('signIn', cpUser);
        });
      }

      // 1e. Centered Back Button from Transaction Success Page (Matching Screenshot)
      const btnBackFromSuccess = document.getElementById('btnBackFromSuccess');
      if (btnBackFromSuccess) {
        btnBackFromSuccess.addEventListener('click', function(e) {
          e.preventDefault();
          self.pendingFirstTimeUser = null;
          sessionStorage.removeItem('pending_first_time_user');
          const cpUser = (document.getElementById('cp-input-username')?.value || 'Faazan50').trim();
          self.showLoginStep('signIn', cpUser);
          self.showToast('Password updated! Please sign in with your new password.', 'info');
        });
      }

      // 1f. 2FA Security Code Form Submission & OTP auto-advance
      for (let i = 1; i <= 6; i++) {
        const inp = document.getElementById('authDigit' + i);
        if (inp) {
          inp.addEventListener('input', function(e) {
            if (this.value && this.value.length >= 1) {
              this.value = this.value.slice(-1);
              const next = document.getElementById('authDigit' + (i + 1));
              if (next) next.focus();
            }
          });
          inp.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value) {
              const prev = document.getElementById('authDigit' + (i - 1));
              if (prev) prev.focus();
            }
          });
        }
      }

      const authForm = document.getElementById('adminAuthForm');
      if (authForm) {
        authForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          let code = '';
          for (let i = 1; i <= 6; i++) {
            code += (document.getElementById('authDigit' + i)?.value || '').trim();
          }
          const authErr = document.getElementById('authCodeError');
          if (authErr) authErr.style.display = 'none';

          if (code.length < 6) {
            if (authErr) {
              authErr.textContent = 'Please enter complete 6-digit code';
              authErr.style.display = 'block';
            }
            return;
          }

          const authSubmitBtn = document.getElementById('authSubmitBtn');
          if (authSubmitBtn) {
            authSubmitBtn.disabled = true;
            authSubmitBtn.innerHTML = 'Verifying <i class="fas fa-spinner fa-spin ml-1"></i>';
          }

          try {
            const resp = await fetch('/api/admin/verifycode', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: code, uname: 'Faazan50' })
            });
            const res = await resp.json();
            if (resp.ok && res.status === 200) {
              self.showToast('Verification successful.', 'success');
              const adminData = {
                uname: 'Faazan50',
                fname: 'Faazan',
                lname: 'Super Admin',
                userType: '2',
                userLevel: 'Super Admin',
                role: 'super_admin',
                pcode: 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss',
                gen: 500000,
                exp: 12500,
                cbal: 1000000,
                login: true,
                auth: 0
              };
              self.adminUser = adminData;
              localStorage.setItem('admin_user', JSON.stringify(adminData));
              self.showDashboard();
              self.navigate('/admin/users');
            } else {
              if (authErr) {
                authErr.textContent = res.msg || 'Invalid verification code';
                authErr.style.display = 'block';
              }
              self.showToast(res.msg || 'Invalid verification code', 'danger');
            }
          } catch (err) {
            self.showToast('Verification error.', 'danger');
          } finally {
            if (authSubmitBtn) {
              authSubmitBtn.disabled = false;
              authSubmitBtn.innerHTML = 'Verify & Proceed';
            }
          }
        });
      }

      const authBackBtn = document.getElementById('authBackBtn');
      if (authBackBtn) {
        authBackBtn.addEventListener('click', function(e) {
          e.preventDefault();
          self.showLoginStep('signIn');
        });
      }

      // 2. Logout Handler
      const logoutBtn = document.getElementById('adminLogoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
          e.preventDefault();
          try {
            await fetch('/api/admin/logout', { method: 'POST' });
          } catch (e) {}

          localStorage.removeItem('admin_user');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('vuejs__admin_user');
          sessionStorage.clear();
          self.adminUser = null;
          self.pendingFirstTimeUser = null;
          const uField = document.getElementById('input-1');
          const pField = document.getElementById('input-2');
          if (uField) uField.value = '';
          if (pField) pField.value = '';
          self.showToast('You have been logged out successfully.', 'info');
          self.showLoginStep('signIn');
          window.history.replaceState(null, '', '/admin');
        });
      }

      // Helper to close all open Bootstrap dropdown menus
      function closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu').forEach(m => {
          m.classList.remove('show');
          m.style.display = 'none';
        });
        document.querySelectorAll('.dropdown.show, .nav-item.show').forEach(d => d.classList.remove('show'));
        document.querySelectorAll('[data-toggle="dropdown"][aria-expanded="true"]').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
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
          
          closeAllDropdowns();
          
          if (!wasOpen && menu) {
            parentDropdown.classList.add('show');
            menu.classList.add('show');
            menu.style.display = 'block';
            toggleBtn.setAttribute('aria-expanded', 'true');
          }
          return;
        }

        // Close dropdown when clicking a dropdown-item
        const item = e.target.closest('.dropdown-item');
        if (item) {
          closeAllDropdowns();
        }

        // Close when clicking anywhere outside
        if (!e.target.closest('.dropdown-menu') && !e.target.closest('.dropdown')) {
          closeAllDropdowns();
        }
      });

      // Close dropdowns on outside click
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown') && !e.target.closest('[data-toggle="dropdown"]')) {
          closeAllDropdowns();
        }
      });

      // 4. SPA Route Navigation Interceptor
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a.nav-route-link');
        if (link && link.getAttribute('href')) {
          const href = link.getAttribute('href');
          if (href.startsWith('/admin')) {
            e.preventDefault();
            closeAllDropdowns();
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
          document.body.classList.toggle('sidebar-enable');
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
      if (path === '/admin' || path === '/admin/' || path === '/admin/home' || path === '/admin/dashboard') {
        path = '/admin/users';
      }
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

      // Close any open dropdowns when navigating to a new route
      document.querySelectorAll('.dropdown-menu').forEach(m => {
        m.classList.remove('show');
        m.style.display = 'none';
      });
      document.querySelectorAll('.dropdown.show, .nav-item.show').forEach(d => d.classList.remove('show'));

      // Route handlers for unauthenticated workflow screens
      if (path.startsWith('/admin/change-password-success')) {
        const parts = path.split('/');
        const token = parts[3] || '130367';
        this.showLoginStep('success', token);
        return;
      }

      if (path.startsWith('/admin/loginauth')) {
        const parts = path.split('/');
        const authId = parts[3] || '1';
        this.showLoginStep('auth', { authId: authId });
        return;
      }

      // Auth guard: redirect unauthenticated requests to /admin while preserving target route
      if (!this.adminUser) {
        if (window.location.pathname !== '/admin') {
          sessionStorage.setItem('admin_redirect', window.location.pathname);
          window.history.replaceState(null, '', '/admin');
        }
        const pendingUser = this.pendingFirstTimeUser || sessionStorage.getItem('pending_first_time_user');
        if (pendingUser) {
          this.showLogin();
          this.showLoginStep('changePassword', pendingUser);
        } else {
          this.showLoginStep('signIn');
        }
        return;
      } else if (this.adminUser.login === false) {
        this.showLogin();
        this.showLoginStep('changePassword', this.adminUser.uname);
        return;
      } else if (this.adminUser.role === 'user' || (this.adminUser.userType === '6' && !this.adminUser.role)) {
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('vuejs__admin_user');
        sessionStorage.clear();
        this.adminUser = null;
        alert('Access Denied: Normal User accounts cannot access the admin management portal.');
        window.location.href = '/home';
        return;
      } else {
        this.showDashboard();
      }

      // Normalize root admin, home, or dashboard routes to /admin/users (Account List is the reference root view)
      if (path === '/admin' || path === '/admin/' || path === '/admin/home' || path === '/admin/dashboard') {
        window.history.replaceState(null, '', '/admin/users');
        path = '/admin/users';
      }

      this.currentPath = path;

      // Update active nav link with exact pill matching reference recording
      document.querySelectorAll('#adminMainMenu .nav-link, #adminMainMenu .dropdown-item, .nav-route-link').forEach(link => {
        link.classList.remove('active');
      });

      const isClientsRoute = (path === '/admin' || path === '/admin/users' || path === '/admin/users/all' || path === '/admin/home' || path === '/admin/dashboard');
      if (isClientsRoute) {
        document.querySelectorAll('#adminMainMenu a[data-route="/admin/users"], #adminMainMenu a[href="/admin/users"]').forEach(el => el.classList.add('active'));
      } else if (path === '/admin/assign-agent') {
        document.querySelectorAll('#adminMainMenu a[data-route="/admin/assign-agent"], #adminMainMenu a[href="/admin/assign-agent"]').forEach(el => el.classList.add('active'));
      } else if (path === '/admin/market-analysis') {
        document.querySelectorAll('#adminMainMenu a[data-route="/admin/market-analysis"], #adminMainMenu a[href="/admin/market-analysis"]').forEach(el => el.classList.add('active'));
      } else if (path === '/admin/createaccount') {
        document.querySelectorAll('#adminMainMenu a[data-route="/admin/createaccount"], #adminMainMenu a[href="/admin/createaccount"]').forEach(el => el.classList.add('active'));
      } else if (path.startsWith('/admin/casino')) {
        const liveMktToggle = document.querySelector('#adminMainMenu li:nth-child(4) > a.dropdown-toggle');
        if (liveMktToggle) liveMktToggle.classList.add('active');
      } else if (path.startsWith('/admin/vcasino')) {
        const liveVirtToggle = document.querySelector('#adminMainMenu li:nth-child(5) > a.dropdown-toggle');
        if (liveVirtToggle) liveVirtToggle.classList.add('active');
      } else if (path.startsWith('/admin/reports') || path.startsWith('/admin/settings')) {
        const repToggle = document.querySelector('#reportsDropdown');
        if (repToggle) repToggle.classList.add('active');
      }

      // Also highlight specific route link
      document.querySelectorAll('.nav-route-link').forEach(link => {
        const route = link.getAttribute('data-route') || link.getAttribute('href');
        if (route === path) {
          link.classList.add('active');
        }
      });

      if (path === '/admin/market-analysis') {
        document.body.classList.add('page-market-analysis');
      } else {
        document.body.classList.remove('page-market-analysis');
      }

      if (isClientsRoute) {
        document.body.classList.add('page-users');
        const collapseBar = document.getElementById('headerCollapseBar');
        if (collapseBar && window.innerWidth < 992) {
          collapseBar.style.display = 'flex';
        }
      } else {
        document.body.classList.remove('page-users');
        const collapseBar = document.getElementById('headerCollapseBar');
        if (collapseBar) {
          collapseBar.style.display = 'none';
        }
      }

      const container = document.getElementById('adminMainContainer');
      if (!container) return;

      // Match and Render Views
      if (path === '/admin/users' || path === '/admin/users/all' || path === '/admin' || path === '/admin/' || path === '/admin/home' || path === '/admin/dashboard') {
        this.renderUsers(container, 'all');
      } else if (path === '/admin/users/super_admin') {
        this.renderUsers(container, 'super_admin');
      } else if (path === '/admin/users/admin') {
        this.renderUsers(container, 'admin');
      } else if (path === '/admin/users/super_master') {
        this.renderUsers(container, 'super_master');
      } else if (path === '/admin/users/master') {
        this.renderUsers(container, 'master');
      } else if (path === '/admin/users/client' || path === '/admin/users/user') {
        this.renderUsers(container, 'user');
      } else if (path === '/admin/users/agent') {
        this.renderUsers(container, 'master');
      } else if (path === '/admin/downline-tree' || path === '/admin/tree') {
        this.renderDownlineTree(container);
      } else if (path.startsWith('/admin/child/')) {
        const parts = path.split('/');
        const guid = parts[3];
        this.renderUsers(container, 'child', guid);
      } else if (path === '/admin/users/insertuser') {
        this.renderInsertUser(container);
      } else if (path === '/admin/assign-agent') {
        this.renderAssignAgent(container);
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
        this.renderUserHistory(container);
      } else if (path === '/admin/reports/generalreport') {
        this.renderGeneralReport(container);
      } else if (path === '/admin/reports/authlist') {
        this.renderUserAuthList(container);
      } else if (path === '/admin/reports/gamereport') {
        this.renderGameReport(container);
      } else if (path === '/admin/reports/livecasinoreport' || path.startsWith('/admin/reports/livecasinoreport/')) {
        this.renderLiveCasinoReport(container);
      } else if (path === '/admin/reports/userregisterdetail') {
        this.renderUserRegisterDetail(container);
      } else if (path === '/admin/reports/totalprofitloss') {
        this.renderTotalProfitLoss(container);
      } else if (path === '/admin/reports/userwinloss') {
        this.renderUserWinLoss(container);
      } else if (path === '/admin/createaccount') {
        this.renderCreateAccount(container);
      } else if (path.startsWith('/admin/casino/') || path.startsWith('/admin/vcasino/')) {
        const parts = path.split('/');
        const mode = parts[2];
        const slug = parts[3] || '';
        this.renderCasinoLobby(container, mode, slug);
      } else if (path.startsWith('/admin/game-detail') || path.startsWith('/admin/match/')) {
        this.renderGameDetailView(container, path);
      } else {
        window.history.replaceState(null, '', '/admin/users');
        this.renderUsers(container, 'all');
      }

      window.scrollTo(0, 0);
    },

    // ==================== VIEW RENDERERS ====================

    switchUserStatusTab: function(status) {
      this.userStatusTab = status;
      this.currentPage = 1;
      this.handleRouting();
    },

    renderUsers: function(container, filter, guid) {
      const store = window.AdminDataStore;
      const actor = this.adminUser || (store ? store.state.currentAdmin : null);
      const actorRole = actor ? store.normalizeRole(actor.role || actor.userType) : 'company';

      let users = store.getUsers();

      // Tab filter: Active vs Deactive
      const isDeactiveTab = this.userStatusTab === 'deactive';
      if (isDeactiveTab) {
        users = users.filter(u => u.userActive === false || u.status === 'Inactive');
      } else {
        users = users.filter(u => u.userActive !== false && u.status !== 'Inactive');
      }

      if (filter && filter !== 'all') {
        if (filter === 'child' && guid) {
          users = store.getDownline(guid);
        } else {
          const normF = store.normalizeRole(filter);
          users = users.filter(u => store.normalizeRole(u.role || u.userType) === normF);
        }
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
      const totalCR = users.reduce((acc, u) => acc + (Number(u.creditRef) || 0), 0);
      const totalPL = users.reduce((acc, u) => acc + (Number(u.clientPL) || (u.creditRef ? -Number(u.creditRef) : 0)), 0);
      const perPage = this.perPage || 25;
      const currentPage = this.currentPage || 1;
      const startIdx = (currentPage - 1) * perPage;
      const pagedUsers = users.slice(startIdx, startIdx + perPage);
      const totalPages = Math.ceil(totalCount / perPage) || 1;

      const allowedRoles = store ? store.getAllowedCreationRoles(actorRole) : [];
      const canCreate = allowedRoles.length > 0;
      const addAccountBtnHtml = canCreate ? `<a href="/admin/users/insertuser" class="btn btn-primary nav-route-link" data-route="/admin/users/insertuser" style="background:#0088cc; border-color:#0088cc; font-size:12px; padding: 4px 12px; border-radius: 4px;">Add Account</a>` : '';

      container.innerHTML = `
        <div class="listing-grid">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h4 class="mb-0" style="font-size: 16px; font-weight: 700; color: #333;">Account List</h4>
            ${addAccountBtnHtml}
          </div>

          <div class="card mb-3" style="border: 1px solid #e9ecef; border-radius: 4px; box-shadow: none;">
            <div class="card-body p-2 p-md-3">
              
              <!-- Top controls: Show entries & Search matching reference frame_01_0s.png -->
              <div class="row align-items-center mb-2">
                <div class="col-sm-6 mb-1 mb-sm-0">
                  <label class="d-inline-flex align-items-center mb-0" style="font-size: 11px; color: #333; font-weight: normal;">
                    Show&nbsp;
                    <select class="custom-select custom-select-sm" id="userPerPageSelect" style="width: auto; height: 26px; padding: 2px 20px 2px 6px; font-size: 11px; display: inline-block;">
                      <option value="25" ${perPage === 25 ? 'selected' : ''}>25</option>
                      <option value="50" ${perPage === 50 ? 'selected' : ''}>50</option>
                      <option value="100" ${perPage === 100 ? 'selected' : ''}>100</option>
                    </select>&nbsp;entries
                  </label>
                </div>
                <div class="col-sm-6 text-sm-right">
                  <div class="d-inline-flex align-items-center" style="font-size: 11px;">
                    <span class="mr-1">Search:</span>
                    <input type="search" placeholder="Search..." class="form-control form-control-sm mr-1" id="searchUserInput" style="height: 26px; font-size: 11px; padding: 2px 6px; width: 140px; display: inline-block; border: 1px solid #ced4da; border-radius: 2px;" onkeyup="if(event.key==='Enter')window.adminFilterUsers()">
                    <button type="button" id="loaddata" class="btn btn-primary btn-sm mr-1" style="background:#0088cc; border-color:#0088cc; font-size: 11px; padding: 2px 10px; height: 26px; border-radius: 2px;" onclick="window.adminFilterUsers()">Load</button>
                    <button type="button" id="resetdata" class="btn btn-secondary btn-sm" style="background:#6c757d; border-color:#6c757d; font-size: 11px; padding: 2px 10px; height: 26px; border-radius: 2px;" onclick="window.adminResetUsers()">Reset</button>
                  </div>
                </div>
              </div>

              <!-- Active Users / Deactive Users Tabs matching frame_01_0s.png -->
              <ul class="nav nav-tabs mb-2" style="border-bottom: 1px solid #dee2e6;">
                <li class="nav-item">
                  <a class="nav-link ${!isDeactiveTab ? 'active' : ''}" href="javascript:void(0)" onclick="window.AdminApp.switchUserStatusTab('active')" style="padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer; ${!isDeactiveTab ? 'background: #fff; border-color: #dee2e6 #dee2e6 #fff; color: #333;' : 'color: #0088cc; border: none; background: transparent;'}">Active Users</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link ${isDeactiveTab ? 'active' : ''}" href="javascript:void(0)" onclick="window.AdminApp.switchUserStatusTab('deactive')" style="padding: 6px 14px; font-size: 12px; cursor: pointer; ${isDeactiveTab ? 'background: #fff; border-color: #dee2e6 #dee2e6 #fff; font-weight: 600; color: #333;' : 'color: #0088cc; border: none; background: transparent;'}">Deactive Users</a>
                </li>
              </ul>

              <!-- PDF / Excel Export Buttons matching frame_01_0s.png -->
              <div class="mb-2">
                <button type="button" class="btn buttons-pdf" style="background:#cb0606; border-color:#cb0606; color:#fff; font-size:11px; padding: 3px 8px; border-radius: 2px; margin-right: 4px;" onclick="window.adminExportPdf()"><i class="far fa-file-pdf mr-1"></i> PDF</button>
                <button type="button" class="btn buttons-excel" style="background:#217346; border-color:#217346; color:#fff; font-size:11px; padding: 3px 8px; border-radius: 2px;" onclick="window.adminExportExcel()"><i class="far fa-file-excel mr-1"></i> Excel</button>
              </div>

              <!-- 12-Column Horizontally Scrollable Table matching frame_01_0s.png -->
              <div class="table-responsive mb-0" style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <table id="eventsListTbl" class="table table-bordered table-hover mb-0" style="font-size: 11px; min-width: 900px;">
                  <thead style="background: #f8f9fa;">
                    <tr>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px;">User Name</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: right;">CR</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: right;">Balance</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: right;">Client(P/L)</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: right;">Exposure</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: right;">Available Balance</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 4px; text-align: center;">U st</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 4px; text-align: center;">B st</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: center;">Exposure Limit</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: center;">Default(%)</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: center;">Account Type</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: center;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Summary Row matching frame_01_0s.png -->
                    <tr style="background-color: #f1f3f5; font-weight: bold;">
                      <td></td>
                      <td class="text-right">${totalCR}</td>
                      <td class="text-right">0</td>
                      <td class="text-right text-danger">${totalPL}</td>
                      <td class="text-right">0</td>
                      <td class="text-right">0</td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                    </tr>
                    ${pagedUsers.length === 0 ? `
                      <tr role="row" class="b-table-empty-row"><td colspan="12" role="cell" class="text-center py-3">There are no records to show</td></tr>
                    ` : pagedUsers.map(u => {
                      const uCR = u.creditRef != null ? u.creditRef : 0;
                      const uBal = u.balance != null ? u.balance : 0;
                      const uPL = u.clientPL != null ? u.clientPL : (uCR > 0 ? -uCR : 0);
                      const uExp = u.exposure != null ? u.exposure : 0;
                      const uAvail = u.availBalance != null ? u.availBalance : 0;
                      const uRoleLabel = u.userLevel || (u.role === 'master' ? 'Master' : u.role === 'agent' ? 'Agent' : u.role === 'user' ? 'User' : 'Master');
                      return `
                      <tr id="row-user-${u.id}">
                        <td style="padding: 5px 8px; vertical-align: middle;">
                          <span style="background: #343a40; color: #ffffff; padding: 2px 7px; border-radius: 2px; font-weight: bold; font-size: 10px; display: inline-block; cursor: pointer;" onclick="window.AdminApp.handleRoute('/admin/child/${u.uname}')">${u.uname}</span>
                        </td>
                        <td class="text-right" style="padding: 5px 8px; vertical-align: middle;">${uCR}</td>
                        <td class="text-right" style="padding: 5px 8px; vertical-align: middle;">${uBal}</td>
                        <td class="text-right ${uPL < 0 ? 'text-danger' : ''}" style="padding: 5px 8px; vertical-align: middle;">${uPL}</td>
                        <td class="text-right" style="padding: 5px 8px; vertical-align: middle;">${uExp}</td>
                        <td class="text-right" style="padding: 5px 8px; vertical-align: middle;">${uAvail}</td>
                        <td class="text-center" style="padding: 5px 4px; vertical-align: middle;">
                          <span style="display:inline-block; width:15px; height:15px; background:#000; color:#fff; border-radius:2px; font-size:10px; line-height:15px; text-align:center; font-weight:bold;">${u.userActive !== false ? '✔' : ''}</span>
                        </td>
                        <td class="text-center" style="padding: 5px 4px; vertical-align: middle;">
                          <span style="display:inline-block; width:15px; height:15px; background:#000; color:#fff; border-radius:2px; font-size:10px; line-height:15px; text-align:center; font-weight:bold;">${u.betActive !== false ? '✔' : ''}</span>
                        </td>
                        <td class="text-center" style="padding: 5px 8px; vertical-align: middle;">${u.exposureLimit || 0}</td>
                        <td class="text-center" style="padding: 5px 8px; vertical-align: middle;">${u.defaultPercent || 0}</td>
                        <td class="text-center" style="padding: 5px 8px; vertical-align: middle;">${uRoleLabel}</td>
                        <td class="text-center nowrap" style="padding: 5px 6px; vertical-align: middle;">
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openDepositModal('${u.id}')" title="Deposit">D</button>
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openWithdrawModal('${u.id}')" title="Withdraw">W</button>
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openExposureLimitModal('${u.id}')" title="Exposure Limit">L</button>
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openCreditRefModal('${u.id}')" title="Credit Reference">C</button>
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openChangePasswordModal('${u.uname}')" title="Change Password">P</button>
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openStatusModal('${u.id}')" title="Status Lock">S</button>
                        </td>
                      </tr>
                    `}).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Pagination matching frame_01_0s.png -->
              <div class="d-flex justify-content-end align-items-center mt-2">
                <ul class="pagination pagination-sm mb-0">
                  <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
                    <button class="page-link" onclick="if(${currentPage} > 1){ window.AdminApp.currentPage = 1; window.AdminApp.handleRouting(); }" style="padding: 2px 8px; font-size: 11px;">«</button>
                  </li>
                  <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
                    <button class="page-link" onclick="if(${currentPage} > 1){ window.AdminApp.currentPage = ${currentPage - 1}; window.AdminApp.handleRouting(); }" style="padding: 2px 8px; font-size: 11px;">‹</button>
                  </li>
                  ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                    <li class="page-item ${p === currentPage ? 'active' : ''}">
                      <button class="page-link" onclick="window.AdminApp.currentPage = ${p}; window.AdminApp.handleRouting();" style="padding: 2px 8px; font-size: 11px; ${p === currentPage ? 'background-color: #0088cc; border-color: #0088cc;' : ''}">${p}</button>
                    </li>
                  `).join('')}
                  <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
                    <button class="page-link" onclick="if(${currentPage} < ${totalPages}){ window.AdminApp.currentPage = ${currentPage + 1}; window.AdminApp.handleRouting(); }" style="padding: 2px 8px; font-size: 11px;">›</button>
                  </li>
                  <li class="page-item ${currentPage >= totalPages ? 'disabled' : ''}">
                    <button class="page-link" onclick="if(${currentPage} < ${totalPages}){ window.AdminApp.currentPage = ${totalPages}; window.AdminApp.handleRouting(); }" style="padding: 2px 8px; font-size: 11px;">»</button>
                  </li>
                </ul>
              </div>

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
      const store = window.AdminDataStore;
      const currentAdmin = store ? store.getAdminUser() : null;
      const actorRole = store ? store.normalizeRole(currentAdmin?.role || currentAdmin?.userType) : 'user';
      const allowedRoles = store ? store.getAllowedCreationRoles(actorRole) : [];

      if (actorRole === 'user' || allowedRoles.length === 0) {
        const roleLabel = store ? store.getRoleLabel(actorRole) : actorRole;
        container.innerHTML = `
          <div class="listing-grid">
            <div class="row">
              <div class="col-12">
                <div class="alert alert-danger font-weight-bold p-4 text-center">
                  <i class="fas fa-ban fa-2x mb-2 d-block"></i>
                  <h5>Access Denied</h5>
                  <p class="mb-0">Your account level (${roleLabel}) is not authorized to create or manage accounts.</p>
                </div>
              </div>
            </div>
          </div>
        `;
        return;
      }
      const optionsHtml = allowedRoles.map(r => {
        const num = store.ROLE_TO_NUMERIC[r] || '6';
        const label = store.getRoleLabel(r);
        return `<option value="${num}" data-role="${r}">${label}</option>`;
      }).join('');

      container.innerHTML = `
        <div class="listing-grid">
          <div class="add-account">
            <h2 class="m-b-20 mb-4">Add Account</h2>

            <form data-vv-scope="InserUserAccount" method="post" action="javascript:void(0);" id="insertUserForm" onsubmit="event.preventDefault(); window.AdminApp.handleCreateAccountSubmit(event); return false;">
              <div class="row">
                <div class="col-md-6 col-12">
                  <h4 class="mb-4 col-12">Personal Detail</h4>
                  <div class="row">
                    <div class="col-md-6 col-12">
                      <div class="form-group">
                        <label for="newUsername">Client Name:</label>
                        <input type="text" placeholder="Client Name" name="clientname" id="newUsername" class="form-control" aria-required="true" required autocomplete="off">
                      </div>
                    </div>
                    <div class="col-md-6 col-12">
                      <div class="form-group">
                        <label for="newPassword">User Password:</label>
                        <input type="password" placeholder="User Password" name="password" id="newPassword" class="form-control" aria-required="true" required minlength="6" autocomplete="new-password">
                      </div>
                    </div>
                    <div class="col-md-6 col-12">
                      <div class="form-group">
                        <label for="newRPassword">Retype Password:</label>
                        <input type="password" placeholder="Retype Password" name="rpassword" id="newRPassword" class="form-control" required minlength="6" autocomplete="new-password">
                      </div>
                    </div>
                    <div class="col-md-6 col-12">
                      <div class="form-group">
                        <label for="newFullName">Full Name:</label>
                        <input type="text" placeholder="Full Name" name="fullname" id="newFullName" class="form-control" aria-required="true" required>
                      </div>
                    </div>
                    <div class="col-md-6 col-12">
                      <div class="form-group">
                        <label for="newCity">City:</label>
                        <input type="text" placeholder="City" name="city" id="newCity" class="form-control">
                      </div>
                    </div>
                    <div class="col-md-6 col-12">
                      <div class="form-group">
                        <label for="newMobile">Phone:</label>
                        <input type="text" placeholder="Phone Number" name="mono" id="newMobile" maxlength="15" class="form-control">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 col-12">
                  <h4 class="mb-4 col-12">Account Detail</h4>
                  <div class="row">
                    <div class="col-md-6 col-12">
                      <div class="form-group">
                        <label for="newUserType">Account Type (Role):</label>
                        <select name="newlvlno" id="newUserType" label="label" data-vv-as="User Type" class="form-control" aria-required="true" required>
                          <option value="">Select Account Type</option>
                          ${optionsHtml}
                        </select>
                        <small class="form-text text-muted">Only roles allowed for your ${store.getRoleLabel(actorRole)} level are listed.</small>
                      </div>
                    </div>
                    <div class="col-md-6 col-12">
                      <div class="form-group">
                        <label for="newCreditRef">Credit Reference:</label>
                        <input type="number" placeholder="Credit Reference" name="camt" id="newCreditRef" class="form-control" aria-required="true" required value="50000">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row mt-4">
                <div class="col-md-6 col-12 mb-3">
                  <h4 class="mb-4 col-md-12">Commission Settings</h4>
                  <table class="table table-striped table-bordered">
                    <tbody>
                      <tr><td style="width:120px;">Upline</td><td>0.00</td></tr>
                      <tr><td>Downline</td><td><input type="text" name="comm" id="newCommission" placeholder="0" maxlength="4" class="form-control" style="max-width:180px;" value="0"></td></tr>
                      <tr><td>Our</td><td>0.00</td></tr>
                    </tbody>
                  </table>
                </div>
                <div class="col-md-6 col-12 mb-3">
                  <h4 class="mb-4 col-md-12">Partnership</h4>
                  <table class="table table-striped table-bordered">
                    <tbody>
                      <tr><td style="width:120px;">Upline</td><td>0.00</td></tr>
                      <tr><td>Downline</td><td><div class="form-group mb-0"><input type="text" name="spart1" id="newShare" placeholder="0" disabled="disabled" class="form-control" style="max-width:180px;" value="0"></div></td></tr>
                      <tr><td>Our</td><td>100.00</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="row mt-4">
                <div class="col-12">
                  <div class="form-group col-md-4 col-12 float-md-right pr-0">
                    <label for="newTxnPwd">Transaction Password:</label>
                    <input placeholder="Transaction Password" type="password" name="mpassword" id="newTxnPwd" class="form-control" aria-required="true" required autocomplete="new-password">
                  </div>
                </div>
              </div>
              <div class="row m-t-20 mb-4">
                <div class="col-md-12">
                  <div class="float-right">
                    <input type="hidden" name="_token">
                    <button type="submit" class="btn btn-submit btn-primary">Create Account</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    handleCreateAccountSubmit: async function(event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      const form = document.getElementById('insertUserForm');
      if (!form) return false;

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Create Account';

      const store = window.AdminDataStore;
      const currentAdmin = store ? store.getAdminUser() : null;

      // 1. Client-Side Field Extraction
      const clientname = (document.getElementById('newUsername')?.value || '').trim();
      const password = document.getElementById('newPassword')?.value || '';
      const rpassword = document.getElementById('newRPassword')?.value || '';
      const fullname = (document.getElementById('newFullName')?.value || '').trim();
      const city = (document.getElementById('newCity')?.value || '').trim();
      const mono = (document.getElementById('newMobile')?.value || '').trim();
      const newlvlno = document.getElementById('newUserType')?.value || '';
      const selectEl = document.getElementById('newUserType');
      const selectedOption = selectEl?.options[selectEl.selectedIndex];
      const targetRole = selectedOption?.getAttribute('data-role') || (store ? store.ROLE_NUMERIC_MAP[newlvlno] : 'user');
      const camt = parseFloat(document.getElementById('newCreditRef')?.value) || 0;
      const comm = parseFloat(document.getElementById('newCommission')?.value) || 0;
      const spart1 = parseFloat(document.getElementById('newShare')?.value) || 0;
      const mpassword = (document.getElementById('newTxnPwd')?.value || '').trim();

      // 2. Client-Side Validation
      if (!clientname) {
        this.showToast('Please enter Client Name', 'error');
        document.getElementById('newUsername')?.focus();
        return false;
      }

      if (!/^[a-zA-Z0-9_]{3,20}$/.test(clientname)) {
        this.showToast('Client Name must be 3-20 alphanumeric characters or underscores', 'error');
        document.getElementById('newUsername')?.focus();
        return false;
      }

      if (!password || password.length < 6) {
        this.showToast('Password must be at least 6 characters', 'error');
        document.getElementById('newPassword')?.focus();
        return false;
      }

      if (password !== rpassword) {
        this.showToast('Password and Retype Password not matching', 'error');
        document.getElementById('newRPassword')?.focus();
        return false;
      }

      if (!fullname) {
        this.showToast('Please enter Full Name', 'error');
        document.getElementById('newFullName')?.focus();
        return false;
      }

      if (!newlvlno) {
        this.showToast('Please select Account Type', 'error');
        document.getElementById('newUserType')?.focus();
        return false;
      }

      if (isNaN(camt) || camt < 0) {
        this.showToast('Please enter a valid Credit Reference amount', 'error');
        document.getElementById('newCreditRef')?.focus();
        return false;
      }

      if (!mpassword) {
        this.showToast('Please enter Transaction Password', 'error');
        document.getElementById('newTxnPwd')?.focus();
        return false;
      }

      // Check client-side permission
      const actorRole = store ? store.normalizeRole(currentAdmin?.role || currentAdmin?.userType) : 'user';
      if (!store || !store.canCreateRole(actorRole, targetRole)) {
        this.showToast(`Forbidden: ${store ? store.getRoleLabel(actorRole) : 'You'} cannot create ${store ? store.getRoleLabel(targetRole) : targetRole}.`, 'error');
        return false;
      }

      // 3. Prevent duplicate submissions
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Creating Account...';
      }

      const payload = {
        clientname: clientname,
        uname: clientname,
        password: password,
        rpassword: rpassword,
        fullname: fullname,
        city: city,
        mono: mono,
        role: targetRole,
        newlvlno: newlvlno,
        userType: newlvlno,
        camt: camt,
        creditRef: camt,
        comm: comm,
        spart1: spart1,
        share: spart1,
        mpassword: mpassword
      };

      const self = this;
      try {
        const token = localStorage.getItem('admin_token') || '';
        const headers = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = 'Bearer ' + token;
        }

        // Call backend API endpoint
        const response = await fetch('/api/admin/insertuser', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && (data.status === 200 || data.success)) {
          // Success! Save to client data store with complete hierarchy fields
          const createdUser = data.user || {};
          if (store) {
            const roleLabel = store.getRoleLabel(targetRole);
            const parentUname = (self.adminUser && self.adminUser.uname) || (currentAdmin && currentAdmin.uname) || 'Newadmin98';
            const parentId = (self.adminUser && self.adminUser.id) || (currentAdmin && currentAdmin.id) || '78859';
            const compRootId = (self.adminUser && self.adminUser.companyRootId) || (currentAdmin && currentAdmin.companyRootId) || '78859';
            const existingAncestors = (self.adminUser && self.adminUser.ancestors) || (currentAdmin && currentAdmin.ancestors) || [];

            store.insertUser({
              id: createdUser.id,
              uname: clientname,
              fname: fullname,
              role: createdUser.role || targetRole,
              userType: createdUser.userType || newlvlno,
              userLevel: createdUser.userLevel || roleLabel,
              pcode: createdUser.pcode || (['company', 'super_admin', 'admin'].includes(targetRole) ? 'dashboard,ma,ulist,uinsert,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss' : 'dashboard,ma,ulist,agassign,casinolist,reportcb,raccst,reportuh,reportpl,casinores,lcasinores,turnover,authlist,bank,gamereport,generalreport,ulock,loginuc,setbutton,uregrpt,totpl,uwinloss'),
              parentId: createdUser.parentId || parentId,
              createdBy: createdUser.createdBy || parentUname,
              companyRootId: createdUser.companyRootId || compRootId,
              ancestors: createdUser.ancestors || [...existingAncestors, parentUname.toLowerCase()],
              creditRef: camt,
              balance: camt,
              share: spart1,
              comm: comm,
              passHash: createdUser.passHash || '',
              password: password,
              upline: parentUname,
              login: true,
              firstLogin: false,
              tranCode: createdUser.tranCode || '130367',
              status: 'Active'
            });
          }

          self.showToast(data.msg || `Account ${clientname} created successfully!`, 'success');
          form.reset();

          // Navigate back to user list after short delay
          setTimeout(() => {
            self.navigate('/admin/users');
          }, 800);
        } else {
          // Validation / Server Error (including 403 Forbidden)
          const errMsg = data.msg || data.error || 'Failed to create account. Please check inputs.';
          self.showToast(errMsg, 'error');
        }
      } catch (err) {
        console.error('Error creating account:', err);
        self.showToast('Network error while creating account. Please try again.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }

      return false;
    },

    renderDownlineTree: function(container) {
      const store = window.AdminDataStore;
      const currentAdmin = store ? store.getAdminUser() : null;
      if (!currentAdmin) {
        container.innerHTML = `<div class="alert alert-warning">Please login to view Downline Tree.</div>`;
        return;
      }

      const actorRole = store.normalizeRole(currentAdmin.role || currentAdmin.userType);
      if (actorRole === 'user') {
        container.innerHTML = `
          <div class="alert alert-danger font-weight-bold p-4 text-center">
            <i class="fas fa-ban fa-2x mb-2 d-block"></i>
            <h5>Access Denied</h5>
            <p class="mb-0">Normal User accounts do not have access to the Downline Hierarchy Tree.</p>
          </div>
        `;
        return;
      }

      const tree = store.buildDownlineTree(currentAdmin);

      function renderTreeNode(node, depth = 0) {
        const hasChildren = node.children && node.children.length > 0;
        const role = store.normalizeRole(node.role || node.userType);
        const roleLabel = store.getRoleLabel(role);
        const nodeId = `tree-node-${node.uname}`;
        const childId = `tree-children-${node.uname}`;

        return `
          <div class="tree-item depth-${depth}" id="${nodeId}" data-uname="${node.uname}" data-role="${role}">
            <div class="tree-node-card">
              <div class="tree-node-left">
                ${hasChildren ? `
                  <button type="button" class="tree-toggle-btn" onclick="window.toggleTreeNode('${node.uname}')" id="btn-toggle-${node.uname}" title="Toggle Children">
                    <i class="fas fa-chevron-down"></i>
                  </button>
                ` : `
                  <span class="tree-leaf-indicator"><i class="fas fa-circle"></i></span>
                `}
                <span class="role-badge role-badge-${role} mr-2">${roleLabel}</span>
                <span class="tree-node-uname font-weight-bold text-dark">${node.uname}</span>
                <span class="text-muted font-size-11 ml-1">(#${node.id || '-'})</span>
                ${node.createdBy ? `<span class="badge badge-light border text-muted ml-2 font-size-11 d-none d-sm-inline">By: ${node.createdBy}</span>` : ''}
              </div>
              <div class="tree-node-right">
                <span class="badge badge-success px-2 py-1 mr-1 font-size-12" title="Balance">Bal: ${Number(node.balance || 0).toLocaleString()}</span>
                <span class="badge badge-info px-2 py-1 mr-1 font-size-12 d-none d-md-inline" title="Credit Reference">CR: ${Number(node.creditRef || 0).toLocaleString()}</span>
                <span class="badge ${node.status === 'Active' ? 'badge-primary' : 'badge-danger'} px-2 py-1 mr-1 font-size-11">${node.status || 'Active'}</span>
                <span class="badge badge-dark px-2 py-1 font-size-11" title="Direct / Total Downline">
                  <i class="fas fa-users mr-1"></i>${node.directCount || 0} / ${node.totalDescendants || 0}
                </span>
                <div class="tree-node-actions ml-2 d-inline-block">
                  <button type="button" class="btn btn-xs btn-outline-primary action-btn-xs" onclick="window.openDepositModal('${node.id}')" title="Deposit">D</button>
                  <button type="button" class="btn btn-xs btn-outline-warning action-btn-xs" onclick="window.openWithdrawModal('${node.id}')" title="Withdraw">W</button>
                  <button type="button" class="btn btn-xs btn-outline-secondary action-btn-xs" onclick="window.openChangePasswordModal('${node.uname}')" title="Change Password">P</button>
                </div>
              </div>
            </div>
            ${hasChildren ? `
              <div class="tree-children" id="${childId}">
                ${node.children.map(child => renderTreeNode(child, depth + 1)).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }

      const allowedRoles = store ? store.getAllowedCreationRoles(actorRole) : [];
      const canCreate = allowedRoles.length > 0;
      const addAccountTreeHtml = canCreate ? `<a href="/admin/users/insertuser" class="btn btn-add-account btn-sm nav-route-link" data-route="/admin/users/insertuser">Add Account</a>` : '';

      container.innerHTML = `
        <div class="listing-grid">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-3 flex-wrap">
                <div>
                  <h4 class="mb-0 font-size-18 font-weight-bold">Downline Hierarchy Tree</h4>
                  <p class="text-muted mb-0 font-size-12">Scoped to branch: <span class="badge badge-info">${currentAdmin.uname} (${store.getRoleLabel(actorRole)})</span></p>
                </div>
                <div class="page-title-right mt-2 mt-sm-0">
                  <button type="button" class="btn btn-outline-secondary btn-sm mr-1" onclick="window.expandAllTreeNodes()"><i class="fas fa-expand-arrows-alt mr-1"></i> Expand All</button>
                  <button type="button" class="btn btn-outline-secondary btn-sm mr-1" onclick="window.collapseAllTreeNodes()"><i class="fas fa-compress-arrows-alt mr-1"></i> Collapse All</button>
                  ${addAccountTreeHtml}
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-12">
              <div class="card">
                <div class="card-body">
                  <div class="row mb-3">
                    <div class="col-md-6 col-12">
                      <div class="input-group">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-search"></i></span>
                        </div>
                        <input type="text" class="form-control" id="treeSearchInput" placeholder="Search account by username or role in tree..." onkeyup="window.filterDownlineTree(this.value)">
                      </div>
                    </div>
                    <div class="col-md-6 col-12 text-md-right mt-2 mt-md-0">
                      <span class="text-muted font-size-12">Branch Stats: Total Accounts: <b>${(tree.totalDescendants || 0) + 1}</b> | Direct Children: <b>${tree.directCount || 0}</b></span>
                    </div>
                  </div>
                  <div class="tree-container p-2" id="downlineTreeRoot">
                    ${renderTreeNode(tree, 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderAssignAgent: function(container) {
      const store = window.AdminDataStore;
      const actor = this.adminUser || (store ? store.state.currentAdmin : null);
      const actorRole = actor ? store.normalizeRole(actor.role || actor.userType) : 'company';
      const allUsers = store ? store.getUsers() : [];
      const users = allUsers.length > 0 ? allUsers : [
        { id: '1', uname: 'ZARGHAM', creditRef: 79, userActive: true, betActive: true, exposureLimit: 0, defaultPercent: 0, userLevel: 'Master' },
        { id: '2', uname: 'ZARGHAM1', creditRef: 2, userActive: true, betActive: true, exposureLimit: 0, defaultPercent: 0, userLevel: 'Agent' },
        { id: '3', uname: 'ZARGHAM2', creditRef: 2, userActive: true, betActive: true, exposureLimit: 0, defaultPercent: 0, userLevel: 'User' },
        { id: '4', uname: 'ZARGHAM3', creditRef: 76, userActive: true, betActive: true, exposureLimit: 0, defaultPercent: 0, userLevel: 'Master' }
      ];

      const perPage = this.perPage || 25;
      const currentPage = this.currentPage || 1;
      const startIdx = (currentPage - 1) * perPage;
      const pagedUsers = users.slice(startIdx, startIdx + perPage);

      const allowedRoles = store ? store.getAllowedCreationRoles(actorRole) : [];
      const canCreate = allowedRoles.length > 0;
      const addAccountBtnHtml = canCreate ? `<a href="/admin/users/insertuser" class="btn btn-primary nav-route-link" data-route="/admin/users/insertuser" style="background:#0088cc; border-color:#0088cc; font-size:12px; padding: 4px 12px; border-radius: 4px;">Add Account</a>` : '';

      container.innerHTML = `
        <div class="listing-grid">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <h4 class="mb-0" style="font-size: 16px; font-weight: 700; color: #333;">Account List</h4>
            ${addAccountBtnHtml}
          </div>

          <div class="card mb-3" style="border: 1px solid #e9ecef; border-radius: 4px; box-shadow: none;">
            <div class="card-body p-2 p-md-3">
              
              <!-- PDF / Excel Export Buttons matching reference frame_08_5s.png -->
              <div class="mb-2">
                <button type="button" class="btn buttons-pdf" style="background:#cb0606; border-color:#cb0606; color:#fff; font-size:11px; padding: 3px 8px; border-radius: 2px; margin-right: 4px;" onclick="window.adminExportPdf()"><i class="far fa-file-pdf mr-1"></i> PDF</button>
                <button type="button" class="btn buttons-excel" style="background:#217346; border-color:#217346; color:#fff; font-size:11px; padding: 3px 8px; border-radius: 2px;" onclick="window.adminExportExcel()"><i class="far fa-file-excel mr-1"></i> Excel</button>
              </div>

              <!-- Top controls: Show entries & Search matching reference frame_08_5s.png -->
              <div class="row align-items-center mb-2">
                <div class="col-sm-6 mb-1 mb-sm-0">
                  <label class="d-inline-flex align-items-center mb-0" style="font-size: 11px; color: #333; font-weight: normal;">
                    Show&nbsp;
                    <select class="custom-select custom-select-sm" id="assignAgentPerPage" style="width: auto; height: 26px; padding: 2px 20px 2px 6px; font-size: 11px; display: inline-block;">
                      <option value="25" selected>25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>&nbsp;entries
                  </label>
                </div>
                <div class="col-sm-6 text-sm-right">
                  <div class="d-inline-flex align-items-center" style="font-size: 11px;">
                    <span class="mr-1">Search:</span>
                    <input type="search" placeholder="Search..." class="form-control form-control-sm mr-1" id="assignAgentSearchInput" style="height: 26px; font-size: 11px; padding: 2px 6px; width: 140px; display: inline-block; border: 1px solid #ced4da; border-radius: 2px;">
                    <button type="button" id="loaddata" class="btn btn-primary btn-sm mr-1" style="background:#0088cc; border-color:#0088cc; font-size: 11px; padding: 2px 10px; height: 26px; border-radius: 2px;">Load</button>
                    <button type="button" id="resetdata" class="btn btn-secondary btn-sm" style="background:#6c757d; border-color:#6c757d; font-size: 11px; padding: 2px 10px; height: 26px; border-radius: 2px;">Reset</button>
                  </div>
                </div>
              </div>

              <!-- 8-Column Horizontally Scrollable Table matching reference frame_08_5s.png and clean_ref_users.html -->
              <div class="table-responsive mb-0" style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <table id="eventsListTbl" class="table table-bordered table-hover mb-0" style="font-size: 11px; min-width: 700px;">
                  <thead style="background: #f8f9fa;">
                    <tr>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px;">User Name</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: right;">CR</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 4px; text-align: center;">U st</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 4px; text-align: center;">B st</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: center;">Exposure Limit</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: center;">Deafult (%)</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: center;">Account Type</th>
                      <th style="font-weight: 600; color: #333; padding: 6px 8px; text-align: center;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pagedUsers.length === 0 ? `
                      <tr role="row" class="b-table-empty-row"><td colspan="8" role="cell" class="text-center py-3">There are no records to show</td></tr>
                    ` : pagedUsers.map(u => {
                      const uCR = u.creditRef != null ? u.creditRef : 0;
                      const uRoleLabel = u.userLevel || (u.role === 'master' ? 'Master' : u.role === 'agent' ? 'Agent' : u.role === 'user' ? 'User' : 'Master');
                      return `
                      <tr id="row-assign-user-${u.id}">
                        <td style="padding: 5px 8px; vertical-align: middle;">
                          <span style="background: #343a40; color: #ffffff; padding: 2px 7px; border-radius: 2px; font-weight: bold; font-size: 10px; display: inline-block; cursor: pointer;" onclick="window.AdminApp.handleRoute('/admin/child/${u.uname}')">${u.uname}</span>
                        </td>
                        <td class="text-right" style="padding: 5px 8px; vertical-align: middle;">${uCR}</td>
                        <td class="text-center" style="padding: 5px 4px; vertical-align: middle;">
                          <span style="display:inline-block; width:15px; height:15px; background:#000; color:#fff; border-radius:2px; font-size:10px; line-height:15px; text-align:center; font-weight:bold;">${u.userActive !== false ? '✔' : ''}</span>
                        </td>
                        <td class="text-center" style="padding: 5px 4px; vertical-align: middle;">
                          <span style="display:inline-block; width:15px; height:15px; background:#000; color:#fff; border-radius:2px; font-size:10px; line-height:15px; text-align:center; font-weight:bold;">${u.betActive !== false ? '✔' : ''}</span>
                        </td>
                        <td class="text-center" style="padding: 5px 8px; vertical-align: middle;">${u.exposureLimit || 0}</td>
                        <td class="text-center" style="padding: 5px 8px; vertical-align: middle;">${u.defaultPercent || 0}</td>
                        <td class="text-center" style="padding: 5px 8px; vertical-align: middle;">${uRoleLabel}</td>
                        <td class="text-center nowrap" style="padding: 5px 6px; vertical-align: middle;">
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openDepositModal('${u.id}')" title="Deposit">D</button>
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openWithdrawModal('${u.id}')" title="Withdraw">W</button>
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openCreditRefModal('${u.id}')" title="Credit Reference">L</button>
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openChangeStatusModal('${u.id}')" title="Change Status">C</button>
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openChangePasswordModal('${u.uname}')" title="Change Password">P</button>
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openStatementModal('${u.id}')" title="Statement">S</button>
                          <button type="button" class="btn btn-dark btn-sm" style="background:#343a40; color:#fff; border:none; padding:2px 5px; font-size:10px; line-height:1.2; border-radius:2px; margin-right:2px; font-weight:bold;" onclick="window.openExtraModal('${u.id}')" title="More">MORE</button>
                        </td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Pagination matching reference frame_08_5s.png -->
              <div class="row pt-3">
                <div class="col">
                  <div class="float-right">
                    <ul class="pagination pagination-rounded mb-0" style="font-size: 11px;">
                      <li class="page-item disabled"><span class="page-link" style="padding: 3px 8px;">«</span></li>
                      <li class="page-item disabled"><span class="page-link" style="padding: 3px 8px;">‹</span></li>
                      <li class="page-item active"><button type="button" class="page-link" style="padding: 3px 8px; background-color: #0088cc; border-color: #0088cc; color:#fff;">1</button></li>
                      <li class="page-item disabled"><span class="page-link" style="padding: 3px 8px;">›</span></li>
                      <li class="page-item disabled"><span class="page-link" style="padding: 3px 8px;">»</span></li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      `;
    },

    renderMarketAnalysis: function(container) {
      document.body.classList.add('page-market-analysis');

      container.innerHTML = `
        <div class="market-analysis">
          <div class="market-analysis-bar page-title-box d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <h4 class="market-analysis-heading mb-0">
                Market Analysis
                <a href="javascript:void(0)" class="text-dark ml-1" title="Refresh Data" id="refreshMarketBtn" onclick="window.adminRefreshMarkets()">
                  <i class="fas fa-sync-alt" id="refreshMarketIcon" style="font-size: 11px;"></i>
                </a>
              </h4>
            </div>
            <div class="page-title-right">
              <input type="text" name="searchMarktetText" value="" placeholder="Search Event" class="search-event-input form-control" id="searchMarketInput" onkeyup="window.adminFilterMarkets()">
            </div>
          </div>

          <!-- Pure clean white background below grey bar matching reference screenshot -->
          <div class="market-analysis-container" id="marketAnalysisContainer" style="background: #ffffff; min-height: calc(100vh - 60px); width: 100%;">
            <!-- Clean white area matching reference state. Populates dynamically when event is searched or selected from sports tree -->
          </div>
        </div>
      `;
    },

        renderAccountStatement: function(container) {
      const ledger = window.AdminDataStore.getLedger();

      container.innerHTML = `
        <div class="listing-grid report-wrapper">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between">
                <h4 class="mb-0 font-size-18">Account Statement</h4>
                <div class="page-title-right"></div>
              </div>
            </div>
          </div>
          <div class="report-form mb-0 mt-3">
            <form method="post" class="ajaxFormSubmit" onsubmit="event.preventDefault(); window.AdminApp.handleRouting();">
              <div class="row">
                <div class="col-lg-2 col-md-4 col-12 mb-2">
                  <div class="form-group mb-0">
                    <label>Account Type</label>
                    <select class="form-control" id="stmtAccountType">
                      <option value="0">All</option>
                      <option value="1">Deposit/Withdraw Report</option>
                      <option value="2">Sports Report</option>
                      <option value="3">Casino Report</option>
                      <option value="4">Third Party Casino Report</option>
                    </select>
                  </div>
                </div>
                <div class="col-lg-2 col-md-4 col-12 mb-2">
                  <div class="form-group mb-0">
                    <label>Game Name</label>
                    <select class="form-control" id="stmtGameName">
                      <option value="allbalance">All</option>
                    </select>
                  </div>
                </div>
                <div class="col-lg-2 col-md-4 col-12 mb-2">
                  <div class="form-group user-lock-search mb-0" style="position: relative;">
                    <label for="d-inline-block">Search By Client Name</label>
                    <input type="text" placeholder="Select option" class="form-control" id="stmtClientSearch">
                  </div>
                </div>
                <div class="col-lg-2 col-md-4 col-12 mb-2">
                  <label>From</label>
                  <div class="mb-3 mx-datepicker">
                    <div class="mx-input-wrapper">
                      <input name="date" type="date" value="2026-09-01" class="form-control mx-input" id="stmtFromDate">
                    </div>
                  </div>
                </div>
                <div class="col-lg-2 col-md-4 col-12 mb-2">
                  <label>To</label>
                  <div class="mb-3 mx-datepicker">
                    <div class="mx-input-wrapper">
                      <input name="date" type="date" value="2026-10-11" class="form-control mx-input" id="stmtToDate">
                    </div>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-lg-2 col-12 mb-3">
                  <button type="submit" id="loaddata" class="btn btn-primary">Load</button>
                </div>
              </div>
            </form>
          </div>
          <div class="row mt-3">
            <div class="col-6">
              <div id="tickets-table_length" class="dataTables_length">
                <label class="d-inline-flex align-items-center">
                  Show&nbsp;
                  <select class="custom-select custom-select-sm">
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="75">75</option>
                    <option value="100">100</option>
                    <option value="125">125</option>
                    <option value="150">150</option>
                  </select>&nbsp;entries
                </label>
              </div>
            </div>
            <div class="col-6 text-right">
              <div id="tickets-table_filter" class="dataTables_filter text-md-right">
                <label class="d-inline-flex align-items-center">
                  Search:
                  <input type="search" placeholder="Search..." class="form-control form-control-sm ml-1" id="searchStmtInput">
                </label>
              </div>
            </div>
          </div>
          <div class="table-responsive mb-0 mt-2 report-table account-table">
            <div class="table no-footer table-hover table-responsive-sm">
              <table id="accStmtTable" role="table" aria-busy="false" aria-colcount="6" class="table b-table table-striped table-bordered">
                <colgroup>
                  <col style="width: 120px;">
                  <col style="width: 120px;">
                  <col style="width: 120px;">
                  <col style="width: 120px;">
                  <col style="width: 350px;">
                  <col style="width: 120px;">
                </colgroup>
                <thead role="rowgroup">
                  <tr role="row">
                    <th role="columnheader" scope="col"><div>Date</div></th>
                    <th role="columnheader" scope="col" class="text-right"><div>Credit</div></th>
                    <th role="columnheader" scope="col" class="text-right"><div>Debit</div></th>
                    <th role="columnheader" scope="col" class="text-right"><div>Closing</div></th>
                    <th role="columnheader" scope="col"><div>Description</div></th>
                    <th role="columnheader" scope="col"><div>Fromto</div></th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  ${ledger.length === 0 ? `
                    <tr role="row" class="b-table-empty-row"><td colspan="6" role="cell"><div role="alert" aria-live="polite"><p class="text-center mb-0">No data available in table</p></div></td></tr>
                  ` : ledger.map(tx => `
                    <tr role="row">
                      <td role="cell">${tx.date}</td>
                      <td role="cell" class="text-right text-success font-weight-bold">${tx.credit > 0 ? this.formatCurrency(tx.credit) : '0.00'}</td>
                      <td role="cell" class="text-right text-danger font-weight-bold">${tx.debit > 0 ? this.formatCurrency(tx.debit) : '0.00'}</td>
                      <td role="cell" class="text-right font-weight-bold">${this.formatCurrency(tx.balance)}</td>
                      <td role="cell">${tx.remarks}</td>
                      <td role="cell">${tx.fromUser} -> ${tx.toUser}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div class="row pt-3">
            <div class="col-12">
              <div class="dataTables_paginate paging_simple_numbers float-right">
                <ul class="pagination pagination-rounded mb-0">
                  <ul role="menubar" class="pagination dataTables_paginate paging_simple_numbers my-0 b-pagination justify-content-end">
                    <li role="presentation" class="page-item disabled"><span class="page-link">«</span></li>
                    <li role="presentation" class="page-item disabled"><span class="page-link">‹</span></li>
                    <li role="presentation" class="page-item active"><button type="button" class="page-link">1</button></li>
                    <li role="presentation" class="page-item disabled"><span class="page-link">›</span></li>
                    <li role="presentation" class="page-item disabled"><span class="page-link">»</span></li>
                  </ul>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;
    },

        renderCurrentBets: function(container) {
      const bets = window.AdminDataStore.getCurrentBets();

      container.innerHTML = `
        <div class="listing-grid report-wrapper">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between">
                <h4 class="mb-0 font-size-18">Current Bets</h4>
                <div class="page-title-right"></div>
              </div>
            </div>
          </div>
          <div class="casino-report-tabs">
            <ul class="nav nav-tabs">
              <li class="nav-item"><a data-toggle="tab" href="javascript:void(0)" class="nav-link active">Sports</a></li>
              <li class="nav-item"><a data-toggle="tab" href="javascript:void(0)" class="nav-link">Casino</a></li>
            </ul>
          </div>
          <div class="row">
            <div class="col-12">
              <div class="card">
                <div class="card-body">
                  <div class="report-form mb-3 row align-items-center modal-chekbox">
                    <div class="col-12 mb-2">
                      <div class="custom-control custom-radio custom-control-inline">
                        <input type="radio" id="customRadio" name="example" value="matchbet" checked="checked" class="custom-control-input">
                        <label for="customRadio" class="custom-control-label">Matched</label>
                      </div>
                      <div class="custom-control custom-radio custom-control-inline">
                        <input type="radio" id="customRadio2" name="example" value="deletebet" class="custom-control-input">
                        <label for="customRadio2" class="custom-control-label">Deleted</label>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="custom-control custom-radio custom-control-inline pl-0">
                        <div class="custom-control custom-radio custom-control-inline">
                          <input type="radio" id="soda-all" name="bettype" value="all" checked="checked" class="custom-control-input">
                          <label for="soda-all" class="custom-control-label">All</label>
                        </div>
                        <div class="custom-control custom-radio custom-control-inline">
                          <input type="radio" id="soda-back" name="bettype" value="back" class="custom-control-input">
                          <label for="soda-back" class="custom-control-label">Back</label>
                        </div>
                        <div class="custom-control custom-radio custom-control-inline">
                          <input type="radio" id="soda-lay" name="bettype" value="lay" class="custom-control-input">
                          <label for="soda-lay" class="custom-control-label">Lay</label>
                        </div>
                      </div>
                      <div class="custom-control-inline">
                        <button title="Refresh Data" type="button" class="btn mr-2 btn-primary" onclick="window.AdminApp.handleRouting()">Load</button>
                      </div>
                    </div>
                    <div class="col-6 text-right">
                      <div class="custom-control-inline mr-0 mt-1">
                        <h5>Total Soda: <span class="mr-2">${bets.length}</span> Total Amount: <span>${this.formatCurrency(bets.reduce((s, b) => s + (b.stake || 0), 0))}</span></h5>
                      </div>
                    </div>
                  </div>
                  <div class="row w-100 mb-2">
                    <div class="col-6">
                      <div id="tickets-table_length" class="dataTables_length">
                        <label class="d-inline-flex align-items-center">
                          Show&nbsp;
                          <select class="custom-select custom-select-sm">
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="75">75</option>
                            <option value="100">100</option>
                            <option value="125">125</option>
                            <option value="150">150</option>
                          </select>&nbsp;entries
                        </label>
                      </div>
                    </div>
                    <div class="col-6 text-right">
                      <div id="tickets-table_filter" class="dataTables_filter text-md-right">
                        <label class="d-inline-flex align-items-center">
                          Search:
                          <input type="search" placeholder="Search..." class="form-control form-control-sm ml-1" id="searchBetInput">
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="table-responsive mb-0 report-table">
                    <div class="table no-footer table-responsive-sm">
                      <table id="eventsListTbl" role="table" aria-busy="false" aria-colcount="8" class="table b-table table-striped table-bordered">
                        <colgroup>
                          <col style="width: auto;">
                          <col style="width: 200px;">
                          <col style="width: auto;">
                          <col style="width: auto;">
                          <col style="width: auto;">
                          <col style="width: auto;">
                          <col style="width: auto;">
                          <col style="width: auto;">
                        </colgroup>
                        <thead role="rowgroup">
                          <tr role="row">
                            <th role="columnheader" scope="col"><div>Event Type</div></th>
                            <th role="columnheader" scope="col"><div>Event Name</div></th>
                            <th role="columnheader" scope="col"><div>User Name</div></th>
                            <th role="columnheader" scope="col"><div>M Name</div></th>
                            <th role="columnheader" scope="col"><div>Nation</div></th>
                            <th role="columnheader" scope="col" class="text-right"><div>U Rate</div></th>
                            <th role="columnheader" scope="col" class="text-right"><div>Amount</div></th>
                            <th role="columnheader" scope="col"><div>Place Date</div></th>
                          </tr>
                        </thead>
                        <tbody role="rowgroup">
                          ${bets.length === 0 ? `
                            <tr role="row" class="b-table-empty-row"><td colspan="8" role="cell"><div role="alert" aria-live="polite"><p class="text-center mb-0">No data available in table</p></div></td></tr>
                          ` : bets.map(b => `
                            <tr role="row">
                              <td role="cell">${b.sport || 'Cricket'}</td>
                              <td role="cell"><strong>${b.event}</strong></td>
                              <td role="cell">${b.user}</td>
                              <td role="cell">${b.market || 'Match Odds'}</td>
                              <td role="cell">${b.runner}</td>
                              <td role="cell" class="text-right font-weight-bold">${b.odds.toFixed(2)}</td>
                              <td role="cell" class="text-right font-weight-bold">${this.formatCurrency(b.stake)}</td>
                              <td role="cell">${b.placedAt}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div class="row pt-3">
                    <div class="col">
                      <div class="dataTables_paginate paging_simple_numbers float-right">
                        <ul class="pagination pagination-rounded mb-0">
                          <ul role="menubar" class="pagination dataTables_paginate paging_simple_numbers my-0 b-pagination justify-content-end">
                            <li role="presentation" class="page-item disabled"><span class="page-link">«</span></li>
                            <li role="presentation" class="page-item disabled"><span class="page-link">‹</span></li>
                            <li role="presentation" class="page-item active"><button type="button" class="page-link">1</button></li>
                            <li role="presentation" class="page-item disabled"><span class="page-link">›</span></li>
                            <li role="presentation" class="page-item disabled"><span class="page-link">»</span></li>
                          </ul>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderProfitLoss: function(container) {
      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
              <h4 class="mb-0 font-size-18">Profit Loss</h4>
              <div class="page-title-right"></div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-body">
                <div class="row mb-3">
                  <div class="col-12">
                    <form class="form-inline" onsubmit="event.preventDefault();">
                      <select class="custom-select custom-select-sm mr-2" style="min-width: 200px;">
                        <option value="all" selected>All</option>
                      </select>
                      <button type="submit" class="btn btn-primary btn-sm" style="background-color: #0088cc; border-color: #0088cc;">Load</button>
                    </form>
                  </div>
                </div>

                <div class="row mb-2">
                  <div class="col-sm-12 col-md-6">
                    <div id="tickets-table_length" class="dataTables_length">
                      <label class="d-inline-flex align-items-center font-weight-normal">
                        Show&nbsp;
                        <select class="custom-select custom-select-sm" style="width:auto; display:inline-block;">
                          <option value="25" selected>25</option>
                          <option value="50">50</option>
                          <option value="75">75</option>
                          <option value="100">100</option>
                        </select>&nbsp;entries
                      </label>
                    </div>
                  </div>
                  <div class="col-sm-12 col-md-6">
                    <div id="tickets-table_filter" class="dataTables_filter text-md-right">
                      <label class="d-inline-flex align-items-center font-weight-normal">
                        Search:
                        <input type="search" placeholder="Search..." class="form-control form-control-sm ml-2" style="width:auto; display:inline-block;">
                      </label>
                    </div>
                  </div>
                </div>

                <div class="table-responsive mb-0">
                  <table class="table b-table table-bordered table-striped mb-0">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>User Name</th>
                        <th>Level</th>
                        <th class="text-right">Casino Pts</th>
                        <th class="text-right">Sport Pts</th>
                        <th class="text-right">Third Party Pts</th>
                        <th class="text-right">Profit/Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="b-table-empty-row">
                        <td colspan="7" class="text-center py-2">No data available in table</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="row pt-3">
                  <div class="col-12">
                    <div class="dataTables_paginate paging_simple_numbers float-right">
                      <ul class="pagination pagination-rounded mb-0">
                        <ul role="menubar" class="pagination dataTables_paginate paging_simple_numbers my-0 b-pagination justify-content-end">
                          <li role="presentation" class="page-item disabled"><span class="page-link">«</span></li>
                          <li role="presentation" class="page-item disabled"><span class="page-link">‹</span></li>
                          <li role="presentation" class="page-item active"><button role="menuitemradio" class="page-link" style="background-color: #0088cc; border-color: #0088cc;">1</button></li>
                          <li role="presentation" class="page-item disabled"><span class="page-link">›</span></li>
                          <li role="presentation" class="page-item disabled"><span class="page-link">»</span></li>
                        </ul>
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
              <table class="table b-table table-bordered table-striped mb-0">
                <thead>
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
        <div class="listing-grid">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between">
                <h4 class="mb-0 font-size-18">Bank</h4>
                <div class="page-title-right"></div>
              </div>
            </div>
          </div>
          <div class="row bank-panel">
            <div class="col-12">
              <div class="card">
                <div class="card-body">
                  <div class="report-form mb-1">
                    <div class="row row5">
                      <div class="col-md-6 mb-2 search-form">
                        <form method="post" class="ajaxFormSubmit" onsubmit="event.preventDefault(); window.AdminApp.filterBank();">
                          <div class="d-inline-block form-group form-group-feedback form-group-feedback-right mb-0 mr-1">
                            <input type="text" name="searchKey" id="bank-search-input" placeholder="Search User" class="form-control form-control-sm" style="display:inline-block; width:auto;">
                          </div>
                          <div class="d-inline-block">
                            <button type="submit" id="submit" class="btn btn-primary btn-sm">Load</button>
                            <button type="button" id="reset" class="btn btn-light btn-sm" onclick="window.AdminApp.resetBank();">Reset</button>
                          </div>
                        </form>
                      </div>
                      <div class="col-md-6 text-right mb-2">
                        <div class="d-inline-block mr-2">
                          <div id="export_bank_excel" class="d-inline-block">
                            <button type="button" class="btn mr-1 btn-success btn-sm" onclick="window.adminExportExcel()"><i class="fas fa-file-excel"></i></button>
                          </div>
                          <button type="button" class="btn btn-danger btn-sm" onclick="window.adminExportPdf()"><i class="fas fa-file-pdf"></i></button>
                        </div>
                        <form data-vv-scope="transferAll" method="post" class="d-inline-block" onsubmit="event.preventDefault(); window.AdminApp.transferAllBank();">
                          <div class="d-inline-block form-group form-group-feedback form-group-feedback-right mb-0 mr-1">
                            <input type="password" name="masterPassword" id="bank-master-pwd" placeholder="Transaction Code" class="form-control form-control-sm" style="display:inline-block; width:150px;">
                          </div>
                          <div class="d-inline-block">
                            <button type="submit" id="transferSubmit" class="btn btn-primary btn-sm">Transfer All</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-6">
                      <div id="tickets-table_length" class="dataTables_length">
                        <label class="d-inline-flex align-items-center">
                          Show&nbsp;
                          <select class="custom-select custom-select-sm" id="bankPerPageSelect">
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="250">250</option>
                            <option value="500">500</option>
                            <option value="750">750</option>
                            <option value="1000">1000</option>
                          </select>&nbsp;entries
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="table-responsive mb-0">
                    <div class="table no-footer table-hover table-responsive-sm">
                      <table id="eventsListTbl" role="table" aria-busy="false" aria-colcount="10" class="table b-table table-bordered table-striped">
                        <colgroup>
                          <col style="width: 200px;">
                          <col style="width: auto;">
                          <col style="width: auto;">
                          <col style="width: auto;">
                          <col style="width: auto;">
                          <col style="width: auto;">
                          <col style="width: auto;">
                          <col style="width: auto;">
                          <col style="width: 250px;">
                          <col style="width: 200px;">
                        </colgroup>
                        <thead role="rowgroup">
                          <tr role="row">
                            <th role="columnheader" scope="col"><div>User Name</div></th>
                            <th role="columnheader" scope="col" class="text-right"><div>CR</div></th>
                            <th role="columnheader" scope="col" class="text-right"><div>Pts</div></th>
                            <th role="columnheader" scope="col" class="text-right"><div>Client(P/L)</div></th>
                            <th role="columnheader" scope="col" class="text-right"><div>Exposure Limit</div></th>
                            <th role="columnheader" scope="col" class="text-right"><div>Exposure</div></th>
                            <th role="columnheader" scope="col" class="text-right"><div>Available Pts</div></th>
                            <th role="columnheader" scope="col"><div>Account Type</div></th>
                            <th role="columnheader" scope="col"><div>Action</div></th>
                            <th role="columnheader" scope="col"><div>Status</div></th>
                          </tr>
                        </thead>
                        <tbody role="rowgroup">
                          ${users.map(u => `
                            <tr role="row">
                              <td role="cell"><strong>${u.uname}</strong></td>
                              <td role="cell" class="text-right">${this.formatCurrency(u.creditRef)}</td>
                              <td role="cell" class="text-right font-weight-bold">${this.formatCurrency(u.balance)}</td>
                              <td role="cell" class="text-right font-weight-bold ${(u.clientPL || 0) >= 0 ? 'text-success' : 'text-danger'}">${(u.clientPL || 0) >= 0 ? '+' : ''}${this.formatCurrency(u.clientPL || 0)}</td>
                              <td role="cell" class="text-right">${this.formatCurrency(u.exposureLimit || 100000)}</td>
                              <td role="cell" class="text-right text-danger">${this.formatCurrency(u.exposure || 0)}</td>
                              <td role="cell" class="text-right font-weight-bold">${this.formatCurrency((u.balance || 0) - (u.exposure || 0))}</td>
                              <td role="cell"><span class="badge ${u.userType === '5' ? 'badge-agent' : 'badge-client'}">${u.userType === '5' ? 'Agent' : (u.userType === '4' ? 'Master' : 'Client')}</span></td>
                              <td role="cell">
                                <div class="btn-group">
                                  <button type="button" class="btn action-button" onclick="window.openDepositModal('${u.id}')" title="Deposit">D</button>
                                  <button type="button" class="btn action-button" onclick="window.openWithdrawModal('${u.id}')" title="Withdraw">W</button>
                                </div>
                              </td>
                              <td role="cell">
                                <span class="badge badge-success">Active</span>
                              </td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div class="row pt-3">
                    <div class="col">
                      <div class="dataTables_paginate paging_simple_numbers float-right">
                        <ul class="pagination pagination-rounded mb-0">
                          <ul role="menubar" class="pagination dataTables_paginate paging_simple_numbers my-0 b-pagination justify-content-end">
                            <li role="presentation" class="page-item disabled"><span class="page-link">«</span></li>
                            <li role="presentation" class="page-item disabled"><span class="page-link">‹</span></li>
                            <li role="presentation" class="page-item active"><button type="button" class="page-link">1</button></li>
                            <li role="presentation" class="page-item disabled"><span class="page-link">›</span></li>
                            <li role="presentation" class="page-item disabled"><span class="page-link">»</span></li>
                          </ul>
                        </ul>
                      </div>
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
      const self = this;
      const isLoaded = self._userLockLoaded !== false;
      const searchUname = self._userLockUname || 'Client_001';

      const sportsTree = [
        {
          id: 'etid_4',
          name: 'Cricket',
          icon: 'fas fa-baseball-ball',
          checked: false,
          children: [
            {
              id: 'tour_ipl',
              name: 'Indian Premier League (IPL)',
              checked: false,
              children: [
                { id: 'm_csk_mi', name: 'Chennai Super Kings v Mumbai Indians', checked: false },
                { id: 'm_rcb_kkr', name: 'Royal Challengers Bangalore v Kolkata Knight Riders', checked: false }
              ]
            },
            {
              id: 'tour_icc',
              name: 'ICC Champions Trophy 2026',
              checked: false,
              children: [
                { id: 'm_ind_pak', name: 'India v Pakistan', checked: false },
                { id: 'm_aus_eng', name: 'Australia v England', checked: false }
              ]
            },
            {
              id: 'tour_psl',
              name: 'Pakistan Super League (PSL)',
              checked: false,
              children: [
                { id: 'm_lq_kk', name: 'Lahore Qalandars v Karachi Kings', checked: false }
              ]
            }
          ]
        },
        {
          id: 'etid_1',
          name: 'Soccer',
          icon: 'fas fa-futbol',
          checked: false,
          children: [
            {
              id: 'tour_epl',
              name: 'English Premier League',
              checked: false,
              children: [
                { id: 'm_ars_che', name: 'Arsenal v Chelsea', checked: false },
                { id: 'm_liv_mci', name: 'Liverpool v Manchester City', checked: false }
              ]
            },
            {
              id: 'tour_ucl',
              name: 'UEFA Champions League',
              checked: false,
              children: [
                { id: 'm_rm_bay', name: 'Real Madrid v Bayern Munich', checked: false }
              ]
            }
          ]
        },
        {
          id: 'etid_2',
          name: 'Tennis',
          icon: 'fas fa-table-tennis',
          checked: false,
          children: [
            {
              id: 'tour_wim',
              name: 'Wimbledon Championship',
              checked: false,
              children: [
                { id: 'm_djo_alc', name: 'Djokovic v Alcaraz', checked: false }
              ]
            },
            {
              id: 'tour_uso',
              name: 'US Open Grand Slam',
              children: [
                { id: 'm_sin_med', name: 'Sinner v Medvedev', checked: false }
              ]
            }
          ]
        }
      ];

      const casinoList = [
        { id: 'c_teen20', name: '20-20 Teenpatti', checked: false },
        { id: 'c_roul', name: 'Roulette Classic', checked: false },
        { id: 'c_dt6', name: 'Dragon Tiger 1 Day', checked: false },
        { id: 'c_lucky7', name: 'Lucky 7 European', checked: false },
        { id: 'c_bacc', name: 'Speed Baccarat', checked: false },
        { id: 'c_ab', name: 'Andar Bahar Live', checked: false },
        { id: 'c_poker', name: 'Live Poker', checked: false },
        { id: 'c_32c', name: '32 Cards', checked: false },
        { id: 'c_worli', name: 'Worli Matka', checked: false },
        { id: 'c_dt20', name: 'Dragon Tiger 20-20', checked: false },
        { id: 'c_lucky7b', name: 'Lucky 7 B', checked: false },
        { id: 'c_teen', name: '1-Day Teenpatti', checked: false },
        { id: 'c_aaa', name: 'Amar Akbar Anthony', checked: false },
        { id: 'c_btable', name: 'Bollywood Table', checked: false },
        { id: 'c_trio', name: 'Trio Table', checked: false },
        { id: 'c_trap', name: 'Trap Roulette', checked: false },
        { id: 'c_race17', name: 'Race to 17', checked: false },
        { id: 'c_teenmuf', name: 'Teenpatti Muflis', checked: false },
        { id: 'c_queen', name: 'Queen Table', checked: false },
        { id: 'c_card32b', name: '32 Cards B', checked: false },
        { id: 'c_poker20', name: '20-20 Poker', checked: false },
        { id: 'c_race20', name: 'Race 20-20', checked: false },
        { id: 'c_sixplayer', name: '6 Player Poker', checked: false },
        { id: 'c_poker6', name: 'Poker 6 Player', checked: false },
        { id: 'c_ab2', name: 'Andar Bahar 2', checked: false },
        { id: 'c_superover', name: 'Super Over', checked: false },
        { id: 'c_worli2', name: 'Instant Worli', checked: false },
        { id: 'c_roulette2', name: 'European Roulette', checked: false }
      ];

      container.innerHTML = `
        <div class="listing-grid">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
                <h4 class="mb-0 font-size-18 font-weight-bold">General Lock</h4>
                <div class="page-title-right">
                  <ol class="breadcrumb m-0 font-size-12">
                    <li class="breadcrumb-item"><a href="/admin/users" class="nav-route-link">Home</a></li>
                    <li class="breadcrumb-item active">General Lock</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-12">
              <div class="card mb-3">
                <div class="card-body">
                  <form class="ajaxFormSubmit" onsubmit="event.preventDefault(); window.AdminApp.handleUserLockLoad();">
                    <div class="row row5 align-items-end">
                      <div class="col-xl-3 col-md-4 mb-2">
                        <label class="font-weight-normal small">Search By Client Name</label>
                        <input type="text" placeholder="Search By Client Name" class="form-control form-control-sm" id="lockClientName" value="${searchUname}">
                      </div>
                      <div class="col-xl-3 col-md-4 mb-2">
                        <label class="font-weight-normal small">Transaction Code</label>
                        <input type="password" placeholder="Transaction Code" class="form-control form-control-sm" id="lockTxnCode" value="123456">
                      </div>
                      <div class="col-xl-3 col-md-4 mb-2">
                        <button type="submit" class="btn btn-primary btn-sm mr-2" style="background-color: #0088cc; border-color: #0088cc;" id="loaddata">Load</button>
                        <button type="button" class="btn btn-light btn-sm" id="reset" onclick="window.AdminApp.resetUserLock();">Reset</button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          ${isLoaded ? `
            <div class="row mt-2" id="userLockSection">
              <!-- Left Column: Events Accordion -->
              <div class="col-lg-6 col-12 mb-3">
                <div class="card shadow-sm h-100">
                  <div class="card-header bg-light py-2">
                    <h5 class="mb-0 font-size-16 font-weight-bold text-dark"><i class="fas fa-trophy mr-1 text-warning"></i> Events</h5>
                  </div>
                  <div class="card-body p-3">
                    <ul class="navbar-nav user-lock-nav" id="accordian1" style="list-style: none; padding-left: 0;">
                      ${sportsTree.map((s, si) => `
                        <li class="nav-item dropdown show mb-2 p-2 border rounded bg-white">
                          <div class="d-flex align-items-center justify-content-between">
                            <div class="d-flex align-items-center">
                              <a class="arrow-icon mr-2 text-dark font-weight-bold" style="cursor: pointer;" onclick="const el=document.getElementById('submenu-${s.id}'); el.style.display = (el.style.display==='none'?'block':'none'); this.querySelector('i').classList.toggle('fa-angle-right'); this.querySelector('i').classList.toggle('fa-angle-down');">
                                <i class="fas fa-angle-down"></i>
                              </a>
                              <span class="custom-control custom-checkbox d-inline-block">
                                <input type="checkbox" class="custom-control-input" id="${s.id}" onchange="window.AdminApp.toggleUserLock('${s.id}', '${s.name}', 'Sport')">
                                <label class="custom-control-label font-weight-bold" for="${s.id}"><i class="${s.icon} mr-1 text-primary"></i> ${s.name}</label>
                              </span>
                            </div>
                            <span class="badge badge-light text-muted small">All In-Play</span>
                          </div>

                          <ul class="sub-menu mt-2 pl-4" id="submenu-${s.id}" style="list-style: none;">
                            ${s.children.map((c, ci) => `
                              <li class="mb-2">
                                <div class="d-flex align-items-center justify-content-between">
                                  <div class="d-flex align-items-center">
                                    <a class="arrow-icon mr-2 text-secondary" style="cursor: pointer;" onclick="const el=document.getElementById('submenu-${c.id}'); if(el){ el.style.display = (el.style.display==='none'?'block':'none'); }">
                                      <i class="fas fa-angle-right font-size-12"></i>
                                    </a>
                                    <span class="custom-control custom-checkbox d-inline-block">
                                      <input type="checkbox" class="custom-control-input" id="${c.id}" onchange="window.AdminApp.toggleUserLock('${c.id}', '${c.name}', 'Tournament')">
                                      <label class="custom-control-label small font-weight-bold" for="${c.id}">${c.name}</label>
                                    </span>
                                  </div>
                                </div>

                                ${c.children ? `
                                  <ul class="sub-menu mt-1 pl-4" id="submenu-${c.id}" style="list-style: none; display: none;">
                                    ${c.children.map(m => `
                                      <li class="mb-1">
                                        <span class="custom-control custom-checkbox">
                                          <input type="checkbox" class="custom-control-input" id="${m.id}" onchange="window.AdminApp.toggleUserLock('${m.id}', '${m.name}', 'Match')">
                                          <label class="custom-control-label small text-muted" for="${m.id}">${m.name}</label>
                                        </span>
                                      </li>
                                    `).join('')}
                                  </ul>
                                ` : ''}
                              </li>
                            `).join('')}
                          </ul>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Right Column: Casino Checkboxes -->
              <div class="col-lg-6 col-12 mb-3">
                <div class="card shadow-sm h-100">
                  <div class="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                    <h5 class="mb-0 font-size-16 font-weight-bold text-dark"><i class="fas fa-dice mr-1 text-danger"></i> Casino Games Lock</h5>
                    <button class="btn btn-xs btn-outline-primary" onclick="const boxes=document.querySelectorAll('#casinoLockList input[type=checkbox]'); const allChecked = Array.from(boxes).every(b=>b.checked); boxes.forEach(b=>b.checked=!allChecked); window.AdminApp.showToast(allChecked?'All casino games unlocked':'All casino games locked', 'info');">Toggle All</button>
                  </div>
                  <div class="card-body p-3">
                    <ul class="list-unstyled mb-0" id="casinoLockList" style="max-height: 480px; overflow-y: auto;">
                      <div class="row">
                        ${casinoList.map(g => `
                          <div class="col-sm-6 mb-2">
                            <span class="custom-control custom-checkbox">
                              <input type="checkbox" class="custom-control-input" id="${g.id}" onchange="window.AdminApp.toggleUserLock('${g.id}', '${g.name}', 'Casino')">
                              <label class="custom-control-label small font-weight-bold" for="${g.id}">${g.name}</label>
                            </span>
                          </div>
                        `).join('')}
                      </div>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    },

    handleUserLockLoad: function() {
      const clientName = (document.getElementById('lockClientName') ? document.getElementById('lockClientName').value : '') || 'Client_001';
      this._userLockLoaded = true;
      this._userLockUname = clientName;
      this.handleRouting();
      this.showToast('Lock profile loaded for ' + clientName, 'success');
    },

    resetUserLock: function() {
      this._userLockLoaded = false;
      this._userLockUname = '';
      this.handleRouting();
      this.showToast('User lock form reset.', 'info');
    },

    toggleUserLock: function(id, name, type) {
      const el = document.getElementById(id);
      const isLocked = el ? el.checked : false;
      this.showToast((isLocked ? 'Locked ' : 'Unlocked ') + type + ': ' + name, isLocked ? 'warning' : 'success');
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
          <div class="card-header text-white" style="background-color: #2c3e50 !important;">
            <h6 class="mb-0 font-weight-bold">Configure Quick Stake Values</h6>
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
          <div class="card-header text-white" style="background-color: #2c3e50 !important;">
            <h6 class="mb-0 font-weight-bold"><i class="fas fa-shield-alt mr-2 text-warning"></i> Two-Factor Authentication (2FA)</h6>
          </div>
          <div class="card-body">
            <p>Enhance your account security with Google Authenticator OTP verification.</p>
            <div class="alert alert-success">
              <i class="fas fa-check-circle mr-2"></i> Standard session verification is currently active.
            </div>
            <div class="form-group">
              <label class="font-weight-bold">Telegram / Authenticator Bot:</label>
              <input type="text" class="form-control" value="@ALLPANELEXCHSecurityBot" readonly>
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
      const pad = n => String(n).padStart(2, '0');
      const formatDate = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
      const fromDateStr = formatDate(oneWeekAgo);
      const toDateStr = formatDate(now);

      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
              <h4 class="mb-0 font-size-18">Turnover Report</h4>
              <div class="page-title-right"></div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-12">
            <div class="alert alert-info py-2 mb-3" style="background-color: #d1ecf1; border-color: #bee5eb; color: #0c5460;">
              You will be able to see the data of last 7 days only.
            </div>
            <div class="card">
              <div class="card-body">
                <form class="mb-3" onsubmit="event.preventDefault();">
                  <div class="row align-items-end">
                    <div class="col-md-3 mb-2">
                      <label class="font-weight-normal mb-1">Search By Client Name</label>
                      <input type="text" placeholder="Select option" class="form-control form-control-sm">
                    </div>
                    <div class="col-md-2 mb-2">
                      <label class="font-weight-normal mb-1">From Date:</label>
                      <input type="text" class="form-control form-control-sm" value="${fromDateStr}">
                    </div>
                    <div class="col-md-2 mb-2">
                      <label class="font-weight-normal mb-1">To Date:</label>
                      <input type="text" class="form-control form-control-sm" value="${toDateStr}">
                    </div>
                    <div class="col-md-2 mb-2">
                      <label class="font-weight-normal mb-1">Type</label>
                      <select class="custom-select custom-select-sm">
                        <option value="" selected>Select Type</option>
                        <option value="sport">Sport</option>
                        <option value="casino">Casino</option>
                      </select>
                    </div>
                  </div>
                  <div class="row mt-2">
                    <div class="col-12">
                      <button type="submit" class="btn btn-primary btn-sm mr-1" style="background-color: #0088cc; border-color: #0088cc;">Load</button>
                      <button type="reset" class="btn btn-secondary btn-sm mr-1">Reset</button>
                      <button type="button" class="btn btn-danger btn-sm mr-1" style="background-color: #f46a6a; border-color: #f46a6a;"><i class="far fa-file-pdf mr-1"></i>PDF</button>
                      <button type="button" class="btn btn-success btn-sm" style="background-color: #34c38f; border-color: #34c38f;"><i class="far fa-file-excel mr-1"></i>Excel</button>
                    </div>
                  </div>
                </form>
                <div class="table-responsive mb-0">
                  <table class="table b-table table-bordered table-striped mb-0">
                    <thead>
                      <tr>
                        <th class="text-center">Loss Turn Over</th>
                        <th class="text-center">Loss</th>
                        <th class="text-center">Win Turn Over</th>
                        <th class="text-center">Win</th>
                        <th class="text-center">Total Turn Over</th>
                        <th class="text-center">Total P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="b-table-empty-row">
                        <td colspan="6" class="text-center py-2">There are no records to show</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderUserHistory: function(container) {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const pad = n => String(n).padStart(2, '0');
      const formatDate = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
      const dateRangeStr = `${formatDate(oneWeekAgo)} ~ ${formatDate(now)}`;

      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
              <h4 class="mb-0 font-size-18">User History</h4>
              <div class="page-title-right"></div>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-body">
                <ul class="nav nav-tabs mb-3">
                  <li class="nav-item">
                    <a class="nav-link active" href="javascript:void(0)">Login History</a>
                  </li>
                  <li class="nav-item">
                    <a class="nav-link" href="javascript:void(0)">Change Password History</a>
                  </li>
                </ul>
                <form class="form-inline mb-3" onsubmit="event.preventDefault();">
                  <input type="text" placeholder="Select option" class="form-control form-control-sm mr-2" style="min-width: 200px;">
                  <div class="input-group input-group-sm mr-2" style="min-width: 220px;">
                    <input type="text" class="form-control" value="${dateRangeStr}">
                    <div class="input-group-append">
                      <span class="input-group-text"><i class="far fa-calendar-alt"></i></span>
                    </div>
                  </div>
                  <button type="submit" class="btn btn-primary btn-sm" style="background-color: #0088cc; border-color: #0088cc;">Load</button>
                </form>
                <div class="row mb-2">
                  <div class="col-sm-12 col-md-6">
                    <div id="tickets-table_length" class="dataTables_length">
                      <label class="d-inline-flex align-items-center font-weight-normal">
                        Show&nbsp;
                        <select class="custom-select custom-select-sm" style="width:auto; display:inline-block;">
                          <option value="25" selected>25</option>
                          <option value="50">50</option>
                          <option value="75">75</option>
                          <option value="100">100</option>
                        </select>&nbsp;entries
                      </label>
                    </div>
                  </div>
                  <div class="col-sm-12 col-md-6">
                    <div id="tickets-table_filter" class="dataTables_filter text-md-right">
                      <label class="d-inline-flex align-items-center font-weight-normal">
                        Search:
                        <input type="search" placeholder="Search..." class="form-control form-control-sm ml-2" style="width:auto; display:inline-block;">
                      </label>
                    </div>
                  </div>
                </div>
                <div class="table-responsive mb-0">
                  <table class="table b-table table-bordered table-striped mb-0">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Date</th>
                        <th>IP</th>
                        <th>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="b-table-empty-row">
                        <td colspan="4" class="text-center py-2">There are no records to show</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="row pt-3">
                  <div class="col-12">
                    <div class="dataTables_paginate paging_simple_numbers float-right">
                      <ul class="pagination pagination-rounded mb-0">
                        <ul role="menubar" class="pagination dataTables_paginate paging_simple_numbers my-0 b-pagination justify-content-end">
                          <li role="presentation" class="page-item disabled"><span class="page-link">«</span></li>
                          <li role="presentation" class="page-item disabled"><span class="page-link">‹</span></li>
                          <li role="presentation" class="page-item active"><button role="menuitemradio" class="page-link" style="background-color: #0088cc; border-color: #0088cc;">1</button></li>
                          <li role="presentation" class="page-item disabled"><span class="page-link">›</span></li>
                          <li role="presentation" class="page-item disabled"><span class="page-link">»</span></li>
                        </ul>
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

    renderUserAuthList: function(container) {
      const users = window.AdminDataStore.getUsers();

      container.innerHTML = `
        <div class="listing-grid report-wrapper">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
                <h4 class="mb-0 font-size-18 font-weight-bold">User Authentication</h4>
                <div class="page-title-right"></div>
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

    
    renderLiveCasinoReport: function(container) {
      const self = this;
      const casinoBets = [
        { roundId: '7729104', game: '20-20 Teenpatti', winner: 'Player A', cards: 'A♠ K♠ Q♠', uname: 'Client_001', stake: 5000, pl: 9500, time: '2026-10-13 22:45:10' },
        { roundId: '7729103', game: 'Roulette Classic', winner: 'Red 14', cards: 'Red', uname: 'Client_002', stake: 2500, pl: -2500, time: '2026-10-13 22:43:25' },
        { roundId: '7729102', game: 'Dragon Tiger Lion', winner: 'Dragon', cards: 'K♥ vs 9♦', uname: 'Client_003', stake: 10000, pl: 9500, time: '2026-10-13 22:41:00' },
        { roundId: '7729101', game: 'Lucky 7 European', winner: 'Low (7 Down)', cards: '4♣', uname: 'Client_Direct', stake: 3000, pl: 2850, time: '2026-10-13 22:38:15' },
        { roundId: '7729100', game: 'Speed Baccarat', winner: 'Banker', cards: 'Banker 8 / Player 6', uname: 'Client_004', stake: 12000, pl: -12000, time: '2026-10-13 22:35:40' }
      ];

      container.innerHTML = `
        <div class="live-bets-report listing-grid report-wrapper">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
                <h4 class="mb-0 font-size-18 font-weight-bold">Casino Report</h4>
                <div class="page-title-right">
                  <ol class="breadcrumb m-0 font-size-12">
                    <li class="breadcrumb-item"><a href="/admin/users" class="nav-route-link">Home</a></li>
                    <li class="breadcrumb-item active">Casino Report</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-12">
              <div class="card">
                <div class="card-body">
                  <form class="ajaxFormSubmit mb-3" onsubmit="event.preventDefault(); window.AdminApp.showToast('Casino report data refreshed.', 'success');">
                    <div class="row row5 align-items-end mb-3">
                      <div class="col-xl-2 col-md-4 mb-2">
                        <label class="font-weight-normal small">Select Casino Type</label>
                        <select class="form-control form-control-sm" id="casinoReportType">
                          <option value="settled" selected>Settled Bets</option>
                          <option value="unsettled">UnSettled Bets</option>
                        </select>
                      </div>
                      <div class="col-xl-2 col-md-4 mb-2">
                        <label class="font-weight-normal small">Search By Client Name</label>
                        <input type="text" class="form-control form-control-sm" placeholder="Client Name..." id="casinoReportUser">
                      </div>
                      <div class="col-xl-2 col-md-4 mb-2">
                        <label class="font-weight-normal small">Date</label>
                        <input type="date" class="form-control form-control-sm" id="casinoReportDate" value="${new Date().toISOString().slice(0, 10)}">
                      </div>
                      <div class="col-xl-3 col-md-6 mb-2">
                        <label class="font-weight-normal small">Select Game</label>
                        <select class="form-control form-control-sm" id="casinoReportGame">
                          <option value="all" selected>All Casino Games</option>
                          <option value="teen20">20-20 Teenpatti</option>
                          <option value="roulette">Roulette</option>
                          <option value="dt6">Dragon Tiger 1 Day</option>
                          <option value="lucky7">Lucky 7</option>
                          <option value="baccarat">Baccarat</option>
                          <option value="andarbahar">Andar Bahar</option>
                          <option value="poker">Live Poker</option>
                        </select>
                      </div>
                      <div class="col-xl-3 col-md-6 mb-2 text-right">
                        <button type="submit" class="btn btn-primary btn-sm mr-1" id="loaddata" style="background-color: #0088cc; border-color: #0088cc;">Load</button>
                        <button type="button" class="btn btn-light btn-sm mr-2" id="reset" onclick="document.getElementById('casinoReportUser').value='';">Reset</button>
                        <button type="button" class="btn btn-success btn-sm mr-1" onclick="window.adminExportExcel()"><i class="fas fa-file-excel"></i></button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="window.adminExportPdf()"><i class="fas fa-file-pdf"></i></button>
                      </div>
                    </div>
                  </form>

                  <div class="row mb-2">
                    <div class="col-sm-6">
                      <div class="dataTables_length">
                        <label class="d-inline-flex align-items-center font-weight-normal small">
                          Show&nbsp;
                          <select class="custom-select custom-select-sm" style="width:auto;">
                            <option value="25" selected>25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>&nbsp;entries
                        </label>
                      </div>
                    </div>
                    <div class="col-sm-6 text-right">
                      <label class="d-inline-flex align-items-center font-weight-normal small">
                        Search: <input type="search" placeholder="Search..." class="form-control form-control-sm ml-2" style="width: auto;">
                      </label>
                    </div>
                  </div>

                  <div class="table-responsive mb-0 report-table">
                    <table class="table b-table table-striped table-bordered table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Round ID</th>
                          <th>Casino Game</th>
                          <th>Winner / Outcome</th>
                          <th>Cards / Detail</th>
                          <th>Client</th>
                          <th class="text-right">Stake</th>
                          <th class="text-right">Profit / Loss</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${casinoBets.map(b => `
                          <tr>
                            <td><code>#${b.roundId}</code></td>
                            <td><strong>${b.game}</strong></td>
                            <td><span class="badge ${b.pl >= 0 ? 'badge-success' : 'badge-danger'} font-size-12">${b.winner}</span></td>
                            <td><code>${b.cards}</code></td>
                            <td><strong class="text-primary">${b.uname}</strong></td>
                            <td class="text-right font-weight-bold">${self.formatCurrency(b.stake)}</td>
                            <td class="text-right font-weight-bold ${b.pl >= 0 ? 'text-success' : 'text-danger'}">${b.pl >= 0 ? '+' : ''}${self.formatCurrency(b.pl)}</td>
                            <td class="text-muted small">${b.time}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderUserRegisterDetail: function(container) {
      const self = this;
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const formatDate = d => d.toISOString().slice(0, 10);

      const regUsers = [
        { userName: 'Client_001', aname: 'Agent_Alpha', Mobile: '+923001234567', CreatedDate: '2026-08-18 16:45:00', Llogin: '2026-10-13 21:10:00', FDepodate: '2026-08-19 10:00:00', LDepoDate: '2026-10-11 14:30:00', deposite: 'Yes', SportsBal: 48000, CasinoBal: 12500, TPCreditBal: 5000, SbookBal: 0 },
        { userName: 'Client_002', aname: 'Agent_Alpha', Mobile: '+923219876543', CreatedDate: '2026-08-20 12:10:00', Llogin: '2026-10-12 18:25:00', FDepodate: '2026-08-21 11:15:00', LDepoDate: '2026-10-09 19:40:00', deposite: 'Yes', SportsBal: 35000, CasinoBal: 8200, TPCreditBal: 2000, SbookBal: 0 },
        { userName: 'Client_003', aname: 'Agent_Beta', Mobile: '+923334567890', CreatedDate: '2026-08-25 10:00:00', Llogin: '2026-10-13 14:00:00', FDepodate: '2026-08-26 15:30:00', LDepoDate: '2026-10-12 20:15:00', deposite: 'Yes', SportsBal: 112000, CasinoBal: 45000, TPCreditBal: 10000, SbookBal: 0 },
        { userName: 'Client_004', aname: 'Agent_Beta', Mobile: '+923456789012', CreatedDate: '2026-08-28 15:30:00', Llogin: '2026-10-10 11:20:00', FDepodate: '-', LDepoDate: '-', deposite: 'No Deposit', SportsBal: 74000, CasinoBal: 0, TPCreditBal: 0, SbookBal: 0 },
        { userName: 'Client_Direct', aname: 'Faazan50', Mobile: '+923123456789', CreatedDate: '2026-08-15 09:30:00', Llogin: '2026-10-13 22:00:00', FDepodate: '2026-08-15 11:00:00', LDepoDate: '2026-10-13 18:00:00', deposite: 'Yes', SportsBal: 42000, CasinoBal: 15400, TPCreditBal: 8000, SbookBal: 0 }
      ];

      container.innerHTML = `
        <div class="listing-grid report-wrapper">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
                <h4 class="mb-0 font-size-18 font-weight-bold">User Register Detail</h4>
                <div class="page-title-right">
                  <ol class="breadcrumb m-0 font-size-12">
                    <li class="breadcrumb-item"><a href="/admin/users" class="nav-route-link">Home</a></li>
                    <li class="breadcrumb-item active">User Register Detail</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-12">
              <div class="card">
                <div class="card-body">
                  <form class="ajaxFormSubmit mb-3" onsubmit="event.preventDefault(); window.AdminApp.showToast('Registration data filtered.', 'success');">
                    <div class="row row5 align-items-end mb-3">
                      <div class="col-xl-3 col-md-4 mb-2">
                        <label class="font-weight-normal small">Search By Client Name</label>
                        <input type="text" class="form-control form-control-sm" placeholder="Client Name..." id="regClientName">
                      </div>
                      <div class="col-xl-2 col-md-3 mb-2">
                        <label class="font-weight-normal small">Status Filter</label>
                        <select class="form-control form-control-sm" id="regType">
                          <option value="1" selected>All Users</option>
                          <option value="2">With Deposit</option>
                          <option value="3">No Deposit</option>
                        </select>
                      </div>
                      <div class="col-xl-2 col-md-3 mb-2">
                        <label class="font-weight-normal small">From Date</label>
                        <input type="date" class="form-control form-control-sm" value="${formatDate(tenDaysAgo)}">
                      </div>
                      <div class="col-xl-2 col-md-3 mb-2">
                        <label class="font-weight-normal small">To Date</label>
                        <input type="date" class="form-control form-control-sm" value="${formatDate(now)}">
                      </div>
                      <div class="col-xl-3 col-md-6 mb-2 text-right">
                        <button type="submit" class="btn btn-primary btn-sm mr-1" style="background-color: #0088cc; border-color: #0088cc;">Load</button>
                        <button type="button" class="btn btn-light btn-sm mr-2" onclick="document.getElementById('regClientName').value='';">Reset</button>
                        <button type="button" class="btn btn-success btn-sm mr-1" onclick="window.adminExportExcel()"><i class="fas fa-file-excel"></i></button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="window.adminExportPdf()"><i class="fas fa-file-pdf"></i></button>
                      </div>
                    </div>
                  </form>

                  <div class="row mb-2">
                    <div class="col-sm-6">
                      <div class="dataTables_length">
                        <label class="d-inline-flex align-items-center font-weight-normal small">
                          Show&nbsp;
                          <select class="custom-select custom-select-sm" style="width:auto;">
                            <option value="25" selected>25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>&nbsp;entries
                        </label>
                      </div>
                    </div>
                    <div class="col-sm-6 text-right">
                      <label class="d-inline-flex align-items-center font-weight-normal small">
                        Search: <input type="search" placeholder="Search..." class="form-control form-control-sm ml-2" style="width: auto;">
                      </label>
                    </div>
                  </div>

                  <div class="table-responsive mb-0 report-table">
                    <table class="table b-table table-striped table-bordered table-hover mb-0">
                      <thead>
                        <tr>
                          <th>User Name</th>
                          <th>Agent Name</th>
                          <th>Mobile</th>
                          <th>Created Date</th>
                          <th>Last Login</th>
                          <th>First Depo</th>
                          <th>Last Depo</th>
                          <th>Deposit</th>
                          <th class="text-right">Sports Bal</th>
                          <th class="text-right">Casino Bal</th>
                          <th class="text-right">TP Credit</th>
                          <th class="text-right">SBook Bal</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${regUsers.map(u => `
                          <tr>
                            <td><strong class="text-primary">${u.userName}</strong></td>
                            <td>${u.aname}</td>
                            <td>${u.Mobile}</td>
                            <td class="small text-muted">${u.CreatedDate}</td>
                            <td class="small text-muted">${u.Llogin}</td>
                            <td class="small">${u.FDepodate}</td>
                            <td class="small">${u.LDepoDate}</td>
                            <td><span class="badge ${u.deposite === 'Yes' ? 'badge-success' : 'badge-warning'}">${u.deposite}</span></td>
                            <td class="text-right font-weight-bold">${self.formatCurrency(u.SportsBal)}</td>
                            <td class="text-right font-weight-bold">${self.formatCurrency(u.CasinoBal)}</td>
                            <td class="text-right font-weight-bold">${self.formatCurrency(u.TPCreditBal)}</td>
                            <td class="text-right font-weight-bold">${self.formatCurrency(u.SbookBal)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderTotalProfitLoss: function(container) {
      const self = this;
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const formatDate = d => d.toISOString().slice(0, 10);

      const sportsData = [
        { name: 'Cricket - South Africa v Pakistan', opening: 500000, closing: 518500, pl: 18500 },
        { name: 'Cricket - India v Australia', opening: 420000, closing: 408000, pl: -12000 },
        { name: 'Soccer - Chelsea v Liverpool', opening: 250000, closing: 259200, pl: 9200 },
        { name: 'Tennis - Alcaraz v Djokovic', opening: 180000, closing: 174500, pl: -5500 }
      ];
      const casinoData = [
        { name: '20-20 Teenpatti', opening: 300000, closing: 314200, pl: 14200 },
        { name: 'Roulette Classic', opening: 150000, closing: 146800, pl: -3200 },
        { name: 'Dragon Tiger', opening: 220000, closing: 228400, pl: 8400 },
        { name: 'Speed Baccarat', opening: 180000, closing: 185600, pl: 5600 }
      ];
      const tpData = [
        { name: 'Spribe Aviator', opening: 120000, closing: 124500, pl: 4500 },
        { name: 'Evolution Lightning Roulette', opening: 95000, closing: 91800, pl: -3200 }
      ];

      const totalSportsPL = sportsData.reduce((s, r) => s + r.pl, 0);
      const totalCasinoPL = casinoData.reduce((s, r) => s + r.pl, 0);
      const totalTPPL = tpData.reduce((s, r) => s + r.pl, 0);
      const grandTotalPL = totalSportsPL + totalCasinoPL + totalTPPL;

      container.innerHTML = `
        <div class="listing-grid report-wrapper">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
                <h4 class="mb-0 font-size-18 font-weight-bold">Total Profit Loss</h4>
                <div class="page-title-right">
                  <ol class="breadcrumb m-0 font-size-12">
                    <li class="breadcrumb-item"><a href="/admin/users" class="nav-route-link">Home</a></li>
                    <li class="breadcrumb-item active">Total Profit Loss</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-12">
              <div class="card">
                <div class="card-body">
                  <form class="ajaxFormSubmit mb-3" onsubmit="event.preventDefault(); window.AdminApp.showToast('Total Profit Loss report loaded.', 'success');">
                    <div class="row row5 align-items-end mb-3">
                      <div class="col-xl-3 col-md-4 mb-2">
                        <label class="font-weight-normal small">Search By Client Name</label>
                        <input type="text" class="form-control form-control-sm" placeholder="Client Name..." id="tplClientName">
                      </div>
                      <div class="col-xl-2 col-md-3 mb-2">
                        <label class="font-weight-normal small">Report Category</label>
                        <select class="form-control form-control-sm" id="tplType">
                          <option value="0" selected>All Reports</option>
                          <option value="2">Sports Report</option>
                          <option value="3">Casino Report</option>
                          <option value="4">Third Party Report</option>
                        </select>
                      </div>
                      <div class="col-xl-2 col-md-3 mb-2">
                        <label class="font-weight-normal small">From Date</label>
                        <input type="date" class="form-control form-control-sm" value="${formatDate(tenDaysAgo)}">
                      </div>
                      <div class="col-xl-2 col-md-3 mb-2">
                        <label class="font-weight-normal small">To Date</label>
                        <input type="date" class="form-control form-control-sm" value="${formatDate(now)}">
                      </div>
                      <div class="col-xl-3 col-md-6 mb-2 text-right">
                        <button type="submit" class="btn btn-primary btn-sm mr-1" style="background-color: #0088cc; border-color: #0088cc;">Load</button>
                        <button type="button" class="btn btn-light btn-sm mr-2" onclick="document.getElementById('tplClientName').value='';">Reset</button>
                        <button type="button" class="btn btn-success btn-sm mr-1" onclick="window.adminExportExcel()"><i class="fas fa-file-excel"></i></button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="window.adminExportPdf()"><i class="fas fa-file-pdf"></i></button>
                      </div>
                    </div>
                  </form>

                  <!-- Grand Total Overview Card -->
                  <div class="row mb-3">
                    <div class="col-md-3 col-6 mb-2">
                      <div class="card bg-light border p-2 text-center">
                        <small class="text-muted text-uppercase">Sports P/L</small>
                        <h5 class="mb-0 font-weight-bold ${totalSportsPL >= 0 ? 'text-success' : 'text-danger'}">${totalSportsPL >= 0 ? '+' : ''}${self.formatCurrency(totalSportsPL)}</h5>
                      </div>
                    </div>
                    <div class="col-md-3 col-6 mb-2">
                      <div class="card bg-light border p-2 text-center">
                        <small class="text-muted text-uppercase">Casino P/L</small>
                        <h5 class="mb-0 font-weight-bold ${totalCasinoPL >= 0 ? 'text-success' : 'text-danger'}">${totalCasinoPL >= 0 ? '+' : ''}${self.formatCurrency(totalCasinoPL)}</h5>
                      </div>
                    </div>
                    <div class="col-md-3 col-6 mb-2">
                      <div class="card bg-light border p-2 text-center">
                        <small class="text-muted text-uppercase">Third Party P/L</small>
                        <h5 class="mb-0 font-weight-bold ${totalTPPL >= 0 ? 'text-success' : 'text-danger'}">${totalTPPL >= 0 ? '+' : ''}${self.formatCurrency(totalTPPL)}</h5>
                      </div>
                    </div>
                    <div class="col-md-3 col-6 mb-2">
                      <div class="card bg-primary text-white p-2 text-center shadow-sm">
                        <small class="text-white-50 text-uppercase">Grand Total Net P/L</small>
                        <h5 class="mb-0 font-weight-bold">${grandTotalPL >= 0 ? '+' : ''}${self.formatCurrency(grandTotalPL)}</h5>
                      </div>
                    </div>
                  </div>

                  <!-- 1. Sports Section -->
                  <h5 class="font-weight-bold mt-3 mb-2"><i class="fas fa-baseball-ball text-warning mr-1"></i> Sports Report</h5>
                  <div class="table-responsive mb-4 report-table">
                    <table class="table b-table table-striped table-bordered table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Sport / Match Name</th>
                          <th class="text-right">Opening Balance</th>
                          <th class="text-right">Closing Balance</th>
                          <th class="text-right">Profit / Loss</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${sportsData.map(r => `
                          <tr>
                            <td><strong>${r.name}</strong></td>
                            <td class="text-right">${self.formatCurrency(r.opening)}</td>
                            <td class="text-right">${self.formatCurrency(r.closing)}</td>
                            <td class="text-right font-weight-bold ${r.pl >= 0 ? 'text-success' : 'text-danger'}">${r.pl >= 0 ? '+' : ''}${self.formatCurrency(r.pl)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                      <tfoot>
                        <tr class="bg-light font-weight-bold">
                          <td colspan="3" class="text-right">Total Sports Profit/Loss:</td>
                          <td class="text-right ${totalSportsPL >= 0 ? 'text-success' : 'text-danger'}">${totalSportsPL >= 0 ? '+' : ''}${self.formatCurrency(totalSportsPL)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <!-- 2. Casino Section -->
                  <h5 class="font-weight-bold mt-3 mb-2"><i class="fas fa-dice text-danger mr-1"></i> Casino Report</h5>
                  <div class="table-responsive mb-4 report-table">
                    <table class="table b-table table-striped table-bordered table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Casino Game</th>
                          <th class="text-right">Opening Balance</th>
                          <th class="text-right">Closing Balance</th>
                          <th class="text-right">Profit / Loss</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${casinoData.map(r => `
                          <tr>
                            <td><strong>${r.name}</strong></td>
                            <td class="text-right">${self.formatCurrency(r.opening)}</td>
                            <td class="text-right">${self.formatCurrency(r.closing)}</td>
                            <td class="text-right font-weight-bold ${r.pl >= 0 ? 'text-success' : 'text-danger'}">${r.pl >= 0 ? '+' : ''}${self.formatCurrency(r.pl)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                      <tfoot>
                        <tr class="bg-light font-weight-bold">
                          <td colspan="3" class="text-right">Total Casino Profit/Loss:</td>
                          <td class="text-right ${totalCasinoPL >= 0 ? 'text-success' : 'text-danger'}">${totalCasinoPL >= 0 ? '+' : ''}${self.formatCurrency(totalCasinoPL)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <!-- 3. Third Party Section -->
                  <h5 class="font-weight-bold mt-3 mb-2"><i class="fas fa-gamepad text-info mr-1"></i> Third Party Casino Report</h5>
                  <div class="table-responsive mb-0 report-table">
                    <table class="table b-table table-striped table-bordered table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Provider / Title</th>
                          <th class="text-right">Opening Balance</th>
                          <th class="text-right">Closing Balance</th>
                          <th class="text-right">Profit / Loss</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${tpData.map(r => `
                          <tr>
                            <td><strong>${r.name}</strong></td>
                            <td class="text-right">${self.formatCurrency(r.opening)}</td>
                            <td class="text-right">${self.formatCurrency(r.closing)}</td>
                            <td class="text-right font-weight-bold ${r.pl >= 0 ? 'text-success' : 'text-danger'}">${r.pl >= 0 ? '+' : ''}${self.formatCurrency(r.pl)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                      <tfoot>
                        <tr class="bg-light font-weight-bold">
                          <td colspan="3" class="text-right">Total Third Party Profit/Loss:</td>
                          <td class="text-right ${totalTPPL >= 0 ? 'text-success' : 'text-danger'}">${totalTPPL >= 0 ? '+' : ''}${self.formatCurrency(totalTPPL)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderUserWinLoss: function(container) {
      const self = this;
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      const formatDate = d => d.toISOString().slice(0, 10);

      const winLossList = [
        { index: 1, uname: 'Client_001', casino: 12500, sports: -18500, thirdparty: 2400, pl: -3600 },
        { index: 2, uname: 'Client_002', casino: -4500, sports: 15200, thirdparty: 0, pl: 10700 },
        { index: 3, uname: 'Client_003', casino: 22000, sports: 9400, thirdparty: 3100, pl: 34500 },
        { index: 4, uname: 'Client_004', casino: 0, sports: -7800, thirdparty: -1200, pl: -9000 },
        { index: 5, uname: 'Client_Direct', casino: 8600, sports: 12000, thirdparty: 4500, pl: 25100 }
      ];

      const totCasino = winLossList.reduce((s, r) => s + r.casino, 0);
      const totSports = winLossList.reduce((s, r) => s + r.sports, 0);
      const totTP = winLossList.reduce((s, r) => s + r.thirdparty, 0);
      const totPL = winLossList.reduce((s, r) => s + r.pl, 0);

      container.innerHTML = `
        <div class="listing-grid report-wrapper">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-2">
                <h4 class="mb-0 font-size-18 font-weight-bold">User Win Loss</h4>
                <div class="page-title-right">
                  <ol class="breadcrumb m-0 font-size-12">
                    <li class="breadcrumb-item"><a href="/admin/users" class="nav-route-link">Home</a></li>
                    <li class="breadcrumb-item active">User Win Loss</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-12">
              <div class="card">
                <div class="card-body">
                  <form class="ajaxFormSubmit mb-3" onsubmit="event.preventDefault(); window.AdminApp.showToast('User win/loss metrics calculated.', 'success');">
                    <div class="row row5 align-items-end mb-3">
                      <div class="col-xl-3 col-md-4 mb-2">
                        <label class="font-weight-normal small">Search By Client Name</label>
                        <input type="text" class="form-control form-control-sm" placeholder="Client Name..." id="winlossClientName">
                      </div>
                      <div class="col-xl-2 col-md-3 mb-2">
                        <label class="font-weight-normal small">From Date</label>
                        <input type="date" class="form-control form-control-sm" value="${formatDate(tenDaysAgo)}">
                      </div>
                      <div class="col-xl-2 col-md-3 mb-2">
                        <label class="font-weight-normal small">To Date</label>
                        <input type="date" class="form-control form-control-sm" value="${formatDate(now)}">
                      </div>
                      <div class="col-xl-5 col-md-8 mb-2 text-right">
                        <button type="submit" class="btn btn-primary btn-sm mr-1" style="background-color: #0088cc; border-color: #0088cc;">Load</button>
                        <button type="button" class="btn btn-light btn-sm mr-2" onclick="document.getElementById('winlossClientName').value='';">Reset</button>
                        <button type="button" class="btn btn-success btn-sm mr-1" onclick="window.adminExportExcel()"><i class="fas fa-file-excel"></i></button>
                        <button type="button" class="btn btn-danger btn-sm" onclick="window.adminExportPdf()"><i class="fas fa-file-pdf"></i></button>
                      </div>
                    </div>
                  </form>

                  <div class="row mb-2">
                    <div class="col-sm-6">
                      <div class="dataTables_length">
                        <label class="d-inline-flex align-items-center font-weight-normal small">
                          Show&nbsp;
                          <select class="custom-select custom-select-sm" style="width:auto;">
                            <option value="25" selected>25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>&nbsp;entries
                        </label>
                      </div>
                    </div>
                    <div class="col-sm-6 text-right">
                      <label class="d-inline-flex align-items-center font-weight-normal small">
                        Search: <input type="search" placeholder="Search..." class="form-control form-control-sm ml-2" style="width: auto;">
                      </label>
                    </div>
                  </div>

                  <div class="table-responsive mb-0 report-table">
                    <table class="table b-table table-striped table-bordered table-hover mb-0">
                      <thead>
                        <tr>
                          <th style="width: 60px;">No</th>
                          <th>User Name</th>
                          <th class="text-right">Casino</th>
                          <th class="text-right">Sport</th>
                          <th class="text-right">Third Party</th>
                          <th class="text-right">Profit / Loss</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${winLossList.map(r => `
                          <tr>
                            <td>${r.index}</td>
                            <td><strong class="text-primary">${r.uname}</strong></td>
                            <td class="text-right ${r.casino >= 0 ? 'text-success' : 'text-danger'}">${r.casino >= 0 ? '+' : ''}${self.formatCurrency(r.casino)}</td>
                            <td class="text-right ${r.sports >= 0 ? 'text-success' : 'text-danger'}">${r.sports >= 0 ? '+' : ''}${self.formatCurrency(r.sports)}</td>
                            <td class="text-right ${r.thirdparty >= 0 ? 'text-success' : 'text-danger'}">${r.thirdparty >= 0 ? '+' : ''}${self.formatCurrency(r.thirdparty)}</td>
                            <td class="text-right font-weight-bold ${r.pl >= 0 ? 'text-success' : 'text-danger'}">${r.pl >= 0 ? '+' : ''}${self.formatCurrency(r.pl)}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                      <tfoot>
                        <tr class="bg-light font-weight-bold">
                          <td colspan="2" class="text-right">Total Aggregate:</td>
                          <td class="text-right ${totCasino >= 0 ? 'text-success' : 'text-danger'}">${totCasino >= 0 ? '+' : ''}${self.formatCurrency(totCasino)}</td>
                          <td class="text-right ${totSports >= 0 ? 'text-success' : 'text-danger'}">${totSports >= 0 ? '+' : ''}${self.formatCurrency(totSports)}</td>
                          <td class="text-right ${totTP >= 0 ? 'text-success' : 'text-danger'}">${totTP >= 0 ? '+' : ''}${self.formatCurrency(totTP)}</td>
                          <td class="text-right ${totPL >= 0 ? 'text-success' : 'text-danger'}">${totPL >= 0 ? '+' : ''}${self.formatCurrency(totPL)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    toggleAllPrivileges: function(checked) {
      document.querySelectorAll('.priv-item').forEach(el => {
        el.checked = checked;
      });
    },

    handleCreateMultiLogin: function() {
      const client = document.getElementById('subClientId')?.value;
      const pass = document.getElementById('subPassword')?.value;
      const cpass = document.getElementById('subConfirmPassword')?.value;
      if (pass !== cpass) {
        alert('Password and Confirm Password do not match');
        return;
      }
      window.AdminApp.showToast('Sub-account ' + (client || '') + ' created successfully.', 'success');
      document.getElementById('createSubAccountForm')?.reset();
    },

    renderCreateAccount: function(container) {
      container.innerHTML = `
        <div class="row">
          <div class="col-12">
            <h4 class="mb-3" style="font-size: 16px; font-weight: 700; color: #333;">Multi Login Account</h4>
          </div>
        </div>

        <div class="card mb-4" style="border: 1px solid #e9ecef; border-radius: 4px; box-shadow: none;">
          <div class="card-body p-3">
            <form id="createSubAccountForm" onsubmit="event.preventDefault(); window.AdminApp.handleCreateMultiLogin();">
              
              <!-- Personal Information Section matching frame_18_0s.png -->
              <h6 class="mb-2" style="font-size: 12px; font-weight: 600; color: #495057;">Personal Information</h6>
              <div class="row mb-3">
                <div class="col-3 px-1 mb-2">
                  <label class="mb-1" style="font-size: 9.5px; color: #495057;">Client ID</label>
                  <input type="text" class="form-control form-control-sm" id="subClientId" required style="height: 26px; font-size: 10px; border: 1px solid #ced4da; border-radius: 2px;">
                </div>
                <div class="col-3 px-1 mb-2">
                  <label class="mb-1" style="font-size: 9.5px; color: #495057;">Full Name</label>
                  <input type="text" class="form-control form-control-sm" id="subFullName" required style="height: 26px; font-size: 10px; border: 1px solid #ced4da; border-radius: 2px;">
                </div>
                <div class="col-3 px-1 mb-2">
                  <label class="mb-1" style="font-size: 9.5px; color: #495057;">Password</label>
                  <input type="password" class="form-control form-control-sm" id="subPassword" required style="height: 26px; font-size: 10px; border: 1px solid #ced4da; border-radius: 2px;">
                </div>
                <div class="col-3 px-1 mb-2">
                  <label class="mb-1" style="font-size: 9.5px; color: #495057;">Confirm Password</label>
                  <input type="password" class="form-control form-control-sm" id="subConfirmPassword" required style="height: 26px; font-size: 10px; border: 1px solid #ced4da; border-radius: 2px;">
                </div>
              </div>

              <!-- Privileges Section matching frame_18_0s.png -->
              <h6 class="mb-2" style="font-size: 12px; font-weight: 600; color: #495057;">Privileges</h6>
              <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 3px; padding: 10px 6px; margin-bottom: 12px;">
                <div class="row no-gutters">
                  <!-- Col 1 -->
                  <div class="col-3 px-1">
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1" id="priv_all" onchange="window.AdminApp.toggleAllPrivileges(this.checked)" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_all">All</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_insert_user" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_insert_user">Insert User</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_gen_lock" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_gen_lock">General Lock</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_events" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_events">Events</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_deposit" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_deposit">Deposit</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_user_lock" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_user_lock">User Lock</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_user_reg_rep" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_user_reg_rep">User Register Report</label>
                    </div>
                  </div>

                  <!-- Col 2 -->
                  <div class="col-3 px-1">
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_dashboard" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_dashboard">DashBoard</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_acc_stmt" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_acc_stmt">Account Statement</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_cas_res" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_cas_res">Casino Result</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_mkt_search" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_mkt_search">Market Search Analysis</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_cred_ref" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_cred_ref">Credit Reference</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_bet_lock" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_bet_lock">Bet Lock</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_tot_pl" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_tot_pl">Total Profitloss</label>
                    </div>
                  </div>

                  <!-- Col 3 -->
                  <div class="col-3 px-1">
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_mkt_analysis" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_mkt_analysis">Market Analysis</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_party_wl" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_party_wl">Party Win Loss</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_live_cas_res" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_live_cas_res">Live Casino Result</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_login_u_create" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_login_u_create">Login User creation</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_u_info" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_u_info">User Info</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_active_u" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_active_u">active user</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_u_winloss" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_u_winloss">User Winloss</label>
                    </div>
                  </div>

                  <!-- Col 4 -->
                  <div class="col-3 px-1">
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_u_list" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_u_list">User List</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_curr_bets" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_curr_bets">Current Bets</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_our_casino" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_our_casino">Our Casino</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_withdraw" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_withdraw">Withdraw</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_u_pass_change" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_u_pass_change">User Password Change</label>
                    </div>
                    <div class="form-check mb-2" style="font-size: 8.5px; display: flex; align-items: center; white-space: nowrap;">
                      <input type="checkbox" class="form-check-input mr-1 priv-item" id="priv_agent_assign" style="width: 12px; height: 12px; accent-color: #000; margin-top: 0;">
                      <label class="form-check-label mb-0" for="priv_agent_assign">Agent Assign</label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Form Footer Controls matching frame_18_0s.png -->
              <div class="d-flex justify-content-end align-items-center">
                <input type="password" placeholder="Transaction Code" class="form-control form-control-sm mr-2" id="subTransactionCode" required style="width: 140px; height: 28px; font-size: 11px; border: 1px solid #ced4da; border-radius: 2px;">
                <button type="submit" class="btn btn-success btn-sm mr-2" style="background-color: #28a745; border-color: #28a745; font-size: 11px; height: 28px; padding: 2px 14px; border-radius: 2px;">Submit</button>
                <button type="reset" class="btn btn-secondary btn-sm" style="background-color: #f8f9fa; border: 1px solid #ced4da; color: #333; font-size: 11px; height: 28px; padding: 2px 14px; border-radius: 2px;">Reset</button>
              </div>

            </form>
          </div>
        </div>

        <!-- Configured Multi Login Accounts Table matching frame_18_0s.png -->
        <div class="table-responsive mb-0" style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
          <table class="table table-bordered table-striped" style="font-size: 11px; min-width: 900px;">
            <thead style="background: #f8f9fa;">
              <tr>
                <th style="font-weight: 600; color: #333;">Action</th>
                <th style="font-weight: 600; color: #333;">Username</th>
                <th style="font-weight: 600; color: #333;">IsAuth</th>
                <th style="font-weight: 600; color: #333;">Full Name</th>
                <th style="font-weight: 600; color: #333;">DashBoard</th>
                <th style="font-weight: 600; color: #333;">Market Analysis</th>
                <th style="font-weight: 600; color: #333;">User List</th>
                <th style="font-weight: 600; color: #333;">Insert User</th>
                <th style="font-weight: 600; color: #333;">Account Statement</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><button type="button" class="btn btn-dark btn-sm" style="padding: 1px 6px; font-size: 10px;">Edit</button></td>
                <td><strong>operator1</strong></td>
                <td><span style="display:inline-block; width:14px; height:14px; background:#000; color:#fff; border-radius:2px; font-size:9px; line-height:14px; text-align:center;">✔</span></td>
                <td>Shift Manager</td>
                <td><span style="display:inline-block; width:14px; height:14px; background:#000; color:#fff; border-radius:2px; font-size:9px; line-height:14px; text-align:center;">✔</span></td>
                <td><span style="display:inline-block; width:14px; height:14px; background:#000; color:#fff; border-radius:2px; font-size:9px; line-height:14px; text-align:center;">✔</span></td>
                <td><span style="display:inline-block; width:14px; height:14px; background:#000; color:#fff; border-radius:2px; font-size:9px; line-height:14px; text-align:center;">✔</span></td>
                <td><span style="display:inline-block; width:14px; height:14px; background:#000; color:#fff; border-radius:2px; font-size:9px; line-height:14px; text-align:center;">✔</span></td>
                <td><span style="display:inline-block; width:14px; height:14px; background:#000; color:#fff; border-radius:2px; font-size:9px; line-height:14px; text-align:center;">✔</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    },

    renderCasinoLobby: function(container, mode, slug) {
      const self = this;
      const gameCatalog = [
        { id: 'teen20', title: '20-20 Teenpatti', category: 'teenpatti', img: 'https://sitethemedata.com/casino_icons/twenty_twenty_teenpatti.jpg', min: 100, max: 200000, live: true },
        { id: 'teen1day', title: '1 Day Teenpatti', category: 'teenpatti', img: 'https://sitethemedata.com/casino_icons/oneday_teenpatti.jpg', min: 100, max: 100000, live: true },
        { id: 'roulette', title: 'European Roulette', category: 'roulette', img: 'https://sitethemedata.com/casino_icons/roulette.jpg', min: 50, max: 50000, live: true },
        { id: 'dt6', title: '1 Day Dragon Tiger', category: 'dragontiger', img: 'https://sitethemedata.com/casino_icons/oneday_dragontiger.jpg', min: 100, max: 150000, live: true },
        { id: 'lucky7', title: 'Lucky 7 European', category: 'lucky7', img: 'https://sitethemedata.com/casino_icons/lucky7.jpg', min: 100, max: 100000, live: true },
        { id: 'baccarat', title: 'Live Speed Baccarat', category: 'baccarat', img: 'https://sitethemedata.com/casino_icons/baccarat.jpg', min: 200, max: 300000, live: true },
        { id: 'andarbahar', title: 'Andar Bahar Live', category: 'andarbahar', img: 'https://sitethemedata.com/casino_icons/andar_bahar.jpg', min: 100, max: 100000, live: true },
        { id: 'cards32', title: '32 Cards Casino', category: 'cards', img: 'https://sitethemedata.com/casino_icons/32cards.jpg', min: 100, max: 150000, live: true },
        { id: 'race20', title: 'Race 20-20', category: 'cards', img: 'https://sitethemedata.com/casino_icons/race20.jpg', min: 100, max: 100000, live: true },
        { id: 'queen', title: 'Queen Casino', category: 'cards', img: 'https://sitethemedata.com/casino_icons/queen.jpg', min: 100, max: 100000, live: true },
        { id: 'aaa', title: 'Amar Akbar Anthony', category: 'virtual', img: 'https://sitethemedata.com/casino_icons/aaa.jpg', min: 50, max: 100000, live: true },
        { id: 'trio', title: 'Trio Virtual Table', category: 'virtual', img: 'https://sitethemedata.com/casino_icons/trio.jpg', min: 100, max: 50000, live: true }
      ];

      const currentTitle = slug ? slug.replace(/-/g, ' ').toUpperCase() : (mode === 'live' ? 'LIVE CASINO' : 'VIRTUAL CASINO');

      container.innerHTML = `
        <div class="listing-grid">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
                <h4 class="mb-0 font-size-18 font-weight-bold">${currentTitle}</h4>
                <div class="page-title-right">
                  <ol class="breadcrumb m-0 font-size-12">
                    <li class="breadcrumb-item"><a href="/admin/users" class="nav-route-link">Home</a></li>
                    <li class="breadcrumb-item"><a href="javascript:void(0);">${mode === 'live' ? 'Live Market' : 'Virtual Market'}</a></li>
                    <li class="breadcrumb-item active">${currentTitle}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-12">
              <div class="card p-2 bg-light border-0">
                <div class="d-flex align-items-center justify-content-between flex-wrap">
                  <div class="btn-group btn-group-sm mb-1" role="group">
                    <button type="button" class="btn btn-primary" style="background-color: #0088cc; border-color: #0088cc;">All Tables</button>
                    <button type="button" class="btn btn-outline-dark">Teenpatti</button>
                    <button type="button" class="btn btn-outline-dark">Roulette</button>
                    <button type="button" class="btn btn-outline-dark">Dragon Tiger</button>
                    <button type="button" class="btn btn-outline-dark">Baccarat</button>
                    <button type="button" class="btn btn-outline-dark">Lucky 7</button>
                  </div>
                  <span class="badge badge-success px-3 py-2 font-size-12 mb-1"><i class="fas fa-signal mr-1"></i> Live Stream Connected (Ultra-Low Latency)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Casino Tables Grid -->
          <div class="row">
            ${gameCatalog.map(g => `
              <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
                <div class="card h-100 shadow-sm border" style="border-radius: 6px; overflow: hidden;">
                  <div style="position: relative; height: 160px; background: #111; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    <img src="${g.img}" onerror="this.src='/admin/images/logo.png'" alt="${g.title}" style="width:100%; height:100%; object-fit: cover;">
                    <span class="badge badge-danger" style="position: absolute; top: 10px; right: 10px; font-size: 11px; padding: 4px 8px;">
                      <i class="fas fa-circle font-size-8 mr-1 text-white"></i> LIVE
                    </span>
                  </div>
                  <div class="card-body p-3 d-flex flex-column justify-content-between">
                    <div>
                      <h5 class="card-title font-size-15 font-weight-bold mb-1 text-dark">${g.title}</h5>
                      <div class="small text-muted mb-2">Min: ${self.formatCurrency(g.min)} | Max: ${self.formatCurrency(g.max)}</div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                      <span class="small font-weight-bold text-success">● Open for Betting</span>
                      <button class="btn btn-sm btn-primary px-3 font-weight-bold" style="background-color: #0088cc; border-color: #0088cc;" onclick="window.openCasinoTableViewer('${g.id}', '${g.title}')">
                        <i class="fas fa-play mr-1"></i> Open Table
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    },

    renderGameDetailView: function(container, path) {
      const self = this;
      const matches = window.AdminDataStore.getLiveMatches();
      const match = matches[0] || { event: 'South Africa v Pakistan', sport: 'Cricket', runners: ['South Africa', 'Pakistan'] };

      container.innerHTML = `
        <div class="listing-grid">
          <div class="row">
            <div class="col-12">
              <div class="page-title-box d-flex align-items-center justify-content-between mb-3">
                <h4 class="mb-0 font-size-18 font-weight-bold">${match.event}</h4>
                <div class="page-title-right">
                  <ol class="breadcrumb m-0 font-size-12">
                    <li class="breadcrumb-item"><a href="/admin/users" class="nav-route-link">Home</a></li>
                    <li class="breadcrumb-item"><a href="/admin/market-analysis" class="nav-route-link">Market Analysis</a></li>
                    <li class="breadcrumb-item active">${match.event}</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-lg-8 mb-4">
              <div class="card shadow-sm mb-3">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center py-2" style="background-color: #0088cc !important;">
                  <h6 class="mb-0 font-weight-bold"><i class="fas fa-chart-bar mr-2"></i> Match Odds - Live Exchange</h6>
                  <span class="badge badge-light text-primary font-weight-bold">Active In-Play</span>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-bordered mb-0">
                      <thead class="bg-light text-center">
                        <tr>
                          <th class="text-left">Runner / Selection</th>
                          <th style="width: 120px; background-color: #72bbef; color: #111;">Back</th>
                          <th style="width: 120px; background-color: #faa9ba; color: #111;">Lay</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${(match.runners || ['South Africa', 'Pakistan']).map((r, i) => `
                          <tr>
                            <td>
                              <div class="font-weight-bold">${r}</div>
                              <small class="text-muted">Book: <span class="${i === 0 ? 'text-success' : 'text-danger'} font-weight-bold">${i === 0 ? '+12,500' : '-8,200'}</span></small>
                            </td>
                            <td class="text-center cp" style="background-color: #edf7ff;" onclick="window.AdminApp.showToast('Back betslip opened for ${r}', 'info')">
                              <span class="odds-box-back d-block">${(1.85 + i * 0.25).toFixed(2)}</span>
                              <small class="text-muted">150k</small>
                            </td>
                            <td class="text-center cp" style="background-color: #fff0f3;" onclick="window.AdminApp.showToast('Lay betslip opened for ${r}', 'info')">
                              <span class="odds-box-lay d-block">${(1.88 + i * 0.25).toFixed(2)}</span>
                              <small class="text-muted">85k</small>
                            </td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-4 mb-4">
              <div class="card shadow-sm">
                <div class="card-header text-white py-2" style="background-color: #2c3e50 !important;">
                  <h6 class="mb-0 font-weight-bold"><i class="fas fa-list-ol mr-2"></i> Live Matched Bets</h6>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-sm table-striped mb-0">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Type</th>
                          <th class="text-right">Odds</th>
                          <th class="text-right">Stake</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td>Client_001</td><td><span class="badge badge-primary">Back</span></td><td class="text-right font-weight-bold">1.85</td><td class="text-right">5,000</td></tr>
                        <tr><td>Client_002</td><td><span class="badge badge-danger">Lay</span></td><td class="text-right font-weight-bold">2.10</td><td class="text-right">2,500</td></tr>
                        <tr><td>Client_Direct</td><td><span class="badge badge-primary">Back</span></td><td class="text-right font-weight-bold">1.86</td><td class="text-right">10,000</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
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
          <div class="card-header text-white" style="background-color: #2c3e50 !important;">
            <h6 class="mb-0 font-weight-bold">${desc}</h6>
          </div>
          <div class="card-body">
            <div class="alert alert-light border">
              <i class="fas fa-info-circle mr-2 text-info"></i> Displaying consolidated records up to <strong>${new Date().toISOString().slice(0,10)}</strong>.
            </div>
          </div>
        </div>
      `;
    },

    showRulesModal: function() {
      alert("ALLPANELEXCH Management Rules:\n\n1. All partnerships are settled weekly on Monday.\n2. Commission formula: (Total P/L * Share %) + 2% Comm.\n3. Negative client balances require immediate settlement authorization.\n4. Ensure adequate Master balance prior to allocating downline credits.");
    },

    openChangePasswordModal: function(uname) {
      document.getElementById('changePasswordUserName').value = uname || 'Faazan50';
      document.getElementById('inputNewPassword').value = '';
      document.getElementById('inputConfirmPassword').value = '';
      window.openModal('changePasswordModal');
    },

    showToast: function(message, type) {
      if (window.Swal) {
        let swalIcon = 'info';
        if (type === 'danger' || type === 'error') swalIcon = 'error';
        if (type === 'success') swalIcon = 'success';
        if (type === 'warning') swalIcon = 'warning';

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: swalIcon,
          title: message,
          showConfirmButton: false,
          timer: 3500,
          timerProgressBar: false
        });
        return;
      }

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
        <div class="alert text-white d-flex justify-content-between align-items-center mb-3" style="background-color: #2c3e50 !important;">
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
            <thead>
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
          <table class="table table-sm table-striped table-bordered">
            <thead>
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
  window.toggleMobileNavAccordion = function(id, trigger) {
    const el = document.getElementById(id);
    if (!el) return;
    const isHidden = (el.style.display === 'none' || !el.style.display);
    el.style.display = isHidden ? 'block' : 'none';
    if (trigger) {
      const arrow = trigger.querySelector('.accordion-arrow');
      if (arrow) {
        if (isHidden) {
          arrow.classList.remove('fa-caret-down');
          arrow.classList.add('fa-caret-up');
        } else {
          arrow.classList.remove('fa-caret-up');
          arrow.classList.add('fa-caret-down');
        }
      }
    }
  };

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
  window.adminFilterUsers = function(searchTerm) {
    const q = (searchTerm !== undefined ? searchTerm : (document.getElementById('searchUserInput')?.value || '')).toLowerCase().trim();
    const rows = document.querySelectorAll('#eventsListTbl tbody tr');
    rows.forEach((row, idx) => {
      if (idx === 0) return; // Keep total summary row visible
      row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  window.adminResetUsers = function() {
    const input = document.getElementById('searchUserInput');
    if (input) input.value = '';
    const topInput = document.getElementById('topClientSearchInput');
    if (topInput) topInput.value = '';
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
    const input = document.getElementById('searchMarketInput');
    const q = (input ? input.value : '').trim().toLowerCase();
    const container = document.getElementById('marketAnalysisContainer');
    if (!container) return;

    if (!q) {
      container.innerHTML = '';
      return;
    }

    const matches = (window.AdminDataStore && typeof window.AdminDataStore.getLiveMatches === 'function')
      ? window.AdminDataStore.getLiveMatches()
      : [];

    const filtered = matches.filter(m =>
      (m.eventName || '').toLowerCase().includes(q) ||
      (m.sportName || '').toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-muted font-size-13">
          No events found matching "${q.replace(/</g, '&lt;')}"
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="market-analysis-list p-2">
        ${filtered.map(m => `
          <div class="market-analysis-card card mb-3 shadow-sm" data-event="${(m.eventName || '').toLowerCase()}">
            <div class="market-analysis-title p-2 d-flex justify-content-between align-items-center" style="background-color: #2c3e50 !important; color: #ffffff !important; border-radius: 4px 4px 0 0;">
              <div>
                <span class="badge badge-warning mr-2">${m.sportName || 'Cricket'}</span>
                <a href="javascript:void(0)" onclick="window.openMarketBookModal('${m.id}')" class="ma-link font-weight-bold text-white">${m.eventName}</a>
              </div>
              <div class="small d-flex align-items-center text-white">
                <span class="badge badge-success mr-2">${m.inPlay ? 'IN PLAY' : 'UPCOMING'}</span>
                <span class="mr-2 text-white-50">Matched: <strong class="text-white">${window.AdminApp ? window.AdminApp.formatCurrency(m.matchedVolume) : m.matchedVolume}</strong></span>
                <button class="btn btn-sm btn-primary py-0 px-2" style="background-color: #0088cc !important; border-color: #0088cc !important;" onclick="window.openMarketBookModal('${m.id}')" title="Open Detailed Market Book">
                  <i class="fas fa-book-open mr-1"></i> Book
                </button>
              </div>
            </div>
            <div class="market-analysis-content p-2">
              <div class="row row5">
                <div class="col-lg-6 col-12 mb-2">
                  <div class="market-analysis-content-detail card mb-0">
                    <table class="table table-bordered table-striped mb-0">
                      <thead>
                        <tr>
                          <th>Match Odds</th>
                          <th class="text-right">Exposure</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${(m.runners || []).map(r => `
                          <tr>
                            <td><strong>${r.name}</strong></td>
                            <td class="text-right font-weight-bold ${(r.exp || 0) >= 0 ? 'text-success' : 'text-danger'}">
                              ${(r.exp || 0) >= 0 ? '+' : ''}${window.AdminApp ? window.AdminApp.formatCurrency(r.exp || 0) : r.exp}
                            </td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div class="col-lg-6 col-12 mb-2">
                  <div class="market-analysis-content-detail card mb-0">
                    <table class="table table-bordered table-striped mb-0">
                      <thead>
                        <tr>
                          <th>Bookmaker</th>
                          <th class="text-right">Exposure</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${(m.runners || []).map(r => `
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
    `;
  };

  window.adminRefreshMarkets = function() {
    const icon = document.getElementById('refreshMarketIcon');
    if (icon) {
      icon.classList.add('fa-spin');
      setTimeout(() => icon.classList.remove('fa-spin'), 600);
    }
    const input = document.getElementById('searchMarketInput');
    if (input && input.value) {
      window.adminFilterMarkets();
    }
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

  App.downloadUserCreationCsv = function() {
    const from = document.getElementById('userCreationFromDate')?.value || '';
    const to = document.getElementById('userCreationToDate')?.value || '';
    const csv = 'Date,User,Status\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `User_Creation.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  App.handleUserLockLoad = function() {
    const name = (document.getElementById('lockClientName')?.value || '').trim();
    const code = (document.getElementById('lockTxnCode')?.value || '').trim();
    if (!name && !code) {
      App.showToast('Please enter Client Name or Transaction Code.', 'warning');
      return;
    }
    App.showToast('Lock status updated.', 'success');
  };

  // Launch on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  App.handleRoute = function(path) {
    App.navigate(path);
  };

  App.filterByRole = function(role) {
    if (!role || role === 'all') {
      App.navigate('/admin/users');
    } else {
      App.navigate('/admin/users/' + role);
    }
  };

  window.toggleTreeNode = function(uname) {
    const container = document.getElementById(`tree-children-${uname}`);
    const btn = document.getElementById(`btn-toggle-${uname}`);
    if (!container) return;
    if (container.classList.contains('collapsed')) {
      container.classList.remove('collapsed');
      container.style.display = 'block';
      if (btn) btn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    } else {
      container.classList.add('collapsed');
      container.style.display = 'none';
      if (btn) btn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    }
  };

  window.expandAllTreeNodes = function() {
    document.querySelectorAll('.tree-children').forEach(c => {
      c.classList.remove('collapsed');
      c.style.display = 'block';
    });
    document.querySelectorAll('.tree-toggle-btn').forEach(b => {
      b.innerHTML = '<i class="fas fa-chevron-down"></i>';
    });
  };

  window.collapseAllTreeNodes = function() {
    document.querySelectorAll('.tree-children').forEach((c, idx) => {
      if (idx > 0) { // Keep root node open
        c.classList.add('collapsed');
        c.style.display = 'none';
      }
    });
    document.querySelectorAll('.tree-toggle-btn').forEach((b, idx) => {
      if (idx > 0) {
        b.innerHTML = '<i class="fas fa-chevron-right"></i>';
      }
    });
  };

  window.filterDownlineTree = function(query) {
    const q = (query || '').trim().toLowerCase();
    const items = document.querySelectorAll('.tree-item');
    if (!q) {
      items.forEach(item => {
        item.style.display = '';
      });
      return;
    }
    items.forEach(item => {
      const uname = (item.getAttribute('data-uname') || '').toLowerCase();
      const role = (item.getAttribute('data-role') || '').toLowerCase();
      const matches = uname.includes(q) || role.includes(q);
      if (matches) {
        item.style.display = '';
        let parent = item.parentElement;
        while (parent && parent.classList.contains('tree-children')) {
          parent.classList.remove('collapsed');
          parent.style.display = 'block';
          if (parent.parentElement) {
            parent.parentElement.style.display = '';
            const pUname = parent.parentElement.getAttribute('data-uname');
            const pBtn = document.getElementById(`btn-toggle-${pUname}`);
            if (pBtn) pBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
          }
          parent = parent.parentElement ? parent.parentElement.parentElement : null;
        }
      } else {
        const hasMatchingDescendant = item.querySelector(`.tree-item[data-uname*="${q}"], .tree-item[data-role*="${q}"]`);
        if (hasMatchingDescendant) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      }
    });
  };

  window.showAdminRulesModal = function() {
    Swal.fire({
      title: 'Rules & Regulations',
      html: `
        <div style="text-align: left; font-size: 13px; max-height: 400px; overflow-y: auto;">
          <p><strong>1. General Conditions:</strong> All management accounts must strictly operate within authorized downline boundaries.</p>
          <p><strong>2. Transactions:</strong> All financial credit reference deposits, withdrawals, and settlements must be backed by a valid transaction password.</p>
          <p><strong>3. Bets:</strong> Bets once matched cannot be altered except through official Void/Deleted procedures.</p>
          <p><strong>4. Security:</strong> Always protect your master credentials and enable two-step verification where applicable.</p>
        </div>
      `,
      confirmButtonText: 'Understood',
      confirmButtonColor: '#0088cc'
    });
  };

  window.AdminApp = App;
  window.handleCreateAccountSubmit = function(e) {
    return App.handleCreateAccountSubmit(e);
  };

})(window, document);

