import { chromium } from 'playwright';

async function verifyLive() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to live production: https://blog.epocanvas.com/posts/markdown-syntax-mastery/ ...');
  await page.goto('https://blog.epocanvas.com/posts/markdown-syntax-mastery/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  const profileCard = await page.evaluate(() => {
    const el = document.querySelector('.card-widget.card-info.profile-card');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      exists: true,
      overflow: style.overflow,
      borderRadius: style.borderRadius,
      contain: style.contain,
      isolation: style.isolation,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      hasSnowInside: !!el.querySelector('.snow-mantle')
    };
  });

  console.log('Live Profile Card Audit:', JSON.stringify(profileCard, null, 2));

  const profileEl = await page.$('.card-widget.card-info.profile-card');
  if (profileEl) {
    await profileEl.screenshot({ path: 'scripts/live_profile_card.png' });
    console.log('Saved scripts/live_profile_card.png');
  }

  console.log('Navigating to live home page: https://blog.epocanvas.com/ ...');
  await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  const homeCards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('#random-banner, .todayCard, .categoryItem, .recent-post-item'));
    return {
      count: cards.length,
      withSnow: cards.filter(c => c.querySelector('.snow-mantle')).length
    };
  });
  console.log('Live Home Cards Audit:', JSON.stringify(homeCards, null, 2));

  const fatalErrors = errors.filter(e => !e.includes('favicon') && !e.includes('analytics') && !e.includes('advertisement'));
  console.log('Fatal JS Errors on live:', fatalErrors);

  await browser.close();
  console.log('✅ Live Production Verification Complete!');
}

verifyLive().catch(err => {
  console.error('Live verification failed:', err);
  process.exit(1);
});
