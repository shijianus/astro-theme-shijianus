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

async function run() {
  const port = 4688;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  const server = await createStaticServer(distDir, port);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle2' });

    console.log('--- 1. Testing Submenu Isolation on Sequential Hover ---');
    for (let i = 1; i <= 4; i++) {
      await page.hover(`#menus .menus_item:nth-child(${i}) .site-page`);
      await new Promise(r => setTimeout(r, 220));

      const status = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('#menus .menus_item'));
        return items.map((it, idx) => {
          const sub = it.querySelector('.site-page-submenu');
          const cs = sub ? window.getComputedStyle(sub) : null;
          return {
            idx,
            label: it.querySelector('.site-page__label')?.innerText.trim(),
            visible: cs && cs.visibility === 'visible' && parseFloat(cs.opacity) > 0.8,
            opacity: cs ? cs.opacity : null,
            pointerEvents: cs ? cs.pointerEvents : null,
          };
        });
      });

      const visibleItems = status.filter(s => s.visible);
      console.log(`Hovered item ${i}: active submenu count = ${visibleItems.length}`, visibleItems.map(v => v.label));
      if (visibleItems.length !== 1) {
        throw new Error(`Expected strictly 1 visible submenu, but found ${visibleItems.length}: ${JSON.stringify(visibleItems)}`);
      }
      if (visibleItems[0].idx !== (i - 1)) {
        throw new Error(`Visible submenu (${visibleItems[0].idx}) does not match hovered item (${i - 1})`);
      }
    }

    console.log('--- 2. Testing Rapid Hover Across Items (No Ghost Overlaps) ---');
    // Rapidly sweep cursor across items 1 -> 2 -> 3 -> 4
    for (let i = 1; i <= 4; i++) {
      await page.hover(`#menus .menus_item:nth-child(${i}) .site-page`);
      await new Promise(r => setTimeout(r, 60)); // Fast move
    }
    // Now at item 4, wait 220ms
    await new Promise(r => setTimeout(r, 220));
    const finalSweep = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('#menus .menus_item'));
      return items.map((it, idx) => {
        const sub = it.querySelector('.site-page-submenu');
        const cs = sub ? window.getComputedStyle(sub) : null;
        return {
          idx,
          label: it.querySelector('.site-page__label')?.innerText.trim(),
          visible: cs && cs.visibility === 'visible' && parseFloat(cs.opacity) > 0.8,
        };
      }).filter(s => s.visible);
    });
    console.log('After rapid sweep to item 4, active submenus:', finalSweep);
    if (finalSweep.length !== 1 || finalSweep[0].idx !== 3) {
      throw new Error(`Expected only item 4 visible after sweep, got: ${JSON.stringify(finalSweep)}`);
    }

    console.log('--- 3. Testing Vertical Distance and Hit-Test Bridge Precision ---');
    await page.hover('#menus .menus_item:nth-child(1) .site-page');
    await new Promise(r => setTimeout(r, 220));

    const metrics = await page.evaluate(() => {
      const sub = document.querySelector('#menus .menus_item:nth-child(1) .site-page-submenu');
      const a = document.querySelector('#menus .menus_item:nth-child(1) .site-page');
      const nav = document.querySelector('#nav');
      const subRect = sub.getBoundingClientRect();
      const aRect = a.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();

      return {
        aBottom: aRect.bottom,
        navBottom: navRect.bottom,
        subTop: subRect.top,
        verticalGapFromButton: Math.round(subRect.top - aRect.bottom),
        verticalGapFromNav: Math.round(subRect.top - navRect.bottom),
      };
    });
    console.log('Submenu Metrics:', metrics);
    // Vertical distance from button should be clean (~12-16px)
    if (metrics.verticalGapFromButton < 10) {
      throw new Error(`Vertical gap from button too small (${metrics.verticalGapFromButton}px)`);
    }
    // Submenu top should be flush with or just below nav bottom (>= -1px and <= 4px)
    if (metrics.subTop < metrics.navBottom - 2) {
      throw new Error(`Submenu cuts into nav bar! subTop=${metrics.subTop}, navBottom=${metrics.navBottom}`);
    }

    // Capture screenshot of isolated clean dropdown
    await page.screenshot({ path: 'scripts/dropdown_clean_isolated.png', clip: { x: 300, y: 0, width: 840, height: 180 } });
    console.log('Saved scripts/dropdown_clean_isolated.png');

    console.log('\n>>> SUCCESS: ALL SUBMENUS ISOLATED, ZERO CONFLICT, CLEAN DISTANCE! <<<');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
