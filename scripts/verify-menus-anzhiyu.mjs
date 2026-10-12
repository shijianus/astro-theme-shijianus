import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';

function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(distDir, reqUrl);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

async function runTests() {
  const port = 4399;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  const server = await createStaticServer(distDir, port);

  console.log('Static server listening on port', port);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Navigating to http://localhost:' + port + '/');
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle2' });

    // 1. Verify #menus exists and is visible on desktop
    const menusVisible = await page.$eval('#menus', el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && rect.width > 0 && rect.height > 0;
    });
    console.log(`[Test 1] #menus visible on desktop: ${menusVisible}`);
    if (!menusVisible) throw new Error('#menus should be visible on desktop');

    // 2. Verify all .site-page-shell elements are equal-sized (等大)
    const shellSizes = await page.$$eval('#menus .site-page-shell', els => {
      return els.map(el => {
        const rect = el.getBoundingClientRect();
        return { width: Math.round(rect.width), height: Math.round(rect.height) };
      });
    });
    console.log(`[Test 2] .site-page-shell count: ${shellSizes.length}`, shellSizes);
    if (shellSizes.length < 4) throw new Error('Expected at least 4 nav items');

    const firstWidth = shellSizes[0].width;
    const allEqualWidth = shellSizes.every(s => Math.abs(s.width - firstWidth) <= 1);
    console.log(`[Test 2] All shells equal width (${firstWidth}px): ${allEqualWidth}`);
    if (!allEqualWidth) throw new Error('Not all .site-page-shell elements have equal width');

    // 3. Verify Pure Text Mode by default (No top-level icons, no subtitles)
    const pureTextCheck = await page.evaluate(() => {
      const topIcons = document.querySelectorAll('#menus .site-page > .site-page__icon, #menus .site-page > .site-page__icon-wrap');
      const topSubtitles = document.querySelectorAll('#menus .site-page .site-page__subtitle');
      const topLabels = document.querySelectorAll('#menus .site-page .site-page__label');
      const bilingualStacks = document.querySelectorAll('#menus .site-page .site-page__bilingual-stack');

      return {
        topIconCount: topIcons.length,
        topSubtitleCount: topSubtitles.length,
        topLabelCount: topLabels.length,
        bilingualStackCount: bilingualStacks.length,
      };
    });
    console.log(`[Test 3] Default Pure Text Audit:`, pureTextCheck);
    if (pureTextCheck.topIconCount !== 0) throw new Error('Expected 0 top-level icons by default');
    if (pureTextCheck.topSubtitleCount !== 0) throw new Error('Expected 0 top-level subtitles by default');
    if (pureTextCheck.bilingualStackCount !== 0) throw new Error('Expected 0 bilingual stacks by default');
    if (pureTextCheck.topLabelCount < 4) throw new Error('Expected at least 4 pure labels');

    // 4. Verify Submenu appearance, frosted glass, and preserved rounded corners
    const hasChildrenItem = await page.$('#menus .menus_item.has-children');
    if (!hasChildrenItem) throw new Error('No .menus_item.has-children found');

    // Hover over the has-children item
    await page.hover('#menus .menus_item.has-children');
    await new Promise(r => setTimeout(r, 400));

    const submenuAudit = await page.evaluate(() => {
      const sub = document.querySelector('#menus .site-page-submenu');
      if (!sub) return null;
      const subStyle = window.getComputedStyle(sub);
      const firstItem = sub.querySelector('.site-page-submenu__item');
      const itemStyle = firstItem ? window.getComputedStyle(firstItem) : null;

      return {
        opacity: subStyle.opacity,
        visibility: subStyle.visibility,
        display: subStyle.display,
        borderRadius: subStyle.borderRadius,
        backdropFilter: subStyle.backdropFilter || subStyle.webkitBackdropFilter,
        backgroundColor: subStyle.backgroundColor,
        boxShadow: subStyle.boxShadow,
        itemBorderRadius: itemStyle ? itemStyle.borderRadius : null,
        itemColor: itemStyle ? itemStyle.color : null,
      };
    });

    console.log(`[Test 4] Submenu Audit on Hover:`, submenuAudit);
    if (!submenuAudit || submenuAudit.opacity !== '1' || submenuAudit.visibility !== 'visible') {
      throw new Error('Submenu should be visible on hover');
    }

    // Verify STRICT rule: corner radiuses preserved
    console.log(`[Test 5] Preserved Corner Radius: container=${submenuAudit.borderRadius}, item=${submenuAudit.itemBorderRadius}`);
    if (submenuAudit.borderRadius !== '8px') {
      throw new Error(`Submenu container border-radius must be 8px, got ${submenuAudit.borderRadius}`);
    }
    if (submenuAudit.itemBorderRadius !== '6px') {
      throw new Error(`Submenu item border-radius must be 6px, got ${submenuAudit.itemBorderRadius}`);
    }

    // 5. Verify Submenu Item Hover Interaction (Color, Brand Blue #425aef, Text White)
    const firstSubmenuItem = await page.$('#menus .site-page-submenu__item');
    if (!firstSubmenuItem) throw new Error('No submenu items found');

    await page.hover('#menus .site-page-submenu__item');
    await new Promise(r => setTimeout(r, 300));

    const itemHoverAudit = await page.evaluate(() => {
      const item = document.querySelector('#menus .site-page-submenu__item:hover') || document.querySelector('#menus .site-page-submenu__item');
      const comp = window.getComputedStyle(item);
      const icon = item.querySelector('.site-page-submenu__icon');
      const iconComp = icon ? window.getComputedStyle(icon) : null;

      return {
        backgroundColor: comp.backgroundColor,
        color: comp.color,
        iconColor: iconComp ? iconComp.color : null,
        boxShadow: comp.boxShadow,
        transform: comp.transform
      };
    });

    console.log(`[Test 6] Submenu Item Hover Audit:`, itemHoverAudit);
    // Background should be theme blue rgb(66, 90, 239)
    const isThemeBlue = itemHoverAudit.backgroundColor.includes('66, 90, 239') || itemHoverAudit.backgroundColor.includes('#425aef');
    const isWhiteText = itemHoverAudit.color === 'rgb(255, 255, 255)';
    console.log(`[Test 6] Submenu Hover Theme Blue: ${isThemeBlue}, White Text: ${isWhiteText}`);
    if (!isThemeBlue) throw new Error(`Expected theme blue hover background, got ${itemHoverAudit.backgroundColor}`);
    if (!isWhiteText) throw new Error(`Expected white hover text, got ${itemHoverAudit.color}`);

    // 6. Test Dark Mode presentation
    console.log('\n--- Auditing Dark Mode ---');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise(r => setTimeout(r, 300));

    const darkModeAudit = await page.evaluate(() => {
      const sub = document.querySelector('#menus .site-page-submenu');
      const subStyle = window.getComputedStyle(sub);
      return {
        backgroundColor: subStyle.backgroundColor,
        boxShadow: subStyle.boxShadow,
        borderRadius: subStyle.borderRadius
      };
    });
    console.log(`[Test 7] Dark Mode Submenu Audit:`, darkModeAudit);
    if (darkModeAudit.borderRadius !== '8px') {
      throw new Error(`Dark mode submenu container border-radius must remain 8px`);
    }

    console.log('\n=========================================');
    console.log(' ALL AUDITS PASSED WITH FLYING COLORS! ');
    console.log('=========================================');
  } finally {
    await browser.close();
    server.close();
  }
}

runTests().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
