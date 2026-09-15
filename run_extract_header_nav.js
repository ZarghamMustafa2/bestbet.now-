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
  });
  await new Promise(r => setTimeout(r, 1000));

  const headerNav = await page.evaluate(() => {
    const header = document.querySelector('header, .header, .top-header, nav');
    const items = [];
    document.querySelectorAll('header *, .header *, .header-top *, .header-bottom *, .navbar *').forEach(el => {
      const text = (el.innerText || '').trim();
      if (el.children.length === 0 && text.length > 0) {
        const s = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        items.push({
          tag: el.tagName,
          className: el.className,
          text: text,
          rect: { x: Math.round(rect.x * 10) / 10, y: Math.round(rect.y * 10) / 10, width: Math.round(rect.width * 10) / 10, height: Math.round(rect.height * 10) / 10 },
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing,
          color: s.color,
          textTransform: s.textTransform
        });
      }
    });
    return items;
  });

  fs.writeFileSync('scratch_header_nav_typography.json', JSON.stringify(headerNav, null, 2));
  console.log('Extracted header & nav items:', headerNav.length);
  await browser.close();
})();
