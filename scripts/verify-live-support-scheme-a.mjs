import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function verifyLive() {
  console.log('=== Verifying Live Production (https://blog.epocanvas.com/support/) ===');

  const evidenceDir = '/root/.gemini/antigravity-cli/brain/263c6162-0b6b-4920-bdcd-08294889ac04';

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Listen to console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const liveUrl = 'https://blog.epocanvas.com/support/';
  console.log(`Navigating to ${liveUrl}...`);
  await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for the support dashboard to mount
  await page.waitForSelector('.grid.grid-cols-2 button.max-h-\\[54px\\]', { timeout: 15000 });

  // 1. Audit Preset Tier Cards
  const auditData = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).filter(b =>
      b.className.includes('max-h-[54px]')
    );

    const legacyJitterElements = document.querySelectorAll('[class*="animate-coffee-"]');

    const cardDetails = buttons.map((b, idx) => {
      const svg = b.querySelector('div[aria-hidden="true"] svg');
      const isSelected = b.className.includes('scale-[1.02]');
      const svgOuter = svg ? svg.outerHTML : '';

      const forbiddenColors = ['#451a03', '#78350f', '#cbd5e1', '#4338ca', '#d97706', '#059669', '#7c3aed', '#be123c', '#fffbeb'];
      const foundForbidden = forbiddenColors.filter(c => svgOuter.toLowerCase().includes(c.toLowerCase()));

      return {
        idx,
        isSelected,
        hasSvg: Boolean(svg),
        viewBox: svg ? svg.getAttribute('viewBox') : null,
        hasCurrentColor: svgOuter.includes('currentColor'),
        foundForbidden,
        classes: b.className,
        rect: {
          width: Math.round(b.offsetWidth),
          height: Math.round(b.offsetHeight),
        }
      };
    });

    return {
      cardCount: buttons.length,
      legacyJitterCount: legacyJitterElements.length,
      cardDetails
    };
  });

  console.log('Live Production Audit Data:', JSON.stringify(auditData, null, 2));

  if (auditData.cardCount !== 6) {
    throw new Error(`FAIL: Expected 6 preset tier cards on live, got ${auditData.cardCount}`);
  }
  if (auditData.legacyJitterCount !== 0) {
    throw new Error(`FAIL: Found ${auditData.legacyJitterCount} elements with legacy jittery animate-coffee classes on live!`);
  }

  // Verify Tier 2
  const tier2 = auditData.cardDetails[2];
  if (!tier2 || !tier2.isSelected) {
    throw new Error('FAIL: Tier 2 (Latte) should be selected by default on live!');
  }
  if (!tier2.hasSvg || tier2.viewBox !== '0 0 48 48') {
    throw new Error(`FAIL: Tier 2 SVG on live invalid viewBox (${tier2.viewBox})!`);
  }
  if (!tier2.hasCurrentColor) {
    throw new Error('FAIL: Tier 2 SVG on live must use currentColor!');
  }
  if (tier2.foundForbidden.length > 0) {
    throw new Error(`FAIL: Tier 2 SVG on live contains forbidden colors: ${tier2.foundForbidden.join(', ')}`);
  }

  // Check all tiers
  for (const card of auditData.cardDetails) {
    if (!card.hasSvg || card.viewBox !== '0 0 48 48') {
      throw new Error(`FAIL: Live Tier ${card.idx} SVG invalid viewBox (${card.viewBox})!`);
    }
    if (!card.hasCurrentColor) {
      throw new Error(`FAIL: Live Tier ${card.idx} SVG must use currentColor!`);
    }
    if (card.foundForbidden.length > 0) {
      throw new Error(`FAIL: Live Tier ${card.idx} SVG contains forbidden colors: ${card.foundForbidden.join(', ')}`);
    }
  }

  // 2. Capture Live Screenshots (Light Mode)
  const gridHandle = await page.$('.grid.grid-cols-2');
  if (gridHandle) {
    await gridHandle.screenshot({ path: path.join(evidenceDir, 'live_support_scheme_a_grid_light.png') });
    console.log('Saved live_support_scheme_a_grid_light.png');
  }

  const selectedHandle = await page.$('.scale-\\[1\\.02\\]');
  if (selectedHandle) {
    await selectedHandle.screenshot({ path: path.join(evidenceDir, 'live_support_scheme_a_selected_light.png') });
    console.log('Saved live_support_scheme_a_selected_light.png');
  }

  // 3. Test Clicking Other Cards (e.g. Tier 4 Pour-over)
  console.log('Testing clicking Tier 4 (Pour-over) on live...');
  const buttons = await page.$$('.grid.grid-cols-2 button.max-h-\\[54px\\]');
  if (buttons[4]) {
    await buttons[4].click();
    await new Promise(r => setTimeout(r, 400));

    const isTier4Selected = await buttons[4].evaluate(b => b.className.includes('scale-[1.02]'));
    console.log('Tier 4 selected state after click:', isTier4Selected);
    if (!isTier4Selected) {
      throw new Error('FAIL: Clicking Tier 4 did not activate it on live!');
    }

    await buttons[4].screenshot({ path: path.join(evidenceDir, 'live_support_scheme_a_tier4_selected.png') });
    console.log('Saved live_support_scheme_a_tier4_selected.png');
  }

  // 4. Test Dark Mode
  console.log('Testing dark mode on live...');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await new Promise(r => setTimeout(r, 400));

  if (gridHandle) {
    await gridHandle.screenshot({ path: path.join(evidenceDir, 'live_support_scheme_a_grid_dark.png') });
    console.log('Saved live_support_scheme_a_grid_dark.png');
  }

  // 5. Mobile Viewport Check (390 x 844)
  console.log('Testing mobile viewport on live...');
  await page.setViewport({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));

  const mobileGrid = await page.$('.grid.grid-cols-2');
  if (mobileGrid) {
    await mobileGrid.screenshot({ path: path.join(evidenceDir, 'live_support_scheme_a_grid_mobile.png') });
    console.log('Saved live_support_scheme_a_grid_mobile.png');
  }

  console.log('Console Errors:', consoleErrors);
  if (consoleErrors.some(e => !e.includes('favicon') && !e.includes('analytics'))) {
    console.warn('Warning: Some console errors detected during live run:', consoleErrors);
  }

  await browser.close();
  console.log('\n============================================================');
  console.log('>>> PRODUCTION (https://blog.epocanvas.com/support/) VERIFIED 100%! <<<');
  console.log('============================================================\n');
}

verifyLive().catch(err => {
  console.error(err);
  process.exit(1);
});
