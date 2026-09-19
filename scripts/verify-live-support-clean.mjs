import puppeteer from 'puppeteer';
import path from 'path';

async function verifyLive() {
  console.log('=== Verifying Live Production: Support Cards No Checkmark & Calibrated Colors ===');

  const evidenceDir = '/root/.gemini/antigravity-cli/brain/263c6162-0b6b-4920-bdcd-08294889ac04';

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const liveUrl = 'https://blog.epocanvas.com/support/';
  console.log(`Navigating to ${liveUrl}...`);
  await page.goto(liveUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for the support dashboard
  await page.waitForSelector('.grid.grid-cols-2 button.max-h-\\[54px\\]', { timeout: 15000 });

  const audit = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).filter(b =>
      b.className.includes('max-h-[54px]')
    );

    // Check if any checkmark SVG exists inside these buttons
    const checkmarkSvgs = buttons.filter(b => {
      const checkIcon = b.querySelector('svg.lucide-check, svg[class*="lucide-check"]');
      return Boolean(checkIcon);
    });

    const cards = buttons.map((b, idx) => {
      const isSelected = b.className.includes('scale-[1.02]');
      const hasLegacyDarkIndigo = b.className.includes('indigo-700');
      const hasLegacyBrightRing = b.className.includes('ring-blue-400/50') || b.className.includes('ring-amber-400/50');
      const hasMuddy950Text = b.className.includes('text-amber-950') || b.className.includes('text-blue-950');

      return {
        idx,
        isSelected,
        hasLegacyDarkIndigo,
        hasLegacyBrightRing,
        hasMuddy950Text,
        classes: b.className
      };
    });

    return {
      cardCount: buttons.length,
      checkmarkCount: checkmarkSvgs.length,
      cards
    };
  });

  console.log('Live Production Audit Result:', JSON.stringify(audit, null, 2));

  if (audit.cardCount !== 6) {
    throw new Error(`FAIL: Expected 6 cards on live production, found ${audit.cardCount}`);
  }
  if (audit.checkmarkCount !== 0) {
    throw new Error(`FAIL: Found ${audit.checkmarkCount} checkmarks on live production!`);
  }

  const tier2 = audit.cards[2];
  if (!tier2.isSelected) {
    throw new Error('FAIL: Tier 2 should be selected by default on live production!');
  }
  if (tier2.hasLegacyDarkIndigo) {
    throw new Error('FAIL: Tier 2 contains legacy dark indigo-700 on live production!');
  }
  if (tier2.hasLegacyBrightRing) {
    throw new Error('FAIL: Tier 2 contains legacy bright ring on live production!');
  }

  // Screenshots
  const grid = await page.$('.grid.grid-cols-2');
  if (grid) {
    await grid.screenshot({ path: path.join(evidenceDir, 'live_support_clean_grid_light.png') });
    console.log('Saved live_support_clean_grid_light.png');
  }

  const selectedCard = await page.$('.scale-\\[1\\.02\\]');
  if (selectedCard) {
    await selectedCard.screenshot({ path: path.join(evidenceDir, 'live_support_clean_selected_light.png') });
    console.log('Saved live_support_clean_selected_light.png');
  }

  // Dark mode
  console.log('Testing dark mode on live production...');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await new Promise(r => setTimeout(r, 400));

  if (grid) {
    await grid.screenshot({ path: path.join(evidenceDir, 'live_support_clean_grid_dark.png') });
    console.log('Saved live_support_clean_grid_dark.png');
  }
  if (selectedCard) {
    await selectedCard.screenshot({ path: path.join(evidenceDir, 'live_support_clean_selected_dark.png') });
    console.log('Saved live_support_clean_selected_dark.png');
  }

  await browser.close();
  console.log('\n============================================================');
  console.log('>>> LIVE PRODUCTION (https://blog.epocanvas.com/support/) VERIFIED 100%! <<<');
  console.log('============================================================\n');
}

verifyLive().catch(err => {
  console.error(err);
  process.exit(1);
});
