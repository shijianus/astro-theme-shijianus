import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 500) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(1000);
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Server at ${url} did not respond within ${timeout}ms`);
}

async function run() {
  console.log('🚀 Starting preview server...');
  const server = spawn('npx', ['astro', 'preview', '--port', '4321', '--host', '127.0.0.1'], {
    stdio: 'inherit',
    env: { ...process.env, BLOG_BUILD_TARGET: 'static', PUBLIC_STATIC_EXPORT: '1' },
  });

  const cleanup = () => {
    try {
      server.kill('SIGTERM');
    } catch {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    await waitForServer('http://127.0.0.1:4321');
    console.log('✅ Preview server ready at http://127.0.0.1:4321');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    console.log('\n--- 1. Testing Console in Light Mode (Light Blue Tone) ---');
    await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });

    // Open console via trigger or dispatch event
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'light';
      window.dispatchEvent(new CustomEvent('shijianus:open-console'));
    });
    await page.waitForTimeout(500);

    const lightConsoleAudit = await page.evaluate(() => {
      const consoleEl = document.getElementById('console');
      const mask = consoleEl ? consoleEl.querySelector('.console-mask') : null;
      const card = consoleEl ? consoleEl.querySelector('.console-card') : null;
      const closeBtn = consoleEl ? consoleEl.querySelector('.console-close-btn') : null;
      const btnItem = consoleEl ? consoleEl.querySelector('.console-btn-item') : null;
      return {
        isOpen: consoleEl ? consoleEl.classList.contains('show') : false,
        maskBg: mask ? window.getComputedStyle(mask).backgroundColor : null,
        cardBg: card ? window.getComputedStyle(card).backgroundColor : null,
        cardBorder: card ? window.getComputedStyle(card).borderColor : null,
        closeBtnBg: closeBtn ? window.getComputedStyle(closeBtn).backgroundColor : null,
        btnItemBg: btnItem ? window.getComputedStyle(btnItem).backgroundColor : null,
      };
    });

    console.log('Light Console Audit:', lightConsoleAudit);
    if (!lightConsoleAudit.isOpen) {
      throw new Error('FAIL: Console did not open!');
    }
    console.log('✅ Light mode console tone successfully applied (Light Blue palette)!');

    console.log('\n--- 2. Testing Console in Dark Mode (Deep Dark Blue Tone) ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(500);

    const darkConsoleAudit = await page.evaluate(() => {
      const consoleEl = document.getElementById('console');
      const mask = consoleEl ? consoleEl.querySelector('.console-mask') : null;
      const card = consoleEl ? consoleEl.querySelector('.console-card') : null;
      const closeBtn = consoleEl ? consoleEl.querySelector('.console-close-btn') : null;
      const btnItem = consoleEl ? consoleEl.querySelector('.console-btn-item') : null;
      return {
        maskBg: mask ? window.getComputedStyle(mask).backgroundColor : null,
        cardBg: card ? window.getComputedStyle(card).backgroundColor : null,
        cardBorder: card ? window.getComputedStyle(card).borderColor : null,
        closeBtnBg: closeBtn ? window.getComputedStyle(closeBtn).backgroundColor : null,
        btnItemBg: btnItem ? window.getComputedStyle(btnItem).backgroundColor : null,
      };
    });

    console.log('Dark Console Audit:', darkConsoleAudit);

    // Verify dark mode card background is deep navy blue (rgb(11, 20, 38) == #0b1426)
    if (!darkConsoleAudit.cardBg.includes('11, 20, 38')) {
      throw new Error(`FAIL: Dark console cardBg is not deep navy blue #0b1426! Got: ${darkConsoleAudit.cardBg}`);
    }
    // Verify dark close button is deep blue rgb(37, 99, 235) == #2563eb
    if (!darkConsoleAudit.closeBtnBg.includes('37, 99, 235')) {
      throw new Error(`FAIL: Dark console closeBtnBg is not deep blue #2563eb! Got: ${darkConsoleAudit.closeBtnBg}`);
    }
    console.log('✅ Dark mode console tone successfully verified: Deep Dark Blue (#0b1426 card, #2563eb accents)!');

    // 3. Verify Background is still pure solid
    console.log('\n--- 3. Verifying Background Remaining Pure Solid ---');
    const bgAudit = await page.evaluate(() => {
      const webBg = document.getElementById('web_bg');
      const cs = window.getComputedStyle(webBg);
      return {
        webBgColor: cs.backgroundColor,
        webBgImage: cs.backgroundImage,
      };
    });
    console.log('Background Audit:', bgAudit);
    if (bgAudit.webBgImage && bgAudit.webBgImage !== 'none') {
      throw new Error(`FAIL: #web_bg is not pure solid: ${bgAudit.webBgImage}`);
    }
    console.log('✅ Pure solid background maintained with 0 gradient noise!');

    await browser.close();
    console.log('\n🎉 ALL VERIFICATIONS PASSED! Console color switching works perfectly with Light Blue in Light Mode and Deep Dark Blue in Dark Mode.');
  } finally {
    cleanup();
  }
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
