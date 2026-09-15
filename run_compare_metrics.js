const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUTPUT_DIR = 'C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/site_inspection';

async function extractDetailedMetrics(page, isLive) {
  return await page.evaluate(() => {
    function getStyle(el) {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        text: (el.innerText || '').trim().replace(/\s+/g, ' ').substring(0, 40),
        rect: { x: Math.round(rect.x * 10) / 10, y: Math.round(rect.y * 10) / 10, width: Math.round(rect.width * 10) / 10, height: Math.round(rect.height * 10) / 10 },
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        fontStretch: s.fontStretch,
        textTransform: s.textTransform,
        color: s.color
      };
    }

    // Specific UI components
    const queries = {
      // 1. Header elements
      headerRules: '.rules-link, a[href*="rules"], .header-top a',
      headerBalanceLabel: '.balance-title, .user-balance span',
      headerBalanceAmount: '.balance-value, .user-balance b',
      headerExpLabel: '.exp-title, .user-balance .exp-text',
      headerExpAmount: '.exp-value, .user-balance .exp-value',
      headerDemoName: '.user-name, .dropdown-toggle',

      // 2. Category navigation items
      navHome: '.header-bottom .nav-item:nth-child(1) .nav-link',
      navLottery: '.header-bottom .nav-item:nth-child(2) .nav-link',
      navCricket: '.header-bottom .nav-item:nth-child(3) .nav-link',
      navTennis: '.header-bottom .nav-item:nth-child(4) .nav-link',
      navFootball: '.header-bottom .nav-item:nth-child(5) .nav-link',
      navCrash: '.header-bottom .aviator .nav-link, .header-bottom .nav-item:last-child .nav-link',

      // 3. Sidebar
      sidebarTitleRacing: '.sidebar .accordion-item:nth-child(1) .accordion-button, .sidebar-title',
      sidebarItemHorse: '.sidebar .accordion-item:nth-child(1) .nav-link:nth-child(1)',
      sidebarTitleOthers: '.sidebar .accordion-item:nth-child(2) .accordion-button',
      sidebarTitleSports: '.sidebar .accordion-item:nth-child(3) .accordion-button',

      // 4. Latest Event Ticker
      eventTickerItem1: '.latest-event-item:nth-child(1) a',
      eventTickerItem2: '.latest-event-item:nth-child(2) a',

      // 5. Sports Tab
      tabCricket: '.sports-tab .nav-link.active, .sports-tab .nav-link:nth-child(1)',
      tabTennis: '.sports-tab .nav-link:nth-child(2)',

      // 6. Bet Table
      tableHeaderGame: '.bet-table-header .bet-nation-name',
      tableHeader1: '.bet-table-header .bet-nation-odd:nth-child(2)',
      tableHeaderX: '.bet-table-header .bet-nation-odd:nth-child(3)',
      tableHeader2: '.bet-table-header .bet-nation-odd:nth-child(4)',
      matchName1: '.bet-nation-game-name',
      matchDate1: '.game-date',
      oddBack1: '.odd-box.back, .back.odd-box',
      oddLay1: '.odd-box.lay, .lay.odd-box',

      // 7. Footer
      footerLink1: 'footer a, .footer a'
    };

    const results = {};
    for (const [key, sel] of Object.entries(queries)) {
      const el = document.querySelector(sel);
      results[key] = getStyle(el);
    }

    // Also get all loaded fonts
    const loadedFonts = [];
    document.fonts.forEach(f => {
      loadedFonts.push({ family: f.family, status: f.status, weight: f.weight, style: f.style });
    });
    results._loadedFonts = loadedFonts;

    return results;
  });
}

async function run() {
  console.log('Comparing typography metrics between Live and Local with stealth...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      '--window-size=1024,650'
    ],
    defaultViewport: { width: 1024, height: 530 }
  });

  try {
    // 1. Live site
    console.log('Opening live site https://bestbet9.now/ ...');
    const livePage = await browser.newPage();
    await livePage.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await livePage.goto('https://bestbet9.now/', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // click demo login
    console.log('Clicking Demo Login...');
    await livePage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const demo = btns.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
      if (demo) demo.click();
    });

    // Wait for navigation to /home
    await livePage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 4000));

    // Close welcome popup modal if present
    console.log('Dismissing any modal dialogs...');
    await livePage.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('.modal .btn-close, .modal .close, button.close, [aria-label="Close"], div[role="dialog"] button, .modal button'));
      for (const btn of closeBtns) btn.click();
      const modal = document.querySelector('.modal');
      if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
      }
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(b => b.remove());
      document.body.classList.remove('modal-open');
    });
    await new Promise(r => setTimeout(r, 1500));

    // Screenshot live at 1024
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    await livePage.screenshot({ path: path.join(OUTPUT_DIR, 'live_authenticated_1024.png') });
    console.log('Saved live_authenticated_1024.png');

    const liveMetrics = await extractDetailedMetrics(livePage, true);

    // 2. Local site
    console.log('Opening local site home.html...');
    const localPage = await browser.newPage();
    const localUrl = 'file:///' + path.resolve('e:/bestbet.now/home.html').replace(/\\/g, '/');
    await localPage.goto(localUrl, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    await localPage.screenshot({ path: path.join(OUTPUT_DIR, 'local_compared_1024.png') });
    console.log('Saved local_compared_1024.png');

    const localMetrics = await extractDetailedMetrics(localPage, false);

    // Compare metrics
    const comparison = {};
    for (const key of Object.keys(liveMetrics)) {
      if (key === '_loadedFonts') continue;
      const l = liveMetrics[key];
      const loc = localMetrics[key];
      comparison[key] = {
        liveText: l ? l.text : 'N/A',
        localText: loc ? loc.text : 'N/A',
        liveFont: l ? `${l.fontFamily} ${l.fontWeight} ${l.fontSize}/${l.lineHeight}` : 'NOT_FOUND',
        localFont: loc ? `${loc.fontFamily} ${loc.fontWeight} ${loc.fontSize}/${loc.lineHeight}` : 'NOT_FOUND',
        liveDimensions: l ? `${l.rect.width}x${l.rect.height} @(${l.rect.x},${l.rect.y})` : 'NOT_FOUND',
        localDimensions: loc ? `${loc.rect.width}x${loc.rect.height} @(${loc.rect.x},${loc.rect.y})` : 'NOT_FOUND',
        widthDiff: (l && loc) ? (loc.rect.width - l.rect.width).toFixed(1) : 'N/A',
        heightDiff: (l && loc) ? (loc.rect.height - l.rect.height).toFixed(1) : 'N/A'
      };
    }

    console.log('\n=== TYPOGRAPHY COMPARISON TABLE ===');
    console.table(comparison);

    fs.writeFileSync(path.join(OUTPUT_DIR, 'detailed_font_comparison.json'), JSON.stringify({
      liveLoadedFonts: liveMetrics._loadedFonts,
      localLoadedFonts: localMetrics._loadedFonts,
      elementComparison: comparison,
      liveRaw: liveMetrics,
      localRaw: localMetrics
    }, null, 2));
    console.log('Saved detailed_font_comparison.json successfully!');

  } catch (err) {
    console.error('Error during comparison:', err);
  } finally {
    await browser.close();
  }
}

run();
