const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUTPUT_DIR = 'C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/site_inspection';

async function run() {
  console.log('Launching browser...');
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

    // Listen to network responses to catch the demo login API
    page.on('response', async (res) => {
      const url = res.url();
      if (url.includes('login') || url.includes('demo') || url.includes('api')) {
        console.log(`[API ${res.status()}] ${res.request().method()} ${url}`);
        try {
          const text = await res.text();
          if (text.length < 500) {
            console.log('  Response:', text);
          } else {
            console.log('  Response length:', text.length);
          }
        } catch(e){}
      }
    });

    console.log('Navigating to https://bestbet9.now/ ...');
    await page.goto('https://bestbet9.now/', { waitUntil: 'networkidle2', timeout: 45000 });
    
    // Wait for the buttons to render
    await page.waitForSelector('.btn', { timeout: 10000 });
    console.log('Buttons rendered on page!');

    // Specifically click the "Login with demo ID" button
    console.log('Clicking the "Login with demo ID" button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const demoBtn = buttons.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
      if (demoBtn) {
        demoBtn.click();
      } else {
        console.log('Could not find demo button among buttons:', buttons.map(b => b.innerText));
      }
    });

    // Wait for navigation or modal or dashboard
    console.log('Waiting 8s for dashboard navigation...');
    await new Promise(r => setTimeout(r, 8000));

    console.log('Current URL:', page.url());
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_demo_dashboard_live.png') });
    console.log('Saved 03_demo_dashboard_live.png');

    const dashboardHtml = await page.content();
    fs.writeFileSync(path.join(OUTPUT_DIR, 'dashboard_live.html'), dashboardHtml);

    // Extract all navigation links, sidebar items, tabs, sports categories, casino games
    const structure = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button')).map(el => ({
        tag: el.tagName,
        text: (el.innerText || '').trim().replace(/\s+/g, ' '),
        href: el.href || '',
        className: el.className || ''
      })).filter(x => x.text && x.text.length < 50);

      const navbars = Array.from(document.querySelectorAll('nav, header, aside, .sidebar, .navbar, .menu, .header')).map(el => ({
        tag: el.tagName,
        className: el.className,
        text: (el.innerText || '').trim().replace(/\s+/g, ' ')
      }));

      const bodyStyle = window.getComputedStyle(document.body);

      return {
        url: window.location.href,
        title: document.title,
        bodyBg: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        linksCount: links.length,
        links: links.slice(0, 100),
        navbars: navbars
      };
    });

    fs.writeFileSync(path.join(OUTPUT_DIR, 'structure.json'), JSON.stringify(structure, null, 2));
    console.log('Structure extracted:', structure.title, structure.url, 'Links:', structure.linksCount);

  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

run();
