const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUTPUT_DIR = 'C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/site_inspection';

async function run() {
  console.log('Launching browser for in-depth inspection...');
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

    console.log('Navigating and logging in with demo ID...');
    await page.goto('https://bestbet9.now/', { waitUntil: 'networkidle2', timeout: 45000 });
    
    await page.waitForSelector('.btn', { timeout: 10000 });
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const demoBtn = buttons.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
      if (demoBtn) demoBtn.click();
    });

    console.log('Waiting for dashboard...');
    await new Promise(r => setTimeout(r, 6000));

    // Close the welcome modal popup
    console.log('Closing modal popup...');
    await page.evaluate(() => {
      const closeButtons = Array.from(document.querySelectorAll('.modal .btn-close, .modal .close, button.close, [aria-label="Close"], .modal-header button, div[role="dialog"] button'));
      for (const btn of closeButtons) {
        btn.click();
      }
      // Also click backdrop or escape
      const modal = document.querySelector('.modal.show, .fade.modal.show');
      if (modal) {
        const xBtn = modal.querySelector('button');
        if (xBtn) xBtn.click();
      }
    });

    await new Promise(r => setTimeout(r, 2000));

    // Take clean dashboard screenshot
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_clean_dashboard.png') });
    console.log('Saved 04_clean_dashboard.png');

    // Click User Dropdown ('Demo')
    console.log('Opening user dropdown...');
    const dropdownOpened = await page.evaluate(() => {
      const userEl = Array.from(document.querySelectorAll('a, button, div, span')).find(el => el.innerText && el.innerText.trim().startsWith('Demo'));
      if (userEl) {
        userEl.click();
        return true;
      }
      return false;
    });
    console.log('User dropdown clicked:', dropdownOpened);
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_user_dropdown.png') });
    console.log('Saved 05_user_dropdown.png');

    // Extract dropdown menu items
    const userMenuItems = await page.evaluate(() => {
      const menus = Array.from(document.querySelectorAll('.dropdown-menu.show, .dropdown-menu, ul[aria-labelledby]'));
      return menus.map(m => Array.from(m.querySelectorAll('a, button, li')).map(item => item.innerText.trim())).flat();
    });
    console.log('User menu items:', userMenuItems);

    // Navigate to Casino page (/casino-list or click Casino)
    console.log('Navigating to Casino page...');
    await page.evaluate(() => {
      const casinoLink = Array.from(document.querySelectorAll('a')).find(a => a.innerText && (a.innerText.includes('Our Casino') || a.innerText.includes('Casino')));
      if (casinoLink) casinoLink.click();
    });
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06_casino_page.png') });
    console.log('Saved 06_casino_page.png');

    // Navigate to Aviator page
    console.log('Navigating to /aviator-list ...');
    await page.goto('https://bestbet9.now/aviator-list', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07_aviator_page.png') });
    console.log('Saved 07_aviator_page.png');

    // Navigate to Cricket match detail / market page
    console.log('Navigating back to home and clicking first match...');
    await page.goto('https://bestbet9.now/home', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    
    // Close modal if appeared
    await page.evaluate(() => {
      const closeBtn = document.querySelector('.modal .btn-close, .modal .close, button.close, [aria-label="Close"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Click first game row / link
    const clickedMatch = await page.evaluate(() => {
      const gameRow = document.querySelector('.table tbody tr a, .game-name a, td a');
      if (gameRow) {
        gameRow.click();
        return gameRow.innerText;
      }
      return null;
    });
    console.log('Clicked match:', clickedMatch);
    await new Promise(r => setTimeout(r, 4000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_match_detail_page.png') });
    console.log('Saved 08_match_detail_page.png');

    console.log('All in-depth inspection screenshots captured successfully!');

  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

run();
