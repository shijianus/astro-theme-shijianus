import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('scratch/transparency-audit');
fs.mkdirSync(outDir, { recursive: true });

async function inspectUrl(url, name) {
  console.log(`\n=== Inspecting: ${name} (${url}) ===`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.warn(`Initial networkidle timed out, waiting load...`, e.message);
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  }

  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({ path: path.join(outDir, `${name}-full.png`), fullPage: true });
  await page.screenshot({ path: path.join(outDir, `${name}-viewport.png`) });

  // Extract styles
  const data = await page.evaluate(() => {
    function getDetails(el) {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        background: s.background,
        backgroundColor: s.backgroundColor,
        backgroundImage: s.backgroundImage,
        backdropFilter: s.backdropFilter,
        webkitBackdropFilter: s.webkitBackdropFilter,
        opacity: s.opacity,
        boxShadow: s.boxShadow,
        border: s.border,
        borderColor: s.borderColor
      };
    }

    const cssVars = {};
    const rootStyle = window.getComputedStyle(document.documentElement);
    const bodyStyle = window.getComputedStyle(document.body);

    const importantVars = [
      '--anzhiyu-card-bg',
      '--anzhiyu-card-bg-none',
      '--anzhiyu-background',
      '--global-bg',
      '--anzhiyu-secondbg',
      '--anzhiyu-card-border',
      '--style-border',
      '--anzhiyu-maskbg',
      '--anzhiyu-shadow-border'
    ];

    for (const v of importantVars) {
      cssVars[v] = rootStyle.getPropertyValue(v).trim() || bodyStyle.getPropertyValue(v).trim();
    }

    // Inspect elements
    const elements = {};
    const selectors = [
      'body',
      '#web_bg',
      '#nav',
      '#page-header',
      '.recent-post-item',
      '#aside-content .card-widget',
      '#aside-content .card-info',
      '#aside-content .card-feature-panel',
      '#aside-content .card-feature-panel--overview',
      '#footer',
      '#footer-wrap',
      '#footer-bar',
      '.p-3.sm\\:p-3\\.5',
      '.card-feature-panel--overview',
      '#content-inner'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      elements[sel] = getDetails(el);
    }

    return { cssVars, elements };
  });

  console.log(`CSS Variables for ${name}:`, JSON.stringify(data.cssVars, null, 2));
  console.log(`Elements for ${name}:`, JSON.stringify(data.elements, null, 2));

  await browser.close();
  return data;
}

async function main() {
  const anzhiyu = await inspectUrl('https://hexo.anheyu.com/', 'anzhiyu-demo');
  const epocanvas = await inspectUrl('https://blog.epocanvas.com/', 'epocanvas-demo');
  
  fs.writeFileSync(path.join(outDir, 'audit-results.json'), JSON.stringify({ anzhiyu, epocanvas }, null, 2));
  console.log(`Audit finished, saved to ${outDir}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
