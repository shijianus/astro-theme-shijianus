import { chromium } from 'playwright';

const TARGET_URL = 'https://blog.epocanvas.com';

const LANGUAGES = [
  { code: 'zh-CN', name: 'Simplified Chinese' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German (Long-word)' },
  { code: 'fr', name: 'French (Long-word)' },
  { code: 'es', name: 'Spanish (Long-word)' },
];

const VIEWPORTS = [
  { name: 'Desktop', width: 1440, height: 950 },
  { name: 'Mobile', width: 375, height: 812 },
];

async function applyLocale(page, langCode) {
  await page.evaluate((targetLang) => {
    if (typeof window.__shijianus_applyLocaleVariant === 'function') {
      window.__shijianus_applyLocaleVariant(targetLang);
    } else {
      localStorage.setItem('shijianus_locale', targetLang);
      localStorage.setItem('shijianus_locale_variant', targetLang);
      localStorage.setItem('shijianus-locale-variant', targetLang);
      document.documentElement.lang = targetLang;
      document.documentElement.setAttribute('data-locale-variant', targetLang);
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: targetLang }));
    }
  }, langCode);
  await page.waitForTimeout(400);
}

async function safeGoto(page, url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(600);
      return;
    } catch (e) {
      console.log(`  [safeGoto] Attempt ${i + 1} failed (${e.message}), retrying...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  await page.goto(url, { waitUntil: 'load', timeout: 35000 });
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`LIVE PRODUCTION MULTILINGUAL & RESPONSIVE AUDIT`);
  console.log(`Target: ${TARGET_URL}`);
  console.log(`======================================================`);

  const browser = await chromium.launch({ headless: true });
  const errors = [];
  const fatalErrors = [];

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n------------------------------------------------------`);
      console.log(`AUDITING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`------------------------------------------------------`);

      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const t = msg.text();
          if (!t.includes('Failed to load resource') && !t.includes('404')) {
            console.log(`  [Console Error]: ${t}`);
            fatalErrors.push(`[${vp.name}] Console Error: ${t}`);
          }
        }
      });

      // 1. Visit Homepage
      console.log(`Navigating to ${TARGET_URL}/ ...`);
      await safeGoto(page, `${TARGET_URL}/`);

      for (const lang of LANGUAGES) {
        console.log(`\n--- [${vp.name}] Testing Language: ${lang.name} (${lang.code}) ---`);
        await applyLocale(page, lang.code);

        // Test 1: MusicPocket tab buttons wrapping & sizing
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('shijianus:toggle-music-pocket', { detail: { visible: true } }));
        });
        await page.waitForTimeout(200);
        await page.evaluate(() => {
          const toggle = document.querySelector('.shijianus-music-pocket__toggle');
          if (toggle && !document.querySelector('.shijianus-music-pocket__panel')) {
            toggle.click();
          }
        });
        await page.waitForTimeout(300);

        const pocketTabs = await page.evaluate(() => {
          const tabs = Array.from(document.querySelectorAll('.shijianus-music-pocket__tab'));
          return tabs.map((t) => {
            const span = t.querySelector('span');
            return {
              tab: t.getAttribute('data-tab'),
              text: (t.textContent || '').trim(),
              width: Math.round(t.getBoundingClientRect().width),
              spanHeight: span ? Math.round(span.getBoundingClientRect().height) : 0,
              isMultiLine: span ? span.getBoundingClientRect().height > 20 : false,
            };
          });
        });

        console.log(`  MusicPocket tabs:`, pocketTabs.map(t => `${t.text} (${t.width}px, lines:${t.isMultiLine ? 'MULTI' : '1'})`).join(', '));
        for (const t of pocketTabs) {
          if (t.isMultiLine) {
            errors.push(`[${vp.name}][${lang.code}] MusicPocket tab '${t.text}' wrapped into multiple lines!`);
          }
        }

        // Test 2: Account Drawer tabs
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('shijianus:open-account', { detail: { tab: 'settings' } }));
        });
        await page.waitForTimeout(300);

        const accountTabs = await page.evaluate(() => {
          const tabs = Array.from(document.querySelectorAll('.account-nav-tab'));
          return tabs.map((t) => {
            const span = t.querySelector('span');
            return {
              text: (span ? span.textContent : t.textContent || '').trim(),
              width: Math.round(t.getBoundingClientRect().width),
              scrollWidth: span ? span.scrollWidth : t.scrollWidth,
              clientWidth: span ? span.clientWidth : t.clientWidth,
              isTruncated: span ? span.scrollWidth > span.clientWidth + 2 : false,
            };
          });
        });

        console.log(`  Account tabs:`, accountTabs.map(t => `${t.text} (${t.width}px, trunc:${t.isTruncated})`).join(', '));

        // Test 3: Console modal layout & heatmap overlap
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('shijianus:open-console'));
        });
        await page.waitForTimeout(400);

        const consoleCheck = await page.evaluate(() => {
          const leftCard = document.querySelector('.console-card-group-left');
          const rightCard = document.querySelector('.console-card-group-right');
          const heatmap = document.querySelector('#console .heatmap-internal-wrapper');
          if (!leftCard || !rightCard) return null;

          const lRect = leftCard.getBoundingClientRect();
          const rRect = rightCard.getBoundingClientRect();
          const hRect = heatmap ? heatmap.getBoundingClientRect() : null;

          return {
            leftCardWidth: Math.round(lRect.width),
            rightCardWidth: Math.round(rRect.width),
            heatmapLeft: hRect ? Math.round(hRect.left) : 0,
            rightCardLeft: Math.round(rRect.left),
            leftCardRight: Math.round(lRect.right),
            isHeatmapOverlappingLeftCard: hRect ? hRect.left < lRect.right : false,
          };
        });

        if (consoleCheck) {
          console.log(`  Console: leftCardWidth=${consoleCheck.leftCardWidth}px, rightCardWidth=${consoleCheck.rightCardWidth}px, heatmapOverlapLeft=${consoleCheck.isHeatmapOverlappingLeftCard}`);
          if (vp.name === 'Desktop' && consoleCheck.isHeatmapOverlappingLeftCard) {
            errors.push(`[${vp.name}][${lang.code}] Console heatmap overlapped left card! (heatmapLeft=${consoleCheck.heatmapLeft} < leftRight=${consoleCheck.leftCardRight})`);
          }
        }

        // Close overlays
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('shijianus:close-overlays'));
        });
        await page.waitForTimeout(200);
      }

      // 2. Audit Post page (Comment section & TOC)
      const postSlug = '/posts/content-formats-and-markup-mastery/';
      console.log(`\nNavigating to live post page: ${TARGET_URL}${postSlug}`);
      await safeGoto(page, `${TARGET_URL}${postSlug}`);

      for (const lang of LANGUAGES) {
        console.log(`\n--- [${vp.name}][PostPage] Testing Language: ${lang.name} (${lang.code}) ---`);
        await applyLocale(page, lang.code);

        // Check comment section title & sort group
        const commentCheck = await page.evaluate(() => {
          const commentRoot = document.querySelector('#post-comment');
          const titleRow = document.querySelector('#post-comment .tk-comments-title');
          const sortGroup = document.querySelector('#post-comment .tk-sort-group');
          if (!commentRoot || !titleRow) return null;

          const cRect = commentRoot.getBoundingClientRect();
          const tRect = titleRow.getBoundingClientRect();
          const sRect = sortGroup ? sortGroup.getBoundingClientRect() : null;

          const hasOverflow = commentRoot.scrollWidth > commentRoot.clientWidth + 2;
          const sortExceeds = sRect ? sRect.right > cRect.right + 2 : false;

          return {
            clientWidth: commentRoot.clientWidth,
            scrollWidth: commentRoot.scrollWidth,
            hasOverflow,
            sortRight: sRect ? Math.round(sRect.right) : 0,
            containerRight: Math.round(cRect.right),
            sortExceeds,
          };
        });

        if (commentCheck) {
          console.log(`  Comment title: clientWidth=${commentCheck.clientWidth}px, scrollWidth=${commentCheck.scrollWidth}px, sortExceeds=${commentCheck.sortExceeds}`);
          if (commentCheck.sortExceeds) {
            errors.push(`[${vp.name}][${lang.code}] Comment sort group exceeds container! (sortRight=${commentCheck.sortRight} > containerRight=${commentCheck.containerRight})`);
          }
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`\n======================================================`);
  console.log(`LIVE AUDIT RESULTS SUMMARY`);
  console.log(`======================================================`);
  if (errors.length === 0 && fatalErrors.length === 0) {
    console.log('✅ ALL LIVE TESTS PASSED! 0 LAYOUT OVERFLOWS OR FATAL JS ERRORS IN PRODUCTION!');
  } else {
    console.error(`❌ FOUND ${errors.length + fatalErrors.length} ISSUES:`);
    errors.forEach(e => console.error('  - ' + e));
    fatalErrors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
