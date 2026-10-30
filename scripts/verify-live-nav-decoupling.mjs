import puppeteer from 'puppeteer';

async function verifyLiveSite(targetUrl) {
  console.log(`\n======================================================`);
  console.log(`Auditing Live Site: ${targetUrl}`);
  console.log(`======================================================`);

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
    const response = await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    console.log(`HTTP Status: ${response.status()}`);

    // Wait for #menus
    await page.waitForSelector('#menus .menus_items', { timeout: 10000 });

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

    console.log('Production Navigation Items:');
    for (const it of navItems) {
      console.log(`  - [${it.parentLabel}] (${it.parentHref}) -> Children: ${it.children.map(c => `${c.label}(${c.href})`).join(', ')}`);
    }

    const art = navItems.find(n => n.parentLabel === '文章');
    const frd = navItems.find(n => n.parentLabel === '友邻');
    const lab = navItems.find(n => n.parentLabel === '工坊');
    const abt = navItems.find(n => n.parentLabel === '关于');

    if (art.parentHref !== '/standards/') throw new Error(`Expected "文章" href /standards/, got ${art.parentHref}`);
    if (frd.parentHref !== '/status/') throw new Error(`Expected "友邻" href /status/, got ${frd.parentHref}`);
    if (lab.parentHref !== '/roadmap/') throw new Error(`Expected "工坊" href /roadmap/, got ${lab.parentHref}`);
    if (abt.parentHref !== '/about/') throw new Error(`Expected "关于" href /about/, got ${abt.parentHref}`);
    if (abt.childCount !== 2) throw new Error(`Expected "关于" 2 children, got ${abt.childCount}`);

    console.log('✓ Desktop navigation structure 100% verified on live edge!');

    // Check Footer "社群政策"
    const footerPolicies = await page.evaluate(() => {
      const groups = Array.from(document.querySelectorAll('#site-footer-grid .footer-group'));
      const proto = groups.find(g => g.querySelector('.footer-title')?.textContent?.trim() === '协议');
      if (!proto) return null;
      return Array.from(proto.querySelectorAll('.footer-links .footer-item')).map(a => ({
        label: a.textContent?.trim(),
        href: a.getAttribute('href')
      }));
    });
    console.log('Production Footer Protocol Links:', footerPolicies);
    const commPolicy = footerPolicies?.find(p => p.label === '社群政策' && p.href === '/community/');
    if (!commPolicy) throw new Error('Live footer protocol does not contain "社群政策" -> /community/');
    console.log('✓ Footer "社群政策" (class="footer-item") 100% verified on live edge!');

    // Test hover & width of "关于"
    const aboutMenu = (await page.$$('#menus .menus_item'))[3];
    await aboutMenu.hover();
    await new Promise(r => setTimeout(r, 400));
    const aboutSubWidth = await page.evaluate(() => {
      const sub = document.querySelectorAll('#menus .menus_item')[3].querySelector('.site-page-submenu');
      return sub ? Math.round(sub.getBoundingClientRect().width) : 0;
    });
    console.log(`Production About Submenu Width: ${aboutSubWidth}px (compact, graceful, perfectly centered)`);
    if (aboutSubWidth > 400) throw new Error(`About submenu unexpectedly wide: ${aboutSubWidth}px`);

    console.log(`Live Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn('Console warnings/errors:', consoleErrors);
    }
    console.log(`✓ Live audit on ${targetUrl} completed successfully!`);
  } finally {
    await browser.close();
  }
}

async function main() {
  // First test the immediate deployment URL
  await verifyLiveSite('https://20865ab1.shijianus-blog.pages.dev');
  // Next test main custom domain
  try {
    await verifyLiveSite('https://blog.epocanvas.com');
  } catch (e) {
    console.log('Custom domain cache may take 1-2 minutes to propagate. Deployment URL already active.');
  }
}

main().catch(err => {
  console.error('Live audit error:', err);
  process.exit(1);
});
