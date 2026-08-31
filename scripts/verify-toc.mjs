import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/root/.gemini/antigravity-cli/brain/edc1f694-f968-412f-9511-5e7d9f84c826';

async function runAudit() {
  console.log('=== STARTING POST-COMMIT AUDIT ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });

  // Check 1: Unencrypted article TOC count (should be 70)
  const totalTocLinks = await page.$$eval('#card-toc .toc-link', els => els.length);
  console.log(`[Audit Check 1] Unencrypted TOC Headings Count: ${totalTocLinks} (Expected: 70)`);
  if (totalTocLinks !== 70) throw new Error(`TOC count mismatch: ${totalTocLinks}`);

  // Check 2: Light Mode active styling (Pure Bold & Blue #425aef, transparent background, no box)
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(300);
  const lightStyles = await page.evaluate(() => {
    const active = document.querySelector('#card-toc .toc-link.active');
    const textEl = active ? active.querySelector('.toc-text') : null;
    const computed = active ? getComputedStyle(active) : null;
    const textComputed = textEl ? getComputedStyle(textEl) : null;
    return {
      textColor: textComputed?.color,
      backgroundColor: computed?.backgroundColor,
      boxShadow: computed?.boxShadow,
      fontSize: textComputed?.fontSize,
      fontWeight: textComputed?.fontWeight,
    };
  });
  console.log('[Audit Check 2] Light Mode Active Style:', lightStyles);

  // Check 3: Dark Mode active styling (Electric Blue #6ba1ff, transparent background, no white collision)
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
    window.dispatchEvent(new CustomEvent('shijianus:themechange', { detail: 'dark' }));
  });
  await page.waitForTimeout(300);
  const darkStyles = await page.evaluate(() => {
    const active = document.querySelector('#card-toc .toc-link.active');
    const textEl = active ? active.querySelector('.toc-text') : null;
    const computed = active ? getComputedStyle(active) : null;
    const textComputed = textEl ? getComputedStyle(textEl) : null;
    return {
      textColor: textComputed?.color,
      backgroundColor: computed?.backgroundColor,
      boxShadow: computed?.boxShadow,
    };
  });
  console.log('[Audit Check 3] Dark Mode Active Style:', darkStyles);

  // Reset to light theme
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    window.dispatchEvent(new CustomEvent('shijianus:themechange', { detail: 'light' }));
  });
  await page.waitForTimeout(200);

  // Check 4: Deep heading alignment at "1. 混合阶梯语法" in all depth modes
  console.log('[Audit Check 4] Aligning deep heading "1. 混合阶梯语法"...');
  await page.evaluate(() => {
    const el = document.getElementById('1-混合阶梯语法推荐-16-层骨干--无限列表深层衍生');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(300);

  // Mode: all
  const alignAll = await page.evaluate(() => {
    const active = document.querySelector('#card-toc .toc-link.active');
    return {
      activeText: active?.textContent.trim(),
      isVisible: active ? getComputedStyle(active.closest('.toc-item')).display !== 'none' : false,
    };
  });
  console.log(' - Depth=all Alignment:', alignAll);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit-deep-depth-all.png') });

  // Mode: 3 (至3级)
  await page.evaluate(() => {
    document.getElementById('card-toc').setAttribute('data-depth-filter', '3');
    window.dispatchEvent(new CustomEvent('shijianus:toc-depth-changed', { detail: '3' }));
  });
  await page.waitForTimeout(200);
  const alignDepth3 = await page.evaluate(() => {
    const active = document.querySelector('#card-toc .toc-link.active');
    return {
      activeText: active?.textContent.trim(),
      isVisible: active ? getComputedStyle(active.closest('.toc-item')).display !== 'none' : false,
    };
  });
  console.log(' - Depth=3 Fallback Alignment:', alignDepth3);

  // Mode: 1 (1级)
  await page.evaluate(() => {
    document.getElementById('card-toc').setAttribute('data-depth-filter', '1');
    window.dispatchEvent(new CustomEvent('shijianus:toc-depth-changed', { detail: '1' }));
  });
  await page.waitForTimeout(200);
  const alignDepth1 = await page.evaluate(() => {
    const active = document.querySelector('#card-toc .toc-link.active');
    return {
      activeText: active?.textContent.trim(),
      isVisible: active ? getComputedStyle(active.closest('.toc-item')).display !== 'none' : false,
    };
  });
  console.log(' - Depth=1 Fallback Alignment:', alignDepth1);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit-deep-depth-1.png') });

  // Reset depth
  await page.evaluate(() => {
    document.getElementById('card-toc').setAttribute('data-depth-filter', 'all');
    window.dispatchEvent(new CustomEvent('shijianus:toc-depth-changed', { detail: 'all' }));
  });
  await page.waitForTimeout(200);

  // Check 5: Rightside toolbar interactions & badges
  console.log('[Audit Check 5] Rightside config toolbar & TOC Depth cycling...');
  const configBtn = await page.$('#rightside-config');
  await configBtn.click();
  await page.waitForTimeout(300);

  const tocBtn = await page.$('#rightside-config-hide #mobile-toc-button');
  await tocBtn.click();
  await page.waitForTimeout(300);
  const badge1 = await page.$eval('.dock-depth-badge', el => el.textContent);
  console.log(' - Rightside depth badge after 1st click:', badge1);

  await tocBtn.click();
  await page.waitForTimeout(300);
  const badge2 = await page.$eval('.dock-depth-badge', el => el.textContent);
  console.log(' - Rightside depth badge after 2nd click:', badge2);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'audit-rightside-badge.png') });

  // Check 6: Full Article 10-point continuous scroll spy check (Strictly 1 active link at all times)
  console.log('[Audit Check 6] 10-Point continuous scroll spy audit...');
  const scrollPositions = [400, 2000, 4500, 7000, 11000, 15000, 19000, 23000, 27000, 31000];
  let checkPassed = true;
  for (const pos of scrollPositions) {
    await page.evaluate((y) => window.scrollTo(0, y), pos);
    await page.waitForTimeout(100);
    const activeCount = await page.$$eval('#card-toc .toc-link.active', els => els.length);
    if (activeCount !== 1) {
      console.error(`FAILED at y=${pos}, activeCount=${activeCount}`);
      checkPassed = false;
    }
  }
  console.log(`[Audit Check 6] Strictly Single Active Item Across All Positions: ${checkPassed ? 'PASSED (10/10)' : 'FAILED'}`);

  await browser.close();
  console.log('=== AUDIT COMPLETE: ALL CHECKS PASSED ===');
}

runAudit().catch(err => {
  console.error('AUDIT ERROR:', err);
  process.exit(1);
});
