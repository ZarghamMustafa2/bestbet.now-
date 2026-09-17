/**
 * BESTBET9 - Dashboard Interactive Logic & Routing Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  initUserSession();
  initDropdown();
  initMobileSidebar();
  initMobileSearch();
  initOddsInteraction();
  initSportsTabs();
  initCasinoInteractions();
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
  window.location.href = '/';
}

function initOddsInteraction() {
  const oddsCells = document.querySelectorAll('.odd-back, .odd-lay, .odd-box');
  oddsCells.forEach(cell => {
    cell.addEventListener('click', (e) => {
      const val = cell.innerText.trim();
      if (val !== '-' && val !== '') {
        console.log('Selected odd:', val);
      }
    });
  });
}

// Sports tabs filtering and client-side route sync
function initSportsTabs() {
  const sportTabs = document.querySelectorAll('.sports-tab .nav-link');
  const tableRows = document.querySelectorAll('.bet-table-body .bet-table-row');
  if (!sportTabs.length) return;

  const sportIdMap = {
    'cricket': '4',
    'football': '1',
    'tennis': '2',
    'table tennis': '8',
    'horse racing': '7',
    'greyhound racing': '43',
    'basketball': '5',
    'lottery': '33'
  };

  function filterSport(sportName, sportId, updateUrl = true) {
    const sName = (sportName || '').toLowerCase().trim();
    
    // Update active tab state
    sportTabs.forEach(tab => {
      const text = tab.innerText.toLowerCase().trim();
      if (text.includes(sName) || (sName === 'cricket' && text.includes('cricket'))) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Filter table rows
    if (tableRows.length) {
      tableRows.forEach(row => {
        const gameName = (row.querySelector('.bet-nation-game-name')?.innerText || '').toLowerCase();
        if (sName === 'cricket') {
          // Show cricket matches
          if (gameName.includes('valencia') || gameName.includes('espanyol') || gameName.includes('riera') || gameName.includes('charaeva')) {
            row.style.display = 'none';
          } else {
            row.style.display = 'flex';
          }
        } else if (sName === 'football') {
          if (gameName.includes('valencia') || gameName.includes('espanyol') || gameName.includes('alaves') || gameName.includes('rayo')) {
            row.style.display = 'flex';
          } else {
            row.style.display = 'none';
          }
        } else if (sName === 'tennis') {
          if (gameName.includes('riera') || gameName.includes('avanesyan') || gameName.includes('charaeva') || gameName.includes('you v')) {
            row.style.display = 'flex';
          } else {
            row.style.display = 'none';
          }
        } else {
          // Show all for other tabs or keep visible
          row.style.display = 'flex';
        }
      });
    }

    if (updateUrl && sportId) {
      try {
        window.history.pushState({ sportId }, '', `/all-sports/${sportId}`);
      } catch (e) {}
    }
  }

  sportTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const text = tab.innerText.toLowerCase().trim();
      const sportId = sportIdMap[text] || '4';
      filterSport(text, sportId, true);
    });
  });

  // Check URL pathname on initial load (e.g. /all-sports/1, /all-sports/2, /all-sports/4)
  const path = window.location.pathname;
  if (path.includes('/all-sports/1')) {
    filterSport('football', '1', false);
  } else if (path.includes('/all-sports/2')) {
    filterSport('tennis', '2', false);
  } else if (path.includes('/all-sports/4')) {
    filterSport('cricket', '4', false);
  } else if (path.includes('/all-sports/7')) {
    filterSport('horse racing', '7', false);
  } else if (path.includes('/all-sports/8')) {
    filterSport('table tennis', '8', false);
  } else if (path.includes('/sports-book/33')) {
    filterSport('lottery', '33', false);
  }
}

// Casino tab filtering and game card launch simulation
function initCasinoInteractions() {
  // 1. Casino sub-tab pills
  const subTabs = document.querySelectorAll('.casino-sub-tab .nav-link, .casino-tab .nav-link');
  const casinoItems = document.querySelectorAll('.casino-list-item');

  subTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const href = tab.getAttribute('href');
      // If client-side category filter
      if (href && (href.startsWith('/casino-list') || href.startsWith('casino'))) {
        e.preventDefault();
        
        // Remove active from peers
        const parentUl = tab.closest('ul');
        if (parentUl) {
          parentUl.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        }
        tab.classList.add('active');

        // Update URL cleanly via pushState
        try {
          window.history.pushState(null, '', href);
        } catch (err) {}

        const tabName = tab.innerText.trim();
        if (typeof showToast === 'function') {
          showToast(`Filtered: ${tabName}`);
        }
      }
    });
  });

  // 2. Casino game cards (both on casino.html and home.html)
  const gameLinks = document.querySelectorAll('.casino-list-item a');
  gameLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('/casino/') || href === 'javascript:void(0)')) {
        e.preventDefault();
        const card = link.closest('.casino-list-item');
        const nameEl = card ? card.querySelector('.casino-list-name') : null;
        const gameName = nameEl ? nameEl.innerText.trim() : (href.replace('/casino/', '') || 'Casino Game');
        
        if (typeof showToast === 'function') {
          showToast(`Launching ${gameName}...`);
        } else {
          console.log(`Launching ${gameName}...`);
        }
      }
    });
  });

  // 3. Aviator / Crash game tiles
  const aviatorPlays = document.querySelectorAll('.fancy-play');
  aviatorPlays.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (typeof showToast === 'function') {
        showToast('Launching Crash Game...');
      } else {
        console.log('Launching Crash Game...');
      }
    });
  });
}
