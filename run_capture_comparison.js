const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUTPUT_DIR = 'C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/site_inspection';

async function run() {
  console.log('Launching browser at 1024x530 for direct comparison...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1024,600'
    ],
    defaultViewport: { width: 1024, height: 530 }
  });

  try {
    const page = await browser.newPage();
    const url = 'file:///' + path.resolve('e:/bestbet.now/home.html').replace(/\\/g, '/');
    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Capture screenshot at 1024x530
    const outPath = path.join(OUTPUT_DIR, 'local_perfect_1024.png');
    await page.screenshot({ path: outPath });
    console.log('Saved local_perfect_1024.png');

    // Extract exact rendered bounding boxes
    const data = await page.evaluate(() => {
      const getB = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.getBoundingClientRect() : null;
      };

      const eventCards = Array.from(document.querySelectorAll('.latest-event-item')).map(el => {
        const r = el.getBoundingClientRect();
        return { text: el.innerText.trim(), x: r.x, y: r.y, w: r.width, h: r.height };
      });

      return {
        header: getB('.header-top'),
        logo: getB('.logo-header img'),
        searchIcon: getB('.search-icon-btn'),
        rules: getB('.header-rules'),
        balance: getB('.user-balance'),
        userDropdown: getB('.user-dropdown'),
        categoryNav: getB('.header-bottom'),
        sidebar: getB('.sidebar.left-sidebar'),
        eventCards: eventCards,
        sportsTabs: getB('.sports-tab'),
        tableHeader: getB('.bet-table-header'),
        firstRow: getB('.bet-table-row'),
        firstBackBox: getB('.bet-table-row .odd-box.back'),
        firstLayBox: getB('.bet-table-row .odd-box.lay')
      };
    });

    console.log('Rendered bounding boxes:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
    console.log('Done.');
  }
}

run();
