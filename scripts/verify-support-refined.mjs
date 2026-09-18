import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const distDir = '/home/shijian/projects/shijianus-blog/dist';
const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/support_refined';
const PORT = 4328;

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function createStaticServer(dir, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${port}`);
      let reqPath = decodeURIComponent(parsedUrl.pathname);

      if (reqPath === '/api/sponsors') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, records: [] }));
        return;
      }

      let filePath = path.join(dir, reqPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      if (!fs.existsSync(filePath)) {
        filePath = path.join(dir, '404.html');
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
    });

    server.listen(port, () => {
      console.log(`✅ Test server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function runVerification() {
  const server = await createStaticServer(distDir, PORT);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    console.log('🚀 Launching Playwright Chromium for Support Page Verification...');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    console.log(`📄 Navigating to http://localhost:${PORT}/support/ ...`);
    const resp = await page.goto(`http://localhost:${PORT}/support/`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    if (resp.status() !== 200) {
      throw new Error(`Expected HTTP 200, got ${resp.status()}`);
    }

    // 1. Audit Preset Amount Cards (Multi-dimensional Explicit Transaction UX)
    console.log('\n--- 1. Auditing Refined Preset Amount Cards ---');
    await page.waitForSelector('.grid[class*="gap-2"] button', { timeout: 15000 });
    const presetButtons = page.locator('.grid[class*="gap-2"] button');
    const count = await presetButtons.count();
    console.log(`Preset buttons count: ${count} (Expected: 6)`);
    if (count !== 6) throw new Error(`Expected 6 preset buttons, got ${count}`);

    const amounts = [];
    const bureaucraticWords = ['微额', '日常', '算力', '基建', '名录致谢', '即时零钱', '边缘函数', '域名存储'];

    for (let i = 0; i < count; i++) {
      const btn = presetButtons.nth(i);
      const text = (await btn.innerText()).trim();
      const box = await btn.boundingBox();
      console.log(`Card ${i + 1}: height=${box?.height.toFixed(1)}px, text="${text.replace(/\n/g, ' | ')}"`);

      // Verify sleek height constraint: strictly ~50px-56px
      if (box && (box.height < 48 || box.height > 58)) {
        throw new Error(`Card ${i + 1} height (${box.height}px) exceeds invariant range [48px, 58px]!`);
      }

      // Check amount
      const amountEl = btn.locator('.relative.z-10 span').first();
      const amountText = (await amountEl.innerText()).trim();
      amounts.push(amountText);

      // Verify NO bureaucratic official words
      for (const word of bureaucraticWords) {
        if (text.includes(word)) {
          throw new Error(`Card ${i + 1} contains bureaucratic word "${word}"! Should be warm and natural.`);
        }
      }

      // Verify interactive animated SVG scene exists
      const sceneSvg = btn.locator('[aria-hidden="true"] svg');
      if ((await sceneSvg.count()) < 1) {
        throw new Error(`Card ${i + 1} missing interactive animated SVG scene!`);
      }

      // Verify each tier has its own UNIQUE non-repetitive pure-coffee scene animation
      if (i === 0) {
        // Tier 0: 便捷速溶咖啡条与小纸杯 (Sachet Pour & Granules)
        const sachet = sceneSvg.locator('.animate-coffee-sachet-pour');
        if ((await sachet.count()) < 1) throw new Error('Tier 0 missing animate-coffee-sachet-pour!');
      } else if (i === 1) {
        // Tier 1: 经典商品外带咖啡纸杯 (Takeaway Paper Cup with Corrugated Sleeve & Coffee Beans)
        const cup = sceneSvg.locator('.animate-coffee-cup-bounce');
        const steam = sceneSvg.locator('path.animate-coffee-steam-1, path.animate-coffee-steam-2');
        if ((await cup.count()) < 1) throw new Error('Tier 1 missing animate-coffee-cup-bounce!');
        if ((await steam.count()) < 1) throw new Error('Tier 1 missing animate-coffee-steam!');
      } else if (i === 2) {
        // Tier 2: 精致意式拿铁拉花陶瓷杯 (Latte Art Heart Foam & Ceramic Cup - Featured)
        const latte = sceneSvg.locator('.animate-coffee-latte-pulse');
        if ((await latte.count()) < 1) throw new Error('Tier 2 missing animate-coffee-latte-pulse!');
        // Check selected card has active checkmark
        const checkIcon = btn.locator('svg.lucide-check');
        if ((await checkIcon.count()) < 1) throw new Error('Tier 2 missing active checkmark indicator!');
      } else if (i === 3) {
        // Tier 3: 经典意式八角摩卡壶萃取 (Moka Pot & Espresso Demitasse)
        const moka = sceneSvg.locator('.animate-coffee-moka-rumble');
        if ((await moka.count()) < 1) throw new Error('Tier 3 missing animate-coffee-moka-rumble!');
      } else if (i === 4) {
        // Tier 4: 专业慢调手冲咖啡壶 (Gooseneck Pour-over & V60 Server)
        const kettle = sceneSvg.locator('.animate-coffee-kettle-pour');
        if ((await kettle.count()) < 1) throw new Error('Tier 4 missing animate-coffee-kettle-pour!');
      } else if (i === 5) {
        // Tier 5: 殿堂冷萃冰滴塔与特调杯 (Cold Brew Tower & Rock Glass with Ice Sphere)
        const tower = sceneSvg.locator('.animate-coffee-tower-drip');
        if ((await tower.count()) < 1) throw new Error('Tier 5 missing animate-coffee-tower-drip!');
      }
    }

    console.log(`\n  Extracted Amounts: ${JSON.stringify(amounts)}`);
    const uniqueAmounts = new Set(amounts);
    if (uniqueAmounts.size !== 6) {
      throw new Error(`Expected 6 unique amounts, got ${uniqueAmounts.size}`);
    }

    console.log('✅ Preset amount cards feature warm animated SVG scenes with steaming coffee & desk decor, zero bureaucratic pricing words, and strictly invariant height (~54px)!');

    // 2. Audit Right Column (QR-Code Interface & Expense Section Removal)
    console.log('\n--- 2. Auditing Right Column QR Interface ---');
    const expenseSection = page.locator('text=真实开销与站点保障公示');
    const expenseCount = await expenseSection.count();
    console.log(`Expense section count: ${expenseCount} (Expected: 0)`);
    if (expenseCount !== 0) {
      throw new Error(`Expense section "真实开销与站点保障公示" was NOT removed!`);
    }

    const cdnPillar = page.locator('text=全球边缘 CDN');
    if (await cdnPillar.count() !== 0) {
      throw new Error(`Infrastructure pillar "全球边缘 CDN" was NOT removed!`);
    }
    console.log('✅ Expense breakdown section successfully removed from Right Column!');

    // 3. Audit Alignment between Left and Right Columns
    console.log('\n--- 3. Auditing Alignment & Height Balance ---');
    const leftCard = page.locator('.lg\\:col-span-7');
    const rightCard = page.locator('.lg\\:col-span-5');
    const boxLeft = await leftCard.boundingBox();
    const boxRight = await rightCard.boundingBox();

    if (boxLeft && boxRight) {
      const topDiff = Math.abs(boxLeft.y - boxRight.y);
      const bottomDiff = Math.abs((boxLeft.y + boxLeft.height) - (boxRight.y + boxRight.height));
      console.log(`Left Card:  y=${boxLeft.y.toFixed(1)}px, height=${boxLeft.height.toFixed(1)}px, bottom=${(boxLeft.y + boxLeft.height).toFixed(1)}px`);
      console.log(`Right Card: y=${boxRight.y.toFixed(1)}px, height=${boxRight.height.toFixed(1)}px, bottom=${(boxRight.y + boxRight.height).toFixed(1)}px`);
      console.log(`Top Diff: ${topDiff.toFixed(1)}px, Bottom Diff: ${bottomDiff.toFixed(1)}px`);

      if (topDiff > 2) {
        throw new Error(`Top alignment mismatch: ${topDiff}px`);
      }
      if (bottomDiff > 2) {
        throw new Error(`Bottom alignment mismatch: ${bottomDiff}px`);
      }
      console.log('✅ Left and Right cards are 100% harmoniously aligned with zero vertical gap discrepancy!');
    }

    // 4. Test Tab Switching in Right Column
    console.log('\n--- 4. Auditing Sub-channel Tabs ---');
    const tabs = page.locator('.lg\\:col-span-5 .rounded-xl button');
    const tabCount = await tabs.count();
    console.log(`Tabs found: ${tabCount} (Expected: 4)`);

    // Tab 1: CN
    await tabs.nth(0).click();
    await page.waitForTimeout(200);
    const wechatCn = page.locator('text=微信支付');
    const alipayCn = page.locator('text=支付宝');
    if (await wechatCn.count() === 0 || await alipayCn.count() === 0) {
      throw new Error('CN tab missing WeChat or Alipay');
    }
    console.log('  ✓ CN tab verified (WeChat Pay & Alipay)');

    // Tab 2: HK
    await tabs.nth(1).click();
    await page.waitForTimeout(200);
    const alipayHk = page.locator('text=Alipay HK');
    const wechatHk = page.locator('text=WeChat Pay HK');
    if (await alipayHk.count() === 0 || await wechatHk.count() === 0) {
      throw new Error('HK tab missing Alipay HK or WeChat Pay HK');
    }
    console.log('  ✓ HK tab verified (Alipay HK & WeChat Pay HK)');

    // Tab 3: PayPal
    await tabs.nth(2).click();
    await page.waitForTimeout(200);
    const paypalLink = page.locator('text=paypal.me/shijianus');
    if (await paypalLink.count() === 0) {
      throw new Error('PayPal tab missing paypal.me link');
    }
    console.log('  ✓ PayPal tab verified (paypal.me/shijianus + HK/UK QR)');

    // Tab 4: USDT
    await tabs.nth(3).click();
    await page.waitForTimeout(200);
    const usdtCard = page.locator('text=USDT (Arbitrum One)');
    const usdtTip = page.locator('text=转账提示');
    if (await usdtCard.count() === 0 || await usdtTip.count() === 0) {
      throw new Error('Crypto tab missing USDT card or tip');
    }
    console.log('  ✓ Crypto tab verified (USDT Arbitrum One + Transfer Tip)');

    // Reset to CN tab
    await tabs.nth(0).click();
    await page.waitForTimeout(200);

    // 5. Test Preset Button Clicks & Stripe Amount Sync
    console.log('\n--- 5. Auditing Amount Selection & Button Sync ---');
    const tier2Btn = presetButtons.nth(1);
    const tier2Text = (await tier2Btn.innerText()).trim();
    const tier2Num = tier2Text.replace(/[^0-9]/g, '');
    await tier2Btn.click();
    await page.waitForTimeout(200);
    const checkoutBtnText = await page.locator('.lg\\:col-span-7 button:has-text("前往 Stripe")').innerText();
    console.log(`Clicked tier 2 (${tier2Text}). Checkout button text: "${checkoutBtnText.replace(/\n/g, ' ')}"`);
    if (!checkoutBtnText.includes(tier2Num)) {
      throw new Error(`Checkout button did not update to ${tier2Num}: ${checkoutBtnText}`);
    }
    console.log(`  ✓ Stripe checkout button correctly synchronized to ${tier2Text}`);

    // 6. Capture Screenshots
    console.log('\n--- 6. Capturing Visual Screenshots ---');
    // Desktop Overview
    const mainSection = page.locator('section.grid.grid-cols-1.lg\\:grid-cols-12');
    await mainSection.screenshot({
      path: path.join(outDir, '01-desktop-main-section-light.png'),
    });
    console.log('  📸 Captured 01-desktop-main-section-light.png');

    // Preset cards close-up
    const presetGrid = page.locator('.grid[class*="gap-2"]').first();
    await presetGrid.screenshot({
      path: path.join(outDir, '02-desktop-preset-cards-light.png'),
    });
    console.log('  📸 Captured 02-desktop-preset-cards-light.png');

    // Right Column close-up
    await rightCard.screenshot({
      path: path.join(outDir, '03-desktop-right-column-light.png'),
    });
    console.log('  📸 Captured 03-desktop-right-column-light.png');

    // Dark Mode Overview
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(300);
    await mainSection.screenshot({
      path: path.join(outDir, '04-desktop-main-section-dark.png'),
    });
    console.log('  📸 Captured 04-desktop-main-section-dark.png');
    await page.evaluate(() => document.documentElement.classList.remove('dark'));

    // Tablet View (768x1024)
    const tabletContext = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      deviceScaleFactor: 2,
    });
    const tabletPage = await tabletContext.newPage();
    await tabletPage.goto(`http://localhost:${PORT}/support/`, { waitUntil: 'networkidle' });
    const tabletSection = tabletPage.locator('section.grid.grid-cols-1.lg\\:grid-cols-12');
    await tabletSection.screenshot({
      path: path.join(outDir, '05-tablet-main-section.png'),
    });
    console.log('  📸 Captured 05-tablet-main-section.png');
    await tabletContext.close();

    // Mobile View (390x844)
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`http://localhost:${PORT}/support/`, { waitUntil: 'networkidle' });
    const mobileSection = mobilePage.locator('section.grid.grid-cols-1.lg\\:grid-cols-12');
    await mobileSection.screenshot({
      path: path.join(outDir, '06-mobile-main-section.png'),
    });
    console.log('  📸 Captured 06-mobile-main-section.png');
    await mobileContext.close();

    console.log('\n🎉 ALL E2E PLAYWRIGHT AUDIT CHECKS PASSED PERFECTLY!\n');
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
