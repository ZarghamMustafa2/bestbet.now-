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
      '--window-size=1024,800'
    ],
    defaultViewport: { width: 1024, height: 600 }
  });

  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.goto('https://bestbet9.now/', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const demo = btns.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
    if (demo) demo.click();
  });
  await new Promise(r => setTimeout(r, 6000));

  // Dismiss modal
  await page.evaluate(() => {
    const modals = document.querySelectorAll('.modal, .modal-backdrop, [role="dialog"]');
    modals.forEach(m => m.remove());
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto';
  });

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'scratch_live_clean_1024.png' });
  console.log('Saved scratch_live_clean_1024.png');

  // Extract every text element and computed styles
  const typography = await page.evaluate(() => {
    const textNodes = [];
    const walk = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const s = window.getComputedStyle(node);
        if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return;
        
        const directText = Array.from(node.childNodes)
          .filter(n => n.nodeType === Node.TEXT_NODE)
          .map(n => n.nodeValue.trim())
          .join(' ');
        
        if (directText && directText.length > 0) {
          const rect = node.getBoundingClientRect();
          textNodes.push({
            tag: node.tagName,
            id: node.id || '',
            className: typeof node.className === 'string' ? node.className : '',
            text: directText.substring(0, 60),
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
        for (const child of node.children) {
          walk(child);
        }
      }
    };
    walk(document.body);
    return textNodes;
  });

  fs.writeFileSync('scratch_live_typography.json', JSON.stringify(typography, null, 2));
  console.log('Extracted typography items:', typography.length);

  // Also get the outer HTML of the main page elements
  const structure = await page.evaluate(() => {
    return {
      headerHtml: document.querySelector('header, .header, .top-header, nav')?.outerHTML?.substring(0, 1000) || '',
      bodyClasses: document.body.className,
      mainClasses: Array.from(document.body.children).map(c => ({ tag: c.tagName, class: c.className, id: c.id }))
    };
  });
  fs.writeFileSync('scratch_live_structure.json', JSON.stringify(structure, null, 2));

  await browser.close();
})();
