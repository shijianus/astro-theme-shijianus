import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';

const chromePath = fs.existsSync('/usr/bin/google-chrome-stable') 
  ? '/usr/bin/google-chrome-stable' 
  : (fs.existsSync('/usr/bin/chromium-browser') ? '/usr/bin/chromium-browser' : undefined);

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

async function verifyState(expectedDisabled = false) {
  const port = 4789;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  const server = await createStaticServer(distDir, port);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({ text: msg.text(), location: msg.location() });
      }
    });

    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle2' });

    console.log(`\n============================================================`);
    console.log(`VERIFYING MENUS STATE: disableParentNav = ${expectedDisabled}`);
    console.log(`============================================================`);

    const parentItems = await page.$$eval('#menus .menus_item.has-children', items => {
      return items.map(item => {
        const a = item.querySelector('.site-page-shell > .site-page');
        const submenu = item.querySelector('.site-page-submenu');
        const submenuItems = submenu ? Array.from(submenu.querySelectorAll('.site-page-submenu__item')).map(sub => ({
          href: sub.getAttribute('href'),
          text: sub.textContent.trim()
        })) : [];

        return {
          text: a ? a.textContent.trim() : null,
          href: a ? a.getAttribute('href') : null,
          isDeadButton: a ? a.classList.contains('is-dead-button') : false,
          role: a ? a.getAttribute('role') : null,
          submenuItemsCount: submenuItems.length,
          submenuItems
        };
      });
    });

    console.log(`Found ${parentItems.length} parent items with children:`);
    for (const item of parentItems) {
      console.log(` - Label: "${item.text}", href: "${item.href}", isDeadButton: ${item.isDeadButton}, role: "${item.role}", children: ${item.submenuItemsCount}`);
    }

    if (expectedDisabled) {
      // 当开启死按钮模式时：所有 has-children 的父级按钮必须为死按钮（无有效链接或为 javascript:void(0)）且拥有 is-dead-button
      for (const item of parentItems) {
        if (item.href !== null && item.href !== 'javascript:void(0);') {
          throw new Error(`Expected dead button (null or javascript:void(0)) for parent item "${item.text}", but got "${item.href}"`);
        }
        if (!item.isDeadButton) {
          throw new Error(`Expected is-dead-button class for parent item "${item.text}"`);
        }
        if (item.role !== 'button') {
          throw new Error(`Expected role="button" for parent item "${item.text}"`);
        }
        // 下拉菜单项必须保留有效 URL
        if (item.submenuItemsCount === 0) {
          throw new Error(`Expected submenu items for parent item "${item.text}"`);
        }
        for (const sub of item.submenuItems) {
          if (!sub.href || sub.href.startsWith('javascript:')) {
            throw new Error(`Expected valid href for submenu item "${sub.text}", got "${sub.href}"`);
          }
        }
      }

      // 验证点击父级按钮不跳转（死button特性）
      const currentUrlBefore = page.url();
      await page.click('#menus .menus_item.has-children:first-child .site-page');
      await new Promise(r => setTimeout(r, 600));
      const currentUrlAfter = page.url();
      if (currentUrlAfter !== currentUrlBefore) {
        throw new Error(`Expected page NOT to navigate upon clicking dead parent button, but URL changed to "${currentUrlAfter}"`);
      }
      console.log(`[PASS] Clicked dead parent button, page remained on ${currentUrlAfter} (no navigation, dead button confirmed).`);

      // 验证鼠标悬停在父级按钮时展开下拉，且点击下拉子菜单项能正常跳转
      await page.hover('#menus .menus_item.has-children:first-child');
      await page.waitForSelector('#menus .menus_item.has-children:first-child .site-page-submenu__item:first-child', { visible: true });
      await page.click('#menus .menus_item.has-children:first-child .site-page-submenu__item:first-child');
      await page.waitForFunction(() => window.location.pathname.startsWith('/archives/'), { timeout: 10000 });
      console.log(`[PASS] Clicked child submenu button, successfully navigated to: ${await page.evaluate(() => window.location.href)}`);

    } else {
      // 默认情况（关闭死按钮）：保留真实 URL，点击能跳转
      for (const item of parentItems) {
        if (item.href === 'javascript:void(0);' || !item.href) {
          throw new Error(`Expected valid navigation href for parent item "${item.text}", but got "${item.href}"`);
        }
        if (item.isDeadButton) {
          throw new Error(`Did NOT expect is-dead-button class when switch is disabled for "${item.text}"`);
        }
      }
      console.log('[PASS] Default mode: All parent buttons have valid navigation URLs and are NOT dead buttons.');
      
      // 点击父级按钮可以正常跳转到其主页面
      await page.click('#menus .menus_item.has-children:first-child .site-page');
      await page.waitForFunction(() => window.location.pathname.startsWith('/archives/'), { timeout: 10000 });
      console.log(`[PASS] Clicked active parent button in default mode, successfully navigated to: ${await page.evaluate(() => window.location.href)}`);
    }

    if (consoleErrors.length > 0) {
      const realErrors = consoleErrors.filter(e => !e.text.includes('Failed to load resource') && !e.text.includes('404')); if (realErrors.length > 0) throw new Error(`Real console errors: ${JSON.stringify(realErrors)}`);
    }

    console.log(`>>> PASS: Verification succeeded for disableParentNav = ${expectedDisabled}! <<<\n`);
  } finally {
    await browser.close();
    server.close();
  }
}

const arg = process.argv[2];
const expectedDisabled = arg === 'true' || arg === 'dead';
verifyState(expectedDisabled).catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
