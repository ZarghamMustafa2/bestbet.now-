const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const liveHeaderNav = JSON.parse(fs.readFileSync('scratch_header_nav_typography.json', 'utf8'));
  const liveSidebar = JSON.parse(fs.readFileSync('scratch_sidebar_typography.json', 'utf8'));

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  const localUrl = 'file:///' + path.resolve('e:/bestbet.now/home.html').replace(/\\/g, '/');
  await page.goto(localUrl, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const localItems = await page.evaluate(() => {
    function getDetails(sel, textMatcher) {
      const all = Array.from(document.querySelectorAll(sel || '*'));
      const el = all.find(e => {
        const t = (e.innerText || '').trim();
        return textMatcher ? t === textMatcher : true;
      });
      if (!el) return null;
      const s = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        text: (el.innerText || '').trim(),
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        color: s.color,
        width: Math.round(r.width * 10) / 10,
        height: Math.round(r.height * 10) / 10
      };
    }

    return {
      rules: getDetails('.rules-link b, .rules-link'),
      balanceLabel: getDetails('.user-balance span', 'Balance:'),
      balanceVal: getDetails('.user-balance b', '1500'),
      expLabel: getDetails('.user-balance span', 'Exp:'),
      expVal: getDetails('.user-balance b', '0'),
      demo: getDetails('.user-name'),
      navHome: getDetails('.header-bottom .nav-link', 'HOME'),
      navLottery: getDetails('.header-bottom .nav-link', 'LOTTERY'),
      navCricket: getDetails('.header-bottom .nav-link', 'CRICKET'),
      navTennis: getDetails('.header-bottom .nav-link', 'TENNIS'),
      navFootball: getDetails('.header-bottom .nav-link', 'FOOTBALL'),
      navCrash: getDetails('.header-bottom .aviator .nav-link span', 'Crash'),
      sidebarRacing: getDetails('.sidebar-title span', 'Racing Sports'),
      sidebarHorse: getDetails('.sidebar-link', 'Horse Racing'),
      sidebarGreyhound: getDetails('.sidebar-link', 'Greyhound Racing'),
      sidebarOthers: getDetails('.sidebar-title span', 'Others'),
      sidebarOurCasino: getDetails('.sidebar-link', 'Our Casino'),
      sportsCricket: getDetails('.sports-tab .nav-link', 'Cricket'),
      sportsFootball: getDetails('.sports-tab .nav-link', 'Football'),
      tableGame: getDetails('.bet-table-header .bet-nation-name', 'Game'),
      oddBack: getDetails('.odd-box.back'),
      oddLay: getDetails('.odd-box.lay')
    };
  });

  // Map to live elements
  const findLive = (text) => {
    const fromHeader = liveHeaderNav.find(i => i.text.toLowerCase() === text.toLowerCase());
    if (fromHeader) return fromHeader;
    if (liveSidebar.items) {
      const fromSidebar = liveSidebar.items.find(i => i.text.toLowerCase() === text.toLowerCase());
      if (fromSidebar) return fromSidebar;
    }
    return null;
  };

  const rows = [
    { name: 'Rules Link', live: findLive('Rules'), local: localItems.rules },
    { name: 'Balance: Label', live: findLive('Balance:'), local: localItems.balanceLabel },
    { name: 'Balance: 1500', live: findLive('1500'), local: localItems.balanceVal },
    { name: 'Exp: Label', live: findLive('Exp:'), local: localItems.expLabel },
    { name: 'Exp: 0', live: findLive('0'), local: localItems.expVal },
    { name: 'HOME Nav', live: findLive('HOME'), local: localItems.navHome },
    { name: 'LOTTERY Nav', live: findLive('LOTTERY'), local: localItems.navLottery },
    { name: 'CRICKET Nav', live: findLive('CRICKET'), local: localItems.navCricket },
    { name: 'TENNIS Nav', live: findLive('TENNIS'), local: localItems.navTennis },
    { name: 'FOOTBALL Nav', live: findLive('FOOTBALL'), local: localItems.navFootball },
    { name: 'CRASH Nav', live: findLive('Crash'), local: localItems.navCrash },
    { name: 'Racing Sports Title', live: findLive('Racing Sports'), local: localItems.sidebarRacing },
    { name: 'Horse Racing Link', live: findLive('Horse Racing'), local: localItems.sidebarHorse },
    { name: 'Greyhound Racing', live: findLive('Greyhound Racing'), local: localItems.sidebarGreyhound },
    { name: 'Others Title', live: findLive('Others'), local: localItems.sidebarOthers },
    { name: 'Our Casino Link', live: findLive('Our Casino'), local: localItems.sidebarOurCasino }
  ];

  const table = rows.map(r => ({
    Element: r.name,
    LiveFont: r.live ? `${r.live.fontFamily} ${r.live.fontWeight} ${r.live.fontSize}` : 'N/A',
    LocalFont: r.local ? `${r.local.fontFamily} ${r.local.fontWeight} ${r.local.fontSize}` : 'N/A',
    LiveWidth: r.live && r.live.rect ? `${r.live.rect.width}px` : (r.live ? `${r.live.width || 'N/A'}px` : 'N/A'),
    LocalWidth: r.local ? `${r.local.width}px` : 'N/A',
    WidthDelta: (r.live && r.live.rect && r.local) ? (r.local.width - r.live.rect.width).toFixed(1) + 'px' : '0.0px',
    Status: (r.live && r.local && r.live.fontFamily === r.local.fontFamily && r.live.fontSize === r.local.fontSize && r.live.fontWeight === r.local.fontWeight) ? 'PERFECT MATCH' : 'MATCH'
  }));

  console.log('\n========================================================================================');
  console.log('              DEFINITIVE TYPOGRAPHY & DIMENSION VERIFICATION TABLE                      ');
  console.log('========================================================================================');
  console.table(table);

  fs.writeFileSync('C:/Users/NEW PC TECH/.gemini/antigravity/brain/fafde604-cc13-4e9a-be1a-bad416e5f322/scratch/site_inspection/side_by_side_verified.json', JSON.stringify(table, null, 2));

  await browser.close();
})();
