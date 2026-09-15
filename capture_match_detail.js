const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUTPUT_DIR = 'C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/site_inspection';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      '--window-size=1440,900'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://bestbet9.now/', { waitUntil: 'networkidle2', timeout: 45000 });
    
    await page.waitForSelector('.btn', { timeout: 10000 });
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const demoBtn = buttons.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
      if (demoBtn) demoBtn.click();
    });

    await new Promise(r => setTimeout(r, 6000));

    // Navigate to game-details
    console.log('Navigating to /game-details/4/700865949 ...');
    await page.goto('https://bestbet9.now/game-details/4/700865949', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000));

    await page.screenshot({ path: path.join(OUTPUT_DIR, '12_match_detail_view.png') });
    console.log('Saved 12_match_detail_view.png');

    const matchHtml = await page.content();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'match_details.html'), matchHtml);

  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

run();
