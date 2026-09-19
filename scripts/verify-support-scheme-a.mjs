import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

async function runVerification() {
  console.log('--- Starting Task 122 Scheme A Support Cards Verification ---');

  // 1. Start static server
  const server = spawn('python3', ['-m', 'http.server', '4388', '-d', 'dist'], {
    stdio: 'ignore'
  });
  await new Promise(r => setTimeout(r, 1500));

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    const targetUrl = 'http://localhost:4388/support/';
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Audit the 6 preset buttons and SVGs
    const auditData = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).filter(b =>
        b.className.includes('max-h-[54px]')
      );

      const legacyJitterElements = document.querySelectorAll('[class*="animate-coffee-"]');

      const cardDetails = buttons.map((b, idx) => {
        const svg = b.querySelector('div[aria-hidden="true"] svg');
        const isSelected = b.className.includes('scale-[1.02]');
        const svgOuter = svg ? svg.outerHTML : '';

        // Check for forbidden dirty hardcoded colors
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

    console.log('Audit Summary:', JSON.stringify(auditData, null, 2));

    // Assertions
    if (auditData.cardCount !== 6) {
      throw new Error(`FAIL: Expected 6 preset tier cards, got ${auditData.cardCount}`);
    }

    if (auditData.legacyJitterCount !== 0) {
      throw new Error(`FAIL: Found ${auditData.legacyJitterCount} elements with legacy jittery animate-coffee classes!`);
    }

    // Check Tier 2 (Latte / 目标卡片)
    const tier2 = auditData.cardDetails[2];
    if (!tier2 || !tier2.isSelected) {
      throw new Error('FAIL: Tier 2 (Index 2) should be selected by default!');
    }
    if (!tier2.hasSvg || tier2.viewBox !== '0 0 48 48') {
      throw new Error(`FAIL: Tier 2 SVG missing or invalid viewBox (${tier2.viewBox})!`);
    }
    if (!tier2.hasCurrentColor) {
      throw new Error('FAIL: Tier 2 SVG must use currentColor!');
    }
    if (tier2.foundForbidden.length > 0) {
      throw new Error(`FAIL: Tier 2 SVG contains forbidden hardcoded colors: ${tier2.foundForbidden.join(', ')}`);
    }

    // Check all other tiers
    for (const card of auditData.cardDetails) {
      if (!card.hasSvg || card.viewBox !== '0 0 48 48') {
        throw new Error(`FAIL: Tier ${card.idx} SVG invalid viewBox (${card.viewBox})!`);
      }
      if (!card.hasCurrentColor) {
        throw new Error(`FAIL: Tier ${card.idx} SVG must use currentColor!`);
      }
      if (card.foundForbidden.length > 0) {
        throw new Error(`FAIL: Tier ${card.idx} SVG contains forbidden colors: ${card.foundForbidden.join(', ')}`);
      }
    }

    // Save screenshots
    const grid = await page.$('.grid.grid-cols-2');
    if (grid) {
      await grid.screenshot({ path: 'scripts/verify-support-scheme-a-grid.png' });
      console.log('Saved scripts/verify-support-scheme-a-grid.png');
    }

    const selectedCard = await page.$('.scale-\\[1\\.02\\]');
    if (selectedCard) {
      await selectedCard.screenshot({ path: 'scripts/verify-support-scheme-a-selected.png' });
      console.log('Saved scripts/verify-support-scheme-a-selected.png');
    }

    await browser.close();
    console.log('>>> SUCCESS: All Task 122 Scheme A assertions passed 100%! <<<');
  } finally {
    server.kill();
  }
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
