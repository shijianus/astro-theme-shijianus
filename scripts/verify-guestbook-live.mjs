import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

// Read-only smoke test of whichever version is currently published.
const board = 'https://blog.epocanvas.com/guestbook/';
const id = 'pinned_welcome_official';
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await context.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return route.abort();
    if (url.pathname === '/api/gestures') {
      url.searchParams.set('trackView', '0');
      return route.continue({ url: url.href });
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);
  await page.goto(board, { waitUntil: 'commit', timeout: 60000 });
  const rows = page.locator('.gb-gesture-row');
  await expect(rows.first()).toBeVisible({ timeout: 45000 });
  await expect(page.locator('.gb-nav-bar')).toContainText('书签');
  console.log('Public board', await page.title(), 'visible topics', await rows.count());
  const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/gestures' && r.ok());
  await page.goto(board + '#gesture-' + id, { waitUntil: 'commit' });
  const detail = await (await response).json();
  assert.equal(detail.gesture?.id, id);
  await expect(page.getByRole('heading', {name: detail.gesture.title, exact:true})).toBeVisible();
  const body = page.locator('#floor-1 .gd-floor-markdown');
  await expect(body).toContainText(detail.gesture.message.slice(0, 14));
  console.log('Public detail', detail.gesture.title, 'returned replies', detail.subGestures.length,
    'rendered floor elements', await page.locator('[data-floor-index], .gb-floor-target').count());
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(body).toBeVisible();
  console.log('Public markup', (await page.locator('.gd-tl-rail').count()) ? 'reading rail' : 'earlier layout');
  await page.goto(board, { waitUntil: 'commit' });
  await expect(rows.first()).toBeVisible({ timeout: 45000 });
} finally {
  await browser.close();
}
