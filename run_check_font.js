const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function check() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1024,600'],
    defaultViewport: { width: 1024, height: 600 }
  });

  const page = await browser.newPage();
  const cdp = await page.target().createCDPSession();
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');

  const url = 'file:///' + path.resolve('e:/bestbet.now/home.html').replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const fontStatus = await page.evaluate(() => {
    const loaded = [];
    document.fonts.forEach(f => {
      loaded.push({ family: f.family, weight: f.weight, status: f.status });
    });
    return {
      documentFonts: loaded,
      isRobotoCondensedLoaded: document.fonts.check('16px "Roboto Condensed"'),
      isBoldRobotoCondensedLoaded: document.fonts.check('bold 16px "Roboto Condensed"'),
      bodyFont: window.getComputedStyle(document.body).fontFamily
    };
  });

  console.log('Local Font Status:', JSON.stringify(fontStatus, null, 2));

  // Check platform font used for .header-bottom .nav-link
  try {
    const { root } = await cdp.send('DOM.getDocument');
    const nodeRes = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.nav-link' });
    if (nodeRes.nodeId) {
      const fontRes = await cdp.send('CSS.getPlatformFontsForNode', { nodeId: nodeRes.nodeId });
      console.log('Platform font for .nav-link:', fontRes.fonts);
    }
  } catch (e) {
    console.error('CDP font error:', e);
  }

  await browser.close();
}

check();
