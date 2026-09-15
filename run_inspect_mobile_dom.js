const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    ]
  });

  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.setViewport({ width: 360, height: 800, isMobile: true });
  await page.goto('https://bestbet9.now/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const demo = btns.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
    if (demo) demo.click();
  });

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (page.url().includes('home')) break;
  }
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    document.querySelectorAll('.modal, .modal-backdrop, [role="dialog"]').forEach(m => m.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
  });
  await new Promise(r => setTimeout(r, 1000));

  // Extract mobile component details
  const mobileDetails = await page.evaluate(() => {
    function inspectElement(sel) {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        selector: sel,
        tagName: el.tagName,
        className: el.className,
        rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 },
        display: s.display,
        flexDirection: s.flexDirection,
        justifyContent: s.justifyContent,
        alignItems: s.alignItems,
        padding: s.padding,
        margin: s.margin,
        backgroundColor: s.backgroundColor,
        color: s.color,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        overflow: s.overflow,
        overflowX: s.overflowX
      };
    }

    // Outer HTML snippets of top sections
    const headerEl = document.querySelector('header, .header, .header-top');
    const navEl = document.querySelector('.header-bottom, .category-nav, nav.navbar');
    const sportsTabEl = document.querySelector('.sports-tab, .nav-tabs');
    const firstMatchEl = document.querySelector('.bet-table-row, [class*="bet-table-row"]');

    return {
      header: inspectElement('header, .header'),
      headerTop: inspectElement('.header-top'),
      logo: inspectElement('.logo-header img, header img'),
      hamburger: inspectElement('.fa-bars, [class*="navbar-toggler"]'),
      userBalance: inspectElement('.user-balance'),
      userDropdown: inspectElement('.user-name, .user-dropdown'),
      rulesLink: inspectElement('a.rules-link, .header-rules'),
      categoryNav: inspectElement('.header-bottom'),
      sportsTab: inspectElement('.sports-tab'),
      betTable: inspectElement('.bet-table'),
      betTableHeader: inspectElement('.bet-table-header'),
      betTableRow: inspectElement('.bet-table-row'),
      oddBoxBack: inspectElement('.odd-box.back'),
      oddBoxLay: inspectElement('.odd-box.lay'),
      htmlSnippets: {
        headerTopHtml: headerEl ? headerEl.outerHTML.substring(0, 1500) : '',
        navHtml: navEl ? navEl.outerHTML.substring(0, 1000) : '',
        sportsTabHtml: sportsTabEl ? sportsTabEl.outerHTML.substring(0, 1000) : '',
        firstMatchHtml: firstMatchEl ? firstMatchEl.outerHTML.substring(0, 1500) : ''
      }
    };
  });

  fs.writeFileSync('scratch_mobile_details_360.json', JSON.stringify(mobileDetails, null, 2));
  console.log('Saved scratch_mobile_details_360.json');

  await browser.close();
})();
