const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  const localUrl = 'file:///' + path.resolve('e:/bestbet.now/home.html').replace(/\\/g, '/');

  // 1. Capture at 1024x530
  await page.setViewport({ width: 1024, height: 530 });
  await page.goto(localUrl, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'local_updated_1024.png' });
  console.log('Saved local_updated_1024.png');

  // 2. Capture at 1280x800
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(localUrl, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'local_updated_1280.png' });
  console.log('Saved local_updated_1280.png');

  await browser.close();
})();
