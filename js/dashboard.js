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
  updateTopNavActiveState(window.location.pathname);
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

// Top Navigation Routing & Active State Controller
function updateTopNavActiveState(pathname) {
  const navItems = document.querySelectorAll('.header-bottom .navbar-nav .nav-item');
  if (!navItems.length) return;

  const p = (pathname || window.location.pathname).toLowerCase();

  let targetText = '';
  if (p === '/' || p === '/home' || p.endsWith('/home.html')) {
    targetText = 'HOME';
  } else if (p.includes('/sports-book/33')) {
    targetText = 'LOTTERY';
  } else if (p.includes('/all-sports/4')) {
    targetText = 'CRICKET';
  } else if (p.includes('/all-sports/2')) {
    targetText = 'TENNIS';
  } else if (p.includes('/all-sports/1')) {
    targetText = 'FOOTBALL';
  } else if (p.includes('/all-sports/8')) {
    targetText = 'TABLE TENNIS';
  } else if (p.includes('/casino-list/lc/4/22') || p.includes('baccarat')) {
    targetText = 'BACCARAT';
  } else if (p.includes('/casino-list/lc/4/24') || p.includes('32-card') || p.includes('card32')) {
    targetText = '32 CARDS';
  } else if (p.includes('/casino-list/lc/4/20') || p.includes('teenpatti')) {
    targetText = 'TEENPATTI';
  } else if (p.includes('/casino-list/lc/4/21') || p.includes('poker')) {
    targetText = 'POKER';
  } else if (p.includes('/casino-list/lc/4/27') || p.includes('lucky-7') || p.includes('lucky7')) {
    targetText = 'LUCKY 7';
  } else if (p.includes('/aviator') || p.includes('crash')) {
    targetText = 'CRASH';
  }

  navItems.forEach(item => {
    const link = item.querySelector('a');
    if (!link) return;
    const t = link.innerText.toUpperCase().trim();
    if (targetText && (t === targetText || (targetText === 'CRASH' && (t.includes('CRASH') || item.classList.contains('aviator'))))) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function handleSportsPageNavigation(targetUrl, updateHistory = true) {
  const p = (targetUrl || window.location.pathname).toLowerCase();
  const latestEvents = document.querySelectorAll('.latest-event');
  const sportsTabs = document.querySelectorAll('.sports-tab');
  const bottomCasinos = document.querySelectorAll('.casino-list.mt-2, .main-container > .casino-list');
  const betTableEl = document.querySelector('.bet-table');
  const tbody = document.querySelector('.bet-table-body');
  const sportTabs = document.querySelectorAll('.sports-tab .nav-link');

  if (p === '/' || p === '/home' || p.endsWith('/home.html')) {
    // HOME state: Show match bar, sports tabs, bet table, and bottom casino
    latestEvents.forEach(el => el.classList.remove('d-none-forced'));
    sportsTabs.forEach(el => el.classList.remove('d-none-forced'));
    bottomCasinos.forEach(el => el.classList.remove('d-none-forced'));
    if (betTableEl) betTableEl.classList.remove('d-none-forced');
    
    // Highlight Cricket in sports pills
    sportTabs.forEach(tab => {
      if (tab.innerText.toLowerCase().trim() === 'cricket') tab.classList.add('active');
      else tab.classList.remove('active');
    });

    // Show Cricket matches by default
    const rows = document.querySelectorAll('.bet-table-body .bet-table-row:not(#noRecordRow)');
    rows.forEach(r => {
      const sp = (r.getAttribute('data-sport') || 'cricket').toLowerCase();
      r.style.display = (sp === 'cricket') ? 'flex' : 'none';
    });

    const noRec = document.getElementById('noRecordRow');
    if (noRec) noRec.style.display = 'none';

    updateTopNavActiveState('/home');
    if (updateHistory) {
      try { window.history.pushState(null, '', '/home'); } catch (e) {}
    }
    return;
  }

  // Sports pages (/all-sports/:id or /sports-book/33): hide match bar, pills, and bottom casino
  latestEvents.forEach(el => el.classList.add('d-none-forced'));
  sportsTabs.forEach(el => el.classList.add('d-none-forced'));
  bottomCasinos.forEach(el => el.classList.add('d-none-forced'));

  let sName = '';
  let sId = '';
  if (p.includes('/sports-book/33')) {
    sName = 'lottery';
    sId = '33';
    updateTopNavActiveState('/sports-book/33');
    toggleCricketAccordion(false);
    // Reference /sports-book/33 displays empty center
    if (betTableEl) betTableEl.classList.add('d-none-forced');
  } else {
    if (betTableEl) betTableEl.classList.remove('d-none-forced');
    if (p.includes('/all-sports/4')) {
      sName = 'cricket';
      sId = '4';
      updateTopNavActiveState('/all-sports/4');
      toggleCricketAccordion(true);
    } else if (p.includes('/all-sports/2')) {
      sName = 'tennis';
      sId = '2';
      updateTopNavActiveState('/all-sports/2');
      toggleCricketAccordion(false);
    } else if (p.includes('/all-sports/1')) {
      sName = 'football';
      sId = '1';
      updateTopNavActiveState('/all-sports/1');
      toggleCricketAccordion(false);
    } else if (p.includes('/all-sports/8')) {
      sName = 'table tennis';
      sId = '8';
      updateTopNavActiveState('/all-sports/8');
      toggleCricketAccordion(false);
    } else if (p.includes('/all-sports/7')) {
      sName = 'horse racing';
      sId = '7';
      toggleCricketAccordion(false);
    }
  }

  // Filter table rows
  const tableRows = document.querySelectorAll('.bet-table-body .bet-table-row:not(#noRecordRow)');
  let matchCount = 0;
  if (tableRows.length) {
    tableRows.forEach(row => {
      const rowSport = (row.getAttribute('data-sport') || 'cricket').toLowerCase();
      if (sName && rowSport === sName) {
        row.style.display = 'flex';
        matchCount++;
      } else {
        row.style.display = 'none';
      }
    });
  }

  let noRec = document.getElementById('noRecordRow');
  if (matchCount === 0 && sId !== '33') {
    if (!noRec && tbody) {
      noRec = document.createElement('div');
      noRec.id = 'noRecordRow';
      noRec.className = 'no-record-row';
      noRec.textContent = 'No Record Found';
      tbody.appendChild(noRec);
    } else if (noRec) {
      noRec.style.display = 'block';
    }
  } else if (noRec) {
    noRec.style.display = 'none';
  }

  if (updateHistory && sId) {
    try {
      const newPath = (sId === '33') ? '/sports-book/33' : `/all-sports/${sId}`;
      window.history.pushState({ sportId: sId }, '', newPath);
    } catch (e) {}
  }
}

// Sports tabs filtering and client-side route sync
function initSportsTabs() {
  const sportTabs = document.querySelectorAll('.sports-tab .nav-link');
  const hasSportsTable = document.querySelector('.bet-table-body');
  
  // Set initial top nav active state
  updateTopNavActiveState(window.location.pathname);

  if (hasSportsTable) {
    handleSportsPageNavigation(window.location.pathname, false);

    // Intercept top nav clicks on sports page
    const topNavLinks = document.querySelectorAll('.header-bottom .navbar-nav a');
    topNavLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href === '/home' || href.startsWith('/sports-book/33') || href.startsWith('/all-sports/')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          handleSportsPageNavigation(href, true);
        });
      }
    });
  }

  if (!sportTabs.length) return;

  const sportIdMap = {
    'cricket': '4',
    'football': '1',
    'tennis': '2',
    'table tennis': '8',
    'horse racing': '7',
    'greyhound racing': '43',
    'basketball': '5',
    'wrestling': '69',
    'volleyball': '18',
    'snooker': '59',
    'e games': '11',
    'ice hockey': '19',
    'futsal': '9',
    'badminton': '22',
    'boxing': '6',
    'mixed martial arts': '3',
    'american football': '58',
    'motor sports': '52',
    'kabaddi': '66',
    'politics': '40',
    'darts': '57',
    'esoccer': '68',
    'boat racing': '67'
  };

  sportTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const text = tab.innerText.toLowerCase().trim();
      const sportId = sportIdMap[text] || '4';
      
      // Update active tab in pills
      sportTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Filter table rows
      const tableRows = document.querySelectorAll('.bet-table-body .bet-table-row:not(#noRecordRow)');
      let matchCount = 0;
      tableRows.forEach(row => {
        const rowSport = (row.getAttribute('data-sport') || 'cricket').toLowerCase();
        if (rowSport === text || (text === 'cricket' && rowSport === 'cricket')) {
          row.style.display = 'flex';
          matchCount++;
        } else {
          row.style.display = 'none';
        }
      });

      const noRec = document.getElementById('noRecordRow');
      if (matchCount === 0) {
        if (!noRec && document.querySelector('.bet-table-body')) {
          const nr = document.createElement('div');
          nr.id = 'noRecordRow';
          nr.className = 'no-record-row';
          nr.textContent = 'No Record Found';
          document.querySelector('.bet-table-body').appendChild(nr);
        } else if (noRec) {
          noRec.style.display = 'block';
        }
      } else if (noRec) {
        noRec.style.display = 'none';
      }
    });
  });

  // Intercept sidebar sports links pointing to /all-sports/:id
  const sidebarSportsLinks = document.querySelectorAll('.left-sidebar a[href^="/all-sports/"]');
  sidebarSportsLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      if (document.querySelector('.bet-table-body')) {
        e.preventDefault();
        handleSportsPageNavigation(href, true);
      }
    });
  });
}

