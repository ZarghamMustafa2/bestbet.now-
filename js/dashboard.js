/**
 * BESTBET9 - Dashboard Interactive Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initUserSession();
  initDropdown();
  initMobileSidebar();
  initMobileSearch();
  initOddsInteraction();
});

function initMobileSearch() {
  const searchBtn = document.getElementById('mobileSearchBtn');
  const searchInput = document.getElementById('mobileSearchInput');
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      searchInput.classList.toggle('search-input-show');
      if (searchInput.classList.contains('search-input-show')) {
        searchInput.focus();
      }
    });
  }
}

function initUserSession() {
  try {
    const userStr = localStorage.getItem('bestbet9_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const userBtn = document.getElementById('userDropdownBtn');
      const mobileUserBtn = document.getElementById('mobileUserDropdownBtn');
      const balEl = document.getElementById('userBalance');
      const expEl = document.getElementById('userExposure');

      if (userBtn && user.username) {
        userBtn.innerHTML = `${user.username} <i class="fas fa-chevron-down ms-1"></i>`;
      }
      if (mobileUserBtn && user.username) {
        mobileUserBtn.innerHTML = `${user.username} <i class="fas fa-chevron-down ms-1"></i>`;
      }
      if (balEl && user.balance !== undefined) {
        balEl.textContent = user.balance;
      }
      if (expEl && user.exposure !== undefined) {
        expEl.textContent = user.exposure;
      }
    }
  } catch (e) {
    console.warn('Session reading error:', e);
  }
}

function initDropdown() {
  const userBtn = document.getElementById('userDropdownBtn');
  const mobileUserBtn = document.getElementById('mobileUserDropdownBtn');
  const dropdownMenu = document.getElementById('userDropdownMenu');

  if (dropdownMenu) {
    if (userBtn) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });
    }
    if (mobileUserBtn) {
      mobileUserBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
      });
    }

    document.addEventListener('click', (e) => {
      if (!dropdownMenu.contains(e.target) && e.target !== userBtn && e.target !== mobileUserBtn) {
        dropdownMenu.classList.remove('show');
      }
    });
  }
}

function initMobileSidebar() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('mainSidebar') || document.querySelector('.sidebar.left-sidebar');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const backdrop = document.getElementById('sidebarBackdrop');

  function openSidebar() {
    if (sidebar) sidebar.classList.add('show', 'visible');
    if (backdrop) backdrop.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('show', 'visible');
    if (backdrop) backdrop.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openSidebar();
    });
  }
  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSidebar();
    });
  }
  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }
}

function toggleSidebarSection(bodyId) {
  const el = document.getElementById(bodyId);
  if (el) {
    el.classList.toggle('show');
  }
}

function toggleSidebar(bodyId, headerEl) {
  const el = document.getElementById(bodyId);
  if (el) {
    const isHidden = el.style.display === 'none';
    el.style.display = isHidden ? 'block' : 'none';
    if (headerEl) {
      const icon = headerEl.querySelector('i');
      if (icon) {
        icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
      }
    }
  }
}

function handleSignOut() {
  try {
    localStorage.removeItem('persist:root');
    localStorage.removeItem('bestbet9_user');
  } catch (e) {}
  window.location.href = 'index.html';
}

function initOddsInteraction() {
  const oddsCells = document.querySelectorAll('.odd-back, .odd-lay');
  oddsCells.forEach(cell => {
    cell.addEventListener('click', () => {
      const val = cell.innerText.trim();
      if (val !== '-') {
        console.log('Selected odd:', val, cell.classList.contains('odd-back') ? 'BACK' : 'LAY');
      }
    });
  });
}
