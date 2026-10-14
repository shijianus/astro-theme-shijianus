import puppeteer from 'puppeteer';

async function verifyLive() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const urlsToTest = [
    'https://dd6ff327.shijianus-blog.pages.dev/',
    'https://blog.epocanvas.com/'
  ];

  for (const url of urlsToTest) {
    console.log(`\n======================================================`);
    console.log(` Testing live URL: ${url}`);
    console.log(`======================================================`);

    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    try {
      await page.setViewport({ width: 1280, height: 800 });
      console.log('Navigating to', url);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });

      // Hover About item (index 3)
      const menuItems = await page.$$('#menus .menus_item');
      if (menuItems.length < 4) throw new Error('Expected at least 4 menu items');

      await menuItems[3].hover();
      await new Promise(r => setTimeout(r, 600));

      const liveAudit = await page.evaluate(() => {
        const item = document.querySelectorAll('#menus .menus_item')[3];
        const sub = item.querySelector('.site-page-submenu');
        const subRect = sub.getBoundingClientRect();
        const subStyle = window.getComputedStyle(sub);
        const navRight = document.querySelector('#nav-right')?.getBoundingClientRect();

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
            gap: (iconRect && labelRect) ? Math.round(labelRect.left - iconRect.right) : null,
            isOverlapping: (iconRect && labelRect) ? !(labelRect.left >= iconRect.right || labelRect.right <= iconRect.left) : false,
            isSvgCoffee
          };
        });

        return {
          subWidth: Math.round(subRect.width),
          subHeight: Math.round(subRect.height),
          subRight: Math.round(subRect.right),
          navRightLeft: navRight ? Math.round(navRight.left) : null,
          collisionWithNavRight: navRight ? (subRect.right > navRight.left) : false,
          gapToNavRight: navRight ? Math.round(navRight.left - subRect.right) : null,
          borderRadius: subStyle.borderRadius,
          children
        };
      });

      console.log(`[${url}] Live Audit Result:`, {
        subWidth: liveAudit.subWidth,
        subRight: liveAudit.subRight,
        navRightLeft: liveAudit.navRightLeft,
        collisionWithNavRight: liveAudit.collisionWithNavRight,
        gapToNavRight: liveAudit.gapToNavRight,
        childrenCount: liveAudit.children.length
      });

      console.log(`[${url}] Children details:`, liveAudit.children);

      // Check collision
      if (liveAudit.collisionWithNavRight) {
        console.warn(`[${url}] Warning: Collided with navRight!`);
      } else {
        console.log(`[${url}] Anti-collision PASSED! Gap to navRight: ${liveAudit.gapToNavRight}px`);
      }

      // Check children text & icon overlap
      const hasOverlaps = liveAudit.children.some(c => c.isOverlapping);
      console.log(`[${url}] Children icon/text overlap detected: ${hasOverlaps}`);

      // Take a live screenshot for visual evidence
      const screenshotPath = url.includes('dd6ff327') 
        ? 'scripts/live_deployment_submenu.png' 
        : 'scripts/live_prod_submenu.png';
      await page.screenshot({ path: screenshotPath, clip: { x: 0, y: 0, width: 1280, height: 200 } });
      console.log(`[${url}] Saved screenshot to ${screenshotPath}`);

    } catch (err) {
      console.error(`Error auditing ${url}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
}

verifyLive().catch(console.error);
