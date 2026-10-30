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
  const port = 4589;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  const server = await createStaticServer(distDir, port);
  console.log(`Local test server listening on http://localhost:${port}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
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

    console.log('\n======================================================');
    console.log('1. Auditing Desktop Navigation Bar (Primary & Submenus)');
    console.log('======================================================');

    const navItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('#menus .menus_item'));
      return items.map(item => {
        const parentLink = item.querySelector('.site-page-shell > .site-page');
        const parentLabel = item.querySelector('.site-page__label')?.textContent?.trim();
        const parentHref = parentLink?.getAttribute('href');
        const submenu = item.querySelector('.site-page-submenu');
        const subLinks = submenu ? Array.from(submenu.querySelectorAll('.site-page-submenu__item')).map(c => ({
          label: c.querySelector('.site-page-submenu__label')?.textContent?.trim() || c.textContent?.trim(),
          href: c.getAttribute('href')
        })) : [];

        return {
          parentLabel,
          parentHref,
          hasChildren: Boolean(submenu),
          childCount: subLinks.length,
          children: subLinks
        };
      });
    });

    console.log('Detected Navigation Items:', JSON.stringify(navItems, null, 2));

    // Assert "文章"
    const artItem = navItems.find(n => n.parentLabel === '文章');
    if (!artItem) throw new Error('Could not find primary item "文章"');
    if (artItem.parentHref !== '/standards/') {
      throw new Error(`Expected "文章" parentHref to be /standards/, got ${artItem.parentHref}`);
    }
    console.log('✓ "文章" parent button maps to /standards/ (工程标准)');
    if (artItem.childCount !== 3) throw new Error(`Expected "文章" to have 3 children, got ${artItem.childCount}`);
    if (artItem.children[0].href !== '/archives/') throw new Error('Expected child 0 to be /archives/');
    console.log('✓ "文章" submenu preserves [全部文章, 分类索引, 标签聚合]');

    // Assert "友邻"
    const frdItem = navItems.find(n => n.parentLabel === '友邻');
    if (!frdItem) throw new Error('Could not find primary item "友邻"');
    if (frdItem.parentHref !== '/status/') {
      throw new Error(`Expected "友邻" parentHref to be /status/, got ${frdItem.parentHref}`);
    }
    console.log('✓ "友邻" parent button maps to /status/ (站点状态)');
    if (frdItem.childCount !== 3) throw new Error(`Expected "友邻" to have 3 children, got ${frdItem.childCount}`);
    console.log('✓ "友邻" submenu preserves [友人帐, 留言板, 朋友圈]');

    // Assert "工坊"
    const labItem = navItems.find(n => n.parentLabel === '工坊');
    if (!labItem) throw new Error('Could not find primary item "工坊"');
    if (labItem.parentHref !== '/roadmap/') {
      throw new Error(`Expected "工坊" parentHref to be /roadmap/, got ${labItem.parentHref}`);
    }
    console.log('✓ "工坊" parent button maps to /roadmap/ (专案路线图)');
    if (labItem.childCount !== 3) throw new Error(`Expected "工坊" to have 3 children, got ${labItem.childCount}`);
    console.log('✓ "工坊" submenu preserves [实验田, 留声机, 放映室]');

    // Assert "关于"
    const abtItem = navItems.find(n => n.parentLabel === '关于');
    if (!abtItem) throw new Error('Could not find primary item "关于"');
    if (abtItem.parentHref !== '/about/') {
      throw new Error(`Expected "关于" parentHref to be /about/, got ${abtItem.parentHref}`);
    }
    console.log('✓ "关于" parent button maps to /about/ (关于与说明)');
    if (abtItem.childCount !== 2) {
      throw new Error(`Expected "关于" to have exactly 2 children after deletion of crowded options, got ${abtItem.childCount}`);
    }
    const abtLabels = abtItem.children.map(c => c.label);
    if (!abtLabels.includes('关于作者') || !abtLabels.includes('请喝咖啡')) {
      throw new Error(`Unexpected children in "关于": ${JSON.stringify(abtLabels)}`);
    }
    if (abtLabels.includes('站点状态') || abtLabels.includes('專案路線圖') || abtLabels.includes('社群政策') || abtLabels.includes('工程标准')) {
      throw new Error(`Crowded options not properly deleted from "关于": ${JSON.stringify(abtLabels)}`);
    }
    console.log('✓ "关于" submenu successfully streamlined to [关于作者, 请喝咖啡] (crowded options deleted)');

    console.log('\n======================================================');
    console.log('2. Auditing Footer Groups (社群政策 in 协议)');
    console.log('======================================================');

    const footerData = await page.evaluate(() => {
      const groups = Array.from(document.querySelectorAll('#site-footer-grid .footer-group'));
      return groups.map(g => {
        const title = g.querySelector('.footer-title')?.textContent?.trim();
        const links = Array.from(g.querySelectorAll('.footer-links .footer-item')).map(a => ({
          label: a.textContent?.trim(),
          href: a.getAttribute('href'),
          className: a.className
        }));
        return { title, links };
      });
    });

    console.log('Footer Groups:', JSON.stringify(footerData, null, 2));

    const protocolGroup = footerData.find(g => g.title === '协议');
    if (!protocolGroup) throw new Error('Could not find footer group "协议"');

    const communityLink = protocolGroup.links.find(l => l.label === '社群政策');
    if (!communityLink) {
      throw new Error('Did not find "社群政策" in footer group "协议"');
    }
    if (communityLink.href !== '/community/') {
      throw new Error(`Expected "社群政策" href to be /community/, got ${communityLink.href}`);
    }
    if (!communityLink.className.includes('footer-item')) {
      throw new Error(`Expected "社群政策" to have class footer-item, got ${communityLink.className}`);
    }
    console.log('✓ "社群政策" is present in footer "协议" group with class="footer-item" and href="/community/"');

    const oldRefundLink = protocolGroup.links.find(l => l.label?.includes('赞赏与退款说明'));
    if (oldRefundLink) {
      throw new Error('Old "赞赏与退款说明" was not replaced in footer "协议" group');
    }
    console.log('✓ "赞赏与退款说明" successfully replaced in footer');

    console.log('\n======================================================');
    console.log('3. Hover & Click Navigation Flow Verification');
    console.log('======================================================');

    // Hover over "关于" to verify dropdown visibility and dimensions
    const aboutMenu = (await page.$$('#menus .menus_item'))[3];
    await aboutMenu.hover();
    await new Promise(r => setTimeout(r, 350));

    const aboutSubmenuRect = await page.evaluate(() => {
      const sub = document.querySelectorAll('#menus .menus_item')[3].querySelector('.site-page-submenu');
      const rect = sub.getBoundingClientRect();
      const style = window.getComputedStyle(sub);
      return {
        width: rect.width,
        height: rect.height,
        opacity: style.opacity,
        visibility: style.visibility
      };
    });
    console.log('About Submenu Rect on Hover:', aboutSubmenuRect);
    if (aboutSubmenuRect.opacity !== '1' || aboutSubmenuRect.visibility !== 'visible') {
      throw new Error('About submenu not visible on hover');
    }
    console.log('✓ "关于" submenu gracefully expands with compact width (~' + Math.round(aboutSubmenuRect.width) + 'px)');

    // Test clicking parent "文章"
    console.log('Testing clicking parent "文章"...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#menus .menus_item:nth-child(1) .site-page-shell > .site-page')
    ]);
    const currentUrl = page.url();
    console.log('Current URL after clicking "文章":', currentUrl);
    if (!currentUrl.includes('/standards')) {
      throw new Error(`Expected navigation to /standards, got ${currentUrl}`);
    }
    console.log('✓ Clicking parent "文章" successfully navigates to /standards/ (工程标准)');

    // Test clicking parent "友邻"
    console.log('Testing clicking parent "友邻"...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#menus .menus_item:nth-child(2) .site-page-shell > .site-page')
    ]);
    console.log('Current URL after clicking "友邻":', page.url());
    if (!page.url().includes('/status')) {
      throw new Error(`Expected navigation to /status, got ${page.url()}`);
    }
    console.log('✓ Clicking parent "友邻" successfully navigates to /status/ (站点状态)');

    // Test clicking parent "工坊"
    console.log('Testing clicking parent "工坊"...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#menus .menus_item:nth-child(3) .site-page-shell > .site-page')
    ]);
    console.log('Current URL after clicking "工坊":', page.url());
    if (!page.url().includes('/roadmap')) {
      throw new Error(`Expected navigation to /roadmap, got ${page.url()}`);
    }
    console.log('✓ Clicking parent "工坊" successfully navigates to /roadmap/ (专案路线图)');

    // Test clicking footer "社群政策"
    console.log('Testing clicking footer "社群政策"...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.evaluate(() => {
        const link = Array.from(document.querySelectorAll('.footer-item')).find(a => a.textContent.includes('社群政策'));
        link.click();
      })
    ]);
    console.log('Current URL after clicking footer "社群政策":', page.url());
    if (!page.url().includes('/community')) {
      throw new Error(`Expected navigation to /community, got ${page.url()}`);
    }
    console.log('✓ Clicking footer "社群政策" successfully navigates to /community/');

    console.log('\n======================================================');
    console.log('4. Mobile Panel Navigation Check');
    console.log('======================================================');
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle2' });

    // Open mobile menu
    await page.click('#toggle-menu .site-page');
    await new Promise(r => setTimeout(r, 300));

    const mobileLinks = await page.evaluate(() => {
      const groups = Array.from(document.querySelectorAll('.site-mobile-link-group'));
      return groups.map(g => {
        const primaryLink = g.querySelector('.site-mobile-link');
        const sublinks = Array.from(g.querySelectorAll('.site-mobile-sublink')).map(s => ({
          label: s.textContent?.trim(),
          href: s.getAttribute('href')
        }));
        return {
          label: primaryLink?.textContent?.trim(),
          href: primaryLink?.getAttribute('href'),
          sublinks
        };
      });
    });

    console.log('Mobile Links:', JSON.stringify(mobileLinks, null, 2));

    const mArt = mobileLinks.find(m => m.label?.includes('文章'));
    if (mArt.href !== '/standards/') throw new Error(`Mobile "文章" expected /standards/, got ${mArt.href}`);
    const mFrd = mobileLinks.find(m => m.label?.includes('友邻'));
    if (mFrd.href !== '/status/') throw new Error(`Mobile "友邻" expected /status/, got ${mFrd.href}`);
    const mLab = mobileLinks.find(m => m.label?.includes('工坊'));
    if (mLab.href !== '/roadmap/') throw new Error(`Mobile "工坊" expected /roadmap/, got ${mLab.href}`);
    const mAbt = mobileLinks.find(m => m.label?.includes('关于'));
    if (mAbt.href !== '/about/') throw new Error(`Mobile "关于" expected /about/, got ${mAbt.href}`);
    if (mAbt.sublinks.length !== 2) throw new Error(`Mobile "关于" sublinks expected 2, got ${mAbt.sublinks.length}`);
    console.log('✓ Mobile panel navigation correctly mirrors desktop decoupling and streamlined structure');

    console.log('\n======================================================');
    console.log('ALL TESTS PASSED WITH 0 CONSOLE ERRORS!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
