import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function runArchetypeVerification() {
  const screenshotDir = path.resolve('scripts/audit_screenshots/snow_archetypes');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log('❄️ Starting Snow Mantle Morphology & Diversity Verification...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
    // 1. Visit Homepage
    console.log('Navigating to local preview / dist...');
    await page.goto('http://localhost:4321/', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);

    // 2. Audit all cards with snow mantles
    const mantleData = await page.evaluate(() => {
      const items = [];
      const svgs = document.querySelectorAll('.card-snow-svg');
      svgs.forEach((svg) => {
        const parent = svg.parentElement;
        const archetype = svg.getAttribute('data-snow-archetype');
        const seed = svg.getAttribute('data-snow-seed');
        const pathD = svg.querySelector('.snow-body')?.getAttribute('d') || '';
        const isRecentPost = parent?.classList.contains('recent-post-item');
        const cardTitle = parent?.querySelector('.article-title, h1, h2, h3, h4')?.textContent?.trim() || '';
        const cardId = parent?.getAttribute('data-card-id') || parent?.id || '';
        const cardIndex = parent?.getAttribute('data-card-index') || '';

        items.push({
          tag: parent?.tagName,
          className: parent?.className?.slice(0, 60),
          cardId,
          cardIndex,
          cardTitle,
          isRecentPost,
          archetype,
          seed,
          pathLength: pathD.length,
          pathSnippet: pathD.slice(0, 50),
        });
      });
      return items;
    });

    console.log(`Found ${mantleData.length} attached snow mantles.`);
    console.log('\n--- Recent Post Items Snow Analysis ---');
    const recentPostsSnow = mantleData.filter((m) => m.isRecentPost);
    console.log(`Found ${recentPostsSnow.length} recent-post-item cards.`);
    recentPostsSnow.forEach((p, i) => {
      console.log(`Card ${i}: [Archetype: ${p.archetype}] [Seed: ${p.seed}] [Title: ${p.cardTitle || p.cardId}]`);
    });

    // Verification 1: Multiple distinct archetypes must be present
    const distinctArchetypes = new Set(recentPostsSnow.map((p) => p.archetype));
    console.log(`\nDistinct Archetypes across recent-post-item: ${distinctArchetypes.size} (${Array.from(distinctArchetypes).join(', ')})`);
    if (recentPostsSnow.length >= 4 && distinctArchetypes.size < 3) {
      throw new Error(`Insufficient archetype diversity! Expected at least 3 distinct archetypes, got ${distinctArchetypes.size}`);
    }

    // Verification 2: Path D strings across adjacent cards must NOT be identical
    for (let i = 0; i < recentPostsSnow.length - 1; i++) {
      const curr = recentPostsSnow[i];
      const next = recentPostsSnow[i + 1];
      if (curr.seed === next.seed) {
        throw new Error(`Adjacent cards ${i} and ${i + 1} share identical seed (${curr.seed})!`);
      }
      if (curr.pathSnippet === next.pathSnippet) {
        throw new Error(`Adjacent cards ${i} and ${i + 1} have identical path data!`);
      }
    }
    console.log('✅ Adjacent recent-post-item cards confirmed to have completely distinct procedural seeds and geometry!');

    // Verification 3: ProfileCard morphology
    const profileSnow = mantleData.find((m) => m.className?.includes('profile-card'));
    if (profileSnow) {
      console.log(`Profile Card Snow: Archetype = ${profileSnow.archetype}, Seed = ${profileSnow.seed}`);
    }

    // 3. Take screenshots of recent post items grid
    const postsGrid = await page.$('#recent-posts');
    if (postsGrid) {
      await postsGrid.screenshot({
        path: path.join(screenshotDir, '01_recent_posts_diverse_snow.png'),
      });
      console.log('Saved 01_recent_posts_diverse_snow.png');
    }

    // Capture individual adjacent cards for direct side-by-side visual comparison
    const cards = await page.$$('#recent-posts .recent-post-item');
    for (let i = 0; i < Math.min(4, cards.length); i++) {
      await cards[i].screenshot({
        path: path.join(screenshotDir, `02_card_${i}_archetype_${recentPostsSnow[i]?.archetype}.png`),
      });
      console.log(`Saved 02_card_${i}_archetype_${recentPostsSnow[i]?.archetype}.png`);
    }

    console.log('\n🎉 Snow Mantle Morphology & Diversity Verification PASSED successfully!');
  } finally {
    await browser.close();
  }
}

runArchetypeVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