function getCasinoGameCategory(href) {
  const h = (href || '').toLowerCase();
  // 22 = Baccarat (Exact 3 games in reference: baccarat, baccarat2, teensin/29 baccarat)
  if (h.includes('teensin') || h.includes('baccarat')) return '22';
  // 32 = Bollywood
  if (h.includes('btable')) return '32';
  // 24 = 32 Cards
  if (h.includes('card32')) return '24';
  // 21 = Poker
  if (h.includes('poker')) return '21';
  // 27 = Lucky 7
  if (h.includes('lucky')) return '27';
  // 31 = Roulette
  if (h.includes('roulette') || h.includes('roullete')) return '31';
  // 23 = Dragon Tiger
  if (h.includes('dt') || h.includes('dragontiger')) return '23';
  // 26 = Andar Bahar
  if (h.includes('ab') || h.includes('andar')) return '26';
  // 30 = Worli
  if (h.includes('worli')) return '30';
  // 40 = Queen
  if (h.includes('queen')) return '40';
  // 41 = Race
  if (h.includes('race')) return '41';
  // 34 = Sports / Super Over
  if (h.includes('superover') || h.includes('sports')) return '34';
  // 20 = Teenpatti
  if (h.includes('teen') || h.includes('joker') || h.includes('patti') || h.includes('muflis')) return '20';
  return 'other';
}

