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

  await page.setViewport({ width: 375, height: 812, isMobile: true });
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

  // Click hamburger
  await page.evaluate(() => {
    const burger = document.querySelector('.fa-bars, [class*="navbar-toggler"], [class*="menu-icon"]');
    if (burger) {
      const target = burger.closest('button, a, div') || burger;
      target.click();
    }
  });

  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'scratch_mobile_hamburger_drawer.png' });
  console.log('Saved scratch_mobile_hamburger_drawer.png');

  // Inspect drawer DOM
  const drawerInfo = await page.evaluate(() => {
    const activeDrawers = Array.from(document.querySelectorAll('.sidebar, .offcanvas, .drawer, [class*="sidebar"], [class*="offcanvas"]')).map(el => {
      const s = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        className: el.className,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        display: s.display,
        position: s.position,
        zIndex: s.zIndex,
        transform: s.transform
      };
    });
    return activeDrawers;
  });

  fs.writeFileSync('scratch_drawer_info.json', JSON.stringify(drawerInfo, null, 2));
  console.log('Drawer info saved.');
  await browser.close();
})();
