const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUTPUT_DIR = 'C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/site_inspection';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false, // Launch with GUI window so Cloudflare challenge passes seamlessly!
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

    // Log console messages
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    console.log('Navigating to https://bestbet9.now/ ...');
    await page.goto('https://bestbet9.now/', { waitUntil: 'networkidle2', timeout: 45000 });
    
    // Give a short pause for rendering
    await new Promise(r => setTimeout(r, 4000));

    // Save login screenshot
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_login_page.png') });
    console.log('Saved 01_login_page.png');
    
    // Dump login page HTML
    const loginHtml = await page.content();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'login.html'), loginHtml);
    console.log('Saved login.html');

    // Look for demo button
    console.log('Looking for demo login button...');
    const demoBtn = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, div, span, input[type="button"]'));
      for (const el of elements) {
        if (el.innerText && el.innerText.toLowerCase().includes('demo')) {
          return {
            text: el.innerText,
            tagName: el.tagName,
            className: el.className,
            id: el.id
          };
        }
      }
      return null;
    });
    console.log('Demo button info:', JSON.stringify(demoBtn));

    // Click demo button
    const clicked = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, div, span, input[type="button"]'));
      for (const el of elements) {
        if (el.innerText && el.innerText.toLowerCase().includes('demo')) {
          el.click();
          return true;
        }
      }
      return false;
    });
    console.log('Demo button clicked:', clicked);

    // Wait for navigation / response
    console.log('Waiting 10s after demo click for dashboard to load...');
    await new Promise(r => setTimeout(r, 10000));

    console.log('Current URL after demo login:', page.url());
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_after_demo_dashboard.png'), fullPage: false });
    console.log('Saved 02_after_demo_dashboard.png');

    const afterDemoHtml = await page.content();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'dashboard.html'), afterDemoHtml);

    // Inspect navigation, menus, sections, and sports/casino tabs
    const pageStructure = await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll('a, button, .nav-item, .nav-link')).map(a => ({
        text: (a.innerText || '').trim().replace(/\s+/g, ' '),
        href: a.href || '',
        className: a.className || ''
      })).filter(l => l.text && l.text.length < 50);

      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, .title, .header')).map(h => ({
        tag: h.tagName,
        text: h.innerText.trim().replace(/\s+/g, ' ')
      })).filter(h => h.text && h.text.length < 60);

      // Colors and fonts computed
      const bodyStyle = window.getComputedStyle(document.body);
      const headerEl = document.querySelector('header, nav, .header, .navbar');
      const headerStyle = headerEl ? window.getComputedStyle(headerEl) : null;

      return {
        title: document.title,
        url: window.location.href,
        navLinks: navLinks.slice(0, 50),
        headings: headings.slice(0, 30),
        bodyFont: bodyStyle.fontFamily,
        bodyBg: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        headerBg: headerStyle ? headerStyle.backgroundColor : null
      };
    });

    fs.writeFileSync(path.join(OUTPUT_DIR, 'dashboard_structure.json'), JSON.stringify(pageStructure, null, 2));
    console.log('Dashboard structure saved successfully!');

  } catch (err) {
    console.error('Error during inspection:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

run();
