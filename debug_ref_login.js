const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

async function testDemoLogin() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      '--window-size=1440,900'
    ]
  });

  try {
    const page = await browser.newPage();
    
    const logs = [];
    const requests = [];
    const responses = [];

    page.on('console', msg => logs.push(msg.text()));
    page.on('request', req => {
      if (req.url().includes('login') || req.url().includes('api')) {
        requests.push({ url: req.url(), method: req.method(), postData: req.postData() });
      }
    });
    page.on('response', async res => {
      if (res.url().includes('login') || res.url().includes('api')) {
        let text = '';
        try { text = await res.text(); } catch(e){}
        responses.push({ url: res.url(), status: res.status(), body: text.slice(0, 300) });
      }
    });

    console.log('1. Loading https://bestbet9.now/ ...');
    await page.goto('https://bestbet9.now/', { waitUntil: 'networkidle2', timeout: 45000 });

    console.log('2. Inspecting LocalStorage and Cookies BEFORE login...');
    const storageBefore = await page.evaluate(() => ({ ...localStorage }));
    const cookiesBefore = await page.cookies();

    console.log('3. Clicking "Login with demo ID" button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const demoBtn = buttons.find(b => b.innerText && b.innerText.includes('Login with demo ID'));
      if (demoBtn) demoBtn.click();
    });

    console.log('4. Waiting 5s for navigation...');
    await new Promise(r => setTimeout(r, 5000));

    console.log('5. Current URL after demo click:', page.url());

    const storageAfter = await page.evaluate(() => ({ ...localStorage }));
    const cookiesAfter = await page.cookies();

    console.log('\n--- NETWORK REQUESTS ---');
    console.log(JSON.stringify(requests, null, 2));

    console.log('\n--- NETWORK RESPONSES ---');
    console.log(JSON.stringify(responses, null, 2));

    console.log('\n--- LOCAL STORAGE AFTER LOGIN ---');
    console.log(JSON.stringify(storageAfter, null, 2));

    console.log('\n--- CONSOLE LOGS ---');
    console.log(logs.slice(-10));

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
}

testDemoLogin();
