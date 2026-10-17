import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  else if (!path.extname(reqPath)) reqPath += '/index.html';

  const filePath = path.join(distDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 5794;

server.listen(PORT, async () => {
  console.log(`[E2E] Testing Post Hero Optimizations on http://localhost:${PORT}...`);
  const executablePath = fs.existsSync('/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome')
    ? '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'
    : undefined;
  const browser = await chromium.launch({ headless: true, executablePath });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // Test across several articles
    const testUrls = [
      '/posts/content-formats-and-markup-mastery/',
      '/posts/media-capability-lab/',
      '/posts/readable-geek-interfaces/',
    ];

    for (const url of testUrls) {
      console.log(`\n========================================`);
      console.log(`Auditing Post Hero on: ${url}`);
      console.log(`========================================`);

      await page.goto(`http://localhost:${PORT}${url}`);
      await page.waitForTimeout(600);

      const audit = await page.evaluate(() => {
        const heroShell = document.querySelector('.page-shell__hero');
        const postHero = document.querySelector('.post-hero');
        const heroInner = document.querySelector('.post-hero__inner');
        const translations = document.querySelectorAll('.post-hero__translations');
        const langTags = document.querySelectorAll('.post-hero__lang-tag');
        const badgesContainer = document.querySelector('.post-hero__badges');
        const primaryBadge = document.querySelector('.post-hero__badge.is-primary');
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

        // Tags visibility & position metrics
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
        // Check if visible tags wrap to multiple lines
        const uniqueTops = new Set(visibleTags.map((t) => Math.round(t.top)));
        const tagsWrap = uniqueTops.size > 1;

        return {
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          // Requirement 1: translations removed
          translationsCount: translations.length,
          langTagsCount: langTags.length,
          // Requirement 2: badges space boundary & fitting
          badgesContainerMaxWidth: badgesComputed ? badgesComputed.maxWidth : null,
          badgesFlexWrap: badgesComputed ? badgesComputed.flexWrap : null,
          badgesOverflow: badgesComputed ? badgesComputed.overflow : null,
          totalTags: allTags.length,
          visibleTagsCount: visibleTags.length,
          tagsWrap,
          // Requirement 3: title-block strict bound & auto-fit
          autoFitEnabled: titleBlock ? titleBlock.getAttribute('data-auto-fit-title') : null,
          titleBlockHeight: titleBlockRect ? titleBlockRect.height : null,
          titleBlockMaxHeight: titleBlockComputed ? titleBlockComputed.maxHeight : null,
          titleFontSize: titleEl ? window.getComputedStyle(titleEl).fontSize : null,
          titleScrollHeight: titleEl ? titleEl.scrollHeight : null,
          titleClientHeight: titleEl ? titleEl.clientHeight : null,
          ledeScrollHeight: ledeEl ? ledeEl.scrollHeight : null,
          ledeClientHeight: ledeEl ? ledeEl.clientHeight : null,
          // Requirement 4: meta-grid strictly above waves
          metaGridZIndex: metaGridComputed ? metaGridComputed.zIndex : null,
          metaGridPosition: metaGridComputed ? metaGridComputed.position : null,
          heroInnerZIndex: heroInnerComputed ? heroInnerComputed.zIndex : null,
          wavesZIndex: wavesComputed ? wavesComputed.zIndex : null,
          metaGridBottom: metaGridRect ? metaGridRect.bottom : null,
          wavesTop: wavesRect ? wavesRect.top : null,
          // Requirement 5: page-shell__hero default height
          heroShellHeight: heroShellRect ? heroShellRect.height : null,
          postHeroHeight: postHeroRect ? postHeroRect.height : null,
        };
      });

      console.log('Audit Results:', JSON.stringify(audit, null, 2));

      // Assert Requirement 1: translations removed
      if (audit.translationsCount !== 0) {
        throw new Error(`[FAIL Requirement 1] .post-hero__translations still exists in DOM: ${audit.translationsCount}`);
      }
      if (audit.langTagsCount !== 0) {
        throw new Error(`[FAIL Requirement 1] .post-hero__lang-tag still exists in DOM: ${audit.langTagsCount}`);
      }
      console.log(`[PASS Req 1] Translations box completely removed from post hero!`);

      // Assert Requirement 2: badges horizontal space & no wrapping
      if (audit.badgesFlexWrap !== 'nowrap') {
        throw new Error(`[FAIL Requirement 2] .post-hero__badges should have flex-wrap: nowrap, got: ${audit.badgesFlexWrap}`);
      }
      if (audit.tagsWrap) {
        throw new Error(`[FAIL Requirement 2] Visible tags wrapped across multiple lines!`);
      }
      console.log(`[PASS Req 2] Tags space boundary enforced! Visible tags: ${audit.visibleTagsCount}/${audit.totalTags}, zero line wrapping!`);

      // Assert Requirement 3: title-block strict upper bound & auto-fit
      if (audit.autoFitEnabled !== 'true') {
        throw new Error(`[FAIL Requirement 3] data-auto-fit-title is not "true"`);
      }
      if (audit.titleBlockHeight > 195) {
        throw new Error(`[FAIL Requirement 3] .post-hero__title-block exceeded max height: ${audit.titleBlockHeight}px > 195px`);
      }
      console.log(`[PASS Req 3] Title-block bounded strictly! Height: ${audit.titleBlockHeight}px, Title Font: ${audit.titleFontSize}`);

      // Assert Requirement 4: meta-grid above waves
      const metaZ = Number(audit.metaGridZIndex);
      const innerZ = Number(audit.heroInnerZIndex);
      const waveZ = Number(audit.wavesZIndex);

      if (metaZ <= waveZ || innerZ <= waveZ) {
        throw new Error(`[FAIL Requirement 4] Meta-grid z-index (${metaZ}) or inner (${innerZ}) is not strictly above waves (${waveZ})!`);
      }
      console.log(`[PASS Req 4] Meta-grid is strictly ABOVE waves! (meta-grid z-index: ${metaZ}, inner z-index: ${innerZ} > waves z-index: ${waveZ})`);

      // Assert Requirement 5: page-shell__hero default height not reaching half screen
      const halfScreen = audit.viewportHeight / 2;
      if (audit.heroShellHeight >= halfScreen) {
        throw new Error(`[FAIL Requirement 5] Hero height (${audit.heroShellHeight}px) reached or exceeded half screen (${halfScreen}px)!`);
      }
      if (audit.heroShellHeight < 360) {
        throw new Error(`[FAIL Requirement 5] Hero height (${audit.heroShellHeight}px) unexpectedly small (< 360px)`);
      }
      console.log(`[PASS Req 5] Default height verified: ${audit.heroShellHeight}px (< 50vh: ${halfScreen}px, never reaches half screen)!`);
    }

    // Check Home Page page-shell__hero is unconstrained
    console.log(`\n========================================`);
    console.log(`Auditing Home Page .page-shell__hero`);
    console.log(`========================================`);
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForTimeout(500);

    const homeAudit = await page.evaluate(() => {
      const heroShell = document.querySelector('.page-shell__hero');
      const comp = heroShell ? window.getComputedStyle(heroShell) : null;
      return {
        height: heroShell ? heroShell.getBoundingClientRect().height : null,
        maxHeight: comp ? comp.maxHeight : null,
      };
    });
    console.log('Home page hero audit:', homeAudit);
    if (homeAudit.maxHeight !== 'none') {
      throw new Error(`[FAIL] Home page .page-shell__hero maxHeight should be none, got: ${homeAudit.maxHeight}`);
    }
    console.log(`[PASS] Home page hero container is unconstrained and intact!`);

    // Mobile Audit (iPhone SE: 375x667)
    console.log(`\n========================================`);
    console.log(`Auditing Mobile Viewport (375x667)`);
    console.log(`========================================`);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`http://localhost:${PORT}/posts/content-formats-and-markup-mastery/`);
    await page.waitForTimeout(600);

    const mobileAudit = await page.evaluate(() => {
      const heroShell = document.querySelector('.page-shell__hero');
      const badgesContainer = document.querySelector('.post-hero__badges');
      const allTags = Array.from(document.querySelectorAll('.post-hero__tag'));
      const visibleTags = allTags.filter((t) => window.getComputedStyle(t).display !== 'none');
      const hiddenTags = allTags.filter((t) => window.getComputedStyle(t).display === 'none');
      const heroHeight = heroShell ? heroShell.getBoundingClientRect().height : 0;
      const bRect = badgesContainer ? badgesContainer.getBoundingClientRect() : null;

      // Check that all visible tags are within badgesContainer width
      const maxRight = bRect ? bRect.right + 2 : 0;
      const anyTagOverflows = visibleTags.some((t) => t.getBoundingClientRect().right > maxRight);

      return {
        viewportHeight: window.innerHeight,
        heroHeight,
        totalTags: allTags.length,
        visibleTagsCount: visibleTags.length,
        hiddenTagsCount: hiddenTags.length,
        anyTagOverflows,
      };
    });

    console.log('Mobile audit results:', mobileAudit);
    if (mobileAudit.heroHeight >= 667 / 2) {
      throw new Error(`[FAIL Mobile] Hero height (${mobileAudit.heroHeight}px) reached or exceeded half screen (${667 / 2}px)!`);
    }
    if (mobileAudit.anyTagOverflows) {
      throw new Error(`[FAIL Mobile] A tag overflowed the container boundary!`);
    }
    if (mobileAudit.hiddenTagsCount === 0 && mobileAudit.totalTags > 5) {
      throw new Error(`[FAIL Mobile] Space truncation should have hidden tags that don't fit in 375px!`);
    }
    console.log(`[PASS Mobile] Space truncation successfully hid ${mobileAudit.hiddenTagsCount} tags that would have been cut off, keeping ${mobileAudit.visibleTagsCount} clean tags!`);
    console.log(`[PASS Mobile] Hero height: ${mobileAudit.heroHeight}px (< 50vh: ${667 / 2}px)!`);

    console.log(`\n>>> ALL 5 POST HERO OPTIMIZATION REQUIREMENTS FULLY VERIFIED! <<<`);
  } finally {
    await browser.close();
    server.close();
  }
});
