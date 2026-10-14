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

async function verifySubmenu() {
  const port = 4580;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  const server = await createStaticServer(distDir, port);

  console.log('Testing static server on port', port);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle2' });

    console.log('=== Step 1: Testing About (4 items) Dropdown & Collision across viewports ===');
    for (const w of [1440, 1280, 1100, 1024]) {
      await page.setViewport({ width: w, height: 800 });
      const menuItems = await page.$$('#menus .menus_item');
      if (menuItems.length < 4) throw new Error('Expected at least 4 menu items');
      
      // Hover About item
      await menuItems[3].hover();
      await new Promise(r => setTimeout(r, 300));

      const aboutAudit = await page.evaluate(() => {
        const item = document.querySelectorAll('#menus .menus_item')[3];
        const sub = item.querySelector('.site-page-submenu');
        const subRect = sub.getBoundingClientRect();
        const subStyle = window.getComputedStyle(sub);
        const navRight = document.querySelector('#nav-right')?.getBoundingClientRect();
        const blogName = document.querySelector('#blog_name, #nav-group #blog_name, #site-name')?.getBoundingClientRect();

        const children = Array.from(sub.querySelectorAll('.site-page-submenu__item')).map(c => {
          const cRect = c.getBoundingClientRect();
          const icon = c.querySelector('.site-page-submenu__icon');
          const iconRect = icon ? icon.getBoundingClientRect() : null;
          const label = c.querySelector('.site-page-submenu__label');
          const labelRect = label ? label.getBoundingClientRect() : null;
          const isSvgCoffee = Boolean(c.querySelector('svg.lucide-coffee'));

          return {
            text: label?.textContent?.trim(),
            itemWidth: Math.round(cRect.width),
            itemHeight: Math.round(cRect.height),
            iconWidth: iconRect ? Math.round(iconRect.width) : null,
            labelWidth: labelRect ? Math.round(labelRect.width) : null,
            iconRight: iconRect ? iconRect.right : null,
            labelLeft: labelRect ? labelRect.left : null,
            iconLabelGap: (iconRect && labelRect) ? Math.round(labelRect.left - iconRect.right) : null,
            isOverlapping: (iconRect && labelRect) ? !(labelRect.left >= iconRect.right || labelRect.right <= iconRect.left) : false,
            isSvgCoffee
          };
        });

        return {
          subWidth: Math.round(subRect.width),
          subHeight: Math.round(subRect.height),
          subLeft: Math.round(subRect.left),
          subRight: Math.round(subRect.right),
          navRightLeft: navRight ? Math.round(navRight.left) : null,
          blogNameRight: blogName ? Math.round(blogName.right) : null,
          collisionWithNavRight: navRight ? (subRect.right > navRight.left) : false,
          collisionWithBlogName: blogName ? (subRect.left < blogName.right) : false,
          gapToNavRight: navRight ? Math.round(navRight.left - subRect.right) : null,
          borderRadius: subStyle.borderRadius,
          children
        };
      });

      console.log(`[Viewport ${w}px] About 4-item audit:`, {
        subWidth: aboutAudit.subWidth,
        subRight: aboutAudit.subRight,
        navRightLeft: aboutAudit.navRightLeft,
        collisionWithNavRight: aboutAudit.collisionWithNavRight,
        gapToNavRight: aboutAudit.gapToNavRight,
        childrenCount: aboutAudit.children.length
      });

      if (aboutAudit.collisionWithNavRight) {
        throw new Error(`[Viewport ${w}px] Submenu collided with #nav-right!`);
      }
      if (aboutAudit.collisionWithBlogName) {
        throw new Error(`[Viewport ${w}px] Submenu collided with logo!`);
      }

      // Verify each child has no overlap between icon and label
      for (const child of aboutAudit.children) {
        if (child.isOverlapping) {
          throw new Error(`Child "${child.text}" has overlapping icon and label!`);
        }
        if (child.iconLabelGap < 4) {
          throw new Error(`Child "${child.text}" gap between icon and label is too small: ${child.iconLabelGap}px`);
        }
      }

      // Check coffee icon for 请喝咖啡
      const coffeeItem = aboutAudit.children.find(c => c.text === '请喝咖啡');
      if (!coffeeItem) throw new Error('Missing "请喝咖啡" item');
      if (!coffeeItem.isSvgCoffee) {
        throw new Error('Expected "请喝咖啡" to have lucide-coffee SVG icon!');
      }
    }

    console.log('=== Step 2: Testing 3 items, 2 items, 1 item, 0 items containment ===');
    await page.setViewport({ width: 1280, height: 800 });

    // 3 items test
    await page.evaluate(() => {
      const sub = document.querySelectorAll('#menus .menus_item')[3].querySelector('.site-page-submenu');
      const items = sub.querySelectorAll('.site-page-submenu__item');
      if (items.length >= 4) items[3].remove();
    });
    await new Promise(r => setTimeout(r, 200));
    const audit3 = await page.evaluate(() => {
      const sub = document.querySelectorAll('#menus .menus_item')[3].querySelector('.site-page-submenu');
      const rect = sub.getBoundingClientRect();
      const items = sub.querySelectorAll('.site-page-submenu__item');
      return { count: items.length, width: Math.round(rect.width) };
    });
    console.log('[3 Items Audit]:', audit3);
    if (audit3.count !== 3 || audit3.width <= 0) throw new Error('3 items failed');

    // 2 items test
    await page.evaluate(() => {
      const sub = document.querySelectorAll('#menus .menus_item')[3].querySelector('.site-page-submenu');
      const items = sub.querySelectorAll('.site-page-submenu__item');
      if (items.length >= 3) items[2].remove();
    });
    await new Promise(r => setTimeout(r, 200));
    const audit2 = await page.evaluate(() => {
      const sub = document.querySelectorAll('#menus .menus_item')[3].querySelector('.site-page-submenu');
      const rect = sub.getBoundingClientRect();
      const items = sub.querySelectorAll('.site-page-submenu__item');
      return { count: items.length, width: Math.round(rect.width) };
    });
    console.log('[2 Items Audit]:', audit2);
    if (audit2.count !== 2 || audit2.width >= audit3.width) throw new Error('2 items width did not shrink dynamically');

    // 1 item test
    await page.evaluate(() => {
      const sub = document.querySelectorAll('#menus .menus_item')[3].querySelector('.site-page-submenu');
      const items = sub.querySelectorAll('.site-page-submenu__item');
      if (items.length >= 2) items[1].remove();
    });
    await new Promise(r => setTimeout(r, 200));
    const audit1 = await page.evaluate(() => {
      const sub = document.querySelectorAll('#menus .menus_item')[3].querySelector('.site-page-submenu');
      const rect = sub.getBoundingClientRect();
      const items = sub.querySelectorAll('.site-page-submenu__item');
      return { count: items.length, width: Math.round(rect.width) };
    });
    console.log('[1 Item Audit]:', audit1);
    if (audit1.count !== 1 || audit1.width >= audit2.width) throw new Error('1 item width did not shrink dynamically');

    // 0 items test (empty)
    await page.evaluate(() => {
      const sub = document.querySelectorAll('#menus .menus_item')[3].querySelector('.site-page-submenu');
      const items = sub.querySelectorAll('.site-page-submenu__item');
      items.forEach(i => i.remove());
    });
    await new Promise(r => setTimeout(r, 200));
    const audit0 = await page.evaluate(() => {
      const sub = document.querySelectorAll('#menus .menus_item')[3].querySelector('.site-page-submenu');
      const style = window.getComputedStyle(sub);
      return {
        display: style.display,
        opacity: style.opacity
      };
    });
    console.log('[0 Items Audit]:', audit0);
    if (audit0.display !== 'none') {
      throw new Error(`Expected display: none for 0 items, got ${audit0.display}`);
    }

    console.log('=== Step 3: Testing Dark Mode and Preserved Corner Radii ===');
    await page.reload({ waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise(r => setTimeout(r, 200));

    const menuItems = await page.$$('#menus .menus_item');
    await menuItems[3].hover();
    await new Promise(r => setTimeout(r, 300));

    const darkAudit = await page.evaluate(() => {
      const sub = document.querySelectorAll('#menus .menus_item')[3].querySelector('.site-page-submenu');
      const item = sub.querySelector('.site-page-submenu__item');
      const subStyle = window.getComputedStyle(sub);
      const itemStyle = window.getComputedStyle(item);
      return {
        subBorderRadius: subStyle.borderRadius,
        itemBorderRadius: itemStyle.borderRadius,
        itemHeight: Math.round(parseFloat(itemStyle.height)),
        subBg: subStyle.backgroundColor
      };
    });
    console.log('[Dark Mode Audit]:', darkAudit);
    if (darkAudit.subBorderRadius !== '8px') throw new Error('Submenu border-radius must remain 8px');
    if (darkAudit.itemBorderRadius !== '6px') throw new Error('Submenu item border-radius must remain 6px');
    if (darkAudit.itemHeight !== 36) throw new Error('Submenu item height must remain 36px');

    console.log('\n======================================================');
    console.log(' ALL SUBMENU OPTIMIZATION AUDITS PASSED WITH SUCCESS! ');
    console.log('======================================================');
  } finally {
    await browser.close();
    server.close();
  }
}

verifySubmenu().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
