/**
 * BESTBET9 - Interactive Betslip Engine
 */

let activeBet = null;

document.addEventListener('DOMContentLoaded', () => {
  initBetslip();
});

function initBetslip() {
  renderMyBets();

  // Attach listeners to all odds cells on the page
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.odd-back, .odd-lay, .odd-box, .market-odd-box, .back, .lay, .back1, .back2, .lay1, .lay2');
    if (target && !target.classList.contains('no-border')) {
      handleOddsClick(target);
    }
  });
}

function renderMyBets() {
  const tbody = document.getElementById('myBetsTableBody');
  if (!tbody) return;

  let bets = [];
  try {
    const stored = localStorage.getItem('bestbet9_bets');
    if (stored) bets = JSON.parse(stored);
  } catch (e) {}

  if (bets.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted" style="padding: 14px; font-size: 13px;">No bets matched yet</td></tr>';
    return;
  }

  tbody.innerHTML = bets.map(b => `
    <tr style="background: ${b.betType === 'BACK' ? 'rgba(114, 187, 239, 0.15)' : 'rgba(250, 169, 186, 0.15)'}; border-bottom: 1px solid #dee2e6;">
      <td style="padding: 6px 8px; font-size: 12px;">
        <span style="display: inline-block; padding: 1px 4px; border-radius: 2px; font-size: 10px; font-weight: 700; color: #fff; background: ${b.betType === 'BACK' ? '#0088cc' : '#e40539'}; margin-right: 4px;">${b.betType}</span>
        <b>${b.runnerName}</b>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">${b.marketName}</div>
      </td>
      <td class="text-end" style="padding: 6px 8px; font-size: 12px; font-weight: 700; vertical-align: middle;">${Number(b.odds).toFixed(2)}</td>
      <td class="text-end" style="padding: 6px 8px; font-size: 12px; font-weight: 700; vertical-align: middle;">${b.stake}</td>
    </tr>
  `).join('');
}

function handleOddsClick(cellEl) {
  if (cellEl.closest('.suspended-row') || cellEl.closest('[data-title="SUSPENDED"]') || cellEl.classList.contains('suspended-row')) {
    if (typeof showToast === 'function') showToast('Market is currently suspended', true);
    return;
  }

  let oddsVal = NaN;
  const oddSpan = cellEl.querySelector('.market-odd');
  if (oddSpan) {
    oddsVal = parseFloat(oddSpan.innerText.trim());
  } else {
    const lines = cellEl.innerText.trim().split(/\s+/);
    oddsVal = parseFloat(lines[0]);
  }

  if (isNaN(oddsVal) || oddsVal <= 1.0) {
    return;
  }

  // Detect bet type
  const isLay = cellEl.classList.contains('odd-lay') || cellEl.classList.contains('lay') || cellEl.classList.contains('lay1') || cellEl.classList.contains('lay2');
  const betType = isLay ? 'LAY' : 'BACK';

  let matchName = 'Live Match';
  let runnerName = 'Selection';
  let marketName = 'Match Odds';

  // 1. Check if inside game-details market-row
  const marketRow = cellEl.closest('.market-row');
  if (marketRow) {
    const rNameEl = marketRow.querySelector('.market-nation-name');
    if (rNameEl) runnerName = rNameEl.innerText.trim();

    const gameMarket = cellEl.closest('.game-market');
    if (gameMarket) {
      const mTitle = gameMarket.querySelector('.market-title span');
      if (mTitle) marketName = mTitle.innerText.trim();
    }
  }

  // 2. Check if inside table row (home.html)
  const betRow = cellEl.closest('.bet-table-row, tr');
  if (betRow && !marketRow) {
    const nameEl = betRow.querySelector('.bet-nation-game-name span, .game-name, td:first-child');
    if (nameEl) {
      runnerName = nameEl.innerText.trim().split('/')[0].trim();
    }
    const headerTitle = document.querySelector('.sports-tab .nav-link.active span');
    if (headerTitle) {
      marketName = headerTitle.innerText.trim() + ' Match Odds';
    }
  }

  const gameHeader = document.querySelector('.game-header span');
  if (gameHeader) {
    matchName = gameHeader.innerText.trim();
  } else {
    matchName = runnerName;
  }

  activeBet = {
    matchName: matchName,
    marketName: marketName,
    runnerName: runnerName,
    odds: oddsVal,
    betType: betType,
    stake: 1000 // default initial stake
  };

  openBetslip(activeBet);
}

