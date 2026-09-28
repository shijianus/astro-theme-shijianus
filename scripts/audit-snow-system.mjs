import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop-wide' },
    { width: 1440, height: 900, name: 'desktop-standard' },
    { width: 390, height: 844, name: 'mobile' }
  ];

  const results = {
    viewports: {},
    consoleErrors: []
  };

  if (!fs.existsSync('scratch')) fs.mkdirSync('scratch');

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    
    page.on('pageerror', (err) => results.consoleErrors.push(`[${vp.name}] Page error: ${err.message}`));
    page.on('console', (msg) => { if (msg.type() === 'error') results.consoleErrors.push(`[${vp.name}] Console error: ${msg.text()}`); });

    console.log(`Auditing Homepage on ${vp.name}...`);
    await page.goto('https://blog.epocanvas.com/', { waitUntil: 'load', timeout: 60000 });
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-background', 'snow');
      window.dispatchEvent(new Event('theme-change'));
    });
    
    await page.waitForTimeout(4000); // Give time for snow engine to render

    // Scroll down to trigger lazy loading / IntersectionObservers
    await page.evaluate(async () => {
      const scrollHeight = document.body.scrollHeight;
      for (let i = 0; i < scrollHeight; i += 500) {
        window.scrollTo(0, i);
        await new Promise(r => setTimeout(r, 100));
      }
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);

    const footerData = await page.evaluate(() => {
      const footer = document.querySelector('#footer-bar');
      if (!footer) return null;
      const rect = footer.getBoundingClientRect();
      const snow = footer.querySelector('.card-snow-svg');
      let snowRect = null;
      if (snow) snowRect = snow.getBoundingClientRect();
      return {
        footerWidth: rect.width,
        footerLeft: rect.left,
        snowWidth: snowRect ? snowRect.width : null,
        snowLeft: snowRect ? snowRect.left : null,
        archetype: snow ? snow.getAttribute('data-snow-archetype') : null
      };
    });

    const cardData = await page.evaluate(() => {
      const selectors = ['.recent-post-item', '.category-bar', '.footer-main-shell', '.card-widget'];
      const data = [];
      document.querySelectorAll(selectors.join(',')).forEach(el => {
        const svg = el.querySelector('.card-snow-svg');
        const path = svg ? svg.querySelector('path.snow-body') : null;
        
        let pathD = path ? path.getAttribute('d') : null;
        let archetype = svg ? svg.getAttribute('data-snow-archetype') : null;
        
        data.push({
          className: el.className.split(' ')[0], // simplify for readability
          width: el.getBoundingClientRect().width,
          hasSvg: !!svg,
          archetype: archetype,
          pathD: pathD ? pathD.substring(0, 100) : null
        });
      });
      return data;
    });

    try {
      // Screenshot footer
      const footer = await page.$('#footer-bar');
      if (footer) {
        await footer.screenshot({ path: `scratch/audit-footer-${vp.name}.png` });
      }
      
      // Screenshot top cards area
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await page.screenshot({ path: `scratch/audit-home-top-${vp.name}.png`, clip: { x: 0, y: 0, width: vp.width, height: 800 } });
    } catch(e) { console.error('Screenshot failed', e); }

    results.viewports[vp.name] = { footerData, cardData };
    await context.close();
  }

  // Auditing post page
  const contextPost = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pagePost = await contextPost.newPage();
  console.log(`Auditing Post page...`);
  await pagePost.goto('https://blog.epocanvas.com/posts/markdown-syntax-mastery/', { waitUntil: 'load', timeout: 60000 });
  await pagePost.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-background', 'snow');
  });
  await pagePost.waitForTimeout(4000);
  
  await pagePost.evaluate(async () => {
    const scrollHeight = document.body.scrollHeight;
    for (let i = 0; i < scrollHeight; i += 500) {
      window.scrollTo(0, i);
      await new Promise(r => setTimeout(r, 100));
    }
  });

  const postData = await pagePost.evaluate(() => {
    const alerts = Array.from(document.querySelectorAll('.markdown-alert, .article-callout, .code-block-shell, figure.highlight, #post-comment'));
    return alerts.map(el => {
      const rect = el.getBoundingClientRect();
      const svg = el.querySelector('.card-snow-svg');
      return {
        className: el.className.split(' ')[0],
        hasSvg: !!svg,
        width: rect.width,
        height: rect.height,
        archetype: svg ? svg.getAttribute('data-snow-archetype') : null
      };
    });
  });

  try {
    const comment = await pagePost.$('#post-comment');
    if (comment) {
      await comment.screenshot({ path: `scratch/audit-comment-1440.png` });
    }
    const alert = await pagePost.$('.markdown-alert');
    if (alert) {
      await alert.screenshot({ path: `scratch/audit-alert-1440.png` });
    }
  } catch(e) {}
  
  results.postData = postData;
  await contextPost.close();
  await browser.close();
  
  fs.writeFileSync('scratch/audit-results2.json', JSON.stringify(results, null, 2));
  console.log('Audit complete.');
})();
