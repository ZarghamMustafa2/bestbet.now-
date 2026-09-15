const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUTPUT_DIR = 'C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/site_inspection/mobile';

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568, isMobile: true },
  { name: '360x800', width: 360, height: 800, isMobile: true },
  { name: '375x812', width: 375, height: 812, isMobile: true },
  { name: '390x844', width: 390, height: 844, isMobile: true },
  { name: '414x896', width: 414, height: 896, isMobile: true },
  { name: '768x1024', width: 768, height: 1024, isMobile: false },
  { name: '1024x768', width: 1024, height: 768, isMobile: false },
  { name: '1280x800', width: 1280, height: 800, isMobile: false }
];

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('Launching browser to inspect live site at all requested viewports...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      '--window-size=1280,1000'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // 1. Capture Login Page at viewports
    console.log('Navigating to https://bestbet9.now/ ...');
    await page.goto('https://bestbet9.now/', { waitUntil: 'networkidle2', timeout: 60000 });

    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile, hasTouch: vp.isMobile });
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(OUTPUT_DIR, `ref_login_${vp.name}.png`) });
      console.log(`Saved login screenshot: ref_login_${vp.name}.png`);
    }

    // 2. Perform Demo Login
    console.log('Logging in with Demo ID...');
    await page.setViewport({ width: 1280, height: 800, isMobile: false });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const demo = btns.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
      if (demo) demo.click();
    });

    // Wait until URL becomes /home
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 1000));
      if (page.url().includes('home')) {
        console.log('Successfully arrived at /home!');
        break;
      }
    }

    await new Promise(r => setTimeout(r, 3000));

    // Dismiss modal popup
    await page.evaluate(() => {
      document.querySelectorAll('.modal, .modal-backdrop, [role="dialog"]').forEach(m => m.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = 'auto';
    });
    await new Promise(r => setTimeout(r, 1000));

    const auditResults = {};

    // 3. Capture Home Dashboard at each viewport
    for (const vp of VIEWPORTS) {
      console.log(`Setting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile, hasTouch: vp.isMobile });
      await new Promise(r => setTimeout(r, 1500));

      // Dismiss any popups that re-appeared on resize
      await page.evaluate(() => {
        document.querySelectorAll('.modal, .modal-backdrop, [role="dialog"]').forEach(m => m.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
      });

      const screenshotPath = path.join(OUTPUT_DIR, `ref_home_${vp.name}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`Saved screenshot: ref_home_${vp.name}.png`);

      // Extract layout metrics
      const metrics = await page.evaluate((vpName) => {
        function getRect(sel) {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const s = window.getComputedStyle(el);
          return {
            visible: s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0,
            x: Math.round(r.x),
            y: Math.round(r.y),
            width: Math.round(r.width * 10) / 10,
            height: Math.round(r.height * 10) / 10,
            display: s.display,
            fontSize: s.fontSize,
            lineHeight: s.lineHeight
          };
        }

        // Fixed bottom bars
        const fixedBars = Array.from(document.querySelectorAll('*')).filter(el => {
          const s = window.getComputedStyle(el);
          return s.position === 'fixed' && (s.bottom === '0px' || parseInt(s.bottom) <= 5);
        }).map(el => ({
          tag: el.tagName,
          className: el.className,
          text: (el.innerText || '').trim().replace(/\s+/g, ' ').substring(0, 80),
          height: el.getBoundingClientRect().height
        }));

        // Check sidebar state
        const sidebar = document.querySelector('.sidebar, aside, [class*="sidebar"]');
        let sidebarInfo = null;
        if (sidebar) {
          const s = window.getComputedStyle(sidebar);
          const r = sidebar.getBoundingClientRect();
          sidebarInfo = {
            display: s.display,
            position: s.position,
            width: Math.round(r.width),
            height: Math.round(r.height),
            visible: s.display !== 'none' && r.width > 0 && r.x >= 0
          };
        }

        // Hamburger icon
        const hamburger = document.querySelector('.fa-bars, [class*="menu-icon"], .navbar-toggler, .header-top .fa-bars');

        return {
          viewport: vpName,
          header: getRect('header, .header'),
          headerTop: getRect('.header-top'),
          logo: getRect('.logo-header img, header img'),
          searchBox: getRect('header input, .search-box, .search-icon-btn, a[title="Search"]'),
          balance: getRect('.user-balance'),
          demoDropdown: getRect('.user-name, .user-dropdown'),
          categoryNav: getRect('.header-bottom, .category-nav, nav.navbar'),
          sportsTab: getRect('.sports-tab, .nav-tabs'),
          betTable: getRect('.bet-table, table, .table'),
          betTableRow1: getRect('.bet-table-row, tbody tr:first-child'),
          sidebar: sidebarInfo,
          hamburgerVisible: !!(hamburger && window.getComputedStyle(hamburger).display !== 'none'),
          fixedBars: fixedBars
        };
      }, vp.name);

      auditResults[vp.name] = metrics;
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, 'mobile_audit_data.json'), JSON.stringify(auditResults, null, 2));
    console.log('Successfully written mobile_audit_data.json!');

  } catch (err) {
    console.error('Error in multi-viewport audit:', err);
  } finally {
    await browser.close();
  }
})();
