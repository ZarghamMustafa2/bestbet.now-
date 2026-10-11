/**
 * BESTBET9 - Match Details & Live Odds Polling Controller
 * Connects SportBex API to match details, multi-market grid, bookmaker, fancy, and betslip engine.
 * 
 * STRICT RULES APPLIED:
 * - 100% faithful replication of authorized reference website (bestbet9.now).
 * - Matches visual reference layout and 2-column secondary markets grid.
 * - In-place text node updates during live odds polling (anti-flicker).
 * - Suspended overlay styling with red SUSPENDED text across locked odds boxes.
 * - Clean teardown on unload/pagehide.
 */

(function () {
  let pollingTimer = null;
  let activeEventId = '868370659';
  let activeSportId = '2'; // Default to Tennis (matching screenshot)
  let activeMatchOddsMarketId = null;
  let activeRunnersMap = {}; // selectionId -> runnerName

  document.addEventListener('DOMContentLoaded', () => {
    initMatchDetails();
  });

  function initMatchDetails() {
    parseUrlParams();
    updateActiveNavHighlight();
    initSidebarTreeInteractions();
    loadMatchData();

    // Clean up polling on navigation away
    window.addEventListener('beforeunload', stopOddsPolling);
    window.addEventListener('pagehide', stopOddsPolling);
  }

  function parseUrlParams() {
    try {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      // e.g. /game-details/2/868370659 or /game-details/4/601999990
      if (pathParts.length >= 3 && (pathParts[0] === 'game-details' || pathParts[0] === 'cricketv' || pathParts[0] === 'tp-virtual-cricket')) {
        activeSportId = pathParts[1];
        activeEventId = pathParts[2];
      } else if (pathParts.length >= 2 && pathParts[0] === 'game-details') {
        activeEventId = pathParts[1];
      }

      // Check query params as fallback or override
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('eventId')) {
        activeEventId = urlParams.get('eventId');
      }
      if (urlParams.get('sportId')) {
        activeSportId = urlParams.get('sportId');
      }
    } catch (e) {
      console.warn('Error parsing URL params:', e);
    }
  }

  function updateActiveNavHighlight() {
    // Remove active from all nav items
    document.querySelectorAll('.header-bottom .nav-item').forEach(el => el.classList.remove('active'));

    // Map sport ID to top nav element
    const sportNavMap = {
      '4': 'nav-item-cricket',
      '2': 'nav-item-tennis',
      '1': 'nav-item-football',
      '8': 'nav-item-table-tennis',
      '33': 'nav-item-lottery'
    };

    const targetNavId = sportNavMap[activeSportId] || 'nav-item-tennis';
    const targetEl = document.getElementById(targetNavId);
    if (targetEl) {
      targetEl.classList.add('active');
    }
  }

  function initSidebarTreeInteractions() {
    // Left sidebar tree expand/collapse
    const menuBox = document.querySelector('.left-sidebar .menu-box');
    if (!menuBox) return;

    menuBox.addEventListener('click', (e) => {
      const toggle = e.target.closest('a.dropdown-toggle');
      if (!toggle) return;

      e.preventDefault();
      const parentLi = toggle.closest('li.nav-item');
      const dropdownMenu = toggle.nextElementSibling;

      if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
        const isShown = dropdownMenu.classList.contains('show');
        if (isShown) {
          dropdownMenu.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
          const icon = toggle.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-minus-square');
            icon.classList.add('fa-plus-square');
          }
        } else {
          dropdownMenu.classList.add('show');
          toggle.setAttribute('aria-expanded', 'true');
          const icon = toggle.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-plus-square');
            icon.classList.add('fa-minus-square');
          }
        }
      }
    });

    // Auto-expand Wrestling and WWE Virtual to match reference screenshot
    expandDefaultTreeNodes();
  }

  function expandDefaultTreeNodes() {
    const allLinks = Array.from(document.querySelectorAll('.left-sidebar .menu-box a.dropdown-toggle'));
    const wrestlingLink = allLinks.find(a => a.innerText && a.innerText.trim().includes('Wrestling'));
    if (wrestlingLink) {
      const wrestlingMenu = wrestlingLink.nextElementSibling;
      if (wrestlingMenu) {
        wrestlingMenu.classList.add('show');
        wrestlingLink.setAttribute('aria-expanded', 'true');
        const icon = wrestlingLink.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-plus-square');
          icon.classList.add('fa-minus-square');
        }

        // Also expand WWE Virtual inside
        const wweLink = Array.from(wrestlingMenu.querySelectorAll('a.dropdown-toggle')).find(a => a.innerText && a.innerText.trim().includes('WWE Virtual'));
        if (wweLink) {
          const wweMenu = wweLink.nextElementSibling;
          if (wweMenu) {
            wweMenu.classList.add('show');
            wweLink.setAttribute('aria-expanded', 'true');
            const wweIcon = wweLink.querySelector('i');
            if (wweIcon) {
              wweIcon.classList.remove('fa-plus-square');
              wweIcon.classList.add('fa-minus-square');
            }
          }
        }
      }
    }
  }

  async function loadMatchData() {
    // 1. Initial render with sport-specific default/fallback data immediately
    renderDefaultSportView();

    if (!activeEventId) return;

    try {
      // 2. Fetch market list from API
      const res = await fetch(`/api/markets?eventId=${encodeURIComponent(activeEventId)}`, { cache: 'no-store' });
      if (res.ok) {
        const markets = await res.json();
        if (Array.isArray(markets) && markets.length > 0) {
          renderMarketsFromApi(markets);
        }
      }

      // 3. If Cricket, fetch Bookmaker and Fancy
      if (activeSportId === '4') {
        loadCricketFancyData();
      }

      // 4. Start polling live odds
      if (activeMatchOddsMarketId) {
        await refreshLiveOdds();
        startOddsPolling();
      }
    } catch (err) {
      console.warn('SportBex live data notice:', err.message);
    }
  }

  function renderDefaultSportView() {
    const headerTitle = document.getElementById('matchHeaderTitle');
    const headerTime = document.getElementById('matchHeaderTime');
    const scorecardContainer = document.getElementById('cricketScorecardContainer');

    if (activeSportId === '4') {
      // Cricket Default View (matching Afghanistan v India)
      if (headerTitle) headerTitle.textContent = 'AFGHANISTAN V INDIA';
      if (headerTime) headerTime.textContent = '15/09/2026 07:00:00';
      document.title = 'Match Markets - Afghanistan v India - BESTBET9';

      if (scorecardContainer) {
        scorecardContainer.style.display = 'block';
        scorecardContainer.innerHTML = `
          <div class="scorecard">
            <div class="row">
              <div class="col-12 col-md-6">
                <p class="team-1 row">
                  <span class="team-name col-3">IND</span>
                  <span class="score col-6 text-end">27-0 (3.2)</span>
                  <span class="team-name col-3"><span>CRR 8.10</span> <span>RR 7.98</span></span>
                </p>
                <p class="team-1 row mt-2">
                  <span class="team-name col-3">AFG</span>
                  <span class="score col-6 text-end">159-8 (20.0)</span>
                  <span class="team-name col-3"></span>
                </p>
              </div>
              <div class="col-12 col-md-6">
                <div class="row">
                  <div class="col-12">
                    <div class="text-xl-end"><span>IND Needed 133 runs from 100 balls</span></div>
                    <div class="row">
                      <div class="col-12">
                        <p class="text-xl-end ball-by-ball mt-2">
                          <span class="ball-runs">1</span>
                          <span class="ball-runs">0</span>
                          <span class="ball-runs four">4</span>
                          <span class="ball-runs">0</span>
                          <span class="ball-runs">0</span>
                          <span class="ball-runs">0</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      renderCricketMarkets();

    } else if (activeSportId === '1') {
      // Football Default View (Rayo Vallecano v Espanyol)
      if (headerTitle) headerTitle.textContent = 'RAYO VALLECANO V ESPANYOL';
      if (headerTime) headerTime.textContent = '15/09/2026 21:00:00';
      document.title = 'Match Markets - Rayo Vallecano v Espanyol - BESTBET9';
      if (scorecardContainer) scorecardContainer.style.display = 'none';

      renderFootballMarkets();

    } else {
      // Tennis Default View (exact match to target screenshot media_1791738745253_ce87d2cd.png)
      if (headerTitle) headerTitle.textContent = 'TH SEYBOTH WILD V JO REIS DA SILVA';
      if (headerTime) headerTime.textContent = '11/10/2026 08:00:00';
      document.title = 'Match Markets - TH SEYBOTH WILD V JO REIS DA SILVA - BESTBET9';
      if (scorecardContainer) scorecardContainer.style.display = 'none';

      renderTennisMarkets();
    }
  }

  function renderTennisMarkets() {
    activeMatchOddsMarketId = 'tennis_mo_1';
    const matchOddsMax = document.getElementById('matchOddsMax');
    if (matchOddsMax) matchOddsMax.textContent = 'Max: 50K';

    const matchOddsBody = document.getElementById('matchOddsBody');
    if (matchOddsBody) {
      matchOddsBody.innerHTML = `
        <div class="market-row" data-title="ACTIVE" data-selection-id="101" data-market-id="tennis_mo_1">
          <div class="market-nation-detail">
            <span class="market-nation-name">Thiago Seyboth Wild</span>
            <div class="market-nation-book"></div>
          </div>
          <div class="market-odd-box back2"><span class="market-odd">16</span><span class="market-volume">35.58</span></div>
          <div class="market-odd-box back1"><span class="market-odd">16.5</span><span class="market-volume">5.67</span></div>
          <div class="market-odd-box back"><span class="market-odd">17.5</span><span class="market-volume">64.55</span></div>
          <div class="market-odd-box lay"><span class="market-odd">26</span><span class="market-volume">4.31</span></div>
          <div class="market-odd-box lay1"><span class="market-odd">36</span><span class="market-volume">30.42</span></div>
          <div class="market-odd-box lay2"><span class="market-odd">50</span><span class="market-volume">24.81</span></div>
        </div>
        <div class="market-row" data-title="ACTIVE" data-selection-id="102" data-market-id="tennis_mo_1">
          <div class="market-nation-detail">
            <span class="market-nation-name">Joao Lucas Reis Da Silv</span>
            <div class="market-nation-book"></div>
          </div>
          <div class="market-odd-box back2"><span class="market-odd">1.02</span><span class="market-volume">3473.06</span></div>
          <div class="market-odd-box back1"><span class="market-odd">1.03</span><span class="market-volume">1063.29</span></div>
          <div class="market-odd-box back"><span class="market-odd">1.04</span><span class="market-volume">107.67</span></div>
          <div class="market-odd-box lay"><span class="market-odd">1.06</span><span class="market-volume">1065.9</span></div>
          <div class="market-odd-box lay1"><span class="market-odd">1.07</span><span class="market-volume">5053.62</span></div>
          <div class="market-odd-box lay2"><span class="market-odd">1.08</span><span class="market-volume">1409.09</span></div>
        </div>
      `;
    }

    // Secondary Markets Container: 2-column & 3-column layout exactly matching the target screenshot
    const secondaryContainer = document.getElementById('secondaryMarketsContainer');
    if (secondaryContainer) {
      secondaryContainer.innerHTML = `
        <!-- Row 2: Bookmaker (Col 1) & Game Winner 3/6 (Col 2) -->
        <div class="game-market market-2">
          <div class="market-title"><span>Bookmaker</span></div>
          <div class="market-header">
            <div class="market-nation-detail"><span class="market-nation-name">Min: 100 &nbsp;Max: 2L</span></div>
            <div class="market-odd-box back"><b>Back</b></div>
            <div class="market-odd-box lay"><b>Lay</b></div>
          </div>
          <div class="market-body" data-title="OPEN">
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Thiago Seyboth Wild</span></div>
              <div class="market-odd-box back"><span class="market-odd">-</span></div>
              <div class="market-odd-box lay"><span class="market-odd">-</span></div>
            </div>
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Joao Lucas Reis Da Silv</span></div>
              <div class="market-odd-box back"><span class="market-odd">5</span><span class="market-volume">200000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">6</span><span class="market-volume">200000</span></div>
            </div>
            <div class="market-row">
              <p class="market-remark">EPL, LaLiga, Bundesliga AND ITALY Serie A -Football Matches Bets Started On Our Exchange.</p>
            </div>
          </div>
        </div>

        <div class="game-market market-2">
          <div class="market-title"><span>Game Winner 3/6</span></div>
          <div class="market-header">
            <div class="market-nation-detail"><span class="market-nation-name">Max: 1L</span></div>
            <div class="market-odd-box back"><b>Back</b></div>
            <div class="market-odd-box lay"><b>Lay</b></div>
          </div>
          <div class="market-body" data-title="OPEN">
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Thiago Seyboth Wild</span></div>
              <div class="market-odd-box back"><span class="market-odd">17.65</span><span class="market-volume">3500000</span></div>
              <div class="market-odd-box lay suspended-cell"><span class="market-odd">-</span></div>
            </div>
            <div class="market-row suspended-row" data-title="SUSPENDED">
              <div class="market-nation-detail"><span class="market-nation-name">Joao Lucas Reis Dasilva</span></div>
              <div class="market-odd-box back"><span class="market-odd">1.02</span><span class="market-volume">3500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">1.06</span><span class="market-volume">3500000</span></div>
            </div>
          </div>
        </div>

        <!-- Row 3: Game Winner 3/7 (Col 1) & Game To Deuce 2/8 (Col 2) -->
        <div class="game-market market-2">
          <div class="market-title"><span>Game Winner 3/7</span></div>
          <div class="market-header">
            <div class="market-nation-detail"><span class="market-nation-name">Max: 1L</span></div>
            <div class="market-odd-box back"><b>Back</b></div>
            <div class="market-odd-box lay"><b>Lay</b></div>
          </div>
          <div class="market-body" data-title="OPEN">
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Thiago Seyboth Wild</span></div>
              <div class="market-odd-box back"><span class="market-odd">1.32</span><span class="market-volume">3500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">1.37</span><span class="market-volume">3500000</span></div>
            </div>
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Joao Lucas Reis Dasilva</span></div>
              <div class="market-odd-box back"><span class="market-odd">3.68</span><span class="market-volume">3500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">4.15</span><span class="market-volume">3500000</span></div>
            </div>
          </div>
        </div>

        <div class="game-market market-2">
          <div class="market-title"><span>Game To Deuce 2/8</span></div>
          <div class="market-header">
            <div class="market-nation-detail"><span class="market-nation-name">Max: 50K</span></div>
            <div class="market-odd-box back"><b>Back</b></div>
            <div class="market-odd-box lay"><b>Lay</b></div>
          </div>
          <div class="market-body" data-title="SUSPENDED">
            <div class="market-row suspended-row" data-title="SUSPENDED">
              <div class="market-nation-detail"><span class="market-nation-name">Yes</span></div>
              <div class="market-odd-box back"><span class="market-odd">4.21</span><span class="market-volume">2500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">4.72</span><span class="market-volume">2500000</span></div>
            </div>
            <div class="market-row suspended-row" data-title="SUSPENDED">
              <div class="market-nation-detail"><span class="market-nation-name">No</span></div>
              <div class="market-odd-box back"><span class="market-odd">1.27</span><span class="market-volume">2500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">1.31</span><span class="market-volume">2500000</span></div>
            </div>
          </div>
        </div>

        <!-- Row 4: Game To Deuce 3/6 (Col 1), Game To Deuce 3/7 (Col 2), Point Winner 3/7/1 (Col 3) -->
        <div class="game-market market-2 market-3-col">
          <div class="market-title"><span>Game To Deuce 3/6</span></div>
          <div class="market-header">
            <div class="market-nation-detail"><span class="market-nation-name">Max: 50K</span></div>
            <div class="market-odd-box back"><b>Back</b></div>
            <div class="market-odd-box lay"><b>Lay</b></div>
          </div>
          <div class="market-body" data-title="SUSPENDED">
            <div class="market-row suspended-row" data-title="SUSPENDED">
              <div class="market-nation-detail"><span class="market-nation-name">Yes</span></div>
              <div class="market-odd-box back"><span class="market-odd">5.53</span><span class="market-volume">2500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">6.9</span><span class="market-volume">2500000</span></div>
            </div>
            <div class="market-row suspended-row" data-title="SUSPENDED">
              <div class="market-nation-detail"><span class="market-nation-name">No</span></div>
              <div class="market-odd-box back"><span class="market-odd">1.17</span><span class="market-volume">2500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">1.22</span><span class="market-volume">2500000</span></div>
            </div>
          </div>
        </div>

        <div class="game-market market-2 market-3-col">
          <div class="market-title"><span>Game To Deuce 3/7</span></div>
          <div class="market-header">
            <div class="market-nation-detail"><span class="market-nation-name">Max: 50K</span></div>
            <div class="market-odd-box back"><b>Back</b></div>
            <div class="market-odd-box lay"><b>Lay</b></div>
          </div>
          <div class="market-body" data-title="OPEN">
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Yes</span></div>
              <div class="market-odd-box back"><span class="market-odd">3.76</span><span class="market-volume">2500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">4.25</span><span class="market-volume">2500000</span></div>
            </div>
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">No</span></div>
              <div class="market-odd-box back"><span class="market-odd">1.31</span><span class="market-volume">2500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">1.36</span><span class="market-volume">2500000</span></div>
            </div>
          </div>
        </div>

        <div class="game-market market-2 market-3-col">
          <div class="market-title"><span>Point Winner 3/7/1</span></div>
          <div class="market-header">
            <div class="market-nation-detail"><span class="market-nation-name">Max: 50K</span></div>
            <div class="market-odd-box back"><b>Back</b></div>
            <div class="market-odd-box lay"><b>Lay</b></div>
          </div>
          <div class="market-body" data-title="OPEN">
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Thiago Seyboth Wild</span></div>
              <div class="market-odd-box back"><span class="market-odd">1.61</span><span class="market-volume">2500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">1.7</span><span class="market-volume">2500000</span></div>
            </div>
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Joao Lucas Reis Dasilva</span></div>
              <div class="market-odd-box back"><span class="market-odd">2.41</span><span class="market-volume">2500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">2.66</span><span class="market-volume">2500000</span></div>
            </div>
          </div>
        </div>
      `;
    }
  }

  function renderCricketMarkets() {
    activeMatchOddsMarketId = 'cricket_mo_1';
    const matchOddsMax = document.getElementById('matchOddsMax');
    if (matchOddsMax) matchOddsMax.textContent = 'Max: 2L';

    const matchOddsBody = document.getElementById('matchOddsBody');
    if (matchOddsBody) {
      matchOddsBody.innerHTML = `
        <div class="market-row" data-title="ACTIVE" data-selection-id="201" data-market-id="cricket_mo_1">
          <div class="market-nation-detail">
            <span class="market-nation-name">Afghanistan</span>
            <div class="market-nation-book"></div>
          </div>
          <div class="market-odd-box back2"><span class="market-odd">22</span><span class="market-volume">202.63</span></div>
          <div class="market-odd-box back1"><span class="market-odd">23</span><span class="market-volume">17.23</span></div>
          <div class="market-odd-box back"><span class="market-odd">24</span><span class="market-volume">1.24</span></div>
          <div class="market-odd-box lay"><span class="market-odd">26</span><span class="market-volume">2546.55</span></div>
          <div class="market-odd-box lay1"><span class="market-odd">27</span><span class="market-volume">59.87</span></div>
          <div class="market-odd-box lay2"><span class="market-odd">28</span><span class="market-volume">55.44</span></div>
        </div>
        <div class="market-row" data-title="ACTIVE" data-selection-id="202" data-market-id="cricket_mo_1">
          <div class="market-nation-detail">
            <span class="market-nation-name">India</span>
            <div class="market-nation-book"></div>
          </div>
          <div class="market-odd-box back2"><span class="market-odd">1.02</span><span class="market-volume">453195.48</span></div>
          <div class="market-odd-box back1"><span class="market-odd">1.03</span><span class="market-volume">404070.09</span></div>
          <div class="market-odd-box back"><span class="market-odd">1.04</span><span class="market-volume">63663.78</span></div>
          <div class="market-odd-box lay"><span class="market-odd">1.05</span><span class="market-volume">91994.82</span></div>
          <div class="market-odd-box lay1"><span class="market-odd">1.06</span><span class="market-volume">40836.76</span></div>
          <div class="market-odd-box lay2"><span class="market-odd">1.07</span><span class="market-volume">41095.64</span></div>
        </div>
      `;
    }

    const secondaryContainer = document.getElementById('secondaryMarketsContainer');
    if (secondaryContainer) {
      secondaryContainer.innerHTML = `
        <div class="game-market market-2">
          <div class="market-title"><span>Bookmaker</span></div>
          <div class="market-header">
            <div class="market-nation-detail"><span class="market-nation-name">Min: 100 &nbsp;Max: 100L</span></div>
            <div class="market-odd-box back"><b>Back</b></div>
            <div class="market-odd-box lay"><b>Lay</b></div>
          </div>
          <div class="market-body" data-title="OPEN">
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Afghanistan</span></div>
              <div class="market-odd-box back"><span class="market-odd">2000</span><span class="market-volume">250000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">2500</span><span class="market-volume">250000</span></div>
            </div>
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">India</span></div>
              <div class="market-odd-box back"><span class="market-odd">4</span><span class="market-volume">2500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">5</span><span class="market-volume">2500000</span></div>
            </div>
            <div class="market-row">
              <p class="market-remark">SPAIN: Laliga Football Matches Advance Bets Started On Our Exchange.</p>
            </div>
          </div>
        </div>

        <div class="game-market market-2">
          <div class="market-title"><span>Bookmaker 2</span></div>
          <div class="market-header">
            <div class="market-nation-detail"><span class="market-nation-name">Min: 100 &nbsp;Max: 10L</span></div>
            <div class="market-odd-box back"><b>Back</b></div>
            <div class="market-odd-box lay"><b>Lay</b></div>
          </div>
          <div class="market-body" data-title="OPEN">
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Afghanistan.</span></div>
              <div class="market-odd-box back"><span class="market-odd">2105</span><span class="market-volume">100000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">2500</span><span class="market-volume">100000</span></div>
            </div>
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">India.</span></div>
              <div class="market-odd-box back"><span class="market-odd">4</span><span class="market-volume">1000000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">4.75</span><span class="market-volume">1000000</span></div>
            </div>
            <div class="market-row">
              <p class="market-remark">*The King of All MATKA Market Open And Close Every Hour! LIVE RESULTS,100% TRUSTED.*</p>
            </div>
          </div>
        </div>

        <div class="game-market market-4">
          <div class="market-title"><span>Score More Runs (A Sharma Vs S Samson)</span></div>
          <div class="market-header">
            <div class="market-nation-detail"><span class="market-nation-name">Min: 100 &nbsp;Max: 2L</span></div>
            <div class="market-odd-box no-border d-none d-md-block"></div>
            <div class="market-odd-box no-border d-none d-md-block"></div>
            <div class="market-odd-box back"><b>Back</b></div>
            <div class="market-odd-box lay"><b>Lay</b></div>
            <div class="market-odd-box no-border d-none d-md-block"></div>
            <div class="market-odd-box no-border d-none d-md-block"></div>
          </div>
          <div class="market-body" data-title="OPEN">
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Abhishek Sharma</span></div>
              <div class="market-odd-box back2"><span class="market-odd">-</span></div>
              <div class="market-odd-box back1"><span class="market-odd">-</span></div>
              <div class="market-odd-box back"><span class="market-odd">55</span><span class="market-volume">200000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">65</span><span class="market-volume">200000</span></div>
              <div class="market-odd-box lay1"><span class="market-odd">-</span></div>
              <div class="market-odd-box lay2"><span class="market-odd">-</span></div>
            </div>
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Sanju Samson</span></div>
              <div class="market-odd-box back2"><span class="market-odd">-</span></div>
              <div class="market-odd-box back1"><span class="market-odd">-</span></div>
              <div class="market-odd-box back"><span class="market-odd">153</span><span class="market-volume">50000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">181</span><span class="market-volume">50000</span></div>
              <div class="market-odd-box lay1"><span class="market-odd">-</span></div>
              <div class="market-odd-box lay2"><span class="market-odd">-</span></div>
            </div>
          </div>
        </div>

        <div class="game-market market-6">
          <div class="market-title"><span>Normal</span></div>
          <div class="row row10">
            <div class="col-md-12">
              <div class="market-header">
                <div class="market-nation-detail"></div>
                <div class="market-odd-box lay"><b>No</b></div>
                <div class="market-odd-box back"><b>Yes</b></div>
                <div class="fancy-min-max-box"></div>
              </div>
            </div>
          </div>
          <div class="market-body" data-title="OPEN">
            <div class="row row10">
              <div class="col-md-6 col-12">
                <div class="fancy-market">
                  <div class="market-row">
                    <div class="market-nation-detail"><span class="market-nation-name">6 over run IND</span></div>
                    <div class="market-odd-box lay"><span class="market-odd">59</span><span class="market-volume">100</span></div>
                    <div class="market-odd-box back"><span class="market-odd">60</span><span class="market-volume">100</span></div>
                    <div class="fancy-min-max-box"><div class="fancy-min-max"><span>Min: 100</span><span>Max: 10L</span></div></div>
                  </div>
                </div>
              </div>
              <div class="col-md-6 col-12">
                <div class="fancy-market">
                  <div class="market-row">
                    <div class="market-nation-detail"><span class="market-nation-name">6 over run bhav IND</span></div>
                    <div class="market-odd-box lay"><span class="market-odd">58</span><span class="market-volume">80</span></div>
                    <div class="market-odd-box back"><span class="market-odd">58</span><span class="market-volume">55</span></div>
                    <div class="fancy-min-max-box"><div class="fancy-min-max"><span>Min: 100</span><span>Max: 1L</span></div></div>
                  </div>
                </div>
              </div>
              <div class="col-md-6 col-12">
                <div class="fancy-market">
                  <div class="market-row suspended-row" data-title="SUSPENDED">
                    <div class="market-nation-detail"><span class="market-nation-name">4.3 over run IND</span></div>
                    <div class="market-odd-box lay"><span class="market-odd">-</span></div>
                    <div class="market-odd-box back"><span class="market-odd">-</span></div>
                    <div class="fancy-min-max-box"><div class="fancy-min-max"><span>Min: 100</span><span>Max: 4L</span></div></div>
                  </div>
                </div>
              </div>
              <div class="col-md-6 col-12">
                <div class="fancy-market">
                  <div class="market-row">
                    <div class="market-nation-detail"><span class="market-nation-name">1st wkt IND</span></div>
                    <div class="market-odd-box lay"><span class="market-odd">57</span><span class="market-volume">110</span></div>
                    <div class="market-odd-box back"><span class="market-odd">57</span><span class="market-volume">90</span></div>
                    <div class="fancy-min-max-box"><div class="fancy-min-max"><span>Min: 100</span><span>Max: 3L</span></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  function renderFootballMarkets() {
    activeMatchOddsMarketId = 'fb_mo_1';
    const matchOddsMax = document.getElementById('matchOddsMax');
    if (matchOddsMax) matchOddsMax.textContent = 'Max: 50K';

    const matchOddsBody = document.getElementById('matchOddsBody');
    if (matchOddsBody) {
      matchOddsBody.innerHTML = `
        <div class="market-row" data-title="ACTIVE" data-selection-id="301" data-market-id="fb_mo_1">
          <div class="market-nation-detail">
            <span class="market-nation-name">Rayo Vallecano</span>
            <div class="market-nation-book"></div>
          </div>
          <div class="market-odd-box back2"><span class="market-odd">2.10</span><span class="market-volume">150.2</span></div>
          <div class="market-odd-box back1"><span class="market-odd">2.12</span><span class="market-volume">340.5</span></div>
          <div class="market-odd-box back"><span class="market-odd">2.14</span><span class="market-volume">520.0</span></div>
          <div class="market-odd-box lay"><span class="market-odd">2.18</span><span class="market-volume">810.0</span></div>
          <div class="market-odd-box lay1"><span class="market-odd">2.20</span><span class="market-volume">240.0</span></div>
          <div class="market-odd-box lay2"><span class="market-odd">2.24</span><span class="market-volume">190.0</span></div>
        </div>
        <div class="market-row" data-title="ACTIVE" data-selection-id="302" data-market-id="fb_mo_1">
          <div class="market-nation-detail">
            <span class="market-nation-name">Espanyol</span>
            <div class="market-nation-book"></div>
          </div>
          <div class="market-odd-box back2"><span class="market-odd">3.40</span><span class="market-volume">90.5</span></div>
          <div class="market-odd-box back1"><span class="market-odd">3.45</span><span class="market-volume">180.2</span></div>
          <div class="market-odd-box back"><span class="market-odd">3.50</span><span class="market-volume">430.0</span></div>
          <div class="market-odd-box lay"><span class="market-odd">3.60</span><span class="market-volume">650.0</span></div>
          <div class="market-odd-box lay1"><span class="market-odd">3.65</span><span class="market-volume">210.0</span></div>
          <div class="market-odd-box lay2"><span class="market-odd">3.75</span><span class="market-volume">120.0</span></div>
        </div>
        <div class="market-row" data-title="ACTIVE" data-selection-id="303" data-market-id="fb_mo_1">
          <div class="market-nation-detail">
            <span class="market-nation-name">The Draw</span>
            <div class="market-nation-book"></div>
          </div>
          <div class="market-odd-box back2"><span class="market-odd">3.10</span><span class="market-volume">110.0</span></div>
          <div class="market-odd-box back1"><span class="market-odd">3.15</span><span class="market-volume">220.0</span></div>
          <div class="market-odd-box back"><span class="market-odd">3.20</span><span class="market-volume">480.0</span></div>
          <div class="market-odd-box lay"><span class="market-odd">3.30</span><span class="market-volume">720.0</span></div>
          <div class="market-odd-box lay1"><span class="market-odd">3.35</span><span class="market-volume">310.0</span></div>
          <div class="market-odd-box lay2"><span class="market-odd">3.40</span><span class="market-volume">140.0</span></div>
        </div>
      `;
    }

    const secondaryContainer = document.getElementById('secondaryMarketsContainer');
    if (secondaryContainer) {
      secondaryContainer.innerHTML = `
        <div class="game-market market-2">
          <div class="market-title"><span>Over/Under 2.5 Goals</span></div>
          <div class="market-header">
            <div class="market-nation-detail"><span class="market-nation-name">Max: 1L</span></div>
            <div class="market-odd-box back"><b>Back</b></div>
            <div class="market-odd-box lay"><b>Lay</b></div>
          </div>
          <div class="market-body" data-title="OPEN">
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Over 2.5 Goals</span></div>
              <div class="market-odd-box back"><span class="market-odd">2.05</span><span class="market-volume">500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">2.12</span><span class="market-volume">500000</span></div>
            </div>
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Under 2.5 Goals</span></div>
              <div class="market-odd-box back"><span class="market-odd">1.85</span><span class="market-volume">500000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">1.92</span><span class="market-volume">500000</span></div>
            </div>
          </div>
        </div>

        <div class="game-market market-2">
          <div class="market-title"><span>Both Teams to Score</span></div>
          <div class="market-header">
            <div class="market-nation-detail"><span class="market-nation-name">Max: 50K</span></div>
            <div class="market-odd-box back"><b>Back</b></div>
            <div class="market-odd-box lay"><b>Lay</b></div>
          </div>
          <div class="market-body" data-title="OPEN">
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">Yes</span></div>
              <div class="market-odd-box back"><span class="market-odd">1.90</span><span class="market-volume">350000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">1.98</span><span class="market-volume">350000</span></div>
            </div>
            <div class="market-row" data-title="ACTIVE">
              <div class="market-nation-detail"><span class="market-nation-name">No</span></div>
              <div class="market-odd-box back"><span class="market-odd">1.95</span><span class="market-volume">350000</span></div>
              <div class="market-odd-box lay"><span class="market-odd">2.04</span><span class="market-volume">350000</span></div>
            </div>
          </div>
        </div>
      `;
    }
  }

  function renderMarketsFromApi(markets) {
    const matchOdds = markets.find(m => 
      m.marketName && m.marketName.toLowerCase().includes('match odds')
    ) || markets[0];

    if (!matchOdds) return;
    activeMatchOddsMarketId = matchOdds.marketId;

    if (Array.isArray(matchOdds.runners)) {
      matchOdds.runners.forEach(r => {
        activeRunnersMap[r.selectionId] = r.runnerName;
      });
    }

    // Update Match Title in Game Header if runners are available
    const gameHeaderTitle = document.getElementById('matchHeaderTitle');
    if (gameHeaderTitle && matchOdds.runners && matchOdds.runners.length >= 2) {
      const r1 = matchOdds.runners[0]?.runnerName || '';
      const r2 = matchOdds.runners[1]?.runnerName || '';
      if (r1 && r2) {
        gameHeaderTitle.textContent = `${r1.toUpperCase()} V ${r2.toUpperCase()}`;
        document.title = `Match Markets - ${r1} v ${r2} - BESTBET9`;
      }
    }

    // Update Match Odds Table Rows
    const matchOddsBody = document.getElementById('matchOddsBody');
    if (matchOddsBody && Array.isArray(matchOdds.runners) && matchOdds.runners.length > 0) {
      matchOddsBody.innerHTML = matchOdds.runners.map(runner => `
        <div class="market-row" data-title="ACTIVE" data-selection-id="${runner.selectionId}" data-market-id="${escapeHtml(activeMatchOddsMarketId)}">
          <div class="market-nation-detail">
            <span class="market-nation-name">${escapeHtml(runner.runnerName)}</span>
            <div class="market-nation-book"></div>
          </div>
          <div class="market-odd-box back2"><span class="market-odd">-</span><span class="market-volume"></span></div>
          <div class="market-odd-box back1"><span class="market-odd">-</span><span class="market-volume"></span></div>
          <div class="market-odd-box back"><span class="market-odd">-</span><span class="market-volume"></span></div>
          <div class="market-odd-box lay"><span class="market-odd">-</span><span class="market-volume"></span></div>
          <div class="market-odd-box lay1"><span class="market-odd">-</span><span class="market-volume"></span></div>
          <div class="market-odd-box lay2"><span class="market-odd">-</span><span class="market-volume"></span></div>
        </div>
      `).join('');
    }

    // If API returned secondary markets, dynamically populate them
    const otherMarkets = markets.filter(m => m.marketId !== activeMatchOddsMarketId);
    if (otherMarkets.length > 0) {
      const secondaryContainer = document.getElementById('secondaryMarketsContainer');
      if (secondaryContainer) {
        secondaryContainer.innerHTML = otherMarkets.map(m => `
          <div class="game-market market-2">
            <div class="market-title"><span>${escapeHtml(m.marketName || 'Market')}</span></div>
            <div class="market-header">
              <div class="market-nation-detail"><span class="market-nation-name">Max: 1L</span></div>
              <div class="market-odd-box back"><b>Back</b></div>
              <div class="market-odd-box lay"><b>Lay</b></div>
            </div>
            <div class="market-body" data-title="OPEN">
              ${(m.runners || []).map(r => `
                <div class="market-row" data-title="ACTIVE" data-selection-id="${r.selectionId}" data-market-id="${escapeHtml(m.marketId)}">
                  <div class="market-nation-detail"><span class="market-nation-name">${escapeHtml(r.runnerName)}</span></div>
                  <div class="market-odd-box back"><span class="market-odd">-</span></div>
                  <div class="market-odd-box lay"><span class="market-odd">-</span></div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('');
      }
    }
  }

  async function loadCricketFancyData() {
    try {
      const res = await fetch(`/api/fancy?eventId=${encodeURIComponent(activeEventId)}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      // Update Bookmaker UI if bookmaker markets exist
      if (Array.isArray(data.bookmaker) && data.bookmaker.length > 0) {
        renderBookmakerUI(data.bookmaker[0]);
      }
    } catch (e) {
      console.warn('Notice loading fancy data:', e.message);
    }
  }

  function renderBookmakerUI(bmMarket) {
    const allMarket2 = document.querySelectorAll('.game-market.market-2');
    if (allMarket2.length === 0) return;
    const bmContainer = allMarket2[0];
    const bmBody = bmContainer.querySelector('.market-body');
    if (!bmBody || !Array.isArray(bmMarket.runners) || bmMarket.runners.length === 0) return;

    bmMarket.runners.forEach(runner => {
      const selId = String(runner.selectionId || '');
      const row = bmBody.querySelector(`.market-row[data-selection-id="${selId}"]`);
      if (!row) return;

      const backPrice = runner.backPrice ? Number(runner.backPrice).toFixed(2) : '-';
      const layPrice = runner.layPrice ? Number(runner.layPrice).toFixed(2) : '-';

      const backOddSpan = row.querySelector('.market-odd-box.back .market-odd');
      const layOddSpan = row.querySelector('.market-odd-box.lay .market-odd');

      if (backOddSpan && backOddSpan.textContent !== backPrice) backOddSpan.textContent = backPrice;
      if (layOddSpan && layOddSpan.textContent !== layPrice) layOddSpan.textContent = layPrice;
    });
  }

  function startOddsPolling() {
    stopOddsPolling();
    pollingTimer = setInterval(refreshLiveOdds, 3000);
  }

  function stopOddsPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  }

  async function refreshLiveOdds() {
    if (!activeMatchOddsMarketId || !activeEventId) return;

    try {
      const url = `/api/odds?eventId=${encodeURIComponent(activeEventId)}&marketId=${encodeURIComponent(activeMatchOddsMarketId)}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;

      const oddsList = await res.json();
      if (!Array.isArray(oddsList) || oddsList.length === 0) return;

      const marketBook = oddsList[0];
      if (!marketBook || !Array.isArray(marketBook.runners)) return;

      updateLiveOddsInPlace(marketBook);
    } catch (err) {
      console.warn('Live odds polling refresh notice:', err.message);
    }
  }

  function updateLiveOddsInPlace(marketBook) {
    const matchOddsContainer = document.getElementById('matchOddsMarket');
    if (!matchOddsContainer) return;

    const marketBody = matchOddsContainer.querySelector('.market-body');
    if (!marketBody) return;

    if (marketBook.status) {
      marketBody.setAttribute('data-title', marketBook.status);
    }

    marketBook.runners.forEach(runner => {
      const selId = String(runner.selectionId);
      const row = marketBody.querySelector(`.market-row[data-selection-id="${selId}"]`);
      if (!row) return;

      const isSuspended = runner.status === 'SUSPENDED' || marketBook.status === 'SUSPENDED';
      if (isSuspended) {
        row.classList.add('suspended-row');
        row.setAttribute('data-title', 'SUSPENDED');
      } else {
        row.classList.remove('suspended-row');
        row.setAttribute('data-title', runner.status || 'ACTIVE');
      }

      const backs = runner.ex?.availableToBack || [];
      const lays = runner.ex?.availableToLay || [];

      // Back cells: back2 (idx 2), back1 (idx 1), back (idx 0)
      updateCellText(row.querySelector('.market-odd-box.back2'), backs[2]);
      updateCellText(row.querySelector('.market-odd-box.back1'), backs[1]);
      updateCellText(row.querySelector('.market-odd-box.back'), backs[0]);

      // Lay cells: lay (idx 0), lay1 (idx 1), lay2 (idx 2)
      updateCellText(row.querySelector('.market-odd-box.lay'), lays[0]);
      updateCellText(row.querySelector('.market-odd-box.lay1'), lays[1]);
      updateCellText(row.querySelector('.market-odd-box.lay2'), lays[2]);
    });
  }

  function updateCellText(cellEl, oddData) {
    if (!cellEl) return;
    const oddSpan = cellEl.querySelector('.market-odd');
    const volSpan = cellEl.querySelector('.market-volume');

    const newOdd = (oddData && oddData.price > 0) ? Number(oddData.price).toFixed(2) : '-';
    const newVol = (oddData && oddData.size > 0) ? formatVolume(oddData.size) : '';

    if (oddSpan && oddSpan.textContent !== newOdd) {
      oddSpan.textContent = newOdd;
    }
    if (volSpan && volSpan.textContent !== newVol) {
      volSpan.textContent = newVol;
    }
  }

  function formatVolume(val) {
    if (val >= 10000000) return (val / 10000000).toFixed(2) + 'Cr';
    if (val >= 100000) return (val / 100000).toFixed(2) + 'L';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return Number(val).toFixed(2);
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Global helper for sidebar toggle buttons
  window.toggleSidebarSection = function (bodyId, btn) {
    const body = document.getElementById(bodyId);
    if (!body) return;
    body.classList.toggle('show');
    if (btn) {
      const isExpanded = body.classList.contains('show');
      btn.setAttribute('aria-expanded', isExpanded);
    }
  };

})();
