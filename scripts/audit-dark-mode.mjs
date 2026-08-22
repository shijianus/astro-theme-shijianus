import { chromium } from 'playwright';

const routes = [
  { name: 'home-dark', path: '/' },
  { name: 'post-dark', path: '/posts/content-first-homepage/' },
  { name: 'archives-dark', path: '/archives/' },
  { name: 'categories-dark', path: '/categories/' },
  { name: 'friends-dark', path: '/friends/' }
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  for (const route of routes) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`http://localhost:4321${route.path}`, { waitUntil: 'networkidle' });
    
    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    });

    await page.waitForFunction(() => {
      const box = document.getElementById('loading-box');
      return !box || box.classList.contains('loaded') || window.getComputedStyle(box).opacity === '0' || window.getComputedStyle(box).display === 'none';
    }, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);

    await page.screenshot({ path: `scripts/audit_screenshots/${route.name}.png`, fullPage: false });
    await page.close();
  }
  await browser.close();
  console.log('Dark mode audit complete.');
}

run().catch(console.error);
