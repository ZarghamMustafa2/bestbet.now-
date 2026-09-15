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

    // Close modal
    await page.evaluate(() => {
      const closeButtons = Array.from(document.querySelectorAll('.modal .btn-close, .modal .close, button.close, [aria-label="Close"]'));
      for (const btn of closeButtons) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Click on match text specifically: "England v Sri Lanka" or any text in the table
    console.log('Clicking on match...');
    const clickedMatch = await page.evaluate(() => {
      const tdList = Array.from(document.querySelectorAll('table td, table td a, table td span, .game-name'));
      const matchTd = tdList.find(el => el.innerText && el.innerText.includes('England v Sri Lanka'));
      if (matchTd) {
        matchTd.click();
        return matchTd.innerText;
      }
      // fallback
      const firstRow = document.querySelector('tbody tr');
      if (firstRow) {
        const firstTd = firstRow.querySelector('td');
        if (firstTd) {
          firstTd.click();
          return firstTd.innerText;
        }
      }
      return null;
    });

    console.log('Clicked match result:', clickedMatch);
    await new Promise(r => setTimeout(r, 5000));

    console.log('Current URL after match click:', page.url());
    await page.screenshot({ path: path.join(OUTPUT_DIR, '10_match_market_page.png') });
    console.log('Saved 10_match_market_page.png');

    // Click on an odds box to see betting slip popup
    console.log('Clicking an odds box to test betting slip...');
    const betBoxClicked = await page.evaluate(() => {
      const oddsBox = document.querySelector('.back, .lay, .btn-back, .btn-lay, td[class*="back"], td[class*="lay"], .odds-box, button.back');
      if (oddsBox) {
        oddsBox.click();
        return true;
      }
      return false;
    });
    console.log('Bet box clicked:', betBoxClicked);
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '11_betslip_active.png') });
    console.log('Saved 11_betslip_active.png');

  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

run();
