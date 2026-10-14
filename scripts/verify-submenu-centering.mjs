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
  const port = 4598;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  const server = await createStaticServer(distDir, port);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle2' });

    // Test all menu items with dropdowns
    const menuItems = await page.$$('#menus .menus_item.has-children');
    console.log(`Found ${menuItems.length} menu items with dropdowns`);

    const centeringResults = [];

    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      await item.hover();
      await new Promise(r => setTimeout(r, 200));

      const info = await page.evaluate((idx) => {
        const itemEl = document.querySelectorAll('#menus .menus_item.has-children')[idx];
        const label = itemEl.querySelector('.site-page-link, .site-page-text, span')?.textContent?.trim();
        const sub = itemEl.querySelector('.site-page-submenu');
        if (!sub) return null;

        const itemRect = itemEl.getBoundingClientRect();
        const subRect = sub.getBoundingClientRect();
        const itemCenter = Math.round((itemRect.left + itemRect.right) / 2);
        const subCenter = Math.round((subRect.left + subRect.right) / 2);
        const offset = Math.abs(itemCenter - subCenter);

        const items = Array.from(sub.querySelectorAll('.site-page-submenu__item')).map(el => {
          const r = el.getBoundingClientRect();
          const icon = el.querySelector('.site-page-submenu__icon')?.getBoundingClientRect();
          const text = el.querySelector('.site-page-submenu__label')?.getBoundingClientRect();
          return {
            text: el.textContent?.trim(),
            width: Math.round(r.width),
            height: Math.round(r.height),
            iconRight: icon ? Math.round(icon.right) : 0,
            textLeft: text ? Math.round(text.left) : 0,
            hasClash: icon && text ? (icon.right > text.left) : false
          };
        });

        const computed = window.getComputedStyle(sub);

        return {
          idx,
          label,
          itemCenter,
          subCenter,
          offset,
          isStrictlyCentered: offset <= 1,
          itemCount: items.length,
          borderRadius: computed.borderRadius,
          border: computed.border,
          items
        };
      }, i);

      centeringResults.push(info);
      console.log(`[Dropdown ${i} - ${info.label}]:`, JSON.stringify(info, null, 2));

      await page.screenshot({
        path: `scripts/dropdown_center_${i}_${info.label}.png`,
        clip: { x: 0, y: 0, width: 1440, height: 260 }
      });
    }

    // Now test 0, 1, 2, 3, 4 dynamic items in the submenu
    const dynamicTests = await page.evaluate(() => {
      const aboutSub = document.querySelectorAll('#menus .menus_item.has-children')[3]?.querySelector('.site-page-submenu');
      if (!aboutSub) return null;

      const originalHtml = aboutSub.innerHTML;
      const testCases = [];

      // Test 0 items (empty)
      aboutSub.innerHTML = '';
      const style0 = window.getComputedStyle(aboutSub);
      testCases.push({
        count: 0,
        display: style0.display,
        opacity: style0.opacity,
        visibility: style0.visibility,
        isHidden: style0.display === 'none' || style0.opacity === '0' || style0.visibility === 'hidden'
      });

      // Helper to generate N items
      const sampleItem = (title) => `
        <a class="site-page-submenu__item" href="/test/">
          <svg class="site-page-submenu__icon" width="15" height="15"><circle cx="7" cy="7" r="5" fill="#425aef"></circle></svg>
          <span class="site-page-submenu__label">${title}</span>
        </a>
      `;

      for (let count = 1; count <= 4; count++) {
        aboutSub.innerHTML = Array.from({ length: count }, (_, k) => sampleItem(`测试项${k+1}`)).join('');
        const itemEl = document.querySelectorAll('#menus .menus_item.has-children')[3];
        const itemRect = itemEl.getBoundingClientRect();
        const subRect = aboutSub.getBoundingClientRect();
        const itemCenter = Math.round((itemRect.left + itemRect.right) / 2);
        const subCenter = Math.round((subRect.left + subRect.right) / 2);
        const offset = Math.abs(itemCenter - subCenter);

        testCases.push({
          count,
          width: Math.round(subRect.width),
          height: Math.round(subRect.height),
          itemCenter,
          subCenter,
          offset,
          isStrictlyCentered: offset <= 1
        });
      }

      aboutSub.innerHTML = originalHtml;
      return testCases;
    });

    console.log('[Dynamic 0-4 item tests]:', JSON.stringify(dynamicTests, null, 2));

    // Assertions
    const allStrictlyCentered = centeringResults.every(r => r.isStrictlyCentered);
    const noClashes = centeringResults.every(r => r.items.every(it => !it.hasClash));
    const dynamic0Hidden = dynamicTests[0].isHidden;
    const dynamic1to4Centered = dynamicTests.slice(1).every(d => d.isStrictlyCentered);

    console.log('\n--- VERIFICATION SUMMARY ---');
    console.log('All menu dropdowns strictly centered (offset <= 1px):', allStrictlyCentered);
    console.log('No text/icon clashes across all items:', noClashes);
    console.log('0-item submenu completely hidden (no ghost box):', dynamic0Hidden);
    console.log('1-4 items submenus dynamically sized & strictly centered:', dynamic1to4Centered);
    console.log('Console errors:', consoleErrors.length);

    if (!allStrictlyCentered || !noClashes || !dynamic0Hidden || !dynamic1to4Centered) {
      throw new Error('Submenu centering or UI consistency verification failed!');
    }

    console.log('\n>>> ALL SUBMENU CENTERING & UI CONSISTENCY VERIFICATIONS PASSED! <<<');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
