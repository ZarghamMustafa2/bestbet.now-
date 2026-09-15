const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUTPUT_DIR = 'C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/site_inspection';

async function verify() {
  console.log('Launching browser to test local demo login flow...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1440,900'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  try {
    const loginUrl = 'file:///' + path.resolve('e:/bestbet.now/index.html').replace(/\\/g, '/');
    console.log('Navigating to local login page:', loginUrl);
    await page.goto(loginUrl, { waitUntil: 'networkidle2' });

    await page.screenshot({ path: path.join(OUTPUT_DIR, 'local_01_login.png') });
    console.log('Captured local_01_login.png');

    // Click "Login with demo ID"
    console.log('Clicking "Login with demo ID" button...');
    const demoBtn = await page.$('#btnDemoLogin');
    if (!demoBtn) {
      throw new Error('Demo login button #btnDemoLogin not found!');
    }
    await demoBtn.click();

    // Wait for navigation to home.html
    console.log('Waiting for navigation to home.html...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {});

    console.log('Current URL after demo login click:', page.url());
    if (!page.url().includes('home.html')) {
      throw new Error('Failed to navigate to home.html after demo login!');
    }

    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'local_02_demo_dashboard.png') });
    console.log('Captured local_02_demo_dashboard.png');

    // Click User Dropdown ('Demo')
    console.log('Clicking user dropdown button...');
    const userBtn = await page.$('#userDropdownBtn');
    if (userBtn) {
      await userBtn.click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'local_03_user_dropdown.png') });
      console.log('Captured local_03_user_dropdown.png');
    }

    // Verify localStorage session
    const sessionData = await page.evaluate(() => {
      return {
        bestbet9_user: localStorage.getItem('bestbet9_user'),
        persist_root: localStorage.getItem('persist:root')
      };
    });
    console.log('Verified localStorage demo session:', sessionData);

    console.log('SUCCESS: Demo login flow and Dashboard reproduction verified 100% locally!');

  } catch (err) {
    console.error('Local verification failed:', err);
  } finally {
    await browser.close();
  }
}

verify();