function filterCasinoCategory(catId, updateHistory = false) {
  const cId = String(catId || '35');
  const casinoCards = document.querySelectorAll('.casino-list-item');
  const subTabLinks = document.querySelectorAll('.casino-sub-tab .nav-link');

  // Filter game cards
  casinoCards.forEach(card => {
    const link = card.querySelector('a');
    const href = link ? link.getAttribute('href') : '';
    if (cId === '35' || cId === 'all') {
      card.style.display = '';
    } else {
      const cardCat = getCasinoGameCategory(href);
      card.style.display = (cardCat === cId) ? '' : 'none';
    }
  });

  // Update active sub-tab
  subTabLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.includes(`/casino-list/LC/4/${cId}`) || (cId === '35' && href.includes('/35'))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update top nav active state
  const catToNav = {
    '22': '/casino-list/LC/4/22',
    '24': '/casino-list/LC/4/24',
    '20': '/casino-list/LC/4/20',
    '21': '/casino-list/LC/4/21',
    '27': '/casino-list/LC/4/27'
  };
  if (catToNav[cId]) {
    updateTopNavActiveState(catToNav[cId]);
  } else {
    updateTopNavActiveState('/casino');
  }

  if (updateHistory) {
    try {
      window.history.pushState({ catId: cId }, '', `/casino-list/LC/4/${cId}`);
    } catch (e) {}
  }
}

