/**
 * BESTBET9 - Interactive Modals Management
 */

// Initialize modals on page load
document.addEventListener('DOMContentLoaded', () => {
  initWelcomeModal();
  initSetButtonValuesModal();
  initRulesModal();
});

/* -------------------------------------------------------------
 * 1. WELCOME ANNOUNCEMENT BANNER MODAL
 * ------------------------------------------------------------- */
function initWelcomeModal() {
  // Check if user has already dismissed welcome modal in this session
  const hasSeenWelcome = sessionStorage.getItem('bestbet9_welcome_seen');
  const user = localStorage.getItem('bestbet9_user');

  // Auto-show on first login
  if (!hasSeenWelcome && user) {
    openWelcomeModal();
  }
}

function openWelcomeModal() {
  let modalEl = document.getElementById('welcomeAnnouncementModal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'welcomeAnnouncementModal';
    modalEl.className = 'modal welcome-modal fade show';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.tabIndex = -1;
    modalEl.innerHTML = `
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title h4">⚠️ Beware Of Phishing Websites Before Login. Enable Security Auth To Secure Your ID.</div>
            <button type="button" class="btn-close" aria-label="Close" onclick="closeWelcomeModal()"></button>
          </div>
          <div class="p-0 modal-body">
            <img src="assets/images/welcome_banner.png" class="img-fluid" alt="Announcement">
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);
  }

  showModalWithBackdrop(modalEl, closeWelcomeModal);
}

function closeWelcomeModal() {
  const modalEl = document.getElementById('welcomeAnnouncementModal');
  if (modalEl) {
    hideModalWithBackdrop(modalEl);
  }
  sessionStorage.setItem('bestbet9_welcome_seen', 'true');
}

/* -------------------------------------------------------------
 * 2. SET BUTTON VALUES MODAL
 * ------------------------------------------------------------- */
const DEFAULT_GAME_BUTTONS = [
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

const DEFAULT_CASINO_BUTTONS = [
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: '200', value: 200 },
  { label: '500', value: 500 },
  { label: '1000', value: 1000 }
];

function getStoredButtonValues() {
  try {
    const data = localStorage.getItem('bestbet9_stake_buttons');
    if (data) return JSON.parse(data);
  } catch (e) {}
  return { gameButtons: DEFAULT_GAME_BUTTONS, casinoButtons: DEFAULT_CASINO_BUTTONS };
}

function initSetButtonValuesModal() {
  // ensure defaults exist in storage
  if (!localStorage.getItem('bestbet9_stake_buttons')) {
    localStorage.setItem('bestbet9_stake_buttons', JSON.stringify({
      gameButtons: DEFAULT_GAME_BUTTONS,
      casinoButtons: DEFAULT_CASINO_BUTTONS
    }));
  }
}

function openSetButtonValuesModal() {
  let modalEl = document.getElementById('setButtonValuesModal');
  const currentValues = getStoredButtonValues();

  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'setButtonValuesModal';
    modalEl.className = 'modal fade show';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.tabIndex = -1;
    document.body.appendChild(modalEl);
  }

  modalEl.innerHTML = `
    <div class="modal-dialog modal-md">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title h4">Set Button Value</div>
          <button type="button" class="btn-close" aria-label="Close" onclick="closeSetButtonValuesModal()"></button>
        </div>
        <div class="p-2 modal-body">
          <ul class="nav-pills" role="tablist">
            <li class="nav-item">
              <button class="nav-link active" id="btn-tab-game" onclick="switchButtonValuesTab('game')">Game Buttons</button>
            </li>
            <li class="nav-item">
              <button class="nav-link" id="btn-tab-casino" onclick="switchButtonValuesTab('casino')">Casino Buttons</button>
            </li>
          </ul>

          <div class="mt-2">
            <!-- Game Buttons Form -->
            <form id="gameButtonsForm" onsubmit="handleSaveButtonValues(event, 'game')">
              <div class="row10 mb-1">
                <div class="col-6"><label class="form-label"><b>Price Label:</b></label></div>
                <div class="col-6"><label class="form-label"><b>Price Value:</b></label></div>
              </div>
              <div id="gameButtonsRows">
                ${currentValues.gameButtons.map((btn, idx) => `
                  <div class="row10 mb-2">
                    <div class="col-6">
                      <input type="text" class="form-control" name="label_${idx}" value="${btn.label}" required>
                    </div>
                    <div class="col-6">
                      <input type="number" class="form-control" name="value_${idx}" value="${btn.value}" required>
                    </div>
                  </div>
                `).join('')}
              </div>
              <div class="row10 mt-3">
                <div class="col-12 col-md-6">
                  <button type="submit" class="btn btn-primary w-100">Update</button>
                </div>
              </div>
            </form>

            <!-- Casino Buttons Form -->
            <form id="casinoButtonsForm" style="display: none;" onsubmit="handleSaveButtonValues(event, 'casino')">
              <div class="row10 mb-1">
                <div class="col-6"><label class="form-label"><b>Price Label:</b></label></div>
                <div class="col-6"><label class="form-label"><b>Price Value:</b></label></div>
              </div>
              <div id="casinoButtonsRows">
                ${currentValues.casinoButtons.map((btn, idx) => `
                  <div class="row10 mb-2">
                    <div class="col-6">
                      <input type="text" class="form-control" name="label_${idx}" value="${btn.label}" required>
                    </div>
                    <div class="col-6">
                      <input type="number" class="form-control" name="value_${idx}" value="${btn.value}" required>
                    </div>
                  </div>
                `).join('')}
              </div>
              <div class="row10 mt-3">
                <div class="col-12 col-md-6">
                  <button type="submit" class="btn btn-primary w-100">Update</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  showModalWithBackdrop(modalEl, closeSetButtonValuesModal);
}

function switchButtonValuesTab(tab) {
  const gameTab = document.getElementById('btn-tab-game');
  const casinoTab = document.getElementById('btn-tab-casino');
  const gameForm = document.getElementById('gameButtonsForm');
  const casinoForm = document.getElementById('casinoButtonsForm');

  if (tab === 'game') {
    gameTab.classList.add('active');
    casinoTab.classList.remove('active');
    gameForm.style.display = 'block';
    casinoForm.style.display = 'none';
  } else {
    casinoTab.classList.add('active');
    gameTab.classList.remove('active');
    casinoForm.style.display = 'block';
    gameForm.style.display = 'none';
  }
}

function handleSaveButtonValues(e, type) {
  e.preventDefault();
  const form = e.target;
  const currentValues = getStoredButtonValues();

  if (type === 'game') {
    const newGameButtons = [];
    for (let i = 0; i < 10; i++) {
      const labelInput = form.querySelector(`[name="label_${i}"]`);
      const valueInput = form.querySelector(`[name="value_${i}"]`);
      if (labelInput && valueInput) {
        newGameButtons.push({
          label: labelInput.value.trim(),
          value: parseInt(valueInput.value.trim(), 10) || 0
        });
      }
    }
    currentValues.gameButtons = newGameButtons;
  } else {
    const newCasinoButtons = [];
    for (let i = 0; i < 6; i++) {
      const labelInput = form.querySelector(`[name="label_${i}"]`);
      const valueInput = form.querySelector(`[name="value_${i}"]`);
      if (labelInput && valueInput) {
        newCasinoButtons.push({
          label: labelInput.value.trim(),
          value: parseInt(valueInput.value.trim(), 10) || 0
        });
      }
    }
    currentValues.casinoButtons = newCasinoButtons;
  }

  localStorage.setItem('bestbet9_stake_buttons', JSON.stringify(currentValues));

  // Update open betslip chips if active
  if (typeof renderBetslipChips === 'function') {
    renderBetslipChips();
  }

  showToast('Button values updated successfully!');
  closeSetButtonValuesModal();
}

function closeSetButtonValuesModal() {
  const modalEl = document.getElementById('setButtonValuesModal');
  if (modalEl) {
    hideModalWithBackdrop(modalEl);
  }
}

/* -------------------------------------------------------------
 * 3. RULES & REGULATIONS MODAL
 * ------------------------------------------------------------- */
const RULES_DATA = {
  Cricket: `
    <div class="rules-content-title">Match Odds</div>
    <table class="table table-bordered">
      <tbody>
        <tr><td>If a ball is not bowled during a competition, series or match then all bets will be void except where the outcome has already been determined.</td></tr>
        <tr><td>In limited overs matches, bets will be void if the scheduled number of overs is reduced by more than 20% due to weather unless the outcome is already determined.</td></tr>
        <tr><td>Tied Match: In limited overs matches where no tie odds are quoted, if the match ends in a tie and no Super Over or bowl-out is played, dead heat rules apply.</td></tr>
      </tbody>
    </table>
    <div class="rules-content-title">Bookmaker & Fancy Markets</div>
    <table class="table table-bordered">
      <tbody>
        <tr><td>Session runs, fall of next wicket, and player runs will be settled according to official match scorecard.</td></tr>
        <tr><td>In complete innings matches, if an innings is curtailed or reduced, bets on incomplete sessions will be void.</td></tr>
        <tr><td class="text-danger">The company reserves the right to void any bets placed after the outcome has occurred or where odds were demonstrably in error.</td></tr>
      </tbody>
    </table>
  `,
  Football: `
    <div class="rules-content-title">Regular Time & Postponements</div>
    <table class="table table-bordered">
      <tbody>
        <tr><td>All bets apply to the relevant full 'regular time' period including stoppage time. Extra-time and penalty shoot-outs are not included unless specified.</td></tr>
        <tr><td>If the match will not take place within 48 hours of the original kick-off time bets will be void.</td></tr>
        <tr><td class="text-danger">For the cancellation of a goal due to VAR, bets matched between the goal and VAR review completion will be voided.</td></tr>
      </tbody>
    </table>
    <div class="rules-content-title">Goals & Corners</div>
    <table class="table table-bordered">
      <tbody>
        <tr><td>Total Corners: Only corners that are taken count. Awarded but not taken corners do not count.</td></tr>
        <tr><td>Both Teams to Score: Predict whether both teams will score in regular time. Own goals count to the team credited.</td></tr>
      </tbody>
    </table>
  `,
  Tennis: `
    <div class="rules-content-title">Match Betting</div>
    <table class="table table-bordered">
      <tbody>
        <tr><td>In the event of a match starting but not being completed then all bets will be void, except for set betting or games where outcome is already determined.</td></tr>
        <tr><td>If a player retires or is disqualified, bets on that player are settled as lost, and opponent as winner if at least one set is completed.</td></tr>
      </tbody>
    </table>
  `,
  HorseRacing: `
    <div class="rules-content-title">Horse Racing Rules</div>
    <table class="table table-bordered">
      <tbody>
        <tr><td>All bets are settled on the official result at the weigh-in ('weighed in'). Subsequent disqualifications or amendments do not count.</td></tr>
        <tr><td>Non-Runner: In the event of a non-runner, Rule 4 deductions may apply to winning bets according to standard betting odds scales.</td></tr>
      </tbody>
    </table>
  `
};

function initRulesModal() {}

function openRulesModal() {
  let modalEl = document.getElementById('rulesModal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'rulesModal';
    modalEl.className = 'modal rules-modal fade show';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.tabIndex = -1;
    document.body.appendChild(modalEl);
  }

  modalEl.innerHTML = `
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title h4">Rules</div>
          <div class="rules-langualge">
            <button type="button" class="btn">
              <img src="assets/images/flag_english.png" alt="English"> English
            </button>
          </div>
          <button type="button" class="btn-close" aria-label="Close" onclick="closeRulesModal()"></button>
        </div>
        <div class="modal-body">
          <div class="rules-left-sidebar">
            <ul class="nav-pills" role="tablist">
              <li class="nav-item">
                <a class="nav-link active" href="javascript:void(0)" onclick="switchRulesCategory('Cricket', this)">Cricket</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="javascript:void(0)" onclick="switchRulesCategory('Football', this)">Football</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="javascript:void(0)" onclick="switchRulesCategory('Tennis', this)">Tennis</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="javascript:void(0)" onclick="switchRulesCategory('HorseRacing', this)">Horse Racing</a>
              </li>
            </ul>
          </div>
          <div class="rules-content" id="rulesContentBody">
            ${RULES_DATA['Cricket']}
          </div>
        </div>
      </div>
    </div>
  `;

  showModalWithBackdrop(modalEl, closeRulesModal);
}

function switchRulesCategory(category, linkEl) {
  const links = document.querySelectorAll('.rules-left-sidebar .nav-link');
  links.forEach(l => l.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');

  const contentEl = document.getElementById('rulesContentBody');
  if (contentEl && RULES_DATA[category]) {
    contentEl.innerHTML = RULES_DATA[category];
  }
}

function closeRulesModal() {
  const modalEl = document.getElementById('rulesModal');
  if (modalEl) {
    hideModalWithBackdrop(modalEl);
  }
}

/* -------------------------------------------------------------
 * HELPER: MODAL SHOW / HIDE WITH BACKDROP
 * ------------------------------------------------------------- */
function showModalWithBackdrop(modalEl, closeCallback) {
  let backdrop = document.getElementById('globalModalBackdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'globalModalBackdrop';
    backdrop.className = 'modal-backdrop fade show';
    document.body.appendChild(backdrop);
  }
  backdrop.style.display = 'block';
  modalEl.style.display = 'block';
  document.body.style.overflow = 'hidden';

  // Backdrop click dismiss
  backdrop.onclick = () => {
    if (typeof closeCallback === 'function') closeCallback();
  };
}

function hideModalWithBackdrop(modalEl) {
  modalEl.style.display = 'none';
  const backdrop = document.getElementById('globalModalBackdrop');
  if (backdrop) {
    backdrop.style.display = 'none';
  }
  document.body.style.overflow = '';
}

/* -------------------------------------------------------------
 * TOAST NOTIFICATION HELPER
 * ------------------------------------------------------------- */
function showToast(message, isError = false) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'bet-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> <span>${message}</span>`;
  toast.style.backgroundColor = isError ? '#dc3545' : '#28a745';
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
