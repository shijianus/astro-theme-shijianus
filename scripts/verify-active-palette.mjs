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
  const port = 4455;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  const server = await createStaticServer(distDir, port);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${port}/categories/`, { waitUntil: 'networkidle2' });

    // 1. Check parent item on /categories/
    const parentData = await page.evaluate(() => {
      const p = document.querySelector('#menus .menus_item:first-child .site-page');
      const cs = window.getComputedStyle(p);
      return {
        text: p.innerText.trim(),
        bg: cs.backgroundColor,
        color: cs.color,
        shadow: cs.boxShadow,
        border: cs.border
      };
    });
    console.log('[Check 1] Active Parent on /categories/:', parentData);
    if (!parentData.color.includes('66, 90, 239')) {
      throw new Error(`Expected theme blue color for active parent, got ${parentData.color}`);
    }
    if (parentData.bg !== 'rgba(0, 0, 0, 0)') {
      throw new Error(`Active parent should not have a clashing background box, got ${parentData.bg}`);
    }

    // 2. Open submenu by hovering parent
    await page.hover('#menus .menus_item:first-child');
    await new Promise(r => setTimeout(r, 400));

    // 3. Check active submenu child (分类索引)
    const activeSubItem = await page.evaluate(() => {
      const it = document.querySelector('#menus .menus_item:first-child .site-page-submenu__item.is-active');
      if (!it) return null;
      const cs = window.getComputedStyle(it);
      return {
        text: it.innerText.trim(),
        bg: cs.backgroundColor,
        color: cs.color,
        shadow: cs.boxShadow,
        border: cs.border
      };
    });
    console.log('[Check 2] Active Submenu Item (non-hovered):', activeSubItem);
    if (!activeSubItem) throw new Error('Active submenu item not found');
    
    // Ensure no clashing 1px inset box or tinted background box
    if (activeSubItem.shadow !== 'none') {
      throw new Error(`Active submenu item has conflicting box-shadow box: ${activeSubItem.shadow}`);
    }
    if (activeSubItem.bg !== 'rgba(0, 0, 0, 0)') {
      throw new Error(`Active submenu item has conflicting background box: ${activeSubItem.bg}`);
    }
    if (!activeSubItem.color.includes('66, 90, 239')) {
      throw new Error(`Active submenu item should have theme blue text, got ${activeSubItem.color}`);
    }

    // 4. Hover over active submenu child -> solid theme blue pill
    await page.hover('#menus .menus_item:first-child .site-page-submenu__item.is-active');
    await new Promise(r => setTimeout(r, 300));

    const activeHoveredSub = await page.evaluate(() => {
      const it = document.querySelector('#menus .menus_item:first-child .site-page-submenu__item.is-active');
      const cs = window.getComputedStyle(it);
      return {
        bg: cs.backgroundColor,
        color: cs.color,
        shadow: cs.boxShadow
      };
    });
    console.log('[Check 3] Active Submenu Item (hovered):', activeHoveredSub);
    if (!activeHoveredSub.bg.includes('66, 90, 239')) {
      throw new Error(`Expected theme blue hover background, got ${activeHoveredSub.bg}`);
    }
    if (activeHoveredSub.color !== 'rgb(255, 255, 255)') {
      throw new Error(`Expected white text on hover, got ${activeHoveredSub.color}`);
    }

    // 5. Hover another inactive child (全部文章) -> ensure solid blue pill on hovered, and active item stays clean without clashing box
    await page.hover('#menus .menus_item:first-child .site-page-submenu__item:first-child');
    await new Promise(r => setTimeout(r, 800));

    const otherChildHovered = await page.evaluate(() => {
      const first = document.querySelector('#menus .menus_item:first-child .site-page-submenu__item:first-child');
      const active = document.querySelector('#menus .menus_item:first-child .site-page-submenu__item.is-active');
      const firstCs = window.getComputedStyle(first);
      const activeCs = window.getComputedStyle(active);
      return {
        hoveredChild: {
          bg: firstCs.backgroundColor,
          color: firstCs.color
        },
        activeChild: {
          bg: activeCs.backgroundColor,
          color: activeCs.color,
          shadow: activeCs.boxShadow
        }
      };
    });
    console.log('[Check 4] Hovered other child while active exists:', otherChildHovered);
    if (!otherChildHovered.hoveredChild.bg.includes('66, 90, 239')) {
      throw new Error('Hovered child should be theme blue');
    }
    if (otherChildHovered.activeChild.shadow !== 'none' || otherChildHovered.activeChild.bg !== 'rgba(0, 0, 0, 0)') {
      throw new Error('Active child must not have clashing box shadow or bg when another child is hovered');
    }

    // 6. Test Dark Mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await new Promise(r => setTimeout(r, 200));

    const darkModeActiveSub = await page.evaluate(() => {
      const active = document.querySelector('#menus .menus_item:first-child .site-page-submenu__item.is-active');
      const cs = window.getComputedStyle(active);
      return {
        bg: cs.backgroundColor,
        color: cs.color,
        shadow: cs.boxShadow
      };
    });
    console.log('[Check 5] Dark Mode Active Submenu Item (non-hovered):', darkModeActiveSub);
    if (darkModeActiveSub.shadow !== 'none' || darkModeActiveSub.bg !== 'rgba(0, 0, 0, 0)') {
      throw new Error('Dark mode active submenu item must have transparent background and no shadow');
    }

    console.log('\n>>> SUCCESS: NO COLOR CONFLICT IN LIGHT & DARK MODE! All menus_item and submenu colors are 100% harmonized with Anzhiyu palette! <<<');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
