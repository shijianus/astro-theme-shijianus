import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';

// Run only against an explicitly selected deployment. No posts, votes or views are written.
assert.ok(process.env.GESTURE_BASE_URL, 'Set GESTURE_BASE_URL to the deployment under review');
const base = new URL(process.env.GESTURE_BASE_URL).origin;
const id = process.env.GESTURE_ID || 'pinned_welcome_official';
const output = resolve(process.env.GESTURE_SHOTS || '/tmp/gesture-deployed-review');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const result = { base, id, viewports: [], screenshots: [], interactions: [], pageErrors: [], assetFailures: [], blockedWrites: [] };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('shijianus-theme', 'dark'));
  await context.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      result.blockedWrites.push({ path: url.pathname, method: request.method() });
      return route.abort();
    }
    if (url.origin === base && url.pathname === '/api/gestures') {
      url.searchParams.set('trackView', '0');
      return route.continue({ url: url.href });
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => result.pageErrors.push(error.message));
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin === base && response.status() >= 400 && /\.(js|css|woff2?)(?:$|\?)/.test(url.pathname)) {
      result.assetFailures.push({ path: url.pathname, status: response.status() });
    }
  });
  const board = base + '/guestbook/';
  await page.goto(board, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(page.locator('.gb-gesture-row').first()).toBeVisible({ timeout: 45000 });
  await expect(page.locator('.gb-boost-track')).toHaveCount(3);
  result.publicBoostRows = await page.locator('.gb-boost-track').evaluateAll(rows => rows.map(row => row.querySelectorAll('.gb-boost-pill-card').length));
  result.visibleTopics = await page.locator('.gb-gesture-row').count();
  const responsePromise = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.pathname === '/api/gestures' && url.searchParams.get('id') === id;
  });
  await page.goto(board + '#gesture-' + id, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const response = await responsePromise;
  assert.equal(response.status(), 200);
  assert.match(response.headers()['content-type'], /application\/json/);
  const data = await response.json();
  assert.equal(data.gesture?.id, id);
  result.topic = { title: data.gesture.title, replies: data.subGestures.length, views: data.topicMap.viewsCount, links: data.relatedLinks.length };
  const op = page.locator('#floor-1');
  await expect(op.locator('.gd-floor-markdown')).toBeVisible({ timeout: 45000 });
  await expect(page.locator('.gd-zone1-title')).toHaveText(data.gesture.title);
  await page.evaluate(() => document.fonts.ready);
  const screenshot = async name => {
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await page.screenshot({ path: resolve(output, name + '.png'), animations: 'disabled' });
    result.screenshots.push(name + '.png');
  };
  const hot = data.subGestures.length >= 15 && data.topicMap.viewsCount >= 500;
  await expect(page.locator('.gd-zone6-topic-map')).toHaveClass(hot ? /is-hot/ : /is-light/);
  await expect(page.locator('.gd-tm-metrics')).toHaveCount(hot ? 1 : 0);
  if (!data.relatedLinks.length) await expect(page.locator('.gd-zone5-links')).toHaveCount(0);
  assert.equal(new Set(data.relatedLinks.map(link => link.url)).size, data.relatedLinks.length);
  for (const node of [data.gesture, ...data.subGestures]) {
    const floor = page.locator('[data-gesture-id="' + node.id + '"]');
    if (!await floor.count()) continue;
    await expect(floor.locator('.gd-edit-count-badge')).toHaveCount(node.editCount > 0 ? 1 : 0);
    await expect(floor.locator('.gd-first-date')).toHaveAttribute('datetime', node.createdAt);
    if (!(data.boostsByGestureId?.[node.id]?.length)) await expect(floor.locator('.gd-zone3-boost')).toHaveCount(0);
  }
  const sizes = [[1920, 1080], [1440, 900], [1280, 800], [1024, 768], [768, 1024], [390, 844], [360, 800]];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.locator('.gd-zone1-header').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const geometry = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      const style = selector => getComputedStyle(document.querySelector(selector));
      const left = rect('.gd-zone1-title').x;
      const content = rect('#floor-1 .gd-floor-markdown').x;
      const box = rect('.gd-detail-grid');
      const leftTargets = ['.gd-zone1-tags', '.gd-zone6-topic-map', ...Array.from(document.querySelectorAll('[data-floor-index]'), el => '#' + el.id + ' > .gd-avatar-rail')];
      const contentTargets = ['#floor-1 .gd-author-bar', '#floor-1 .gd-zone4-action-bar', '.gd-zone5-links', '#floor-1 .gd-zone3-boost'].filter(selector => document.querySelector(selector));
      const borderless = ['.gd-topbar', '.gd-role-badge', '.gd-level-badge', '.gd-zone5-links', '.gd-zone1-tags span'].filter(selector => document.querySelector(selector)).every(selector => style(selector).borderWidth === '0px');
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        leftAxisError: Math.max(...leftTargets.map(selector => Math.abs(rect(selector).x - left))),
        contentAxis: content - left,
        contentAxisError: Math.max(...contentTargets.map(selector => Math.abs(rect(selector).x - content))),
        centerError: Math.abs(box.x + box.width / 2 - innerWidth / 2),
        surfaceWidth: box.width,
        background: style('.gd-detail-grid').backgroundColor,
        blur: style('.gd-detail-grid').backdropFilter,
        radius: style('.gd-detail-grid').borderRadius,
        body: [style('.gd-floor-markdown').fontSize, style('.gd-floor-markdown').lineHeight, style('.gd-floor-markdown').color],
        icon: style('.gd-icon-btn').color,
        borderless,
        railWidth: getComputedStyle(document.querySelector('.gd-tl-rail'), '::before').width,
        thumbWidth: style('.gd-tl-thumb').width,
        railChildren: document.querySelector('.gd-tl-rail').children.length,
        timelineBackground: style('.gd-timeline-aside').backgroundColor,
        activityWhiteSpace: style('.gd-tl-latest').whiteSpace,
        musicPosition: document.querySelector('.shijianus-music-pocket') ? style('.shijianus-music-pocket').position : null,
        opAvatar: rect('#floor-1 > .gd-avatar-rail .gd-avatar').width,
        subAvatars: Array.from(document.querySelectorAll('.is-sub-floor > .gd-avatar-rail .gd-avatar'), el => el.getBoundingClientRect().width),
      };
    });
    assert.equal(geometry.overflow, 0);
    assert.ok(geometry.leftAxisError < 1 && geometry.contentAxisError < 1, JSON.stringify(geometry));
    assert.equal(geometry.contentAxis, 56);
    assert.ok(geometry.surfaceWidth <= 960 && geometry.centerError < 2, JSON.stringify(geometry));
    assert.equal(geometry.background, 'rgba(15, 23, 42, 0.88)');
    assert.equal(geometry.blur, 'blur(20px)');
    assert.equal(geometry.radius, '12px');
    assert.deepEqual(geometry.body, ['16px', '28px', 'rgb(226, 232, 240)']);
    assert.equal(geometry.icon, 'rgb(100, 116, 139)');
    assert.ok(geometry.borderless);
    assert.equal(geometry.railWidth, '1px');
    assert.equal(geometry.thumbWidth, '3px');
    assert.equal(geometry.railChildren, 1);
    assert.equal(geometry.timelineBackground, 'rgba(0, 0, 0, 0)');
    if (width <= 760) assert.equal(geometry.activityWhiteSpace, 'nowrap');
    assert.equal(geometry.opAvatar, 42);
    assert.ok(geometry.subAvatars.every(value => value === 36));
    result.viewports.push({ width, height, ...geometry });
    console.log('Layout', width + '×' + height, JSON.stringify(geometry));
    if ([1440, 390, 360].includes(width)) await screenshot('dark-' + width);
    const trigger = op.locator('.gd-agg-emoji-pill');
    await trigger.click();
    const panel = page.getByRole('dialog', { name: '选择表情' });
    await expect(panel).toBeVisible();
    const a = await trigger.boundingBox(), p = await panel.boundingBox();
    assert.ok(p.y >= 0 && p.y + p.height <= a.y - 5 && p.x >= 0 && p.x + p.width <= width, JSON.stringify({ width, a, p }));
    if (width === 1440) await screenshot('emoji-upward');
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
  }
  result.interactions.push('Upward Emoji picker at all seven viewport sizes');
  await page.setViewportSize({ width: 1440, height: 900 });
  await op.getByLabel('发送 Boost 短评', { exact: true }).click();
  const boost = op.getByRole('textbox', { name: 'Boost 短评', exact: true });
  await expect(boost).toHaveAttribute('maxlength', '16');
  await boost.fill('字'.repeat(17));
  assert.equal((await boost.inputValue()).length, 16);
  await boost.fill('');
  await page.locator('.gd-zone1-title').click();
  result.interactions.push('Inline Boost input rejects character 17; no submission');
  await page.locator('.gd-summary-toggle').click();
  await expect(page.getByRole('region', { name: '讨论摘录' })).toBeVisible();
  await page.locator('.gd-summary-toggle').click();
  result.interactions.push('Topic Map summary toggles in place');
  await expect(page.locator('.gd-tl-latest')).toHaveText(/刚刚|\d+(分钟|小时|天|个月|年)前/);
  assert.ok(Date.parse(await page.locator('.gd-tl-latest').getAttribute('datetime')) >= Date.parse(data.gesture.createdAt));
  if (data.subGestures.length) {
    await page.getByRole('button', { name: '跳至最新回复', exact: true }).click();
    await expect(page.locator('#floor-' + (data.subGestures.length + 1))).toBeInViewport();
    result.interactions.push('Timeline jumps to final real reply');
    const parentToggle = page.locator('.is-sub-floor .gd-reply-target-pill').first();
    if (await parentToggle.count()) {
      await parentToggle.click();
      const parent = page.locator('.gd-reply-context.is-parent');
      await expect(parent).toBeVisible();
      await parent.getByRole('button', { name: /跳至第 .* 楼贴文/ }).click();
      await expect(page.locator('.gd-return')).toBeVisible();
      await page.locator('.gd-return').click();
      await expect(page.locator('.gd-return')).toHaveCount(0);
      await expect(parentToggle).toHaveAttribute('aria-expanded', 'true');
      result.interactions.push('Expanded real parent jump preserves a return marker and restores expansion');
    }
  } else result.interactions.push('No real replies: parent/child/jump interaction remains covered by local D1 tests');
  await page.locator('#nav-theme-toggle a').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.snackbar-container.show')).toHaveCount(0, { timeout: 10000 });
  await page.locator('.gd-zone1-header').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  assert.equal(await page.locator('.gd-floor-markdown').first().evaluate(el => getComputedStyle(el).color), 'rgb(54, 54, 54)');
  assert.equal(await page.locator('.gd-detail-grid').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(255, 255, 255, 0.94)');
  await screenshot('light-1440');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator('.gd-timeline-aside').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(page.locator('.gd-timeline-aside')).toHaveAttribute('data-stuck', 'false');
  assert.equal(await page.locator('.gd-timeline-aside').evaluate(el => getComputedStyle(el, '::before').opacity), '0');
  await screenshot('light-390');
  await op.locator('.gd-floor-markdown').evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - 80, behavior: 'instant' }));
  await expect(page.locator('.gd-timeline-aside')).toHaveAttribute('data-stuck', 'true');
  assert.equal(await page.locator('.gd-timeline-aside').evaluate(el => getComputedStyle(el, '::before').opacity), '1');
  await screenshot('light-390-scrolled');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
  await page.locator('.gd-back-btn').click();
  await expect(page.locator('.gb-gesture-row').first()).toBeVisible({ timeout: 45000 });
  await expect(page.locator('.gb-boost-track')).toHaveCount(3);
  assert.equal(await page.locator('.guestbook-board-container').evaluate(el => getComputedStyle(el).getPropertyValue('--gd-text')), '');
  result.baselineHydrationWarnings = result.pageErrors.filter(error => error.startsWith('Minified React error #418;'));
  assert.deepEqual(result.pageErrors.filter(error => !result.baselineHydrationWarnings.includes(error)), []);
  assert.deepEqual(result.assetFailures, []);
  result.ok = true;
  console.log('PASS', JSON.stringify(result.topic), JSON.stringify(result.interactions));
} catch (error) {
  result.ok = false;
  result.error = error.stack;
  throw error;
} finally {
  await writeFile(resolve(output, 'acceptance.json'), JSON.stringify(result, null, 2) + '\n');
  await browser.close();
}
