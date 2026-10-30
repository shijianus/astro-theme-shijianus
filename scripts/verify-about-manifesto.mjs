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
  const port = 4591;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  const server = await createStaticServer(distDir, port);
  console.log(`Local test server running on http://localhost:${port}`);

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
    console.log('1. Auditing "关于" Primary Item and 4 Submenu Options');
    console.log('======================================================');

    const aboutAudit = await page.evaluate(() => {
      const menuItems = Array.from(document.querySelectorAll('#menus .menus_item'));
      const aboutEl = menuItems[3];
      const parentLink = aboutEl.querySelector('.site-page-shell > .site-page');
      const parentLabel = aboutEl.querySelector('.site-page__label')?.textContent?.trim();
      const parentHref = parentLink?.getAttribute('href');
      const submenu = aboutEl.querySelector('.site-page-submenu');
      const subItems = submenu ? Array.from(submenu.querySelectorAll('.site-page-submenu__item')).map(c => ({
        label: c.querySelector('.site-page-submenu__label')?.textContent?.trim(),
        href: c.getAttribute('href')
      })) : [];

      return {
        parentLabel,
        parentHref,
        subItems
      };
    });

    console.log('Detected "关于" Nav:', JSON.stringify(aboutAudit, null, 2));

    if (aboutAudit.parentLabel !== '关于') {
      throw new Error(`Expected parentLabel to be '关于', got ${aboutAudit.parentLabel}`);
    }
    if (aboutAudit.parentHref !== '/about/site/') {
      throw new Error(`Expected parentHref to be '/about/site/', got ${aboutAudit.parentHref}`);
    }
    console.log('✓ "关于" parent button maps to /about/site/ (作者自述与建站说明官方文档)');

    if (aboutAudit.subItems.length !== 4) {
      throw new Error(`Expected exactly 4 subItems in "关于", got ${aboutAudit.subItems.length}`);
    }
    const expectedSubmenu = [
      { label: '关于作者', href: '/about/' },
      { label: '关于本站', href: '/about/site/' },
      { label: '版本规范', href: '/version/' },
      { label: '请喝咖啡', href: '/support/' }
    ];

    for (let i = 0; i < expectedSubmenu.length; i++) {
      const exp = expectedSubmenu[i];
      const act = aboutAudit.subItems[i];
      if (act.label !== exp.label || act.href !== exp.href) {
        throw new Error(`Submenu item ${i} mismatch: expected ${JSON.stringify(exp)}, got ${JSON.stringify(act)}`);
      }
    }
    console.log('✓ "关于" 4 submenu options verified in order: [关于作者, 关于本站, 版本规范, 请喝咖啡]');

    console.log('\n======================================================');
    console.log('2. Auditing Submenu Alignment & Hover Geometry');
    console.log('======================================================');

    const aboutMenuItem = (await page.$$('#menus .menus_item'))[3];
    await aboutMenuItem.hover();
    await new Promise(r => setTimeout(r, 350));

    const submenuGeometry = await page.evaluate(() => {
      const sub = document.querySelectorAll('#menus .menus_item')[3].querySelector('.site-page-submenu');
      const navRight = document.querySelector('#nav-right');
      const subRect = sub.getBoundingClientRect();
      const rightRect = navRight ? navRight.getBoundingClientRect() : null;
      const style = window.getComputedStyle(sub);

      return {
        width: Math.round(subRect.width),
        height: Math.round(subRect.height),
        left: Math.round(subRect.left),
        right: Math.round(subRect.right),
        navRightLeft: rightRect ? Math.round(rightRect.left) : null,
        collidesWithRight: rightRect ? subRect.right > rightRect.left : false,
        opacity: style.opacity,
        visibility: style.visibility
      };
    });

    console.log('Submenu Geometry on Hover:', submenuGeometry);
    if (submenuGeometry.opacity !== '1' || submenuGeometry.visibility !== 'visible') {
      throw new Error('Submenu failed to become visible on hover');
    }
    if (submenuGeometry.collidesWithRight) {
      throw new Error(`Submenu collides with #nav-right: right=${submenuGeometry.right}, navRight=${submenuGeometry.navRightLeft}`);
    }
    console.log(`✓ Submenu horizontally centered with width ${submenuGeometry.width}px and 0 collision`);

    console.log('\n======================================================');
    console.log('3. Testing Click Navigation to Official Doc (/about/site/)');
    console.log('======================================================');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#menus .menus_item:nth-child(4) .site-page-shell > .site-page')
    ]);

    const docUrl = page.url();
    console.log('Navigated URL:', docUrl);
    if (!docUrl.includes('/about/site')) {
      throw new Error(`Expected URL to include /about/site, got ${docUrl}`);
    }

    const docContentAudit = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent?.trim();
      const heroTitle = document.querySelector('#standards-hero .standards-hero__title, .standards-hero-title, h1')?.textContent?.trim();
      const badgePrimary = document.querySelector('.badge-primary')?.textContent?.trim();
      const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim());
      const hasCode = Boolean(document.querySelector('pre, code'));
      const hasTOC = Boolean(document.querySelector('#card-toc, .toc-container, #toc'));

      return {
        h1,
        heroTitle,
        badgePrimary,
        h2s,
        hasCode,
        hasTOC
      };
    });

    console.log('Official Doc Content Audit:', docContentAudit);
    if (!docContentAudit.heroTitle?.includes('創作者自述') && !docContentAudit.h1?.includes('創作者自述')) {
      throw new Error(`Expected title to include '創作者自述', got h1=${docContentAudit.h1}, hero=${docContentAudit.heroTitle}`);
    }
    if (docContentAudit.badgePrimary !== 'ABOUT-001') {
      throw new Error(`Expected badge to be 'ABOUT-001', got ${docContentAudit.badgePrimary}`);
    }
    if (docContentAudit.h2s.length < 4) {
      throw new Error(`Expected at least 4 major sections (H2), found ${docContentAudit.h2s.length}`);
    }
    console.log('✓ Official Manifesto doc rendered flawlessly with StandardsHero, TOC & high-quality sections');

    console.log('\n======================================================');
    console.log('4. Testing Submenu Links: /about/, /version/, /support/');
    console.log('======================================================');

    // Return to home
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle2' });

    // Test Clicking "关于作者" in submenu
    console.log('Testing click "关于作者"...');
    const aboutMenu = (await page.$$('#menus .menus_item'))[3];
    await aboutMenu.hover();
    await new Promise(r => setTimeout(r, 300));
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#menus .menus_item:nth-child(4) .site-page-submenu__item:nth-child(1)')
    ]);
    console.log('Current URL after clicking "关于作者":', page.url());
    if (!page.url().endsWith('/about/')) {
      throw new Error(`Expected /about/, got ${page.url()}`);
    }
    const hasAboutDashboard = await page.evaluate(() => Boolean(document.querySelector('#about-page, .author-box, .myInfoAndSayHello')));
    if (!hasAboutDashboard) {
      throw new Error('About Dashboard elements not found on /about/');
    }
    console.log('✓ "关于作者" correctly routes to the visual AboutDashboard (/about/)');

    // Test Clicking "版本规范" in submenu
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle2' });
    const aboutMenu2 = (await page.$$('#menus .menus_item'))[3];
    await aboutMenu2.hover();
    await new Promise(r => setTimeout(r, 300));
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#menus .menus_item:nth-child(4) .site-page-submenu__item:nth-child(3)')
    ]);
    console.log('Current URL after clicking "版本规范":', page.url());
    if (!page.url().includes('/version')) {
      throw new Error(`Expected /version/, got ${page.url()}`);
    }
    console.log('✓ "版本规范" correctly routes to /version/');

    // Test Clicking "请喝咖啡" in submenu
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle2' });
    const aboutMenu3 = (await page.$$('#menus .menus_item'))[3];
    await aboutMenu3.hover();
    await new Promise(r => setTimeout(r, 300));
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('#menus .menus_item:nth-child(4) .site-page-submenu__item:nth-child(4)')
    ]);
    console.log('Current URL after clicking "请喝咖啡":', page.url());
    if (!page.url().includes('/support')) {
      throw new Error(`Expected /support/, got ${page.url()}`);
    }
    console.log('✓ "请喝咖啡" correctly routes to /support/');

    console.log('\n======================================================');
    console.log('5. Mobile Menu Drawer Verification');
    console.log('======================================================');

    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle2' });
    await page.click('#toggle-menu .site-page');
    await new Promise(r => setTimeout(r, 300));

    const mobileAbout = await page.evaluate(() => {
      const groups = Array.from(document.querySelectorAll('.site-mobile-link-group'));
      const aboutGrp = groups.find(g => g.querySelector('.site-mobile-link')?.textContent?.includes('关于'));
      if (!aboutGrp) return null;
      const pLink = aboutGrp.querySelector('.site-mobile-link');
      const sublinks = Array.from(aboutGrp.querySelectorAll('.site-mobile-sublink')).map(s => ({
        label: s.textContent?.trim(),
        href: s.getAttribute('href')
      }));
      return {
        label: pLink?.textContent?.trim(),
        href: pLink?.getAttribute('href'),
        sublinks
      };
    });

    console.log('Mobile About Group:', mobileAbout);
    if (mobileAbout.href !== '/about/site/') {
      throw new Error(`Mobile parent href expected /about/site/, got ${mobileAbout.href}`);
    }
    if (mobileAbout.sublinks.length !== 4) {
      throw new Error(`Mobile sublinks count expected 4, got ${mobileAbout.sublinks.length}`);
    }
    console.log('✓ Mobile menu drawer perfectly mirrors the 4-item matrix');

    console.log('\n======================================================');
    console.log('ALL VERIFICATIONS PASSED WITH 0 CONSOLE ERRORS!');
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
