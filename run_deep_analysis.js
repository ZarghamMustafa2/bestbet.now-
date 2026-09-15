const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUTPUT_DIR = 'C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/deep_analysis';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper to get computed styles of elements
async function getElementStyles(page, selector) {
  return await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = window.getComputedStyle(el);
    return {
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      lineHeight: s.lineHeight,
      color: s.color,
      backgroundColor: s.backgroundColor,
      border: s.border,
      borderRadius: s.borderRadius,
      boxShadow: s.boxShadow,
      padding: s.padding,
      margin: s.margin,
      height: s.height,
      width: s.width
    };
  }, selector);
}

async function run() {
  console.log('--- STARTING COMPREHENSIVE DEEP REFERENCE SITE ANALYSIS ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      '--window-size=1440,900'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  const report = {
    pages: [],
    modals: [],
    typography: {},
    colors: {},
    navigationStructure: {},
    interactions: []
  };

  try {
    const page = await browser.newPage();

    // 1. LOGIN PAGE ANALYSIS
    console.log('[1/12] Inspecting Login Page...');
    await page.goto('https://bestbet9.now/', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_login_desktop.png') });

    const loginStyles = {
      body: await getElementStyles(page, 'body'),
      card: await getElementStyles(page, '.card, .login-card, .login-box, form'),
      heading: await getElementStyles(page, 'h4, h3, .heading'),
      inputs: await getElementStyles(page, 'input[type="text"], input[type="password"]'),
      loginBtn: await getElementStyles(page, '.btn-primary, button[type="submit"]'),
      demoBtn: await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, a'));
        const btn = btns.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
        if (!btn) return null;
        const s = window.getComputedStyle(btn);
        return {
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
          color: s.color,
          backgroundColor: s.backgroundColor,
          border: s.border,
          borderRadius: s.borderRadius,
          height: s.height
        };
      }),
      footer: await getElementStyles(page, 'footer, .footer')
    };
    report.typography.login = loginStyles;

    // 2. DEMO LOGIN & WELCOME POPUP MODAL
    console.log('[2/12] Executing Demo Login and capturing modal/popup...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const btn = btns.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 7000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_demo_login_popup_modal.png') });

    // Inspect modal if present
    const modalInfo = await page.evaluate(() => {
      const modal = document.querySelector('.modal.show, .modal-dialog, div[role="dialog"]');
      if (!modal) return null;
      const s = window.getComputedStyle(modal);
      const img = modal.querySelector('img');
      const closeBtn = modal.querySelector('.btn-close, .close, button');
      return {
        hasModal: true,
        width: s.width,
        height: s.height,
        imgSrc: img ? img.src : null,
        closeBtnClasses: closeBtn ? closeBtn.className : null,
        text: modal.innerText.trim()
      };
    });
    if (modalInfo) {
      report.modals.push({ name: 'Welcome Banner Modal', ...modalInfo });
    }

    // Dismiss modal
    console.log('[3/12] Dismissing modal and inspecting Clean Home Dashboard...');
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('.modal .btn-close, .modal .close, button.close, [aria-label="Close"], div[role="dialog"] button'));
      for (const btn of closeBtns) btn.click();
      const modal = document.querySelector('.modal');
      if (modal) modal.classList.remove('show');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_clean_dashboard.png') });

    // Extract exact Header & Dashboard styles
    const dashboardStyles = {
      header: await getElementStyles(page, '.header, header, .header-top'),
      logo: await page.evaluate(() => {
        const img = document.querySelector('.logo-header img, header img');
        return img ? { src: img.src, width: img.clientWidth, height: img.clientHeight } : null;
      }),
      searchBox: await getElementStyles(page, '.search-box input, input[type="search"]'),
      rulesLink: await getElementStyles(page, '.rules-link, .header-rules a'),
      userBalance: await getElementStyles(page, '.user-balance, .balance'),
      userName: await getElementStyles(page, '.user-name, .dropdown-toggle'),
      categoryNav: await getElementStyles(page, '.header-bottom, .navbar-nav'),
      categoryNavItem: await getElementStyles(page, '.header-bottom .nav-link'),
      sidebar: await getElementStyles(page, '.sidebar.left-sidebar'),
      accordionHeader: await getElementStyles(page, '.sidebar .accordion-button'),
      accordionItem: await getElementStyles(page, '.sidebar .accordion-body .nav-link'),
      tableHeader: await getElementStyles(page, '.table thead th'),
      backOdds: await getElementStyles(page, '.odd-back, td.back, td:has(.back), td[class*="back"]'),
      layOdds: await getElementStyles(page, '.odd-lay, td.lay, td:has(.lay), td[class*="lay"]')
    };
    report.typography.dashboard = dashboardStyles;

    // 3. USER ACCOUNT DROPDOWN MENU
    console.log('[4/12] Clicking and inspecting User Account Dropdown...');
    await page.evaluate(() => {
      const userBtn = Array.from(document.querySelectorAll('a, button, div')).find(el => el.innerText && el.innerText.trim().startsWith('Demo'));
      if (userBtn) userBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_user_account_dropdown.png') });

    const userDropdownDetails = await page.evaluate(() => {
      const menu = document.querySelector('.dropdown-menu.show, .dropdown-menu');
      if (!menu) return null;
      const items = Array.from(menu.querySelectorAll('a, button, li')).map(item => ({
        text: item.innerText.trim(),
        href: item.getAttribute('href') || ''
      }));
      const s = window.getComputedStyle(menu);
      return {
        items: items,
        backgroundColor: s.backgroundColor,
        boxShadow: s.boxShadow,
        borderRadius: s.borderRadius
      };
    });
    report.navigationStructure.userDropdown = userDropdownDetails;

    // 4. RULES MODAL
    console.log('[5/12] Clicking Rules Link to inspect Rules Modal/Dialog...');
    await page.evaluate(() => {
      const rules = Array.from(document.querySelectorAll('a, button')).find(el => el.innerText && el.innerText.trim() === 'Rules');
      if (rules) rules.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_rules_modal.png') });
    
    // Close Rules modal if opened
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('.modal .btn-close, .modal .close, button.close, [aria-label="Close"], div[role="dialog"] button'));
      for (const btn of closeBtns) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // 5. SET BUTTON VALUES MODAL
    console.log('[6/12] Inspecting Set Button Values modal...');
    await page.evaluate(() => {
      const userBtn = Array.from(document.querySelectorAll('a, button, div')).find(el => el.innerText && el.innerText.trim().startsWith('Demo'));
      if (userBtn) userBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => {
      const setBtnVal = Array.from(document.querySelectorAll('.dropdown-menu a, .dropdown-menu button, a')).find(el => el.innerText && el.innerText.includes('Set Button Values'));
      if (setBtnVal) setBtnVal.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06_set_button_values_modal.png') });

    const btnValuesModalInfo = await page.evaluate(() => {
      const modal = document.querySelector('.modal.show, div[role="dialog"]');
      if (!modal) return null;
      return {
        title: modal.querySelector('.modal-title, h4, h5') ? modal.querySelector('.modal-title, h4, h5').innerText.trim() : '',
        inputs: Array.from(modal.querySelectorAll('input')).map(i => ({ value: i.value, name: i.name, placeholder: i.placeholder })),
        buttons: Array.from(modal.querySelectorAll('button')).map(b => b.innerText.trim()),
        text: modal.innerText.trim()
      };
    });
    if (btnValuesModalInfo) report.modals.push({ name: 'Set Button Values Modal', ...btnValuesModalInfo });

    // Close modal
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('.modal .btn-close, .modal .close, button.close, [aria-label="Close"], div[role="dialog"] button'));
      for (const btn of closeBtns) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // 6. ACCOUNT STATEMENT PAGE
    console.log('[7/12] Navigating to Account Statement Page...');
    await page.goto('https://bestbet9.now/account-statement', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07_account_statement_page.png') });
    report.pages.push({
      name: 'Account Statement',
      url: page.url(),
      title: await page.title(),
      tableHeaders: await page.evaluate(() => Array.from(document.querySelectorAll('th')).map(th => th.innerText.trim())),
      inputs: await page.evaluate(() => Array.from(document.querySelectorAll('input, select')).map(el => ({ tag: el.tagName, name: el.name, placeholder: el.placeholder })))
    });

    // 7. CURRENT BET PAGE
    console.log('[8/12] Navigating to Current Bet Page...');
    await page.goto('https://bestbet9.now/current-bet', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_current_bet_page.png') });
    report.pages.push({
      name: 'Current Bet',
      url: page.url(),
      title: await page.title(),
      tableHeaders: await page.evaluate(() => Array.from(document.querySelectorAll('th')).map(th => th.innerText.trim()))
    });

    // 8. CASINO RESULTS PAGE
    console.log('[9/12] Navigating to Casino Results Page...');
    await page.goto('https://bestbet9.now/casino-results', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09_casino_results_page.png') });
    report.pages.push({
      name: 'Casino Results',
      url: page.url(),
      title: await page.title(),
      tableHeaders: await page.evaluate(() => Array.from(document.querySelectorAll('th')).map(th => th.innerText.trim()))
    });

    // 9. SPORTS CATEGORY PAGES (Cricket, Tennis, Football)
    console.log('[10/12] Inspecting Cricket & In-play Match Detail Page...');
    await page.goto('https://bestbet9.now/all-sports/4', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10_all_sports_cricket_page.png') });

    // Open first live match
    const matchHref = await page.evaluate(() => {
      const matchLink = document.querySelector('.table tbody tr a, .game-name a, td a');
      return matchLink ? matchLink.href : null;
    });

    if (matchHref) {
      console.log('Navigating to live match details:', matchHref);
      await page.goto(matchHref, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 4000));
      await page.screenshot({ path: path.join(OUTPUT_DIR, '11_match_details_ladder_and_markets.png') });

      // Click on an odds button to activate betslip!
      console.log('Triggering betslip by clicking an odds button...');
      await page.evaluate(() => {
        const oddBtn = document.querySelector('.odd-back, .odd-lay, .back, .lay, td.back, td.lay');
        if (oddBtn) oddBtn.click();
      });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(OUTPUT_DIR, '12_active_betslip_panel.png') });

      const betslipDetails = await page.evaluate(() => {
        const slip = document.querySelector('.betslip, .bet-slip, .right-sidebar, .bet-box');
        if (!slip) return null;
        return {
          title: slip.innerText.slice(0, 200),
          buttons: Array.from(slip.querySelectorAll('button, .btn')).map(b => b.innerText.trim()),
          inputs: Array.from(slip.querySelectorAll('input')).map(i => ({ value: i.value, placeholder: i.placeholder }))
        };
      });
      if (betslipDetails) report.interactions.push({ name: 'Betslip Interaction', ...betslipDetails });
    }

    // 10. CASINO & AVIATOR GALLERY PAGES
    console.log('[11/12] Inspecting Casino & Aviator Hubs...');
    await page.goto('https://bestbet9.now/casino-list/LC/4', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '13_our_casino_page.png') });

    await page.goto('https://bestbet9.now/aviator-list', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '14_aviator_page.png') });

    // 11. MOBILE RESPONSIVE LAYOUT (375x812)
    console.log('[12/12] Inspecting Mobile Responsive Layout (375x812)...');
    await page.setViewport({ width: 375, height: 812, isMobile: true });
    await page.goto('https://bestbet9.now/home', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 3000));
    
    // Close modal if popped up
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('.modal .btn-close, .modal .close, button.close, [aria-label="Close"], div[role="dialog"] button'));
      for (const btn of closeBtns) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '15_mobile_home_dashboard.png') });

    // Open mobile sidebar drawer
    await page.evaluate(() => {
      const hamburger = document.querySelector('.logo-header a, .fas.fa-bars, .d-xl-none .fa-bars');
      if (hamburger) {
        hamburger.click();
        const parent = hamburger.closest('a');
        if (parent) parent.click();
      }
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '16_mobile_sidebar_drawer.png') });

    // Save final report JSON
    fs.writeFileSync(path.join(OUTPUT_DIR, 'deep_analysis_report.json'), JSON.stringify(report, null, 2));
    console.log('--- COMPREHENSIVE ANALYSIS FINISHED SUCCESSFULLY! ---');

  } catch (err) {
    console.error('Analysis error:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

run();
