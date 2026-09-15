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

    // Go to casino-list
    console.log('Navigating to /casino-list ...');
    await page.goto('https://bestbet9.now/casino-list', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09_our_casino_page.png') });
    console.log('Saved 09_our_casino_page.png');

    // Go to a match
    console.log('Navigating to home...');
    await page.goto('https://bestbet9.now/home', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.evaluate(() => {
      const closeButtons = Array.from(document.querySelectorAll('.modal .btn-close, .modal .close, button.close, [aria-label="Close"]'));
      for (const btn of closeButtons) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Find and click the first cricket match link
    const matchUrl = await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('td a, .game-name a')).find(a => a.href && a.href.includes('match') || a.href.includes('game') || a.href.includes('event'));
      return link ? link.href : null;
    });

    console.log('Found match URL:', matchUrl);
    if (matchUrl) {
      await page.goto(matchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: path.join(OUTPUT_DIR, '10_match_market_page.png') });
      console.log('Saved 10_match_market_page.png');
    } else {
      // Click on table row text
      await page.evaluate(() => {
        const tr = document.querySelector('tbody tr td');
        if (tr) tr.click();
      });
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: path.join(OUTPUT_DIR, '10_match_market_page.png') });
    }

  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
}

run();
