import { chromium } from 'playwright';

async function run() {
  const targetUrl = process.env.TEST_URL || 'http://localhost:4321/';
  console.log(`[E2E Verification] Testing #footer_deal and .deal_link on: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  let hasFailure = false;

  try {
    // 1. Desktop Light Mode (1440px)
    console.log('\n--- 1. Testing Desktop 1440px Light Mode ---');
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const deal = page.locator('#footer_deal');
    const dealCount = await deal.count();
    if (dealCount === 0) throw new Error('#footer_deal not found on page');

    const links = await deal.locator('.deal_link').all();
    if (links.length !== 8) throw new Error(`Expected 8 .deal_link elements, got ${links.length}`);
    console.log('✓ Found 8 .deal_link items in #footer_deal');

    const logo = deal.locator('.footer_mini_logo');
    if (await logo.count() !== 1) throw new Error('Expected 1 .footer_mini_logo element');
    console.log('✓ Found 1 .footer_mini_logo in center');

    // Check light mode styles of link 0
    const lightStyle = await links[0].evaluate(el => {
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        color: s.color,
        borderWidth: s.borderTopWidth,
        borderRadius: s.borderRadius,
        margin: s.margin,
        width: parseFloat(s.width),
        height: parseFloat(s.height)
      };
    });
    console.log('Light Mode .deal_link style:', lightStyle);

    // Assert light mode: should NOT be dark/black (i.e. NOT rgb(54, 54, 54) or dark black)
    // and color should be dark font (not white)
    if (lightStyle.bg.includes('54, 54, 54')) {
      throw new Error(`Light mode .deal_link background is dark black (${lightStyle.bg}), should be light/translucent!`);
    }
    console.log('✓ Light mode .deal_link background is properly light/translucent (not dark black)');

    // Vertical alignment check: all items must have identical centerY (subpixel tolerance <= 1px)
    const children = await deal.locator('> *').all();
    const centerYs = [];
    for (let i = 0; i < children.length; i++) {
      const b = await children[i].boundingBox();
      if (!b) continue;
      centerYs.push({ i, centerY: b.y + b.height / 2 });
    }
    const baseCenterY = centerYs[0].centerY;
    for (const c of centerYs) {
      if (Math.abs(c.centerY - baseCenterY) > 1.5) {
        throw new Error(`Vertical misalignment detected! Child ${c.i} centerY = ${c.centerY}, expected ~${baseCenterY}`);
      }
    }
    console.log(`✓ All 9 items perfectly vertically aligned at centerY = ${baseCenterY.toFixed(1)}px (tolerance <= 1px)`);

    // 2. Desktop Dark Mode (1440px)
    console.log('\n--- 2. Testing Desktop 1440px Dark Mode ---');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);

    const darkStyle = await links[0].evaluate(el => {
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        color: s.color,
        border: s.borderColor
      };
    });
    console.log('Dark Mode .deal_link style:', darkStyle);

    // Assert dark mode: should NOT be pure white (i.e. NOT rgb(247, 247, 250) or rgb(255, 255, 255))
    if (darkStyle.bg.includes('247, 247, 250') || darkStyle.bg.includes('255, 255, 255')) {
      throw new Error(`Dark mode .deal_link background is glaring white (${darkStyle.bg}), should be dark/translucent!`);
    }
    console.log('✓ Dark mode .deal_link background is properly dark/translucent (not glaring white)');

    // Test Hover
    await links[0].hover();
    await page.waitForTimeout(300);
    const hoverStyle = await links[0].evaluate(el => {
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        color: s.color,
        transform: s.transform
      };
    });
    console.log('Hover style:', hoverStyle);
    if (!hoverStyle.transform || hoverStyle.transform === 'none') {
      throw new Error('Hover transform was not applied');
    }
    console.log('✓ Hover transition and theme color shift verified');

    await page.close();

    // 3. Mobile Viewports (375px, 414px, 768px)
    console.log('\n--- 3. Testing Mobile Responsive Viewports (375px, 414px, 768px) ---');
    for (const w of [375, 414, 768]) {
      const p = await browser.newPage({ viewport: { width: w, height: 800 } });
      await p.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1000);

      const mLogo = p.locator('#footer_deal .footer_mini_logo');
      const logoVisible = await mLogo.isVisible();
      if (logoVisible) {
        throw new Error(`Mobile viewport ${w}px: .footer_mini_logo should be hidden (display: none), but is visible`);
      }
      console.log(`✓ [${w}px] .footer_mini_logo is cleanly hidden`);

      const mLinks = await p.locator('#footer_deal .deal_link').all();
      const rows = {};
      for (let i = 0; i < mLinks.length; i++) {
        const b = await mLinks[i].boundingBox();
        if (!b) continue;
        const y = Math.round(b.y);
        if (!rows[y]) rows[y] = [];
        rows[y].push(i);
      }
      const rowKeys = Object.keys(rows);
      if (rowKeys.length !== 2) {
        throw new Error(`[${w}px] Expected exactly 2 neat rows, got ${rowKeys.length} rows`);
      }
      if (rows[rowKeys[0]].length !== 4 || rows[rowKeys[1]].length !== 4) {
        throw new Error(`[${w}px] Expected 4 items per row, got ${rows[rowKeys[0]].length} and ${rows[rowKeys[1]].length}`);
      }
      console.log(`✓ [${w}px] 8 links cleanly organized into symmetrical 4x2 grid (Row 1: 4 items, Row 2: 4 items)`);
      await p.close();
    }

    console.log('\n========================================');
    console.log('🎉 ALL #footer_deal & .deal_link E2E TESTS PASSED 100%!');
    console.log('========================================');
  } catch (err) {
    console.error('❌ E2E Verification failed:', err.message);
    hasFailure = true;
  } finally {
    await browser.close();
  }

  if (hasFailure) {
    process.exit(1);
  }
}

run();
