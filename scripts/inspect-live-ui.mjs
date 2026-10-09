import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const outDir = path.resolve('scratch/live-inspection');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Navigating to https://blog.epocanvas.com/ ...');
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  // Take light mode screenshots
  await page.screenshot({ path: path.join(outDir, '01-live-home-light.png') });
  const boxLight = await page.$('#aside-sticky-box-overview');
  if (boxLight) {
    await boxLight.screenshot({ path: path.join(outDir, '01-live-box-light.png') });
  }

  // Inspect light mode
  const lightData = await page.evaluate(() => {
    const box = document.getElementById('aside-sticky-box-overview');
    const layout = document.getElementById('home-sticky-layout');
    const sBox = box ? window.getComputedStyle(box) : null;
    const canvases = Array.from(document.querySelectorAll('canvas')).map(c => ({
      id: c.id,
      className: c.className,
      style: c.getAttribute('style'),
      zIndex: window.getComputedStyle(c).zIndex,
      position: window.getComputedStyle(c).position,
      width: c.width,
      height: c.height
    }));
    return {
      boxFound: Boolean(box),
      boxClasses: box?.className,
      boxBg: sBox?.backgroundColor,
      boxFilter: sBox?.backdropFilter || sBox?.webkitBackdropFilter,
      boxBorder: sBox?.border,
      boxShadow: sBox?.boxShadow,
      boxPadding: sBox?.padding,
      boxRect: box ? box.getBoundingClientRect() : null,
      children: box ? Array.from(box.children).map(c => ({
        tag: c.tagName,
        id: c.id,
        className: c.className,
        bg: window.getComputedStyle(c).backgroundColor,
        filter: window.getComputedStyle(c).backdropFilter || window.getComputedStyle(c).webkitBackdropFilter,
        border: window.getComputedStyle(c).border
      })) : [],
      canvases
    };
  });
  console.log('Light Mode Live Data:', JSON.stringify(lightData, null, 2));

  // Switch to dark mode
  console.log('Switching to dark mode...');
  await page.evaluate(() => {
    const btn = document.getElementById('darkmode');
    if (btn) btn.click();
    else document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(3000);

  // Take dark mode screenshots
  await page.screenshot({ path: path.join(outDir, '02-live-home-dark.png') });
  const boxDark = await page.$('#aside-sticky-box-overview');
  if (boxDark) {
    await boxDark.screenshot({ path: path.join(outDir, '02-live-box-dark.png') });
  }

  // Record 3 seconds of background motion or check if universe/meteor/snow is running
  const darkData = await page.evaluate(() => {
    const box = document.getElementById('aside-sticky-box-overview');
    const sBox = box ? window.getComputedStyle(box) : null;
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
    const canvases = Array.from(document.querySelectorAll('canvas')).map(c => ({
      id: c.id,
      className: c.className,
      style: c.getAttribute('style'),
      zIndex: window.getComputedStyle(c).zIndex,
      position: window.getComputedStyle(c).position,
      rect: c.getBoundingClientRect()
    }));
    const allBgElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const id = el.id || '';
      const cls = el.className || '';
      return id.includes('star') || id.includes('snow') || id.includes('meteor') || id.includes('universe') ||
             (typeof cls === 'string' && (cls.includes('star') || cls.includes('snow') || cls.includes('meteor') || cls.includes('universe')));
    }).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className,
      rect: el.getBoundingClientRect(),
      zIndex: window.getComputedStyle(el).zIndex
    }));

    return {
      theme: document.documentElement.dataset.theme,
      boxBg: sBox?.backgroundColor,
      boxFilter: sBox?.backdropFilter || sBox?.webkitBackdropFilter,
      boxBorder: sBox?.border,
      boxShadow: sBox?.boxShadow,
      bodyBg,
      htmlBg,
      children: box ? Array.from(box.children).map(c => ({
        tag: c.tagName,
        id: c.id,
        className: c.className,
        bg: window.getComputedStyle(c).backgroundColor,
        filter: window.getComputedStyle(c).backdropFilter || window.getComputedStyle(c).webkitBackdropFilter
      })) : [],
      canvases,
      allBgElements
    };
  });
  console.log('Dark Mode Live Data:', JSON.stringify(darkData, null, 2));

  await browser.close();
  console.log('Done! Screenshots saved to scratch/live-inspection');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
