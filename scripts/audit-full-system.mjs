import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.woff2': 'font/woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  let filePath = path.join(path.resolve('dist'), reqPath);

  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
    filePath = path.join(filePath, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 4334;
await new Promise((resolve) => server.listen(PORT, resolve));
console.log(`Audit test server running at http://localhost:${PORT}`);

const screenshotDir = path.resolve('scripts/audit_screenshots/full_system_audit');
fs.mkdirSync(screenshotDir, { recursive: true });

const auditResults = {
  cardMorphology: {},
  snowMantle: {},
  responsivePages: {},
  regressions: {},
  consoleErrors: [],
};

const browser = await chromium.launch({ headless: true });

try {
  // ─────────────────────────────────────────────────────────────
  // SECTION 1: Card Morphology & Boundary Integrity on Post Page
  // ─────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('1. Auditing Card Morphology & Boundary Integrity');
  console.log('========================================');

  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await contextDesktop.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('favicon') && !txt.includes('analytics')) {
        auditResults.consoleErrors.push({ url: page.url(), text: txt });
      }
    }
  });

  await page.goto(`http://localhost:${PORT}/posts/markdown-syntax-mastery/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Enable snow theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-background', 'snow');
    if (window.__snowMantleEngine) {
      window.__snowMantleEngine.scanCards();
    }
  });
  await page.waitForTimeout(600);

  // 1.1 Profile Card Audit
  const profileCardAudit = await page.evaluate(() => {
    const card = document.querySelector('.profile-card');
    if (!card) return { found: false };
    const style = window.getComputedStyle(card);
    const content = card.querySelector('.card-content');
    const contentStyle = content ? window.getComputedStyle(content) : null;
    const hasSnow = Boolean(card.querySelector('.card-snow-svg'));
    const rect = card.getBoundingClientRect();

    return {
      found: true,
      cardOverflow: style.overflow,
      cardBorderRadius: style.borderRadius,
      cardIsolation: style.isolation,
      cardTransform: style.transform,
      contentOverflow: contentStyle?.overflow,
      contentBorderRadius: contentStyle?.borderRadius,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      hasSnowInside: hasSnow,
    };
  });

  console.log('Profile Card Morphology:', profileCardAudit);
  auditResults.cardMorphology.profileCard = profileCardAudit;

  const profileCardEl = await page.$('.profile-card');
  if (profileCardEl) {
    await profileCardEl.screenshot({ path: path.join(screenshotDir, '01_profile_card_default.png') });
    await profileCardEl.hover();
    await page.waitForTimeout(400);
    await profileCardEl.screenshot({ path: path.join(screenshotDir, '01_profile_card_hovered.png') });
    console.log('Saved 01_profile_card_default.png & 01_profile_card_hovered.png');
  }

  // 1.2 Related Posts & Post Nav Cards
  const postCardsAudit = await page.evaluate(() => {
    const results = {};
    const related = document.querySelector('.relatedPosts-item');
    if (related) {
      const s = window.getComputedStyle(related);
      const img = related.querySelector('img');
      const imgStyle = img ? window.getComputedStyle(img) : null;
      results.relatedPost = {
        overflow: s.overflow,
        borderRadius: s.borderRadius,
        imgBorderRadius: imgStyle?.borderRadius,
        hasSnow: Boolean(related.querySelector('.card-snow-svg')),
      };
    }
    const nav = document.querySelector('.postNav-card');
    if (nav) {
      const s = window.getComputedStyle(nav);
      const img = nav.querySelector('img');
      const imgStyle = img ? window.getComputedStyle(img) : null;
      results.postNav = {
        overflow: s.overflow,
        borderRadius: s.borderRadius,
        imgBorderRadius: imgStyle?.borderRadius,
        hasSnow: Boolean(nav.querySelector('.card-snow-svg')),
      };
    }
    return results;
  });

  console.log('Related Posts & Post Nav Cards:', postCardsAudit);
  auditResults.cardMorphology.postSubCards = postCardsAudit;

  // Screenshot Related Posts Hover
  const relatedEl = await page.$('.relatedPosts-item');
  if (relatedEl) {
    await relatedEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await relatedEl.screenshot({ path: path.join(screenshotDir, '02_related_post_default.png') });
    await relatedEl.hover();
    await page.waitForTimeout(400);
    await relatedEl.screenshot({ path: path.join(screenshotDir, '02_related_post_hover.png') });
    console.log('Saved 02_related_post_default.png & 02_related_post_hover.png');
  }

  // Screenshot PostNav Hover
  const postNavEl = await page.$('.postNav-card');
  if (postNavEl) {
    await postNavEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await postNavEl.screenshot({ path: path.join(screenshotDir, '03_postnav_card_default.png') });
    await postNavEl.hover();
    await page.waitForTimeout(400);
    await postNavEl.screenshot({ path: path.join(screenshotDir, '03_postnav_card_hover.png') });
    console.log('Saved 03_postnav_card_default.png & 03_postnav_card_hover.png');
  }

  // ─────────────────────────────────────────────────────────────
  // SECTION 2: Snow Mantle & Micro-interactions on Homepage
  // ─────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('2. Auditing Snow Mantle & Micro-interactions');
  console.log('========================================');

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // Enable snow theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-background', 'snow');
    if (window.__snowMantleEngine) {
      window.__snowMantleEngine.scanCards();
    }
  });
  await page.waitForTimeout(600);

  // 2.1 Home Cards Overview & Corner Radius Matching
  const homeCardsAudit = await page.evaluate(() => {
    const list = [];
    const selectors = ['#random-banner', '.todayCard', '.categoryItem', '.recent-post-item', '#aside-content .card-widget'];
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el, idx) => {
        const s = window.getComputedStyle(el);
        const snow = el.querySelector(':scope > .card-snow-svg');
        const viewBox = snow?.getAttribute('viewBox');
        list.push({
          selector: sel,
          index: idx,
          id: el.id,
          tag: el.tagName,
          overflow: s.overflow,
          borderRadius: s.borderRadius,
          hasSnow: Boolean(snow),
          snowViewBox: viewBox,
        });
      });
    });
    return list;
  });

  console.log(`Audited ${homeCardsAudit.length} cards on Homepage. Sample:`, homeCardsAudit.slice(0, 6));
  auditResults.snowMantle.cardsSample = homeCardsAudit;

  await page.screenshot({ path: path.join(screenshotDir, '04_home_hero_light.png'), animations: 'disabled' });
  console.log('Saved 04_home_hero_light.png');

  // 2.2 CategoryItem Hover Flex Expansion
  console.log('Testing .categoryItem Hover Flex (1.45) Expansion...');
  const catItems = await page.$$('.categoryItem');
  if (catItems.length > 0) {
    const firstCat = catItems[0];
    const beforeWidth = await firstCat.evaluate((el) => el.getBoundingClientRect().width);
    await firstCat.hover();
    await page.waitForTimeout(400);
    const afterWidth = await firstCat.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const snow = el.querySelector('.card-snow-svg');
      const snowRect = snow?.getBoundingClientRect();
      return {
        cardWidth: Math.round(rect.width),
        snowWidth: Math.round(snowRect ? snowRect.width : 0),
        snowAttached: Boolean(snow),
      };
    });

    console.log(`CategoryItem Hover: width changed from ${Math.round(beforeWidth)}px to ${afterWidth.cardWidth}px. Snow width: ${afterWidth.snowWidth}px`);
    auditResults.snowMantle.categoryExpansion = {
      beforeWidth,
      afterWidth,
    };

    const catGroup = await page.$('.categoryGroup');
    if (catGroup) {
      await catGroup.screenshot({ path: path.join(screenshotDir, '05_category_group_hover.png') });
      console.log('Saved 05_category_group_hover.png');
    }
  }

  // 2.3 TodayCard Flipping & Ghost Snow Elimination
  console.log('Testing TodayCard 3D Flip & Opacity Transition...');
  const todayCard = await page.$('.todayCard');
  if (todayCard) {
    const todayCardBefore = await todayCard.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { opacity: s.opacity, transform: s.transform, pointerEvents: s.pointerEvents };
    });

    // Click toggle to flip
    const toggle = await page.$('#today-card-toggle');
    if (toggle) {
      await page.evaluate(() => {
        const t = document.getElementById('today-card-toggle');
        if (t) {
          t.checked = true;
          t.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await page.waitForTimeout(400);

      const todayCardAfter = await todayCard.evaluate((el) => {
        const s = window.getComputedStyle(el);
        const snow = el.querySelector('.card-snow-svg');
        const snowStyle = snow ? window.getComputedStyle(snow) : null;
        return {
          opacity: s.opacity,
          transform: s.transform,
          pointerEvents: s.pointerEvents,
          snowOpacity: snowStyle ? snowStyle.opacity : null,
          hasSnowElement: Boolean(snow),
        };
      });

      console.log('TodayCard Before Flip:', todayCardBefore);
      console.log('TodayCard After Flip (Faded out):', todayCardAfter);
      auditResults.snowMantle.todayCardFlip = { todayCardBefore, todayCardAfter };

      const topGroup = await page.$('.topGroup');
      if (topGroup) {
        await topGroup.screenshot({ path: path.join(screenshotDir, '06_todaycard_flipped_revealed.png') });
        console.log('Saved 06_todaycard_flipped_revealed.png');
      }

      // Flip back
      await page.evaluate(() => {
        const t = document.getElementById('today-card-toggle');
        if (t) {
          t.checked = false;
          t.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await page.waitForTimeout(400);
    }
  }

  // 2.4 Dark Mode Snow Contrast & Visuals
  console.log('Testing Dark Mode Snow Contrast...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(500);

  const darkModeAudit = await page.evaluate(() => {
    const svg = document.querySelector('.card-snow-svg');
    if (!svg) return null;
    const body = svg.querySelector('.snow-body');
    const s = body ? window.getComputedStyle(body) : null;
    return {
      isDark: document.documentElement.getAttribute('data-theme') === 'dark',
      themeBackground: document.documentElement.getAttribute('data-background'),
    };
  });
  console.log('Dark Mode Audit:', darkModeAudit);
  auditResults.snowMantle.darkMode = darkModeAudit;

  await page.screenshot({ path: path.join(screenshotDir, '07_home_hero_dark.png'), animations: 'disabled' });
  console.log('Saved 07_home_hero_dark.png');

  // Switch back to light theme
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.waitForTimeout(300);

  await contextDesktop.close();

  // ─────────────────────────────────────────────────────────────
  // SECTION 3: Multi-Page & Responsive Integrity
  // ─────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('3. Auditing Multi-Page & Responsive Integrity');
  console.log('========================================');

  const testPages = [
    { name: 'Home', path: '/' },
    { name: 'Post', path: '/posts/markdown-syntax-mastery/' },
    { name: 'Archives', path: '/archives/' },
    { name: 'Friends', path: '/friends/' },
  ];

  const viewports = [
    { name: 'desktop', width: 1440, height: 950 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 },
  ];

  for (const pageInfo of testPages) {
    auditResults.responsivePages[pageInfo.name] = {};
    for (const vp of viewports) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });
      const p = await ctx.newPage();

      p.on('console', (msg) => {
        if (msg.type() === 'error') {
          const txt = msg.text();
          if (!txt.includes('favicon') && !txt.includes('analytics')) {
            auditResults.consoleErrors.push({ url: pageInfo.path, viewport: vp.name, text: txt });
          }
        }
      });

      await p.goto(`http://localhost:${PORT}${pageInfo.path}`, { waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1000);

      // Check horizontal overflow
      const overflowMetrics = await p.evaluate(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
        const clientWidth = docEl.clientWidth;
        const hasHorizontalScroll = scrollWidth > clientWidth;
        return {
          scrollWidth,
          clientWidth,
          hasHorizontalScroll,
          delta: scrollWidth - clientWidth,
        };
      });

      console.log(`Page: ${pageInfo.name} | VP: ${vp.name} (${vp.width}x${vp.height}) | H-Scroll: ${overflowMetrics.hasHorizontalScroll} (Delta: ${overflowMetrics.delta}px)`);
      auditResults.responsivePages[pageInfo.name][vp.name] = overflowMetrics;

      const screenshotName = `resp_${pageInfo.name.toLowerCase()}_${vp.name}.png`;
      await p.screenshot({
        path: path.join(screenshotDir, screenshotName),
        fullPage: false,
        animations: 'disabled',
      });

      await ctx.close();
    }
  }

  // Write audit summary JSON
  fs.writeFileSync(
    path.join(screenshotDir, 'audit_results.json'),
    JSON.stringify(auditResults, null, 2),
    'utf-8'
  );
  console.log('\nAudit complete! Results written to scripts/audit_screenshots/full_system_audit/audit_results.json');

} finally {
  await browser.close();
  server.close();
}