function openBetslip(bet) {
  // Desktop betslip container or mobile drawer
  const isMobile = window.innerWidth < 1200;
  let container = document.getElementById(isMobile ? 'mobileBetslipDrawer' : 'desktopBetslipContainer');

  if (!container) {
    if (isMobile) {
      container = document.createElement('div');
      container.id = 'mobileBetslipDrawer';
      container.className = 'mobile-betslip-drawer';
      document.body.appendChild(container);
    } else {
      // Find right sidebar column or inject floating container
      const rightCol = document.querySelector('.sidebar.right-sidebar, .right-column');
      if (rightCol) {
        container = document.createElement('div');
        container.id = 'desktopBetslipContainer';
        rightCol.prepend(container);
      } else {
        container = document.createElement('div');
        container.id = 'desktopBetslipContainer';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.width = '320px';
        container.style.zIndex = '1040';
        document.body.appendChild(container);
      }
    }
  }

  renderBetslipContent(container, bet);

  if (isMobile) {
    container.classList.add('show');
  }
}

function renderBetslipContent(container, bet) {
  const isBack = bet.betType === 'BACK';
  const profit = isBack ? ((bet.odds - 1) * bet.stake).toFixed(2) : bet.stake.toFixed(2);
  const liability = isBack ? bet.stake.toFixed(2) : ((bet.odds - 1) * bet.stake).toFixed(2);

  // Retrieve custom stake chips from Set Button Values
  let buttonPresets = [];
  try {
    const data = localStorage.getItem('bestbet9_stake_buttons');
    if (data) {
      buttonPresets = JSON.parse(data).gameButtons || [];
    }
  } catch (e) {}

  if (buttonPresets.length === 0) {
    buttonPresets = [
      { label: '1k', value: 1000 },
      { label: '2k', value: 2000 },
      { label: '5k', value: 5000 },
      { label: '10k', value: 10000 },
      { label: '20k', value: 20000 },
      { label: '25k', value: 25000 },
      { label: '50k', value: 50000 },
      { label: '75k', value: 75000 },
      { label: '90k', value: 90000 },
      { label: '95k', value: 95000 }
    ];
  }

  container.innerHTML = `
    <div class="betslip-card">
      <div class="betslip-header">
        <span><i class="fas fa-ticket-alt me-1"></i> Place Bet</span>
        <button type="button" class="close-betslip" onclick="closeBetslip()">&times;</button>
      </div>
      <div class="betslip-body">
        <div class="betslip-bet-item ${isBack ? 'back-bet' : 'lay-bet'}">
          <div class="betslip-selection-title">
            <span>${bet.runnerName}</span>
            <span class="betslip-bet-type-badge">${bet.betType}</span>
          </div>
          <div class="betslip-market-name">${bet.matchName} &bull; ${bet.marketName}</div>

          <div class="betslip-inputs-row">
            <div class="betslip-input-group">
              <label>Odds:</label>
              <div class="betslip-input-spinner">
                <button type="button" onclick="adjustOdds(-0.01)">-</button>
                <input type="number" step="0.01" id="betslipOddsInput" value="${bet.odds.toFixed(2)}" oninput="onOddsChanged(this.value)">
                <button type="button" onclick="adjustOdds(0.01)">+</button>
              </div>
            </div>
            <div class="betslip-input-group">
              <label>Stake:</label>
              <input type="number" id="betslipStakeInput" value="${bet.stake}" oninput="onStakeChanged(this.value)">
            </div>
          </div>

          <div class="betslip-chips-grid" id="betslipChipsGrid">
            ${buttonPresets.map(b => `
              <button type="button" class="betslip-chip-btn" onclick="addStake(${b.value})">+${b.label}</button>
            `).join('')}
          </div>

          <div class="betslip-profit-row">
            <span>${isBack ? 'Profit:' : 'Liability:'}</span>
            <span class="${isBack ? 'profit-val' : 'liability-val'}">
              <b>${isBack ? profit : liability}</b>
            </span>
          </div>

          <div class="betslip-actions">
            <button type="button" class="betslip-btn-cancel" onclick="closeBetslip()">Cancel</button>
            <button type="button" class="betslip-btn-place" id="placeBetSubmitBtn" onclick="submitBet()">Place Bet</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function adjustOdds(delta) {
  if (!activeBet) return;
  activeBet.odds = Math.max(1.01, parseFloat((activeBet.odds + delta).toFixed(2)));
  const oddsInput = document.getElementById('betslipOddsInput');
  if (oddsInput) oddsInput.value = activeBet.odds.toFixed(2);
  updateProfitDisplay();
}

function onOddsChanged(val) {
  if (!activeBet) return;
  const num = parseFloat(val);
  if (!isNaN(num) && num > 1) {
    activeBet.odds = num;
    updateProfitDisplay();
  }
}

function onStakeChanged(val) {
  if (!activeBet) return;
  const num = parseInt(val, 10);
  activeBet.stake = isNaN(num) || num < 0 ? 0 : num;
  updateProfitDisplay();
}

function addStake(amount) {
  if (!activeBet) return;
  activeBet.stake += amount;
  const stakeInput = document.getElementById('betslipStakeInput');
  if (stakeInput) stakeInput.value = activeBet.stake;
  updateProfitDisplay();
}

function updateProfitDisplay() {
  if (!activeBet) return;
  const isBack = activeBet.betType === 'BACK';
  const profit = isBack ? ((activeBet.odds - 1) * activeBet.stake).toFixed(2) : activeBet.stake.toFixed(2);
  const liability = isBack ? activeBet.stake.toFixed(2) : ((activeBet.odds - 1) * activeBet.stake).toFixed(2);

  const profitEl = document.querySelector('.betslip-profit-row span:last-child b');
  if (profitEl) {
    profitEl.textContent = isBack ? profit : liability;
  }
}

function submitBet() {
  if (!activeBet || activeBet.stake <= 0) {
    if (typeof showToast === 'function') showToast('Please enter a valid stake amount', true);
    return;
  }

  const userStr = localStorage.getItem('bestbet9_user');
  let currentBalance = 1500;
  let currentExposure = 0;
  let user = { username: 'Demo', balance: 1500, exposure: 0 };

  if (userStr) {
    try {
      user = JSON.parse(userStr);
      currentBalance = user.balance || 1500;
      currentExposure = user.exposure || 0;
    } catch (e) {}
  }

  if (activeBet.stake > currentBalance) {
    if (typeof showToast === 'function') showToast('Insufficient balance for this stake!', true);
    return;
  }

  const submitBtn = document.getElementById('placeBetSubmitBtn');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
  }

  setTimeout(() => {
    // Deduct stake and update exposure
    const updatedBalance = currentBalance - activeBet.stake;
    const updatedExposure = currentExposure + activeBet.stake;
    user.balance = updatedBalance;
    user.exposure = updatedExposure;

    localStorage.setItem('bestbet9_user', JSON.stringify(user));

    // Save placed bet in history
    let bets = [];
    try {
      const storedBets = localStorage.getItem('bestbet9_bets');
      if (storedBets) bets = JSON.parse(storedBets);
    } catch (e) {}

    const newBet = {
      id: 'BET' + Math.floor(10000000 + Math.random() * 90000000),
      matchName: activeBet.matchName,
      marketName: activeBet.marketName,
      runnerName: activeBet.runnerName,
      betType: activeBet.betType,
      odds: activeBet.odds,
      stake: activeBet.stake,
      placedTime: new Date().toLocaleTimeString(),
      status: 'MATCHED'
    };
    bets.unshift(newBet);
    localStorage.setItem('bestbet9_bets', JSON.stringify(bets));

    // Update Header Displays
    const balEl = document.getElementById('userBalance');
    const expEl = document.getElementById('userExposure');
    if (balEl) balEl.textContent = updatedBalance;
    if (expEl) expEl.textContent = updatedExposure;

    if (typeof showToast === 'function') {
      showToast(`Bet matched! ${activeBet.betType} ${activeBet.runnerName} @ ${activeBet.odds}`);
    }

    renderMyBets();
    closeBetslip();
  }, 600);
}

function closeBetslip() {
  const mobileDrawer = document.getElementById('mobileBetslipDrawer');
  if (mobileDrawer) {
    mobileDrawer.classList.remove('show');
    mobileDrawer.innerHTML = '';
  }
  const desktopContainer = document.getElementById('desktopBetslipContainer');
  if (desktopContainer) {
    desktopContainer.innerHTML = '';
  }
  activeBet = null;
}
