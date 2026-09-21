/**
 * BESTBET9 - Match Details & Live Odds Polling Controller
 * Connects SportBex API to existing match details, odds, bookmaker, and fancy UI.
 * 
 * STRICT RULES APPLIED:
 * - 0% UI / design changes.
 * - In-place text node updates only (anti-flicker).
 * - Zero DOM rebuilds during polling cycles.
 * - Stops polling when leaving the page.
 */

(function () {
  let pollingTimer = null;
  let activeEventId = null;
  let activeSportId = '4';
  let activeMatchOddsMarketId = null;
  let activeRunnersMap = {}; // selectionId -> runnerName

  document.addEventListener('DOMContentLoaded', () => {
    initMatchDetails();
  });

  function initMatchDetails() {
    parseUrlParams();
    if (!activeEventId) {
      // If on game-details page without specific ID, try extracting from title or default
      const defaultId = '33145920';
      activeEventId = defaultId;
    }

    loadMatchData();

    // Clean up polling on navigation away
    window.addEventListener('beforeunload', stopOddsPolling);
    window.addEventListener('pagehide', stopOddsPolling);
  }

  function parseUrlParams() {
    try {
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      // e.g. /game-details/4/33145920 or /game-details/33145920
      if (pathParts.length >= 3 && pathParts[0] === 'game-details') {
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

  async function loadMatchData() {
    if (!activeEventId) return;

    try {
      // 1. Fetch market list
      const res = await fetch(`/api/markets?eventId=${encodeURIComponent(activeEventId)}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Markets status ${res.status}`);
      }
      const markets = await res.json();
      if (Array.isArray(markets) && markets.length > 0) {
        renderMarketsUI(markets);
      }

      // 2. Fetch Cricket Bookmaker and Fancy if Cricket (sportId === 4)
      if (activeSportId === '4') {
        loadCricketFancyData();
      }

      // 3. Fetch initial live odds and start polling
      if (activeMatchOddsMarketId) {
        await refreshLiveOdds();
        startOddsPolling();
      }
    } catch (err) {
      console.warn('SportBex match data loading notice:', err.message);
    }
  }

  function renderMarketsUI(markets) {
    // Find Match Odds market
    const matchOdds = markets.find(m => 
      m.marketName && m.marketName.toLowerCase().includes('match odds')
    ) || markets[0];

    if (!matchOdds) return;
    activeMatchOddsMarketId = matchOdds.marketId;

    // Cache runners map
    if (Array.isArray(matchOdds.runners)) {
      matchOdds.runners.forEach(r => {
        activeRunnersMap[r.selectionId] = r.runnerName;
      });
    }

    // Update Match Title in Game Header if runners are available
    const gameHeaderTitle = document.querySelector('.game-header span:first-child');
    if (gameHeaderTitle && matchOdds.runners && matchOdds.runners.length >= 2) {
      const r1 = matchOdds.runners[0]?.runnerName || '';
      const r2 = matchOdds.runners[1]?.runnerName || '';
      if (r1 && r2) {
        gameHeaderTitle.textContent = `${r1} v ${r2}`;
        document.title = `Match Markets - ${r1} v ${r2} - BESTBET9`;
      }
    }

    // Update Match Odds Table Rows
    const matchOddsContainer = document.querySelector('.game-market.market-4');
    if (!matchOddsContainer) return;

    const marketBody = matchOddsContainer.querySelector('.market-body');
    if (!marketBody || !Array.isArray(matchOdds.runners) || matchOdds.runners.length === 0) return;

    // Render runner rows matching existing HTML format exactly
    marketBody.innerHTML = matchOdds.runners.map(runner => `
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

      // Update Fancy UI if fancy markets exist
      if (Array.isArray(data.fancy) && data.fancy.length > 0) {
        renderFancyUI(data.fancy);
      }
    } catch (e) {
      console.warn('Notice loading fancy data:', e.message);
    }
  }

  function renderBookmakerUI(bmMarket) {
    const allMarket4 = document.querySelectorAll('.game-market.market-4');
    if (allMarket4.length < 2) return;
    const bmContainer = allMarket4[1]; // Second market-4 is Bookmaker
    const bmBody = bmContainer.querySelector('.market-body');
    if (!bmBody || !Array.isArray(bmMarket.runners) || bmMarket.runners.length === 0) return;

    // If rows already exist, update in-place without rebuilding DOM
    const existingRows = bmBody.querySelectorAll('.market-row[data-selection-id]');
    if (existingRows.length > 0) {
      updateBookmakerInPlace(bmBody, bmMarket);
      return;
    }

    // Initial render only
    bmBody.innerHTML = bmMarket.runners.map(runner => {
      const selId = runner.selectionId || '';
      const rName = runner.runnerName || activeRunnersMap[selId] || 'Selection';
      const backPrice = runner.backPrice ? Number(runner.backPrice).toFixed(2) : '-';
      const layPrice = runner.layPrice ? Number(runner.layPrice).toFixed(2) : '-';

      return `
        <div class="market-row" data-title="${runner.status || 'ACTIVE'}" data-selection-id="${escapeHtml(String(selId))}">
          <div class="market-nation-detail">
            <span class="market-nation-name">${escapeHtml(rName)}</span>
            <div class="market-nation-book"></div>
          </div>
          <div class="market-odd-box back2"><span class="market-odd">-</span></div>
          <div class="market-odd-box back1"><span class="market-odd">-</span></div>
          <div class="market-odd-box back"><span class="market-odd">${backPrice}</span></div>
          <div class="market-odd-box lay"><span class="market-odd">${layPrice}</span></div>
          <div class="market-odd-box lay1"><span class="market-odd">-</span></div>
          <div class="market-odd-box lay2"><span class="market-odd">-</span></div>
        </div>
      `;
    }).join('');
  }

  function updateBookmakerInPlace(bmBody, bmMarket) {
    if (bmMarket.status) {
      bmBody.setAttribute('data-title', bmMarket.status);
    }

    bmMarket.runners.forEach(runner => {
      const selId = String(runner.selectionId || '');
      const row = bmBody.querySelector(`.market-row[data-selection-id="${selId}"]`);
      if (!row) return;

      const isSuspended = runner.status === 'SUSPENDED' || bmMarket.status === 'SUSPENDED';
      if (isSuspended) {
        row.classList.add('suspended-row');
        row.setAttribute('data-title', 'SUSPENDED');
      } else {
        row.classList.remove('suspended-row');
        row.setAttribute('data-title', runner.status || 'ACTIVE');
      }

      const backPrice = runner.backPrice ? Number(runner.backPrice).toFixed(2) : '-';
      const layPrice = runner.layPrice ? Number(runner.layPrice).toFixed(2) : '-';

      const backOddSpan = row.querySelector('.market-odd-box.back .market-odd');
      const layOddSpan = row.querySelector('.market-odd-box.lay .market-odd');

      if (backOddSpan && backOddSpan.textContent !== backPrice) {
        backOddSpan.textContent = backPrice;
      }
      if (layOddSpan && layOddSpan.textContent !== layPrice) {
        layOddSpan.textContent = layPrice;
      }
    });
  }

  function renderFancyUI(fancyList) {
    const fancyContainer = document.querySelector('.game-market.market-6');
    if (!fancyContainer) return;
    const fancyBody = fancyContainer.querySelector('.market-body');
    if (!fancyBody) return;

    // If rows already exist, update in-place without rebuilding DOM
    const existingFancyMarkets = fancyBody.querySelectorAll('.fancy-market');
    if (existingFancyMarkets.length > 0) {
      updateFancyInPlace(fancyBody, fancyList);
      return;
    }

    // Initial render only
    fancyBody.innerHTML = `
      <div class="row row10">
        <div class="col-md-12">
          ${fancyList.map(item => {
            const name = item.marketName || 'Session';
            const runsNo = item.runsNo !== undefined ? item.runsNo : (item.noPrice !== undefined ? item.noPrice : '-');
            const runsYes = item.runsYes !== undefined ? item.runsYes : (item.yesPrice !== undefined ? item.yesPrice : '-');
            const isSuspended = item.status === 'SUSPENDED';

            return `
              <div class="fancy-market ${isSuspended ? 'suspended-row' : ''}" data-title="${item.status || 'OPEN'}" data-market-id="${escapeHtml(String(item.marketId || ''))}">
                <div class="market-row">
                  <div class="market-nation-detail">
                    <span class="market-nation-name">${escapeHtml(name)}</span>
                  </div>
                  <div class="market-odd-box lay"><span class="market-odd">${runsNo}</span></div>
                  <div class="market-odd-box back"><span class="market-odd">${runsYes}</span></div>
                  <div class="fancy-min-max-box">
                    <div class="fancy-min-max">
                      <span class="w-100 d-block">Min: ${item.min || 100}</span>
                      <span class="w-100 d-block">Max: ${item.max ? (item.max >= 1000 ? (item.max / 1000) + 'K' : item.max) : '25K'}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function updateFancyInPlace(fancyBody, fancyList) {
    fancyList.forEach(item => {
      const mId = String(item.marketId || '');
      const name = item.marketName || '';

      let el = mId ? fancyBody.querySelector(`.fancy-market[data-market-id="${mId}"]`) : null;
      if (!el && name) {
        const allNationNames = fancyBody.querySelectorAll('.fancy-market .market-nation-name');
        for (const span of allNationNames) {
          if (span.textContent.trim() === name.trim()) {
            el = span.closest('.fancy-market');
            break;
          }
        }
      }
      if (!el) return;

      const isSuspended = item.status === 'SUSPENDED';
      if (isSuspended) {
        el.classList.add('suspended-row');
        el.setAttribute('data-title', 'SUSPENDED');
      } else {
        el.classList.remove('suspended-row');
        el.setAttribute('data-title', item.status || 'OPEN');
      }

      const runsNo = item.runsNo !== undefined ? String(item.runsNo) : (item.noPrice !== undefined ? String(item.noPrice) : '-');
      const runsYes = item.runsYes !== undefined ? String(item.runsYes) : (item.yesPrice !== undefined ? String(item.yesPrice) : '-');

      const noOddSpan = el.querySelector('.market-odd-box.lay .market-odd');
      const yesOddSpan = el.querySelector('.market-odd-box.back .market-odd');

      if (noOddSpan && noOddSpan.textContent !== runsNo) {
        noOddSpan.textContent = runsNo;
      }
      if (yesOddSpan && yesOddSpan.textContent !== runsYes) {
        yesOddSpan.textContent = runsYes;
      }

      if (item.min !== undefined || item.max !== undefined) {
        const minSpan = el.querySelector('.fancy-min-max span:first-child');
        const maxSpan = el.querySelector('.fancy-min-max span:last-child');
        const minText = `Min: ${item.min || 100}`;
        const maxText = `Max: ${item.max ? (item.max >= 1000 ? (item.max / 1000) + 'K' : item.max) : '25K'}`;
        if (minSpan && minSpan.textContent !== minText) minSpan.textContent = minText;
        if (maxSpan && maxSpan.textContent !== maxText) maxSpan.textContent = maxText;
      }
    });
  }

  async function refreshLiveOdds() {
    if (!activeEventId || !activeMatchOddsMarketId) return;

    try {
      const res = await fetch(`/api/odds?eventId=${encodeURIComponent(activeEventId)}&marketId=${encodeURIComponent(activeMatchOddsMarketId)}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const marketBooks = Array.isArray(data) ? data : (data ? [data] : []);
      if (marketBooks.length > 0) {
        updateLiveOddsInPlace(marketBooks[0]);
      }
    } catch (e) {
      // Silently ignore single poll network glitches to maintain smooth UX
    }
  }

  /**
   * ANTI-FLICKER IN-PLACE DOM UPDATE
   * Directly updates text content of existing cells without rebuilding elements.
   */
  function updateLiveOddsInPlace(marketBook) {
    if (!marketBook || !Array.isArray(marketBook.runners)) return;

    // Check market status
    const marketContainer = document.querySelector('.game-market.market-4');
    if (marketContainer) {
      const marketBody = marketContainer.querySelector('.market-body');
      if (marketBody && marketBook.status) {
        marketBody.setAttribute('data-title', marketBook.status);
      }
    }

    marketBook.runners.forEach(runner => {
      const row = document.querySelector(`.market-row[data-selection-id="${runner.selectionId}"]`);
      if (!row) return;

      // Handle suspended status
      if (runner.status === 'SUSPENDED' || marketBook.status === 'SUSPENDED') {
        row.classList.add('suspended-row');
        row.setAttribute('data-title', 'SUSPENDED');
      } else {
        row.classList.remove('suspended-row');
        row.setAttribute('data-title', runner.status || 'ACTIVE');
      }

      const ex = runner.ex || {};
      const backs = ex.availableToBack || [];
      const lays = ex.availableToLay || [];

      // Primary Back & Lay
      updateOddCell(row.querySelector('.market-odd-box.back'), backs[0]);
      updateOddCell(row.querySelector('.market-odd-box.lay'), lays[0]);

      // Depth Back & Lay
      updateOddCell(row.querySelector('.market-odd-box.back1'), backs[1]);
      updateOddCell(row.querySelector('.market-odd-box.lay1'), lays[1]);
      updateOddCell(row.querySelector('.market-odd-box.back2'), backs[2]);
      updateOddCell(row.querySelector('.market-odd-box.lay2'), lays[2]);
    });
  }

  function updateOddCell(cellEl, oddData) {
    if (!cellEl) return;
    const oddSpan = cellEl.querySelector('.market-odd');
    const volSpan = cellEl.querySelector('.market-volume');

    const newOddText = (oddData && oddData.price) ? Number(oddData.price).toFixed(2) : '-';
    const newVolText = (oddData && oddData.size) ? formatVolume(oddData.size) : '';

    if (oddSpan && oddSpan.textContent !== newOddText) {
      oddSpan.textContent = newOddText;
    }
    if (volSpan && volSpan.textContent !== newVolText) {
      volSpan.textContent = newVolText;
    }
  }

  function formatVolume(size) {
    const num = Number(size);
    if (!Number.isFinite(num) || num <= 0) return '';
    if (num >= 100000) return (num / 100000).toFixed(2) + 'L';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  function startOddsPolling() {
    stopOddsPolling();
    // 2.5 second polling interval as required (between 2 and 3 seconds)
    pollingTimer = setInterval(async () => {
      await refreshLiveOdds();
      if (activeSportId === '4') {
        loadCricketFancyData();
      }
    }, 2500);
  }

  function stopOddsPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
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

  window.initMatchDetails = initMatchDetails;
  window.stopOddsPolling = stopOddsPolling;
})();
