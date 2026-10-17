import fs from 'fs';
import { chromium } from 'playwright';

const LIVE_TARGETS = [
  'https://b50f8ce0.shijianus-blog.pages.dev',
  'https://blog.epocanvas.com',
];

const TEST_POSTS = [
  '/posts/content-formats-and-markup-mastery/',
  '/posts/media-capability-lab/',
  '/posts/readable-geek-interfaces/',
];

async function runLiveAudit() {
  console.log('[PROD E2E] Starting Live Post Hero Optimizations Audit...');
  const executablePath = fs.existsSync('/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome')
    ? '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'
    : undefined;
  const browser = await chromium.launch({ headless: true, executablePath });

  try {
    for (const baseUrl of LIVE_TARGETS) {
      console.log(`\n======================================================`);
      console.log(`Testing Live Target: ${baseUrl}`);
      console.log(`======================================================`);

      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      for (const postPath of TEST_POSTS) {
        const fullUrl = `${baseUrl}${postPath}`;
        console.log(`\nAuditing Post: ${fullUrl}`);

        const response = await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!response || response.status() >= 400) {
          console.warn(`[WARN] Got HTTP status ${response ? response.status() : 'null'} for ${fullUrl}`);
        }
        await page.waitForTimeout(1000);

        const audit = await page.evaluate(() => {
          const heroShell = document.querySelector('.page-shell__hero');
          const postHero = document.querySelector('.post-hero');
          const heroInner = document.querySelector('.post-hero__inner');
          const translations = document.querySelectorAll('.post-hero__translations');
          const langTags = document.querySelectorAll('.post-hero__lang-tag');
          const badgesContainer = document.querySelector('.post-hero__badges');
          const allTags = Array.from(document.querySelectorAll('.post-hero__tag'));
          const titleBlock = document.querySelector('.post-hero__title-block');
          const titleEl = document.querySelector('.post-hero__title-block h1, .post-hero__title');
          const ledeEl = document.querySelector('.post-hero__lede');
          const metaGrid = document.querySelector('.post-hero__meta-grid');
          const waves = document.querySelector('.post-hero__waves');

          const heroShellRect = heroShell ? heroShell.getBoundingClientRect() : null;
          const postHeroRect = postHero ? postHero.getBoundingClientRect() : null;
          const badgesRect = badgesContainer ? badgesContainer.getBoundingClientRect() : null;
          const titleBlockRect = titleBlock ? titleBlock.getBoundingClientRect() : null;
          const metaGridRect = metaGrid ? metaGrid.getBoundingClientRect() : null;
          const wavesRect = waves ? waves.getBoundingClientRect() : null;

          const heroInnerComputed = heroInner ? window.getComputedStyle(heroInner) : null;
          const metaGridComputed = metaGrid ? window.getComputedStyle(metaGrid) : null;
          const wavesComputed = waves ? window.getComputedStyle(waves) : null;
          const badgesComputed = badgesContainer ? window.getComputedStyle(badgesContainer) : null;
          const titleBlockComputed = titleBlock ? window.getComputedStyle(titleBlock) : null;

          const tagMetrics = allTags.map((tag) => {
            const r = tag.getBoundingClientRect();
            const comp = window.getComputedStyle(tag);
            return {
              text: tag.textContent.trim(),
              display: comp.display,
              width: r.width,
              left: r.left,
              right: r.right,
              top: r.top,
            };
          });

          const visibleTags = tagMetrics.filter((t) => t.display !== 'none');
          const uniqueTops = new Set(visibleTags.map((t) => Math.round(t.top)));
          const tagsWrap = uniqueTops.size > 1;

          return {
            translationsCount: translations.length,
            langTagsCount: langTags.length,
            badgesContainerMaxWidth: badgesComputed ? badgesComputed.maxWidth : null,
            badgesFlexWrap: badgesComputed ? badgesComputed.flexWrap : null,
            totalTags: allTags.length,
            visibleTagsCount: visibleTags.length,
            tagsWrap,
            autoFitEnabled: titleBlock ? titleBlock.getAttribute('data-auto-fit-title') : null,
            titleBlockHeight: titleBlockRect ? titleBlockRect.height : null,
            titleFontSize: titleEl ? window.getComputedStyle(titleEl).fontSize : null,
            titleFullText: titleEl ? titleEl.textContent.trim() : '',
            titleVisibleText: titleEl ? titleEl.innerText.trim() : '',
            hasEllipsis: titleEl ? (titleEl.innerText.includes('...') || titleEl.innerText.includes('…')) : false,
            isTruncated: titleEl ? (titleEl.textContent.trim() !== titleEl.innerText.trim() || titleEl.innerText.includes('...') || titleEl.innerText.includes('…')) : false,
            metaGridZIndex: metaGridComputed ? metaGridComputed.zIndex : null,
            heroInnerZIndex: heroInnerComputed ? heroInnerComputed.zIndex : null,
            wavesZIndex: wavesComputed ? wavesComputed.zIndex : null,
            heroShellHeight: heroShellRect ? heroShellRect.height : null,
            postHeroHeight: postHeroRect ? postHeroRect.height : null,
          };
        });

        console.log(`Live Audit [${postPath}]:`, JSON.stringify(audit, null, 2));

        if (audit.translationsCount !== 0) {
          throw new Error(`[FAIL Req 1] Translations box still rendered in live: ${audit.translationsCount}`);
        }
        console.log(`  ✓ Req 1: Translations box completely absent (count: 0)`);

        if (audit.tagsWrap) {
          throw new Error(`[FAIL Req 2] Tags wrapped into multiple lines`);
        }
        console.log(`  ✓ Req 2: Tags horizontal space boundary clean (visible: ${audit.visibleTagsCount}/${audit.totalTags})`);

        if (audit.autoFitEnabled !== 'true') {
          throw new Error(`[FAIL Req 3] auto-fit title attribute not set`);
        }
        if (audit.isTruncated || audit.hasEllipsis) {
          throw new Error(`[FAIL Req 3] Live title was TRUNCATED! visible: "${audit.titleVisibleText}", full: "${audit.titleFullText}"`);
        }
        const liveTitleFont = parseFloat(audit.titleFontSize || '0');
        if (liveTitleFont < 28) {
          throw new Error(`[FAIL Req 3] Live title font (${audit.titleFontSize}) is smaller than 28px! Must be larger than content.`);
        }
        console.log(`  ✓ Req 3: ZERO TRUNCATION verified on live! 100% visible: "${audit.titleVisibleText.slice(0, 35)}...", font: ${audit.titleFontSize}`);

        const metaZ = parseInt(audit.metaGridZIndex || '0', 10);
        const wavesZ = parseInt(audit.wavesZIndex || '0', 10);
        if (metaZ <= wavesZ) {
          throw new Error(`[FAIL Req 4] Meta-grid z-index (${metaZ}) is not above waves (${wavesZ})`);
        }
        console.log(`  ✓ Req 4: Meta-grid strictly above waves (z-index: ${metaZ} > ${wavesZ})`);

        if (audit.heroShellHeight > 450) {
          throw new Error(`[FAIL Req 5] Hero shell height (${audit.heroShellHeight}) exceeds 50vh`);
        }
        console.log(`  ✓ Req 5: Unified default height verified (${audit.heroShellHeight}px < 50vh: 450px)`);
      }

      // Check mobile viewport on live
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseUrl}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      const mobileAudit = await page.evaluate(() => {
        const heroShell = document.querySelector('.page-shell__hero');
        const tags = Array.from(document.querySelectorAll('.post-hero__tag'));
        const hiddenTags = tags.filter((t) => window.getComputedStyle(t).display === 'none');
        const visibleTags = tags.filter((t) => window.getComputedStyle(t).display !== 'none');
        return {
          heroHeight: heroShell ? heroShell.getBoundingClientRect().height : 0,
          totalTags: tags.length,
          visibleTagsCount: visibleTags.length,
          hiddenTagsCount: hiddenTags.length,
        };
      });

      console.log('Live Mobile Audit:', mobileAudit);
      if (mobileAudit.heroHeight > 333.5) {
        throw new Error(`[FAIL Mobile] Mobile hero height (${mobileAudit.heroHeight}px) exceeds 50vh`);
      }
      console.log(`  ✓ Req 5 (Mobile): Hero height (${mobileAudit.heroHeight}px < 50vh: 333.5px)`);

      await page.close();
      console.log(`Target ${baseUrl} audit PASSED cleanly!`);
    }

    console.log(`\n======================================================`);
    console.log(`>>> ALL LIVE PRODUCTION VERIFICATIONS PASSED 100%! <<<`);
    console.log(`======================================================`);
  } finally {
    await browser.close();
  }
}

runLiveAudit().catch((err) => {
  console.error('[PROD E2E ERROR]', err);
  process.exit(1);
});
