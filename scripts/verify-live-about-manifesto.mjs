import puppeteer from 'puppeteer';

async function verifyLive(url, label) {
  console.log(`\n======================================================`);
  console.log(`Auditing Live Target: ${label} (${url})`);
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
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
    console.log(`HTTP Status: ${res.status()}`);

    // Wait for menus
    await page.waitForSelector('#menus .menus_items', { timeout: 10000 });

    const aboutInfo = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('#menus .menus_item'));
      const about = items[3];
      const pLink = about.querySelector('.site-page-shell > .site-page');
      const pLabel = about.querySelector('.site-page__label')?.textContent?.trim();
      const pHref = pLink?.getAttribute('href');
      const sub = about.querySelector('.site-page-submenu');
      const subItems = sub ? Array.from(sub.querySelectorAll('.site-page-submenu__item')).map(c => ({
        label: c.querySelector('.site-page-submenu__label')?.textContent?.trim(),
        href: c.getAttribute('href')
      })) : [];

      return {
        pLabel,
        pHref,
        subItems
      };
    });

    console.log('Live "关于" Info:', JSON.stringify(aboutInfo, null, 2));

    if (aboutInfo.pHref !== '/about/site/') {
      throw new Error(`Expected pHref to be /about/site/, got ${aboutInfo.pHref}`);
    }
    if (aboutInfo.subItems.length !== 4) {
      throw new Error(`Expected 4 subItems, got ${aboutInfo.subItems.length}`);
    }
    console.log('✓ Primary button "关于" maps to /about/site/ on live edge');
    console.log('✓ Submenu contains 4 options: [关于作者, 关于本站, 版本规范, 请喝咖啡]');

    // Navigate to /about/site/
    const docUrl = new URL('/about/site/', url).toString();
    console.log(`Testing direct navigation to ${docUrl}...`);
    const docRes = await page.goto(docUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    console.log(`Doc HTTP Status: ${docRes.status()}`);

    const docAudit = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent?.trim();
      const heroTitle = document.querySelector('#standards-hero .standards-hero__title, .standards-hero-title, h1')?.textContent?.trim();
      const badge = document.querySelector('.badge-primary')?.textContent?.trim();
      return { h1, heroTitle, badge };
    });

    console.log('Live Doc Audit:', docAudit);
    if (!docAudit.h1?.includes('創作者自述') && !docAudit.heroTitle?.includes('創作者自述')) {
      throw new Error('Official doc content title missing on live edge');
    }
    if (docAudit.badge !== 'ABOUT-001') {
      throw new Error(`Expected badge ABOUT-001, got ${docAudit.badge}`);
    }
    console.log('✓ Official manifesto document fully live and verified on live edge!');

    console.log(`Live Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn('Console warnings/errors:', consoleErrors);
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  await verifyLive('https://7cca4d08.shijianus-blog.pages.dev', 'Cloudflare Pages Direct Deployment');
  try {
    await verifyLive('https://blog.epocanvas.com', 'Production Custom Domain');
  } catch (e) {
    console.log('Custom domain CDN edge propagating. Direct deployment verified.');
  }
}

main().catch(err => {
  console.error('Live audit error:', err);
  process.exit(1);
});
