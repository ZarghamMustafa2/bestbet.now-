const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUTPUT_DIR = 'C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/site_inspection';

async function extractDetailedMetrics(page) {
  return await page.evaluate(() => {
    function getStyle(el) {
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        text: (el.innerText || '').trim().replace(/\s+/g, ' ').substring(0, 30),
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        color: s.color,
        rectWidth: Math.round(rect.width * 10) / 10,
        rectHeight: Math.round(rect.height * 10) / 10
      };
    }

    const queries = {
      headerRules: '.header-rules a, a.rules-link',
      headerBalanceLabel: '.user-balance span',
      headerBalanceAmount: '.user-balance b',
      headerExpLabel: '.user-balance div:nth-child(2) span',
      headerExpAmount: '.user-balance div:nth-child(2) b',
      headerDemoName: '.user-name',
      navHome: '.header-bottom .nav-item:nth-child(1) .nav-link',
      navLottery: '.header-bottom .nav-item:nth-child(2) .nav-link',
      navCricket: '.header-bottom .nav-item:nth-child(3) .nav-link',
      sidebarTitleRacing: '.sidebar-title span, .accordion-button',
      sidebarLinkHorse: '.sidebar-link, .sidebar .nav-link',
      eventTickerItem1: '.latest-event-item a',
      sportsTabCricket: '.sports-tab .nav-link.active, .sports-tab .nav-link:nth-child(1)',
      tableHeaderGame: '.bet-table-header .bet-nation-name',
      tableHeader1: '.bet-table-header .bet-nation-odd:nth-child(2)',
      tableMatchName: '.bet-nation-game-name',
      oddBoxBack: '.odd-box.back',
      oddBoxLay: '.odd-box.lay'
    };

    const res = {};
    for (const [k, q] of Object.entries(queries)) {
      res[k] = getStyle(document.querySelector(q));
    }
    return res;
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      '--window-size=1280,900'
    ],
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    // 1. Live site
    console.log('Inspecting live site at 1280x800...');
    const livePage = await browser.newPage();
    await livePage.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    await livePage.goto('https://bestbet9.now/', { waitUntil: 'networkidle2' });
    await livePage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const demo = btns.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
      if (demo) demo.click();
    });
    await new Promise(r => setTimeout(r, 6000));
    await livePage.evaluate(() => {
      document.querySelectorAll('.modal, .modal-backdrop, [role="dialog"]').forEach(m => m.remove());
      document.body.classList.remove('modal-open');
    });
    await new Promise(r => setTimeout(r, 1000));

    const liveData = await livePage.evaluate(() => {
      function getStyle(el) {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          text: (el.innerText || '').trim().replace(/\s+/g, ' ').substring(0, 30),
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing,
          color: s.color,
          rectWidth: Math.round(rect.width * 10) / 10,
          rectHeight: Math.round(rect.height * 10) / 10
        };
      }
      return {
        headerRules: getStyle(Array.from(document.querySelectorAll('header *')).find(e => e.innerText && e.innerText.trim() === 'Rules')),
        headerBalanceLabel: getStyle(Array.from(document.querySelectorAll('header *')).find(e => e.innerText && e.innerText.trim() === 'Balance:')),
        headerBalanceAmount: getStyle(Array.from(document.querySelectorAll('header *')).find(e => e.innerText && e.innerText.trim() === '1500')),
        headerExpLabel: getStyle(Array.from(document.querySelectorAll('header *')).find(e => e.innerText && e.innerText.trim() === 'Exp:')),
        headerExpAmount: getStyle(Array.from(document.querySelectorAll('header *')).find(e => e.innerText && e.innerText.trim() === '0')),
        headerDemoName: getStyle(Array.from(document.querySelectorAll('header *')).find(e => e.innerText && e.innerText.trim().startsWith('Demo'))),
        navHome: getStyle(Array.from(document.querySelectorAll('header a, nav a')).find(e => e.innerText && e.innerText.trim() === 'HOME')),
        navLottery: getStyle(Array.from(document.querySelectorAll('header a, nav a')).find(e => e.innerText && e.innerText.trim() === 'LOTTERY')),
        navCricket: getStyle(Array.from(document.querySelectorAll('header a, nav a')).find(e => e.innerText && e.innerText.trim() === 'CRICKET')),
        sidebarTitleRacing: getStyle(Array.from(document.querySelectorAll('.sidebar *, aside *')).find(e => e.innerText && e.innerText.trim() === 'Racing Sports')),
        sidebarLinkHorse: getStyle(Array.from(document.querySelectorAll('.sidebar *, aside *')).find(e => e.innerText && e.innerText.trim() === 'Horse Racing')),
        sportsTabCricket: getStyle(Array.from(document.querySelectorAll('.sports-tab *, .nav-tabs *')).find(e => e.innerText && e.innerText.trim() === 'Cricket')),
        tableHeaderGame: getStyle(Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'Game')),
        tableMatchName: getStyle(Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim().startsWith('Super Over2'))),
        oddBoxBack: getStyle(document.querySelector('.odd-box.back, .back.odd-box, [class*="back"]')),
        oddBoxLay: getStyle(document.querySelector('.odd-box.lay, .lay.odd-box, [class*="lay"]'))
      };
    });

    // 2. Local site
    console.log('Inspecting local site at 1280x800...');
    const localPage = await browser.newPage();
    const localUrl = 'file:///' + path.resolve('e:/bestbet.now/home.html').replace(/\\/g, '/');
    await localPage.goto(localUrl, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));

    const localData = await extractDetailedMetrics(localPage);

    // Side by side table
    const comparison = [];
    for (const k of Object.keys(liveData)) {
      const l = liveData[k];
      const loc = localData[k];
      comparison.push({
        element: k,
        liveFont: l ? `${l.fontFamily} ${l.fontWeight} ${l.fontSize}` : 'N/A',
        localFont: loc ? `${loc.fontFamily} ${loc.fontWeight} ${loc.fontSize}` : 'N/A',
        liveSize: l ? `${l.rectWidth}x${l.rectHeight}` : 'N/A',
        localSize: loc ? `${loc.rectWidth}x${loc.rectHeight}` : 'N/A',
        fontMatched: (l && loc && l.fontFamily === loc.fontFamily && l.fontSize === loc.fontSize && l.fontWeight === loc.fontWeight) ? 'YES' : 'DIFF'
      });
    }

    console.log('\n=== DIRECT TYPOGRAPHY VERIFICATION REPORT ===');
    console.table(comparison);

    fs.writeFileSync(path.join(OUTPUT_DIR, 'final_typography_verification.json'), JSON.stringify(comparison, null, 2));
    console.log('Saved final_typography_verification.json');

  } catch (err) {
    console.error('Error in verification:', err);
  } finally {
    await browser.close();
  }
})();
