import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('scratch/sticky-overview-audit');
fs.mkdirSync(outDir, { recursive: true });

const targetUrl = process.env.TEST_URL || 'http://127.0.0.1:4321/';
console.log(`================================================================`);
console.log(`Starting Home Sticky Overview Card Verification on: ${targetUrl}`);
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

  // 1. Inspect DOM hierarchy
  console.log('[*] 1. Checking DOM hierarchy & class/id attributes...');
  const domInfo = await page.evaluate(() => {
    const box = document.getElementById('aside-sticky-box-overview');
    const track = document.getElementById('aside-track-overview');
    const layout = document.getElementById('home-sticky-layout');
    const card = box ? box.querySelector('#card-tag-cloud-overview, .card-feature-panel--overview') : null;
    const profileCard = document.getElementById('sidebar-profile-card');
    const announcementCard = document.querySelector('.card-announcement');

    return {
      boxExists: Boolean(box),
      boxTag: box?.tagName,
      boxClass: box?.className,
      trackExists: Boolean(track),
      layoutExists: Boolean(layout),
      cardExists: Boolean(card),
      profileExists: Boolean(profileCard),
      announcementExists: Boolean(announcementCard)
    };
  });

  console.log('DOM Info:', JSON.stringify(domInfo, null, 2));
  assert.ok(domInfo.boxExists, 'aside-sticky-box-overview MUST exist');
  assert.ok(domInfo.boxClass.includes('aside-sticky-box'), 'aside-sticky-box-overview MUST have class="aside-sticky-box"');
  assert.ok(domInfo.cardExists, 'Inner card content MUST exist');
  console.log('[✅ PASS] DOM elements and classes verified.\n');

  // 2. Audit Light Mode Card Frame styling
  console.log('[*] 2. Auditing Light Mode Translucent White Card Frame...');
  const lightStyles = await page.evaluate(() => {
    const box = document.getElementById('aside-sticky-box-overview');
    const card = box.querySelector('#card-tag-cloud-overview, .card-feature-panel--overview');
    const profileCard = document.getElementById('sidebar-profile-card');
    const tag = box.querySelector('.tag-cloud-item');
    const chip = box.querySelector('.category-chip');
    const webinfo = box.querySelector('.webinfo-item');

    const sBox = window.getComputedStyle(box);
    const sCard = window.getComputedStyle(card);
    const sProfile = profileCard ? window.getComputedStyle(profileCard) : null;
    const sTag = tag ? window.getComputedStyle(tag) : null;
    const sChip = chip ? window.getComputedStyle(chip) : null;
    const sWebinfo = webinfo ? window.getComputedStyle(webinfo) : null;

    const boxRect = box.getBoundingClientRect();
    const profileRect = profileCard ? profileCard.getBoundingClientRect() : null;

    return {
      box: {
        bg: sBox.backgroundColor,
        border: sBox.border,
        borderWidth: sBox.borderWidth,
        borderRadius: sBox.borderRadius,
        backdropFilter: sBox.backdropFilter || sBox.webkitBackdropFilter,
        boxShadow: sBox.boxShadow,
        width: boxRect.width,
        x: boxRect.x,
        padding: sBox.padding
      },
      innerCard: {
        bg: sCard.backgroundColor,
        border: sCard.border,
        borderWidth: sCard.borderWidth,
        backdropFilter: sCard.backdropFilter || sCard.webkitBackdropFilter,
        padding: sCard.padding
      },
      alignment: {
        profileWidth: profileRect ? profileRect.width : null,
        profileX: profileRect ? profileRect.x : null
      },
      subItems: {
        tagBg: sTag?.backgroundColor,
        chipBg: sChip?.backgroundColor,
        webinfoBg: sWebinfo?.backgroundColor
      }
    };
  });

  console.log('Light Mode Styles:', JSON.stringify(lightStyles, null, 2));

  // Assertions for light mode
  // Must be translucent grey (rgba(r, g, b, alpha) with grey tones and increased transparency 0.12 <= alpha <= 0.25)
  assert.ok(lightStyles.box.bg.startsWith('rgba('), 'Light mode box MUST have rgba format');
  const lightMatch = lightStyles.box.bg.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  assert.ok(lightMatch, 'Light mode box MUST have rgba format with alpha');
  const [_, lr, lg, lb, lAlphaStr] = lightMatch;
  const lightAlpha = parseFloat(lAlphaStr);
  const maxDiff = Math.max(Math.abs(parseInt(lr) - parseInt(lg)), Math.abs(parseInt(lg) - parseInt(lb)), Math.abs(parseInt(lr) - parseInt(lb)));
  assert.ok(maxDiff <= 25, `Light mode box MUST be grey-toned (got rgb(${lr}, ${lg}, ${lb}))`);
  assert.ok(lightAlpha >= 0.12 && lightAlpha <= 0.25, `Light mode box alpha must have increased transparency between 0.12 and 0.25 (got ${lightAlpha})`);
  assert.ok(lightStyles.box.backdropFilter === 'none' || lightStyles.box.backdropFilter === 'blur(0px)', 'BackdropFilter blur sensation MUST be reduced/eliminated (none)');

  // Inner card zero double-nesting assertion
  assert.ok(
    lightStyles.innerCard.bg === 'transparent' || lightStyles.innerCard.bg === 'rgba(0, 0, 0, 0)',
    'Inner card MUST have transparent background to prevent double nesting'
  );
  assert.equal(parseInt(lightStyles.innerCard.borderWidth, 10) || 0, 0, 'Inner card MUST NOT have duplicate border');

  // Alignment assertion with sidebar profile card
  if (lightStyles.alignment.profileWidth) {
    assert.equal(lightStyles.box.width, lightStyles.alignment.profileWidth, 'Box width must align with profile card width');
    assert.equal(lightStyles.box.x, lightStyles.alignment.profileX, 'Box X-position must align with profile card');
  }

  // Screenshot light mode
  await page.screenshot({ path: path.join(outDir, '01-home-sticky-box-light.png') });
  const boxEl = await page.$('#aside-sticky-box-overview');
  if (boxEl) {
    await boxEl.screenshot({ path: path.join(outDir, '01-sticky-box-light-crop.png') });
  }
  console.log('[✅ PASS] Light mode translucent white card frame verified.\n');

  // 3. Audit Dark Mode Card Frame styling
  console.log('[*] 3. Toggling Dark Mode and auditing Translucent Dark Grey Card Frame...');
  await page.evaluate(() => {
    const btn = document.getElementById('darkmode');
    if (btn) btn.click();
    else document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(2000);

  const darkStyles = await page.evaluate(() => {
    const box = document.getElementById('aside-sticky-box-overview');
    const card = box.querySelector('#card-tag-cloud-overview, .card-feature-panel--overview');
    const tag = box.querySelector('.tag-cloud-item');
    const chip = box.querySelector('.category-chip');
    const webinfo = box.querySelector('.webinfo-item');

    const sBox = window.getComputedStyle(box);
    const sCard = window.getComputedStyle(card);
    const sTag = tag ? window.getComputedStyle(tag) : null;
    const sChip = chip ? window.getComputedStyle(chip) : null;
    const sWebinfo = webinfo ? window.getComputedStyle(webinfo) : null;

    const theme = document.documentElement.dataset.theme;

    // Check if stars/meteors exist on universe canvas in the right sidebar area
    const canvas = document.getElementById('universe');
    const uOpacity = canvas ? window.getComputedStyle(canvas).opacity : '0';

    return {
      theme,
      universeOpacity: uOpacity,
      box: {
        bg: sBox.backgroundColor,
        border: sBox.border,
        borderWidth: sBox.borderWidth,
        borderRadius: sBox.borderRadius,
        backdropFilter: sBox.backdropFilter || sBox.webkitBackdropFilter,
        boxShadow: sBox.boxShadow,
        color: sBox.color
      },
      innerCard: {
        bg: sCard.backgroundColor,
        borderWidth: sCard.borderWidth
      },
      subItems: {
        tagBg: sTag?.backgroundColor,
        chipBg: sChip?.backgroundColor,
        webinfoBg: sWebinfo?.backgroundColor
      }
    };
  });

  console.log('Dark Mode Styles:', JSON.stringify(darkStyles, null, 2));

  // Assertions for dark mode
  // Must be translucent grey (rgba(r, g, b, alpha) with grey tones and increased transparency 0.12 <= alpha <= 0.25)
  assert.equal(darkStyles.theme, 'dark', 'Theme must be dark');
  assert.equal(darkStyles.universeOpacity, '1', 'Universe canvas MUST be active (opacity: 1) in dark mode');
  const darkMatch = darkStyles.box.bg.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  assert.ok(darkMatch, 'Dark mode box MUST have rgba format with alpha');
  const [_dark, dr, dg, db, darkAlphaStr] = darkMatch;
  const darkAlpha = parseFloat(darkAlphaStr);
  const darkMaxDiff = Math.max(Math.abs(parseInt(dr) - parseInt(dg)), Math.abs(parseInt(dg) - parseInt(db)), Math.abs(parseInt(dr) - parseInt(db)));
  assert.ok(darkMaxDiff <= 25, `Dark mode box MUST be grey-toned (got rgb(${dr}, ${dg}, ${db}))`);
  assert.ok(darkAlpha >= 0.12 && darkAlpha <= 0.25, `Dark mode box alpha must have increased transparency between 0.12 and 0.25 (got ${darkAlpha})`);
  assert.ok(darkStyles.box.backdropFilter === 'none' || darkStyles.box.backdropFilter === 'blur(0px)', 'Dark mode backdropFilter blur sensation MUST be reduced/eliminated (none)');

  // Border & radius assertions
  assert.equal(darkStyles.box.borderRadius, '8px', 'Dark mode border-radius must remain 8px');
  assert.ok(parseInt(darkStyles.box.borderWidth, 10) >= 1, 'Dark mode border must be 1px solid');

  // Wait a short duration to let meteors streak through and capture
  console.log('[*] Waiting for meteors and stars to streak across right sidebar...');
  await page.waitForTimeout(3200);

  // Screenshot dark mode
  await page.screenshot({ path: path.join(outDir, '02-home-sticky-box-dark.png') });
  if (boxEl) {
    await boxEl.screenshot({ path: path.join(outDir, '02-sticky-box-dark-crop.png') });
  }
  console.log('[✅ PASS] Dark mode translucent dark grey card frame verified with active canvas.\n');

  // 4. Test Scroll Sticky Pinning Behavior
  console.log('[*] 4. Testing scroll sticky pinning and alignment...');
  for (const scrollY of [500, 1200, 1600]) {
    await page.evaluate(y => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(300);

    const scrollMetrics = await page.evaluate(() => {
      const box = document.getElementById('aside-sticky-box-overview');
      const rect = box.getBoundingClientRect();
      const style = window.getComputedStyle(box);
      return {
        scrollY: window.scrollY,
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        position: style.position
      };
    });

    console.log(`Scroll Y=${scrollY}: Top=${scrollMetrics.top}px, Width=${scrollMetrics.width}px, Position=${scrollMetrics.position}`);
    if (scrollY >= 1200) {
      assert.ok(scrollMetrics.top >= 60 && scrollMetrics.top <= 90, `Sticky box should pin near sticky top offset at scroll ${scrollY} (got ${scrollMetrics.top}px)`);
    }
  }
  console.log('[✅ PASS] Sticky pinning behavior verified.\n');

  // 5. Fatal errors check
  assert.equal(errors.length, 0, `There should be zero browser console errors (found: ${errors.join(', ')})`);

  console.log(`================================================================`);
  console.log(`🎉 ALL HOME STICKY OVERVIEW CARD ASSERTIONS PASSED (100%)!`);
  console.log(`================================================================\n`);

  await browser.close();
}

run().catch(err => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
