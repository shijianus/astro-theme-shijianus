import { chromium } from 'playwright';
import fs from 'fs';
import http from 'http';
import path from 'path';

const DIST_DIR = path.resolve('dist');

// Built-in static server to cleanly test the exact built dist output
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath.endsWith('/')) {
    reqPath += 'index.html';
  } else if (!path.extname(reqPath)) {
    reqPath += '/index.html';
  }

  const filePath = path.join(DIST_DIR, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.woff2': 'font/woff2'
    };
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 4399;

server.listen(PORT, async () => {
  console.log(`[E2E] Testing Home Pagination & Feed Switching on http://localhost:${PORT}...`);
  const executablePath = fs.existsSync('/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome')
    ? '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'
    : undefined;
  const browser = await chromium.launch({ headless: true, executablePath });

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

    console.log('--- Step 1: Verify #home-pagination presence ---');
    const pagination = await page.$('#home-pagination');
    if (!pagination) {
      throw new Error('❌ #home-pagination element not found!');
    }
    console.log('✅ Found #home-pagination element');

    console.log('--- Step 2: Verify home-pagination__prev on Page 1 ---');
    const prevBtn = await page.$('.home-pagination__btn.home-pagination__prev');
    if (!prevBtn) {
      throw new Error('❌ .home-pagination__prev not found!');
    }

    const prevInfo = await page.evaluate((el) => {
      const icon = el.querySelector('i.anzhiyufont');
      const textSpan = el.querySelector('.home-pagination__btn-text');
      const computed = window.getComputedStyle(el);
      return {
        hasTextSpan: Boolean(textSpan),
        rawText: el.innerText.trim(),
        hasIcon: Boolean(icon && icon.classList.contains('anzhiyu-icon-angle-left')),
        isDisabled: el.classList.contains('is-disabled'),
        dataTooltip: el.getAttribute('data-tooltip'),
        ariaLabel: el.getAttribute('aria-label'),
        title: el.getAttribute('title'),
        width: computed.width,
        height: computed.height,
        pointerEvents: computed.pointerEvents,
        cursor: computed.cursor
      };
    }, prevBtn);

    console.log('Prev Button on Page 1:', prevInfo);

    if (prevInfo.hasTextSpan || prevInfo.rawText.includes('上页')) {
      throw new Error('❌ Prev button still displays text explicitly!');
    }
    console.log('✅ Prev button has NO explicit text inside');

    if (!prevInfo.hasIcon) {
      throw new Error('❌ Prev button is missing angle-left icon!');
    }
    console.log('✅ Prev button has anzhiyu-icon-angle-left icon');

    if (!prevInfo.dataTooltip || !prevInfo.dataTooltip.includes('第一页')) {
      throw new Error(`❌ Prev button missing or invalid data-tooltip: ${prevInfo.dataTooltip}`);
    }
    console.log(`✅ Prev button has tooltip: "${prevInfo.dataTooltip}"`);

    if (parseFloat(prevInfo.width) < 32 || parseFloat(prevInfo.height) < 32) {
      throw new Error(`❌ Prev button dimensions unexpected: ${prevInfo.width}x${prevInfo.height}`);
    }
    console.log(`✅ Prev button dimensions verified square: ${prevInfo.width} x ${prevInfo.height}`);

    console.log('--- Step 3: Verify home-pagination__next on Page 1 ---');
    const nextBtn = await page.$('.home-pagination__btn.home-pagination__next');
    if (!nextBtn) {
      throw new Error('❌ .home-pagination__next not found!');
    }

    const nextInfo = await page.evaluate((el) => {
      const icon = el.querySelector('i.anzhiyufont');
      const textSpan = el.querySelector('.home-pagination__btn-text');
      const computed = window.getComputedStyle(el);
      return {
        hasTextSpan: Boolean(textSpan),
        rawText: el.innerText.trim(),
        hasIcon: Boolean(icon && icon.classList.contains('anzhiyu-icon-angle-right')),
        dataTooltip: el.getAttribute('data-tooltip'),
        ariaLabel: el.getAttribute('aria-label'),
        width: computed.width,
        height: computed.height
      };
    }, nextBtn);

    console.log('Next Button on Page 1:', nextInfo);

    if (nextInfo.hasTextSpan || nextInfo.rawText.includes('下页')) {
      throw new Error('❌ Next button still displays text explicitly!');
    }
    console.log('✅ Next button has NO explicit text inside');

    if (!nextInfo.hasIcon) {
      throw new Error('❌ Next button is missing angle-right icon!');
    }
    console.log('✅ Next button has anzhiyu-icon-angle-right icon');

    if (nextInfo.dataTooltip !== '下一页') {
      throw new Error(`❌ Next button data-tooltip mismatch: ${nextInfo.dataTooltip}`);
    }
    console.log(`✅ Next button data-tooltip is "${nextInfo.dataTooltip}"`);

    console.log('--- Step 4: Hover verification of tooltips ---');
    await nextBtn.hover();
    await page.waitForTimeout(300);
    const nextHoverTooltip = await page.evaluate((el) => {
      const pseudo = window.getComputedStyle(el, '::before');
      return {
        content: pseudo.content,
        opacity: pseudo.opacity,
        visibility: pseudo.visibility,
        bottom: pseudo.bottom
      };
    }, nextBtn);
    console.log('Next button hover tooltip pseudo-style:', nextHoverTooltip);
    if (!nextHoverTooltip.content || !nextHoverTooltip.content.includes('下一页')) {
      throw new Error('❌ Next button hover tooltip content missing or not displaying');
    }
    console.log('✅ Next button hover tooltip verified');

    // Hover disabled button
    await prevBtn.hover();
    await page.waitForTimeout(300);
    const prevHoverTooltip = await page.evaluate((el) => {
      const pseudo = window.getComputedStyle(el, '::before');
      return {
        content: pseudo.content,
        opacity: pseudo.opacity,
        visibility: pseudo.visibility
      };
    }, prevBtn);
    console.log('Prev button hover tooltip pseudo-style:', prevHoverTooltip);
    if (!prevHoverTooltip.content || !prevHoverTooltip.content.includes('第一页')) {
      throw new Error('❌ Disabled prev button hover tooltip content missing');
    }
    console.log('✅ Disabled prev button hover tooltip verified');

    console.log('--- Step 5: Verify Speculation Rules ---');
    const speculationRules = await page.evaluate(() => {
      const script = document.querySelector('script[type="speculationrules"]');
      if (!script) return null;
      try {
        return JSON.parse(script.textContent || '{}');
      } catch {
        return 'invalid_json';
      }
    });
    if (!speculationRules || speculationRules === 'invalid_json') {
      throw new Error('❌ Speculation Rules script missing or invalid JSON');
    }
    console.log('✅ Speculation Rules present and valid JSON');

    console.log('--- Step 6: Test Seamless In-place Feed Switching (No hard reload!) ---');
    // Set a probe on window to detect whether a full page reload occurs
    await page.evaluate(() => {
      window.__NO_RELOAD_TEST_PROBE__ = 98765;
    });

    console.log('Clicking Next Button to navigate to Page 2...');
    await nextBtn.click();

    // Wait for URL to update to /page/2/
    await page.waitForFunction(() => window.location.pathname.includes('/page/2/'), { timeout: 8000 });
    console.log('✅ URL updated to:', await page.evaluate(() => window.location.href));

    // Wait for DOM update
    await page.waitForTimeout(500);

    // Verify window probe was PRESERVED (proving ZERO hard reload happened!)
    const probeValue = await page.evaluate(() => window.__NO_RELOAD_TEST_PROBE__);
    if (probeValue !== 98765) {
      throw new Error('❌ Window probe was lost! A hard page reload occurred instead of seamless in-place switching!');
    }
    console.log('🌟 SUCCESS: window.__NO_RELOAD_TEST_PROBE__ is preserved! ZERO HARD PAGE RELOAD!');

    // Verify active page number
    const page2ActiveNum = await page.evaluate(() => {
      return document.querySelector('.home-pagination__num.is-current')?.textContent?.trim();
    });
    if (page2ActiveNum !== '2') {
      throw new Error(`❌ Active page number expected 2 but got: ${page2ActiveNum}`);
    }
    console.log('✅ Active pagination number updated to 2');

    // Test navigating BACK to Page 1 via Prev Button
    console.log('Navigating back to Page 1 via Prev button...');
    const page2PrevBtn = await page.$('.home-pagination__btn.home-pagination__prev');
    if (!page2PrevBtn) throw new Error('❌ Prev button on Page 2 not found');
    await page2PrevBtn.click();

    await page.waitForFunction(() => window.location.pathname === '/' || window.location.pathname === '', { timeout: 8000 });
    console.log('✅ URL returned to:', await page.evaluate(() => window.location.href));

    // Verify probe is STILL preserved!
    const probeValueAfterReturn = await page.evaluate(() => window.__NO_RELOAD_TEST_PROBE__);
    if (probeValueAfterReturn !== 98765) {
      throw new Error('❌ Window probe lost on return navigation!');
    }
    console.log('🌟 SUCCESS: Probe intact after two-way navigation!');

    console.log('\n🎉 ALL E2E TESTS PASSED 100%!');
  } finally {
    await browser.close();
    server.close();
  }
});
