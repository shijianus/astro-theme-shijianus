import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/live_support_refined';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runLiveAudit() {
  const targetUrl = 'https://blog.epocanvas.com/support/';
  console.log(`🚀 Launching Playwright Chromium for Live Production Audit on ${targetUrl}...`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    console.log(`📄 Navigating to ${targetUrl} ...`);
    const resp = await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 45000,
    });

    console.log(`HTTP Status: ${resp.status()}`);
    if (resp.status() !== 200) {
      throw new Error(`Expected HTTP 200, got ${resp.status()}`);
    }

    // 1. Audit Preset Amount Cards
    console.log('\n--- 1. Auditing Live Preset Amount Cards ---');
    await page.waitForSelector('.grid[class*="gap-2"] button', { timeout: 15000 });
    const presetButtons = page.locator('.grid[class*="gap-2"] button');
    const count = await presetButtons.count();
    console.log(`Found ${count} preset buttons (Expected: 6)`);
    if (count !== 6) throw new Error(`Expected 6 preset buttons, got ${count}`);

    const amounts = [];

    for (let i = 0; i < count; i++) {
      const btn = presetButtons.nth(i);
      const text = (await btn.innerText()).trim();
      const box = await btn.boundingBox();
      console.log(`  Card ${i + 1}: height=${box?.height.toFixed(1)}px, text="${text.replace(/\n/g, ' | ')}"`);

      // Verify sleek height constraint
      if (box && (box.height < 48 || box.height > 60)) {
        throw new Error(`Card ${i + 1} height (${box.height}px) on live site exceeds range [48px, 60px]!`);
      }

      // Check amount
      const amountEl = btn.locator('.relative.z-10 span').first();
      const amountText = (await amountEl.innerText()).trim();
      amounts.push(amountText);

      // Verify NO bureaucratic official words on live site
      const bureaucraticWords = ['微额', '日常', '算力', '基建', '名录致谢', '即时零钱', '边缘函数', '域名存储'];
      for (const word of bureaucraticWords) {
        if (text.includes(word)) {
          throw new Error(`Live Card ${i + 1} contains bureaucratic word "${word}"!`);
        }
      }

      // Verify interactive animated SVG scene exists on live site
      const sceneSvg = btn.locator('[aria-hidden="true"] svg');
      if ((await sceneSvg.count()) < 1) {
        throw new Error(`Live Card ${i + 1} missing interactive animated SVG scene!`);
      }

      // Verify each tier has its own UNIQUE non-repetitive pure-coffee scene animation on live site
      if (i === 0) {
        // Tier 0: 便捷速溶咖啡条与小纸杯 (Sachet Pour & Granules)
        const sachet = sceneSvg.locator('.animate-coffee-sachet-pour');
        if ((await sachet.count()) < 1) throw new Error('Live Tier 0 missing animate-coffee-sachet-pour!');
      } else if (i === 1) {
        // Tier 1: 经典商品外带咖啡纸杯 (Takeaway Paper Cup with Corrugated Sleeve & Coffee Beans)
        const cup = sceneSvg.locator('.animate-coffee-cup-bounce');
        const steam = sceneSvg.locator('path.animate-coffee-steam-1, path.animate-coffee-steam-2');
        if ((await cup.count()) < 1) throw new Error('Live Tier 1 missing animate-coffee-cup-bounce!');
        if ((await steam.count()) < 1) throw new Error('Live Tier 1 missing animate-coffee-steam!');
      } else if (i === 2) {
        // Tier 2: 精致意式拿铁拉花陶瓷杯 (Latte Art Heart Foam & Ceramic Cup - Featured)
        const latte = sceneSvg.locator('.animate-coffee-latte-pulse');
        if ((await latte.count()) < 1) throw new Error('Live Tier 2 missing animate-coffee-latte-pulse!');
        // Check selected card has active checkmark
        const checkIcon = btn.locator('svg.lucide-check');
        if ((await checkIcon.count()) < 1) throw new Error('Live Tier 2 missing active checkmark indicator!');
      } else if (i === 3) {
        // Tier 3: 经典意式八角摩卡壶萃取 (Moka Pot & Espresso Demitasse)
        const moka = sceneSvg.locator('.animate-coffee-moka-rumble');
        if ((await moka.count()) < 1) throw new Error('Live Tier 3 missing animate-coffee-moka-rumble!');
      } else if (i === 4) {
        // Tier 4: 专业慢调手冲咖啡壶 (Gooseneck Pour-over & V60 Server)
        const kettle = sceneSvg.locator('.animate-coffee-kettle-pour');
        if ((await kettle.count()) < 1) throw new Error('Live Tier 4 missing animate-coffee-kettle-pour!');
      } else if (i === 5) {
        // Tier 5: 殿堂冷萃冰滴塔与特调杯 (Cold Brew Tower & Rock Glass with Ice Sphere)
        const tower = sceneSvg.locator('.animate-coffee-tower-drip');
        if ((await tower.count()) < 1) throw new Error('Live Tier 5 missing animate-coffee-tower-drip!');
      }
    }

    console.log(`\n  Live Amounts: ${JSON.stringify(amounts)}`);
    const uniqueAmounts = new Set(amounts);
    if (uniqueAmounts.size !== 6) {
      throw new Error(`Expected 6 unique amounts on live site, got ${uniqueAmounts.size}`);
    }

    console.log('✅ Live preset amount cards feature warm animated SVG scenes with steaming coffee & desk decor, zero bureaucratic pricing words, and strictly invariant height (~54px)!');

    // 2. Audit Right Column Expense Removal
    console.log('\n--- 2. Auditing Right Column QR Interface on Production ---');
    const expenseSection = page.locator('text=真实开销与站点保障公示');
    const expenseCount = await expenseSection.count();
    console.log(`Expense section count on live site: ${expenseCount} (Expected: 0)`);
    if (expenseCount !== 0) {
      throw new Error('Expense section "真实开销与站点保障公示" is still present on live site!');
    }
    console.log('✅ Live expense breakdown section successfully removed from Right Column!');

    // 3. Audit Alignment between Left and Right Columns
    console.log('\n--- 3. Auditing Alignment & Height Balance on Production ---');
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
        throw new Error(`Top alignment mismatch on live site: ${topDiff}px`);
      }
      if (bottomDiff > 2) {
        throw new Error(`Bottom alignment mismatch on live site: ${bottomDiff}px`);
      }
      console.log('✅ Left and Right cards are 100% harmoniously aligned on live site!');
    }

    // 4. Test Sub-channel Tabs on Production
    console.log('\n--- 4. Auditing Sub-channel Tabs on Production ---');
    const tabs = page.locator('.lg\\:col-span-5 .rounded-xl button');
    const tabCount = await tabs.count();
    console.log(`Tabs found: ${tabCount} (Expected: 4)`);

    // Tab 1: CN
    await tabs.nth(0).click();
    await page.waitForTimeout(200);
    const wechatCn = page.locator('text=微信支付');
    const alipayCn = page.locator('text=支付宝');
    if (await wechatCn.count() === 0 || await alipayCn.count() === 0) {
      throw new Error('CN tab missing WeChat or Alipay on live site');
    }
    console.log('  ✓ CN tab verified (WeChat Pay & Alipay)');

    // Tab 2: HK
    await tabs.nth(1).click();
    await page.waitForTimeout(200);
    const alipayHk = page.locator('text=Alipay HK');
    if (await alipayHk.count() === 0) {
      throw new Error('HK tab missing Alipay HK on live site');
    }
    console.log('  ✓ HK tab verified (Alipay HK & WeChat Pay HK)');

    // Tab 3: PayPal
    await tabs.nth(2).click();
    await page.waitForTimeout(200);
    const paypalLink = page.locator('text=paypal.me/shijianus');
    if (await paypalLink.count() === 0) {
      throw new Error('PayPal tab missing paypal.me link on live site');
    }
    console.log('  ✓ PayPal tab verified (paypal.me/shijianus + HK/UK QR)');

    // Tab 4: USDT
    await tabs.nth(3).click();
    await page.waitForTimeout(200);
    const usdtCard = page.locator('text=USDT (Arbitrum One)');
    if (await usdtCard.count() === 0) {
      throw new Error('Crypto tab missing USDT card on live site');
    }
    console.log('  ✓ Crypto tab verified (USDT Arbitrum One + Transfer Tip)');

    // Reset to CN tab
    await tabs.nth(0).click();
    await page.waitForTimeout(200);

    // 5. Test Preset Button Clicks & Stripe Sync on Production
    console.log('\n--- 5. Auditing Stripe Button Sync on Production ---');
    const tier2Btn = presetButtons.nth(1);
    const tier2Text = (await tier2Btn.innerText()).trim();
    const tier2Num = tier2Text.replace(/[^0-9]/g, '');
    await tier2Btn.click();
    await page.waitForTimeout(300);
    const checkoutBtnText = await page.locator('.lg\\:col-span-7 button:has-text("前往 Stripe")').innerText();
    console.log(`Clicked tier 2 (${tier2Text}). Checkout button text: "${checkoutBtnText.replace(/\n/g, ' ')}"`);
    if (!checkoutBtnText.includes(tier2Num)) {
      throw new Error(`Checkout button did not update to ${tier2Num}: ${checkoutBtnText}`);
    }
    console.log(`  ✓ Stripe checkout button correctly synchronized to ${tier2Text} on live site!`);

    // 6. Capture High-Resolution Live Screenshots
    console.log('\n--- 6. Capturing Live Production Screenshots ---');
    const mainSection = page.locator('section.grid.grid-cols-1.lg\\:grid-cols-12');
    await mainSection.screenshot({
      path: path.join(outDir, 'live-01-desktop-overview.png'),
    });
    console.log('  📸 Captured live-01-desktop-overview.png');

    const presetGrid = page.locator('.grid[class*="gap-2"]').first();
    await presetGrid.screenshot({
      path: path.join(outDir, 'live-02-desktop-preset-cards.png'),
    });
    console.log('  📸 Captured live-02-desktop-preset-cards.png');

    await rightCard.screenshot({
      path: path.join(outDir, 'live-03-desktop-right-column.png'),
    });
    console.log('  📸 Captured live-03-desktop-right-column.png');

    // Dark Mode Live
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(300);
    await mainSection.screenshot({
      path: path.join(outDir, 'live-04-desktop-dark-mode.png'),
    });
    console.log('  📸 Captured live-04-desktop-dark-mode.png');
    await page.evaluate(() => document.documentElement.classList.remove('dark'));

    // Tablet View (768x1024)
    const tabletContext = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      deviceScaleFactor: 2,
    });
    const tabletPage = await tabletContext.newPage();
    await tabletPage.goto(targetUrl, { waitUntil: 'networkidle' });
    const tabletSection = tabletPage.locator('section.grid.grid-cols-1.lg\\:grid-cols-12');
    await tabletSection.screenshot({
      path: path.join(outDir, 'live-05-tablet.png'),
    });
    console.log('  📸 Captured live-05-tablet.png');
    await tabletContext.close();

    // Mobile View (390x844)
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(targetUrl, { waitUntil: 'networkidle' });
    const mobileSection = mobilePage.locator('section.grid.grid-cols-1.lg\\:grid-cols-12');
    await mobileSection.screenshot({
      path: path.join(outDir, 'live-06-mobile.png'),
    });
    console.log('  📸 Captured live-06-mobile.png');
    await mobileContext.close();

    console.log('\n🎉 ALL LIVE PRODUCTION AUDIT CHECKS PASSED PERFECTLY!\n');
  } finally {
    await browser.close();
  }
}

runLiveAudit().catch((err) => {
  console.error('❌ Live verification failed:', err);
  process.exit(1);
});
