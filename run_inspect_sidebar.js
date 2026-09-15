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
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      '--window-size=1280,900'
    ],
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  await page.goto('https://bestbet9.now/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const demo = btns.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
    if (demo) demo.click();
  });
  await new Promise(r => setTimeout(r, 6000));
  await page.evaluate(() => {
    document.querySelectorAll('.modal, .modal-backdrop, [role="dialog"]').forEach(m => m.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({ path: 'scratch_live_1280_sidebar.png' });

  const sidebarTypography = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar, aside, [class*="sidebar"]');
    if (!sidebar) return { found: false };
    const items = [];
    sidebar.querySelectorAll('*').forEach(el => {
      const text = (el.innerText || '').trim();
      if (el.children.length === 0 && text.length > 0) {
        const s = window.getComputedStyle(el);
        items.push({
          tag: el.tagName,
          className: el.className,
          text: text.substring(0, 40),
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing,
          color: s.color
        });
      }
    });
    return { found: true, items };
  });

  fs.writeFileSync('scratch_sidebar_typography.json', JSON.stringify(sidebarTypography, null, 2));
  console.log('Sidebar found:', sidebarTypography.found, 'items:', sidebarTypography.items ? sidebarTypography.items.length : 0);
  await browser.close();
})();
