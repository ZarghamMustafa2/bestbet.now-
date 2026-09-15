const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUTPUT_DIR = 'C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/site_inspection';

async function run() {
  console.log('Launching browser at 1024x768...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1024,800'
    ],
    defaultViewport: { width: 1024, height: 768 }
  });

  try {
    const page = await browser.newPage();
    console.log('Navigating to https://bestbet9.now/ ...');
    await page.goto('https://bestbet9.now/', { waitUntil: 'networkidle2', timeout: 45000 });
    
    // Login with demo ID
    console.log('Clicking "Login with demo ID"...');
    await page.waitForSelector('button', { timeout: 10000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const btn = btns.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
      if (btn) btn.click();
    });

    console.log('Waiting for URL to include /home...');
    await page.waitForFunction(() => window.location.href.includes('home'), { timeout: 20000 });
    await new Promise(r => setTimeout(r, 4000));

    // Close modal
    console.log('Closing modal popup...');
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('.modal .btn-close, .modal .close, button.close, [aria-label="Close"], div[role="dialog"] button'));
      for (const btn of closeBtns) btn.click();
      const modal = document.querySelector('.modal');
      if (modal) modal.classList.remove('show');
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
    });

    await new Promise(r => setTimeout(r, 2000));

    // Take screenshot at 1024 width
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'ref_at_1024.png') });
    console.log('Saved ref_at_1024.png');

    // Extract exact computed styles and measurements of all components at 1024
    const metrics = await page.evaluate(() => {
      function getMetrics(sel) {
        const el = document.querySelector(sel);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return {
          selector: sel,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
          color: s.color,
          backgroundColor: s.backgroundColor,
          border: s.border,
          margin: s.margin,
          padding: s.padding,
          display: s.display
        };
      }

      return {
        header: getMetrics('.header'),
        headerTop: getMetrics('.header-top'),
        logo: getMetrics('.logo-header img'),
        searchBox: getMetrics('.search-box-container'),
        rules: getMetrics('.header-rules'),
        balance: getMetrics('.user-balance'),
        userDropdown: getMetrics('.dropdown .user-name'),
        categoryNav: getMetrics('.header-bottom'),
        categoryNavItems: Array.from(document.querySelectorAll('.header-bottom .nav-link')).map(el => ({
          text: el.innerText.trim(),
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
          padding: window.getComputedStyle(el).padding,
          fontSize: window.getComputedStyle(el).fontSize,
          fontWeight: window.getComputedStyle(el).fontWeight
        })),
        sidebar: getMetrics('.sidebar.left-sidebar'),
        accordionHeader: getMetrics('.sidebar .accordion-button'),
        sidebarItem: getMetrics('.sidebar .accordion-body .nav-link'),
        latestEvent: getMetrics('.latest-event'),
        latestEventItems: Array.from(document.querySelectorAll('.latest-event .latest-event-item')).map(el => ({
          text: el.innerText.trim(),
          rect: el.getBoundingClientRect(),
          styles: {
            backgroundColor: window.getComputedStyle(el).backgroundColor,
            borderRadius: window.getComputedStyle(el).borderRadius,
            margin: window.getComputedStyle(el).margin,
            padding: window.getComputedStyle(el).padding
          }
        })),
        sportsTab: getMetrics('.sports-tab'),
        sportsTabItems: Array.from(document.querySelectorAll('.sports-tab .nav-link')).map(el => ({
          text: el.innerText.trim(),
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height
        })),
        betTableHeader: getMetrics('.bet-table-header'),
        betTableNationName: getMetrics('.bet-table-header .bet-nation-name'),
        betTableNationOdds: Array.from(document.querySelectorAll('.bet-table-header .bet-nation-odd')).map(el => ({
          text: el.innerText.trim(),
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height
        })),
        betTableRow: getMetrics('.bet-table-row'),
        oddBoxBack: getMetrics('.bet-table-row .back.odd-box'),
        oddBoxLay: getMetrics('.bet-table-row .lay.odd-box')
      };
    });

    fs.writeFileSync(path.join(OUTPUT_DIR, 'metrics_1024.json'), JSON.stringify(metrics, null, 2));
    console.log('Saved metrics_1024.json');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

run();
