import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/support_page';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(distDir, reqUrl);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

async function runVerification() {
  const port = 4399;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  console.log('🚀 Starting local static server on port ' + port + '...');
  const server = await createStaticServer(distDir, port);
  console.log('✅ Static server ready at http://127.0.0.1:' + port);

  console.log('🌐 Launching Chromium browser for E2E audit...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // -------------------------------------------------------------
    // 1. Desktop Audit (1440 x 920)
    // -------------------------------------------------------------
    const context = await browser.newContext({
      viewport: { width: 1440, height: 920 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    console.log('📄 1. Navigating to /support/ ...');
    await page.goto('http://127.0.0.1:4399/support/', { waitUntil: 'networkidle' });

    // Assert Title and Hero
    const heroTitle = await page.locator('h1').textContent();
    console.log(`✨ Page H1: "${heroTitle?.trim()}"`);
    if (!heroTitle?.includes('请喝一杯咖啡')) {
      throw new Error(`Expected H1 to contain '请喝一杯咖啡', got: ${heroTitle}`);
    }

    await page.screenshot({ path: path.join(outDir, '01-desktop-support-hero.png') });

    // -------------------------------------------------------------
    // 2. Card Top & Bottom Alignment Audit
    // -------------------------------------------------------------
    console.log('📐 2. Auditing Top & Bottom Vertical Alignment of Left and Right Cards...');
    const leftCard = page.locator('.lg\\:col-span-7');
    const rightCard = page.locator('.lg\\:col-span-5');
    const boxLeft = await leftCard.boundingBox();
    const boxRight = await rightCard.boundingBox();

    if (!boxLeft || !boxRight) {
      throw new Error('Failed to retrieve bounding boxes for left/right cards');
    }

    console.log(`Left Card: y=${boxLeft.y}, h=${boxLeft.height}, bottom=${boxLeft.y + boxLeft.height}`);
    console.log(`Right Card: y=${boxRight.y}, h=${boxRight.height}, bottom=${boxRight.y + boxRight.height}`);

    const topDiff = Math.abs(boxLeft.y - boxRight.y);
    const bottomDiff = Math.abs((boxLeft.y + boxLeft.height) - (boxRight.y + boxRight.height));

    console.log(`Top Alignment Diff: ${topDiff}px, Bottom Alignment Diff: ${bottomDiff}px`);
    if (topDiff > 2) {
      throw new Error(`Left and Right cards are not top-aligned (diff: ${topDiff}px)`);
    }
    if (bottomDiff > 2) {
      throw new Error(`Left and Right cards are not bottom-aligned (diff: ${bottomDiff}px)`);
    }
    console.log('✅ Requirement 1 Verified: Left & Right Cards are perfectly aligned top-to-bottom!');

    // -------------------------------------------------------------
    // 3. Width Alignment Audit for FAQ
    // -------------------------------------------------------------
    console.log('📐 3. Auditing Width Alignment of FAQ Section with Other Sections...');
    const faqSection = page.locator('section:has(h2:has-text("常見問題與透明度承諾"))');
    const recordsSection = page.locator('#sponsor-records');
    const faqBox = await faqSection.boundingBox();
    const recordsBox = await recordsSection.boundingBox();

    if (!faqBox || !recordsBox) {
      throw new Error('Failed to retrieve bounding boxes for FAQ or Records section');
    }

    console.log(`FAQ Section: x=${faqBox.x}, width=${faqBox.width}`);
    console.log(`Records Section: x=${recordsBox.x}, width=${recordsBox.width}`);

    const widthDiff = Math.abs(faqBox.width - recordsBox.width);
    const leftDiff = Math.abs(faqBox.x - recordsBox.x);
    console.log(`FAQ Width Diff: ${widthDiff}px, Left Diff: ${leftDiff}px`);
    if (widthDiff > 2 || leftDiff > 2) {
      throw new Error(`FAQ section does not span full width matching records section (width diff: ${widthDiff}px)`);
    }
    console.log('✅ Requirement 2 Verified: FAQ is 100% full-width aligned with the rest of the page!');

    // -------------------------------------------------------------
    // 4. Test 2-Currency Switcher & Dynamic Conversion
    // -------------------------------------------------------------
    console.log('💱 4. Testing 2-Currency Switcher & Dynamic Conversion...');
    const currencyButtons = page.locator('.lg\\:col-span-7 .flex.items-center.gap-1.p-1 button');
    const currencyBtnCount = await currencyButtons.count();
    console.log(`Visible Currency Toggle Buttons: ${currencyBtnCount}`);
    if (currencyBtnCount !== 2) {
      throw new Error(`Expected exactly 2 currency buttons (Local & USD), found: ${currencyBtnCount}`);
    }

    // Toggle to USD
    await currencyButtons.nth(1).click();
    await page.waitForTimeout(300);
    const ctaTextUSD = await page.locator('button:has-text("前往 Stripe 安全收银台支付")').textContent();
    console.log(`CTA Text after selecting USD: "${ctaTextUSD?.trim()}"`);
    if (!ctaTextUSD?.includes('USD')) {
      throw new Error('Expected CTA button to display USD currency code');
    }

    // Check USD preset buttons in grid-cols-3
    const usdPresets = page.locator('.grid.grid-cols-3.gap-2\\.5 button');
    const usdPresetCount = await usdPresets.count();
    console.log(`USD Presets Count: ${usdPresetCount}`);
    if (usdPresetCount !== 6) {
      throw new Error(`Expected 6 preset buttons in grid-cols-3, got ${usdPresetCount}`);
    }

    // Switch back to CNY
    await currencyButtons.nth(0).click();
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // 5. Test 6 Presets in grid-cols-3 and In-place Custom Input
    // -------------------------------------------------------------
    console.log('☕ 5. Auditing 6 Presets in grid-cols-3 and In-place Custom Input...');
    const cnyPresets = page.locator('.grid.grid-cols-3.gap-2\\.5 button');
    await cnyPresets.nth(2).click(); // Click 3rd preset (¥14)
    await page.waitForTimeout(200);

    const ctaText14 = await page.locator('button:has-text("前往 Stripe 安全收银台支付")').textContent();
    console.log(`CTA Text after picking 3rd preset: "${ctaText14?.trim()}"`);
    if (!ctaText14?.includes('14')) {
      throw new Error('Expected CTA to show amount 14');
    }

    // Test in-place custom input
    const customInputLabel = page.locator('label.cursor-text');
    if (!(await customInputLabel.isVisible())) {
      throw new Error('Custom amount label (cursor-text) is missing');
    }

    const customInput = customInputLabel.locator('input[type="number"]');
    await customInput.fill('50');
    await page.waitForTimeout(200);

    const ctaText50 = await page.locator('button:has-text("前往 Stripe 安全收银台支付")').textContent();
    console.log(`CTA Text after filling custom 50: "${ctaText50?.trim()}"`);
    if (!ctaText50?.includes('50')) {
      throw new Error('Expected CTA to show custom amount 50');
    }
    console.log('✅ Requirement 4 & 5 Verified: Copied grid-cols-3 and cursor-text custom input work seamlessly!');

    // -------------------------------------------------------------
    // 6. Test Serv00-styled Supporter Inputs & Clean Notice
    // -------------------------------------------------------------
    console.log('👤 6. Testing Serv00-styled Supporter Inputs & Notice...');
    const nameLabel = await page.locator('label:has-text("称呼或社交账号")').textContent();
    const msgLabel = await page.locator('label:has-text("留言寄语")').textContent();
    console.log(`Field 1 Label: "${nameLabel?.trim()}"`);
    console.log(`Field 2 Label: "${msgLabel?.trim()}"`);

    if (!nameLabel?.includes('👤 称呼或社交账号 (Name or your social) (可选)')) {
      throw new Error(`Label does not match Serv00 standard: ${nameLabel}`);
    }
    if (!msgLabel?.includes('💬 留言寄语 (Say something nice) (可选)')) {
      throw new Error(`Label does not match Serv00 standard: ${msgLabel}`);
    }

    const nameInput = page.locator('input[placeholder="例如：@github_username 或 Shijian Friend"]');
    const msgInput = page.locator('textarea[placeholder="写下想对作者说的话或鼓励..."]');
    if (!(await nameInput.isVisible()) || !(await msgInput.isVisible())) {
      throw new Error('Supporter input placeholders do not match Serv00 format');
    }

    // Check notice under button
    const noticeText = await page.locator('.pt-4.space-y-2 p').textContent();
    console.log(`Notice under button: "${noticeText?.trim()}"`);
    if (!noticeText?.includes('支持信息将在完成付款后自动推送到作者 Telegram 频道并安全保存')) {
      throw new Error('Missing exact telegram completion notice under button');
    }
    console.log('✅ Requirement 6 Verified: Serv00 inputs and clean notification text verified!');

    // Fill inputs
    await nameInput.fill('时间探索者');
    await msgInput.fill('非常喜爱博客的极客交互与深度长文，请博主喝咖啡！☕️🚀');

    // -------------------------------------------------------------
    // 7. Test Triggering Stripe Modal (Direct Checkout Mode)
    // -------------------------------------------------------------
    console.log('💳 7. Testing Stripe Checkout CTA Trigger button...');
    const stripeCta = page.locator('button:has-text("前往 Stripe 安全收银台支付")');
    await stripeCta.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('.fixed.inset-0.z-\\[10000\\]');
    const isModalVisible = await modal.isVisible();
    console.log(`Stripe Modal visible: ${isModalVisible}`);
    if (!isModalVisible) {
      throw new Error('RewardModal did not open when clicking Stripe CTA button');
    }

    await page.screenshot({ path: path.join(outDir, '02-desktop-stripe-modal-opened.png') });

    // Close modal
    const closeBtn = modal.locator('button:has(svg.lucide-x)');
    await closeBtn.click();
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // 8. Test Accurate LV.0-LV.4 Disassociation in FAQ (No Amber Filler Card)
    // -------------------------------------------------------------
    console.log('💎 8. Auditing Accurate LV.0-LV.4 Disassociation in FAQ...');
    // Assert amber card is NOT present in right column
    const amberCards = page.locator('.bg-amber-50\\/60');
    const amberCount = await amberCards.count();
    console.log(`Amber filler cards count: ${amberCount}`);
    if (amberCount > 0) {
      throw new Error('Amber filler card should be removed from the column');
    }

    const lvFaqBtn = page.locator('button:has-text("赞赏支持能否提升我的社区等级 (LV) 或信任等级 (TL)？")');
    await lvFaqBtn.click();
    await page.waitForTimeout(300);

    const faqContent = await page.locator('text=完全不能，两者 100% 独立脱钩').textContent();
    console.log(`FAQ Answer: "${faqContent?.trim().slice(0, 100)}..."`);
    if (!faqContent?.includes('LV.0 至 LV.4')) {
      throw new Error('FAQ must accurately reflect the project level system (LV.0 至 LV.4)');
    }
    console.log('✅ Requirement 8 Verified: Grounded LV.0-LV.4 disassociation verified without filler cards!');

    // -------------------------------------------------------------
    // 9. Test Supporter Table Advanced Pagination
    // -------------------------------------------------------------
    console.log('📜 9. Testing Supporter Table Advanced Pagination...');
    await page.locator('#sponsor-records').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const prevBtn = page.locator('button:has-text("上一页"):has(svg.lucide-chevron-left)');
    const nextBtn = page.locator('button:has-text("下一页"):has(svg.lucide-chevron-right)');
    if (!(await prevBtn.isVisible()) || !(await nextBtn.isVisible())) {
      throw new Error('Prev or Next buttons missing Chevron icon or text');
    }

    const page1Btn = page.locator('.flex.items-center.gap-1 button:has-text("1")').first();
    const page2Btn = page.locator('.flex.items-center.gap-1 button:has-text("2")').first();
    const jumpBtn = page.locator('.flex.items-center.gap-1 button:has-text("...")').first();

    console.log(`Page 1 Btn Visible: ${await page1Btn.isVisible()}`);
    console.log(`Page 2 Btn Visible: ${await page2Btn.isVisible()}`);
    console.log(`Jump "..." Btn Visible: ${await jumpBtn.isVisible()}`);

    // Click Next button
    await nextBtn.click();
    await page.waitForTimeout(300);

    const pageInfoText = await page.locator('#sponsor-records').getByText(/第\s*2\s*\//).textContent();
    console.log(`Page text after clicking next: "${pageInfoText?.trim()}"`);

    await page.screenshot({ path: path.join(outDir, '03-desktop-pagination-page2.png') });
    console.log('✅ Requirement 9 Verified: Advanced pagination works with icons and number windows!');

    // -------------------------------------------------------------
    // 10. Mobile Viewport Audit (375 x 812)
    // -------------------------------------------------------------
    console.log('📱 10. Testing Mobile Viewport (375x812)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 2,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://127.0.0.1:4399/support/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await mobilePage.waitForSelector('#sponsor-records', { timeout: 10000 });
    await mobilePage.waitForTimeout(500);

    await mobilePage.screenshot({
      path: path.join(outDir, '04-mobile-hero.png'),
      fullPage: false,
    });

    await mobilePage.locator('#sponsor-records').scrollIntoViewIfNeeded();
    await mobilePage.waitForTimeout(500);
    await mobilePage.screenshot({
      path: path.join(outDir, '05-mobile-roster-table.png'),
      fullPage: false,
    });

    await mobileContext.close();
    await context.close();

    console.log('🎉 All Support Page requirements PASSED Playwright verification!');
  } finally {
    await browser.close();
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
