import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';

const PORT = 4329;
const URL = `http://127.0.0.1:${PORT}/posts/content-formats-and-markup-mastery/`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkPortReady(port, retries = 20) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
        clearInterval(interval);
        req.destroy();
        resolve(true);
      });
      req.on('error', () => {
        if (count >= retries) {
          clearInterval(interval);
          reject(new Error(`Port ${port} not ready after ${retries} attempts`));
        }
      });
    }, 500);
  });
}

async function run() {
  console.log('[Test] Starting static preview server on port', PORT);
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '-d', 'dist'], {
    stdio: 'ignore',
  });

  try {
    await checkPortReady(PORT);
    console.log('[Test] Preview server ready at', URL);

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    const page = await context.newPage();
    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message, err.stack));

    console.log(`[Test] Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle' });
    await wait(1000);

    // Wait for ThemeOverlays astro-island to hydrate
    console.log('[Test] Waiting for ThemeOverlays hydration...');
    await page.waitForFunction(() => {
      const island = document.querySelector('astro-island[component-export="ThemeOverlays"]');
      // If astro-island has no ssr attribute or child elements have event listeners
      return island && !island.hasAttribute('ssr');
    }, { timeout: 10000 }).catch(() => {
      console.log('[Test] astro-island wait timeout, continuing...');
    });
    await wait(500);

    // Trigger open notifications / account drawer
    console.log('[Test] Dispatching open-notifications event...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    });

    // Wait explicitly for .theme-account-overlay.show
    console.log('[Test] Waiting for .theme-account-overlay.show...');
    await page.waitForSelector('.theme-account-overlay.show', { timeout: 5000 });
    await wait(400);

    // 1. Verify drawer is visible
    const drawer = page.locator('.theme-account-drawer');
    const isDrawerVisible = await drawer.isVisible();
    console.log('[Assert 1] Account Drawer visible:', isDrawerVisible);
    if (!isDrawerVisible) throw new Error('Account drawer not visible after triggering open-notifications');

    const debugInfo = await page.evaluate(() => {
      const drawer = document.querySelector('.theme-account-drawer');
      const btn = document.querySelector('.account-partition-btn');
      const overlay = document.querySelector('.theme-account-overlay');
      return {
        overlayClass: overlay?.className,
        drawerRect: drawer?.getBoundingClientRect(),
        drawerTransform: drawer ? window.getComputedStyle(drawer).transform : null,
        btnRect: btn?.getBoundingClientRect(),
      };
    });
    console.log('[Debug]', JSON.stringify(debugInfo, null, 2));

    // 2. Click "全站广播通告" partition button if not already active
    await page.evaluate(() => {
      const btn = document.querySelector('.account-partition-btn');
      if (btn) btn.click();
    });
    await wait(300);

    // 3. Assert NO online edit button exists (.account-card-action-btn)
    const editBtnCount = await page.locator('.account-card-action-btn').count();
    console.log('[Assert 2] Online edit buttons in drawer:', editBtnCount, '(Expected: 0)');
    if (editBtnCount !== 0) throw new Error(`Found ${editBtnCount} .account-card-action-btn elements; expected 0!`);

    // 4. Assert NO inline edit form exists (.account-broadcast-editor)
    const editorFormCount = await page.locator('.account-broadcast-editor').count();
    console.log('[Assert 3] Online broadcast editor forms in drawer:', editorFormCount, '(Expected: 0)');
    if (editorFormCount !== 0) throw new Error(`Found ${editorFormCount} .account-broadcast-editor elements; expected 0!`);

    // 5. Assert featured broadcast item exists (.account-broadcast-item--featured)
    const featuredItem = page.locator('.account-broadcast-item--featured');
    const isFeaturedVisible = await featuredItem.isVisible();
    console.log('[Assert 4] Featured broadcast card visible:', isFeaturedVisible);
    if (!isFeaturedVisible) throw new Error('Featured broadcast item not visible');

    // 6. Assert Badge content
    const badgeText = await featuredItem.locator('.account-broadcast-badge--featured').innerText();
    console.log('[Assert 5] Badge text:', badgeText.trim(), '(Expected: 博主动态)');
    if (!badgeText.includes('博主动态')) throw new Error(`Badge text mismatch: "${badgeText}"`);

    // 7. Assert Title content
    const titleText = await featuredItem.locator('.account-broadcast-title').innerText();
    console.log('[Assert 6] Title text:', titleText.trim());
    if (!titleText.includes('读者中心全面升级') && !titleText.includes('通告')) {
      throw new Error(`Title text mismatch: "${titleText}"`);
    }

    // 8. Assert Summary / Description content
    const descText = await featuredItem.locator('.account-broadcast-desc').innerText();
    console.log('[Assert 7] Description text:', descText.trim().slice(0, 60) + '...');
    if (!descText || descText.length < 10) {
      throw new Error('Description text is empty or too short');
    }

    // 9. Assert Bullets list count and content
    const bulletsCount = await featuredItem.locator('.account-broadcast-bullets li').count();
    console.log('[Assert 8] Bullets count:', bulletsCount, '(Expected: >= 3)');
    if (bulletsCount < 3) {
      throw new Error(`Expected at least 3 bullet points, found ${bulletsCount}`);
    }

    // 10. Assert Link button
    const linkLocator = featuredItem.locator('.account-broadcast-link');
    const hasLink = await linkLocator.isVisible();
    console.log('[Assert 9] Detail link visible:', hasLink);
    if (hasLink) {
      const linkHref = await linkLocator.getAttribute('href');
      console.log('[Assert 10] Detail link href:', linkHref);
      if (!linkHref || linkHref === '#') {
        throw new Error(`Detail link href invalid: ${linkHref}`);
      }
    }

    await page.screenshot({ path: 'scratch/broadcast-drawer.png' });
    console.log('[Test] Screenshot saved to scratch/broadcast-drawer.png');

    console.log('\n=============================================');
    console.log('🎉 ALL BROADCAST E2E TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================\n');

    await browser.close();
  } catch (err) {
    console.log('[Captured Console Logs]:', consoleLogs);
    throw err;
  } finally {
    server.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