// Casino tab filtering and game card launch simulation
function initCasinoInteractions() {
  const isCasinoPage = document.querySelector('.casino-sub-tab');

  if (isCasinoPage) {
    // Initial route extraction from URL
    const pathname = window.location.pathname;
    let initialCatId = '35';
    const match = pathname.match(/\/casino-list\/LC\/4\/(\d+)/i);
    if (match && match[1]) {
      initialCatId = match[1];
    } else if (pathname.includes('baccarat')) {
      initialCatId = '22';
    } else if (pathname.includes('32-card') || pathname.includes('card32')) {
      initialCatId = '24';
    } else if (pathname.includes('teenpatti')) {
      initialCatId = '20';
    } else if (pathname.includes('poker')) {
      initialCatId = '21';
    } else if (pathname.includes('lucky7') || pathname.includes('lucky-7')) {
      initialCatId = '27';
    }

    filterCasinoCategory(initialCatId, false);

    // Sub-tab click listeners
    const subTabs = document.querySelectorAll('.casino-sub-tab .nav-link');
    subTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const href = tab.getAttribute('href') || '';
        const m = href.match(/\/casino-list\/LC\/4\/(\d+)/i);
        const targetCatId = m ? m[1] : '35';
        e.preventDefault();
        filterCasinoCategory(targetCatId, true);
      });
    });

    // Top nav casino items click listeners on casino page
    const topNavLinks = document.querySelectorAll('.header-bottom .navbar-nav a');
    topNavLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const m = href.match(/\/casino-list\/LC\/4\/(\d+)/i);
      if (m && m[1]) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          filterCasinoCategory(m[1], true);
        });
      }
    });
  }

  // 2. Casino game cards launch feedback
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

  // Popstate listener for back/forward navigation
  window.addEventListener('popstate', () => {
    const curPath = window.location.pathname;
    updateTopNavActiveState(curPath);
    if (document.querySelector('.bet-table-body')) {
      handleSportsPageNavigation(curPath, false);
    }
    if (document.querySelector('.casino-sub-tab')) {
      const m = curPath.match(/\/casino-list\/LC\/4\/(\d+)/i);
      filterCasinoCategory(m ? m[1] : '35', false);
    }
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

  // Check URL params for competitionId
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const targetCompId = urlParams.get('competitionId');
    if (targetCompId) {
      const matchingItem = competitions.find(c => String(c.competition?.id || c.id) === String(targetCompId));
      handleCompetitionClick(null, targetCompId, matchingItem?.competition?.name || '');
    }
  } catch (e) {}
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

let cachedEventsByCompetition = {};

async function handleCompetitionClick(event, competitionId, competitionName) {
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

  // Load and render events for this competition
  await loadEventsForCompetition(competitionId, competitionName);
}

async function loadEventsForCompetition(competitionId, competitionName) {
  const tableBody = document.querySelector('.bet-table-body');
  if (!tableBody) return;

  // Check cache
  if (cachedEventsByCompetition[competitionId]) {
    renderEventsTable(cachedEventsByCompetition[competitionId], competitionName);
    return;
  }

  try {
    const res = await fetch(`/api/events?sportId=4&competitionId=${encodeURIComponent(competitionId)}`);
    if (!res.ok) {
      throw new Error(`Events status ${res.status}`);
    }
    const data = await res.json();
    const events = Array.isArray(data) ? data : [];
    cachedEventsByCompetition[competitionId] = events;
    renderEventsTable(events, competitionName);
  } catch (err) {
    console.warn('Error loading events:', err.message);
    tableBody.innerHTML = `
      <div class="p-4 text-center text-muted" style="background: #fff; font-size: 13px;">
        No active matches currently available.
      </div>
    `;
  }
}

function renderEventsTable(events, competitionName) {
  const tableBody = document.querySelector('.bet-table-body');
  if (!tableBody) return;

  if (!Array.isArray(events) || events.length === 0) {
    tableBody.innerHTML = `
      <div class="p-4 text-center text-muted" style="background: #fff; font-size: 13px;">
        No active matches currently scheduled for ${escapeHtml(competitionName || 'this competition')}.
      </div>
    `;
    return;
  }

  tableBody.innerHTML = events.map(item => {
    const evt = item.event || item;
    const id = evt.id || '';
    const name = evt.name || 'Unknown Match';
    const openDate = evt.openDate ? formatDate(evt.openDate) : '';

    return `
      <div class="bet-table-row" data-sport="cricket" data-event-id="${escapeHtml(String(id))}">
        <div class="bet-nation-name">
          <a class="bet-nation-game-name" href="/game-details/4/${escapeHtml(String(id))}">
            <span>${escapeHtml(name)}</span>
            ${openDate ? `<span class="d-none d-md-inline-block">&nbsp;/&nbsp;</span><span>${escapeHtml(openDate)}</span>` : ''}
          </a>
          <div class="game-icons">
            <span class="game-icon-dot"></span>
            <i class="fas fa-tv game-icon-tv"></i>
            <img src="/assets/images/ic_fancy.png" class="game-icon-img" alt="f">
            <img src="/assets/images/ic_bm.png" class="game-icon-img" alt="BM">
          </div>
        </div>
        <div class="bet-nation-odd d-xl-none"><b>1</b></div>
        <div class="bet-nation-odd d-xl-none"><b>X</b></div>
        <div class="bet-nation-odd d-xl-none"><b>2</b></div>
        <div class="bet-nation-odd"><div class="odd-box back" data-odd-type="back">-</div><div class="odd-box lay" data-odd-type="lay">-</div></div>
        <div class="bet-nation-odd"><div class="odd-box back" data-odd-type="back">-</div><div class="odd-box lay" data-odd-type="lay">-</div></div>
        <div class="bet-nation-odd"><div class="odd-box back" data-odd-type="back">-</div><div class="odd-box lay" data-odd-type="lay">-</div></div>
      </div>
    `;
  }).join('');
}

function formatDate(isoStr) {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } catch (e) {
    return isoStr;
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
window.loadEventsForCompetition = loadEventsForCompetition;


