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
  loadCricketCompetitions();
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
  const mobileDropdownMenu = document.getElementById('mobileUserDropdownMenu');

  if (userBtn && dropdownMenu) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('show');
      if (mobileDropdownMenu) mobileDropdownMenu.classList.remove('show');
    });
  }

  if (mobileUserBtn && mobileDropdownMenu) {
    mobileUserBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileDropdownMenu.classList.toggle('show');
      if (dropdownMenu) dropdownMenu.classList.remove('show');
    });
  }

  document.addEventListener('click', (e) => {
    if (dropdownMenu && !dropdownMenu.contains(e.target) && e.target !== userBtn) {
      dropdownMenu.classList.remove('show');
    }
    if (mobileDropdownMenu && !mobileDropdownMenu.contains(e.target) && e.target !== mobileUserBtn) {
      mobileDropdownMenu.classList.remove('show');
    }
  });
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
        const rowSport = (row.getAttribute('data-sport') || 'cricket').toLowerCase();
        if (rowSport === sName || (sName === 'cricket' && rowSport === 'cricket')) {
          row.style.display = 'flex';
        } else {
          row.style.display = 'none';
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

  // Intercept header nav & sidebar links pointing to /all-sports/:id
  const sportsNavLinks = document.querySelectorAll('a[href^="/all-sports/"]');
  sportsNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      const parts = href.split('/');
      const sportId = parts[2];
      const idToName = {
        '1': 'football',
        '2': 'tennis',
        '4': 'cricket',
        '7': 'horse racing',
        '8': 'table tennis',
        '43': 'greyhound racing'
      };
      const sName = idToName[sportId];
      if (sName) {
        e.preventDefault();
        filterSport(sName, sportId, true);
        if (sportId === '4') {
          toggleCricketAccordion();
        } else {
          toggleCricketAccordion(false);
        }
      }
    });
  });

  // Check URL pathname on initial load (e.g. /all-sports/1, /all-sports/2, /all-sports/4)
  const path = window.location.pathname;
  if (path.includes('/all-sports/1')) {
    filterSport('football', '1', false);
    toggleCricketAccordion(false);
  } else if (path.includes('/all-sports/2')) {
    filterSport('tennis', '2', false);
    toggleCricketAccordion(false);
  } else if (path.includes('/all-sports/4')) {
    filterSport('cricket', '4', false);
    toggleCricketAccordion(true);
  } else if (path.includes('/all-sports/7')) {
    filterSport('horse racing', '7', false);
    toggleCricketAccordion(false);
  } else if (path.includes('/all-sports/8')) {
    filterSport('table tennis', '8', false);
    toggleCricketAccordion(false);
  } else if (path.includes('/sports-book/33')) {
    filterSport('lottery', '33', false);
    toggleCricketAccordion(false);
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

// SportBex Gaming API: Cricket Competitions Integration
let cachedCricketCompetitions = null;

async function loadCricketCompetitions() {
  const container = document.getElementById('cricketCompetitionsList');
  if (!container) return;

  try {
    if (cachedCricketCompetitions && cachedCricketCompetitions.length > 0) {
      renderCricketCompetitions(cachedCricketCompetitions);
      return;
    }

    const res = await fetch('/api/competitions?eventTypeId=4');
    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      cachedCricketCompetitions = data;
      renderCricketCompetitions(data);
    }
  } catch (e) {
    console.warn('SportBex competition fallback active:', e.message);
  }
}

function renderCricketCompetitions(competitions) {
  const container = document.getElementById('cricketCompetitionsList');
  if (!container || !Array.isArray(competitions)) return;

  container.innerHTML = competitions.map(item => {
    const comp = item.competition || {};
    const id = comp.id || '';
    const name = comp.name || 'Unknown Competition';
    const region = item.competitionRegion || 'International';
    const marketCount = item.marketCount !== undefined ? item.marketCount : 1;

    return `
      <a class="sidebar-link sidebar-sub-link competition-item" 
         href="/all-sports/4?competitionId=${escapeHtml(String(id))}" 
         data-competition-id="${escapeHtml(String(id))}" 
         data-region="${escapeHtml(String(region))}" 
         data-market-count="${escapeHtml(String(marketCount))}" 
         title="${escapeHtml(name)} (${escapeHtml(region)})"
         onclick="handleCompetitionClick(event, '${escapeHtml(String(id))}', '${escapeHtml(name)}')">
        <i class="far fa-plus-square"></i>
        <span class="competition-name">${escapeHtml(name)}</span>
        <span class="competition-market-count">(${escapeHtml(String(marketCount))})</span>
      </a>
    `;
  }).join('');
}

function toggleCricketAccordion(forceState) {
  const container = document.getElementById('cricketCompetitionsList');
  const icon = document.getElementById('cricketTreeIcon');
  if (!container) return;

  const isCurrentlyHidden = container.style.display === 'none' || !container.style.display;
  const shouldOpen = (typeof forceState === 'boolean') ? forceState : isCurrentlyHidden;

  container.style.display = shouldOpen ? 'block' : 'none';
  if (icon) {
    icon.className = shouldOpen ? 'far fa-minus-square' : 'far fa-plus-square';
  }

  if (shouldOpen && (!container.children || container.children.length === 0)) {
    loadCricketCompetitions();
  }
}

function handleCompetitionClick(event, competitionId, competitionName) {
  if (event) {
    event.preventDefault();
  }
  const allItems = document.querySelectorAll('.competition-item');
  allItems.forEach(item => {
    if (item.getAttribute('data-competition-id') === competitionId) {
      item.style.backgroundColor = '#d5dae0';
      item.style.fontWeight = 'bold';
    } else {
      item.style.backgroundColor = '';
      item.style.fontWeight = '';
    }
  });

  // Ensure cricket sports tab is active
  const sportTabs = document.querySelectorAll('.sports-tab .nav-link');
  sportTabs.forEach(tab => {
    if (tab.innerText.toLowerCase().includes('cricket')) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Filter table rows if matching matches exist
  const tableRows = document.querySelectorAll('.bet-table-body .bet-table-row');
  if (tableRows.length) {
    tableRows.forEach(row => {
      const rowSport = (row.getAttribute('data-sport') || 'cricket').toLowerCase();
      if (rowSport === 'cricket') {
        row.style.display = 'flex';
      } else {
        row.style.display = 'none';
      }
    });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.toggleCricketAccordion = toggleCricketAccordion;
window.handleCompetitionClick = handleCompetitionClick;
window.loadCricketCompetitions = loadCricketCompetitions;

