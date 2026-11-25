import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

// Read-only reproduction of the original public board's reload warning.
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const warnings = [];
  page.on('pageerror', error => {
    console.log(error.message);
    if (error.message.startsWith('Minified React error #418;')) warnings.push(error.message);
  });
  await page.addInitScript(() => localStorage.setItem('shijianus_guestbook_reads', '["pinned_welcome_official"]'));
  await page.route('**/*', route => {
    const request = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return route.abort();
    const url = new URL(request.url());
    if (url.pathname === '/api/gestures') {
      url.searchParams.set('trackView', '0');
      return route.continue({ url: url.href });
    }
    return route.continue();
  });
  await page.goto('https://blog.epocanvas.com/guestbook/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('.gb-boost-track').first().waitFor({ timeout: 45000 });
  await page.locator('.gb-cat-badge').first().waitFor({ timeout: 45000 });
  console.log('Production baseline hydration errors with an existing read marker:', warnings.length);
  assert.ok(warnings.length > 0);
} finally {
  await browser.close();
}
