const puppeteer = require('puppeteer-core');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function run() {
  console.log('Launching browser to inspect exact fonts on https://bestbet9.now/ ...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1280,900'
    ],
    defaultViewport: { width: 1280, height: 900 }
  });

  try {
    const page = await browser.newPage();
    const cdp = await page.target().createCDPSession();
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');

    console.log('Navigating to https://bestbet9.now/ ...');
    await page.goto('https://bestbet9.now/', { waitUntil: 'networkidle2', timeout: 60000 });

    // Inspect login page fonts first
    console.log('\n=== LOGIN PAGE FONTS ===');
    const loginFontFaces = await page.evaluate(() => {
      const faces = [];
      document.fonts.forEach(f => {
        faces.push({ family: f.family, status: f.status, weight: f.weight, style: f.style });
      });
      return faces;
    });
    console.log('document.fonts on login:', loginFontFaces);

    // Login with demo ID
    console.log('Clicking demo login...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const btn = btns.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 6000));

    // Dismiss modal
    await page.evaluate(() => {
      const closeBtns = Array.from(document.querySelectorAll('.modal .btn-close, .modal .close, button.close, [aria-label="Close"], div[role="dialog"] button'));
      for (const btn of closeBtns) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    console.log('\n=== DASHBOARD FONTS ===');
    const dashFontFaces = await page.evaluate(() => {
      const faces = [];
      document.fonts.forEach(f => {
        faces.push({ family: f.family, status: f.status, weight: f.weight, style: f.style });
      });
      return faces;
    });
    console.log('document.fonts on dashboard:', dashFontFaces);

    // Detailed typography inspection for all key elements
    const elementsToInspect = [
      { name: 'Body', sel: 'body' },
      { name: 'Rules link', sel: '.rules-link' },
      { name: 'Balance text', sel: '.user-balance' },
      { name: 'Balance number', sel: '.user-balance b' },
      { name: 'Demo dropdown', sel: '.user-name' },
      { name: 'Category HOME', sel: '.header-bottom .nav-link' },
      { name: 'Category CRASH', sel: '.header-bottom .aviator .nav-link' },
      { name: 'Sidebar Title', sel: '.sidebar-title button, .sidebar-title' },
      { name: 'Sidebar Link', sel: '.sidebar .accordion-body .nav-link, .sidebar .nav-link' },
      { name: 'Event Card Ticker', sel: '.latest-event-item a' },
      { name: 'Sports Tab Active', sel: '.sports-tab .nav-link.active' },
      { name: 'Sports Tab Inactive', sel: '.sports-tab .nav-link:not(.active)' },
      { name: 'Bet Table Header Game', sel: '.bet-table-header .bet-nation-name' },
      { name: 'Bet Table Header Odd', sel: '.bet-table-header .bet-nation-odd' },
      { name: 'Bet Match Name', sel: '.bet-nation-game-name' },
      { name: 'Odd Box Back', sel: '.odd-box.back, .back.odd-box' },
      { name: 'Odd Box Lay', sel: '.odd-box.lay, .lay.odd-box' }
    ];

    const elementReport = [];

    for (const item of elementsToInspect) {
      const info = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const s = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          fontFamily: s.fontFamily,
          fontWeight: s.fontWeight,
          fontSize: s.fontSize,
          lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing,
          fontStretch: s.fontStretch,
          fontStyle: s.fontStyle,
          textTransform: s.textTransform,
          color: s.color,
          renderedWidth: rect.width,
          renderedHeight: rect.height,
          text: el.innerText.trim().replace(/\s+/g, ' ')
        };
      }, item.sel);

      // Get platform font via CDP
      let platformFont = 'N/A';
      try {
        const { root } = await cdp.send('DOM.getDocument');
        const nodeRes = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: item.sel });
        if (nodeRes.nodeId) {
          const fontRes = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: nodeRes.nodeId });
          if (fontRes.fonts && fontRes.fonts.length > 0) {
            platformFont = fontRes.fonts.map(f => `${f.familyName} (${f.glyphCount} glyphs)`).join(', ');
          }
        }
      } catch (e) {
        platformFont = 'CDP Error: ' + e.message;
      }

      elementReport.push({
        element: item.name,
        selector: item.sel,
        platformFont: platformFont,
        ...info
      });
    }

    fs.writeFileSync('C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/site_inspection/typography_deep_audit.json', JSON.stringify(elementReport, null, 2));
    console.log('Saved typography_deep_audit.json successfully!');

  } catch (err) {
    console.error('Audit error:', err);
  } finally {
    await browser.close();
  }
}

run();
