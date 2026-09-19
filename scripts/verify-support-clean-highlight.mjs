import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import path from 'path';

async function verify() {
  console.log('--- Verifying Local Support Cards: No Checkmark & Calibrated Colors ---');

  const evidenceDir = '/root/.gemini/antigravity-cli/brain/263c6162-0b6b-4920-bdcd-08294889ac04';

  const server = spawn('python3', ['-m', 'http.server', '4399', '-d', 'dist'], {
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

    const targetUrl = 'http://localhost:4399/support/';
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for support dashboard
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

    console.log('Local Audit Result:', JSON.stringify(audit, null, 2));

    if (audit.cardCount !== 6) {
      throw new Error(`FAIL: Expected 6 cards, found ${audit.cardCount}`);
    }
    if (audit.checkmarkCount !== 0) {
      throw new Error(`FAIL: Found ${audit.checkmarkCount} checkmark badges inside tier cards! They must be completely deleted.`);
    }

    const tier2 = audit.cards[2];
    if (!tier2.isSelected) {
      throw new Error('FAIL: Tier 2 should be selected by default!');
    }
    if (tier2.hasLegacyDarkIndigo) {
      throw new Error('FAIL: Tier 2 still contains legacy dark indigo-700 in light mode!');
    }
    if (tier2.hasLegacyBrightRing) {
      throw new Error('FAIL: Tier 2 still contains legacy bright neon ring in dark mode!');
    }

    // Capture Light Screenshot
    const grid = await page.$('.grid.grid-cols-2');
    if (grid) {
      await grid.screenshot({ path: path.join(evidenceDir, 'local_support_clean_grid_light.png') });
      console.log('Saved local_support_clean_grid_light.png');
    }

    const selectedCard = await page.$('.scale-\\[1\\.02\\]');
    if (selectedCard) {
      await selectedCard.screenshot({ path: path.join(evidenceDir, 'local_support_clean_selected_light.png') });
      console.log('Saved local_support_clean_selected_light.png');
    }

    // Capture Dark Screenshot
    console.log('Testing dark mode...');
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await new Promise(r => setTimeout(r, 400));

    if (grid) {
      await grid.screenshot({ path: path.join(evidenceDir, 'local_support_clean_grid_dark.png') });
      console.log('Saved local_support_clean_grid_dark.png');
    }
    if (selectedCard) {
      await selectedCard.screenshot({ path: path.join(evidenceDir, 'local_support_clean_selected_dark.png') });
      console.log('Saved local_support_clean_selected_dark.png');
    }

    await browser.close();
    console.log('>>> LOCAL VERIFICATION PASSED 100%! <<<');
  } finally {
    server.kill();
  }
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
