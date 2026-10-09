import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('scratch/recent-post-card-audit');
fs.mkdirSync(outDir, { recursive: true });

const targetUrl = process.env.TEST_URL || 'http://127.0.0.1:4399/';
console.log(`================================================================`);
console.log(`Starting Recent Post Card Transparency Verification on: ${targetUrl}`);
console.log(`================================================================\n`);

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => {
    console.log(`[Browser JS Error]`, err.message);
    errors.push(err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('Failed to load resource') && !msg.text().includes('404')) {
      console.log(`[Browser Console Error]`, msg.text());
      errors.push(msg.text());
    }
  });

  await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.waitForTimeout(2000);

  // 1. Inspect DOM presence of recent-post-item
  console.log('[*] 1. Auditing .recent-post-item DOM nodes...');
  const cardCount = await page.evaluate(() => {
    const cards = document.querySelectorAll('.recent-post-item');
    return cards.length;
  });
  console.log(`Found ${cardCount} .recent-post-item elements.`);
  assert.ok(cardCount >= 1, 'At least 1 .recent-post-item must exist');

  // 2. Audit Light Mode Card Transparency and Initial Color Tone
  console.log('[*] 2. Auditing Light Mode Translucent Blue Tone Card (Inherent Blue Character, Zero Blur)...');
  const lightStyles = await page.evaluate(() => {
    const card = document.querySelector('#recent-posts .recent-post-item.group, .recent-post-item.group') || document.querySelector('.recent-post-item');
    const sCard = window.getComputedStyle(card);
    const coverWrapper = card.querySelector('div:first-child');
    const sCover = coverWrapper ? window.getComputedStyle(coverWrapper) : null;
    const coverImg = card.querySelector('div:first-child img, .post_cover img');
    const sCoverImg = coverImg ? window.getComputedStyle(coverImg) : null;
    const infoWrapper = card.querySelector('.recent-post-info') || card.children[1];
    const sInfo = infoWrapper ? window.getComputedStyle(infoWrapper) : null;
    const title = card.querySelector('.article-title');
    const sTitle = title ? window.getComputedStyle(title) : null;

    return {
      card: {
        className: card.className,
        bg: sCard.backgroundColor,
        border: sCard.border,
        borderWidth: sCard.borderWidth,
        borderRadius: sCard.borderRadius,
        backdropFilter: sCard.backdropFilter || sCard.webkitBackdropFilter,
        boxShadow: sCard.boxShadow
      },
      coverWrapperBg: sCover ? sCover.backgroundColor : null,
      coverImgOpacity: sCoverImg ? sCoverImg.opacity : null,
      infoWrapperBg: sInfo ? sInfo.backgroundColor : null,
      infoBackdropFilter: sInfo ? (sInfo.backdropFilter || sInfo.webkitBackdropFilter) : null,
      titleColor: sTitle ? sTitle.color : null
    };
  });

  console.log('Light Mode Styles:', JSON.stringify(lightStyles, null, 2));

  // Assertions: Light mode must preserve authentic blue tone (rgba(r, g, b, alpha) with b > r && b > g)
  const lightMatch = lightStyles.card.bg.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  assert.ok(lightMatch, 'Light mode card MUST have rgba format with alpha');
  const [_, lrStr, lgStr, lbStr, lightAlphaStr] = lightMatch;
  const lr = parseInt(lrStr);
  const lg = parseInt(lgStr);
  const lb = parseInt(lbStr);
  const lightAlpha = parseFloat(lightAlphaStr);
  assert.ok(lb > lr && lb > lg, `Light mode card MUST preserve authentic blue character (b > r && b > g, got R:${lr} G:${lg} B:${lb})`);
  assert.ok(lightAlpha >= 0.20 && lightAlpha <= 0.36, `Light mode card alpha must be translucent between 0.20 and 0.36 (got ${lightAlpha})`);

  // Assertions: Zero blur / reduced blur (learned from aside-sticky-box)
  assert.ok(
    lightStyles.card.backdropFilter === 'none' || lightStyles.card.backdropFilter === 'blur(0px)',
    `Card backdropFilter blur MUST be removed/zero per aside-sticky-box method (got ${lightStyles.card.backdropFilter})`
  );

  // Assertions: Cover image and inner containers must be translucent / transparent to allow light transmission
  assert.ok(
    lightStyles.infoWrapperBg === 'rgba(0, 0, 0, 0)' || lightStyles.infoWrapperBg === 'transparent',
    'Info wrapper must be transparent'
  );
  assert.ok(
    lightStyles.coverWrapperBg === 'rgba(0, 0, 0, 0)' || lightStyles.coverWrapperBg === 'transparent',
    'Cover wrapper must be transparent'
  );
  if (lightStyles.coverImgOpacity) {
    const lImgOp = parseFloat(lightStyles.coverImgOpacity);
    assert.ok(lImgOp >= 0.70 && lImgOp <= 0.90, `Cover image must have translucency between 0.70 and 0.90 (got ${lImgOp})`);
  }

  // Screenshot light mode card
  const firstCard = await page.$('#recent-posts .recent-post-item.group, .recent-post-item.group');
  if (firstCard) {
    await firstCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await firstCard.screenshot({ path: path.join(outDir, '01-recent-post-card-light.png') });
  }
  console.log('[✅ PASS] Light mode translucent blue card & translucent cover image verified.\n');

  // 3. Audit Dark Mode Card Transparency and Initial Color Tone
  console.log('[*] 3. Toggling Dark Mode and auditing Translucent Dark Blue Card (Sapphire Blue Tone, Zero Blur)...');
  await page.evaluate(() => {
    const btn = document.getElementById('darkmode');
    if (btn) btn.click();
    else document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(1500);

  const darkStyles = await page.evaluate(() => {
    const card = document.querySelector('#recent-posts .recent-post-item.group, .recent-post-item.group') || document.querySelector('.recent-post-item');
    const sCard = window.getComputedStyle(card);
    const coverWrapper = card.querySelector('div:first-child');
    const sCover = coverWrapper ? window.getComputedStyle(coverWrapper) : null;
    const coverImg = card.querySelector('div:first-child img, .post_cover img');
    const sCoverImg = coverImg ? window.getComputedStyle(coverImg) : null;
    const infoWrapper = card.querySelector('.recent-post-info') || card.children[1];
    const sInfo = infoWrapper ? window.getComputedStyle(infoWrapper) : null;
    const theme = document.documentElement.dataset.theme;

    return {
      theme,
      card: {
        bg: sCard.backgroundColor,
        border: sCard.border,
        borderWidth: sCard.borderWidth,
        borderRadius: sCard.borderRadius,
        backdropFilter: sCard.backdropFilter || sCard.webkitBackdropFilter,
        boxShadow: sCard.boxShadow,
        color: sCard.color
      },
      coverWrapperBg: sCover ? sCover.backgroundColor : null,
      coverImgOpacity: sCoverImg ? sCoverImg.opacity : null,
      infoWrapperBg: sInfo ? sInfo.backgroundColor : null
    };
  });

  console.log('Dark Mode Styles:', JSON.stringify(darkStyles, null, 2));

  // Assertions: Dark mode must preserve authentic sapphire blue tone (rgba(r, g, b, alpha) with b > r && b > g)
  assert.equal(darkStyles.theme, 'dark', 'Theme must be dark');
  const darkMatch = darkStyles.card.bg.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  assert.ok(darkMatch, 'Dark mode card MUST have rgba format with alpha');
  const [dFull, drStr, dgStr, dbStr, darkAlphaStr] = darkMatch;
  const dr = parseInt(drStr);
  const dg = parseInt(dgStr);
  const db = parseInt(dbStr);
  const darkAlpha = parseFloat(darkAlphaStr);
  assert.ok(db > dr && db > dg, `Dark mode card MUST preserve sapphire blue tone (b > r && b > g, got R:${dr} G:${dg} B:${db})`);
  assert.ok(db >= 50, `Dark mode blue component must be at least 50 (got ${db})`);
  assert.ok(darkAlpha >= 0.20 && darkAlpha <= 0.40, `Dark mode card alpha must be translucent between 0.20 and 0.40 (got ${darkAlpha})`);

  // Assertions: Zero blur / reduced blur
  assert.ok(
    darkStyles.card.backdropFilter === 'none' || darkStyles.card.backdropFilter === 'blur(0px)',
    `Dark mode backdropFilter blur MUST be removed/zero (got ${darkStyles.card.backdropFilter})`
  );

  // Assertions: Dark mode cover image translucency
  if (darkStyles.coverImgOpacity) {
    const dImgOp = parseFloat(darkStyles.coverImgOpacity);
    assert.ok(dImgOp >= 0.65 && dImgOp <= 0.88, `Dark mode cover image must have translucency between 0.65 and 0.88 (got ${dImgOp})`);
  }

  // Screenshot dark mode card
  if (firstCard) {
    await firstCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await firstCard.screenshot({ path: path.join(outDir, '02-recent-post-card-dark.png') });
  }
  console.log('[✅ PASS] Dark mode translucent sapphire blue card & translucent cover image verified.\n');

  // 4. Test Hover Interaction and Completeness
  console.log('[*] 4. Testing hover state and visual completeness...');
  const listCard = await page.$('#recent-posts .recent-post-item.group, .recent-post-item.group');
  if (listCard) {
    await listCard.scrollIntoViewIfNeeded();
    await listCard.hover();
    await page.waitForTimeout(400);

    const hoverStyles = await page.evaluate(() => {
      const card = document.querySelector('#recent-posts .recent-post-item.group, .recent-post-item.group');
      const s = window.getComputedStyle(card);
      const coverImg = card.querySelector('div:first-child img, .post_cover img');
      const sImg = coverImg ? window.getComputedStyle(coverImg) : null;
      return {
        transform: s.transform,
        boxShadow: s.boxShadow,
        borderColor: s.borderColor,
        coverImgOpacity: sImg ? sImg.opacity : null
      };
    });

    console.log('Hover Styles:', JSON.stringify(hoverStyles, null, 2));
    assert.ok(hoverStyles.transform !== 'none', 'Hover transform must be active');
    if (hoverStyles.coverImgOpacity) {
      const hOp = parseFloat(hoverStyles.coverImgOpacity);
      assert.ok(hOp >= 0.90, `Hover cover image opacity should increase towards 1.0 (got ${hOp})`);
    }
    console.log('[✅ PASS] Hover interaction verified.\n');
  }

  // 5. Fatal errors check
  assert.equal(errors.length, 0, `There should be zero browser console errors (found: ${errors.join(', ')})`);

  console.log(`================================================================`);
  console.log(`🎉 ALL RECENT POST CARD TRANSPARENCY ASSERTIONS PASSED (100%)!`);
  console.log(`================================================================\n`);

  await browser.close();
}

run().catch(err => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
