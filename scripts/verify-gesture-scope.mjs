import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { expect } from '@playwright/test';
import { withGuestbook } from './guestbook-test-server.mjs';

const baseline = '2e9074ba9512afe9b7f72c65109d18996ca3ffb4';
const out = process.env.GESTURE_SHOTS || 'reports/gesture-scope-correction-20261123/screenshots';
await mkdir(out, { recursive: true });
const result = { baseline, identicalSources: [], publicBoost: [], themes: [] };
for (const file of ['src/styles/guestbook-board.css', 'src/lib/comment-client.ts', 'src/lib/gesture-client.ts',
  'functions/api/comments.ts', 'functions/_lib/gesture-shared.ts', 'functions/_lib/auth-service.ts',
  'src/styles/global.css', 'src/styles/rebuild.css', 'src/pages/status.astro', 'docs/standards/status.md']) {
  assert.equal(await readFile(file, 'utf8'), execFileSync('git', ['show', baseline + ':' + file], { encoding: 'utf8' }));
  result.identicalSources.push(file);
}
const boardFile = 'src/components/theme/GuestbookBoard.tsx';
const originalBoard = execFileSync('git', ['show', baseline + ':' + boardFile], { encoding: 'utf8' });
assert.equal(await readFile(boardFile, 'utf8'), originalBoard.replace(
  "raw.replace(/-floor-\\d+$/, '')", "raw.replace(/-floor-\\d+(?:~[\\w-]+)?$/, '')"));
result.boardDifference = 'Only detail deep-link parsing accepts a stable post ID; all public rendering and classification code is identical.';

await withGuestbook(async ({ db, page, base, add, errors }) => {
  await add('scope_detail', '夜读时记下的问题，常常会在下一次讨论中找到答案。\n\n保留一段清楚的正文，让文字成为阅读的中心。', {
    title: '留下一个想法，开始一场交流', author_name: '青禾', views_count: 128,
  });
  await add('scope_reply', '给每条摘记留一个回到原文的位置，之后再读也能找到上下文。', {
    parent_id: 'scope_detail', reply_to_id: 'scope_detail', author_name: '南山',
  });
  const scoped = await page.request.post(base + '/api/gestures', {
    data: { action: 'boost', gestureId: 'scope_detail', content: '把想法留在这里', authorName: '江澄' },
  });
  assert.equal(scoped.status(), 200);
  for (const length of [17, 30, 31]) {
    const response = await page.request.post(base + '/api/comments', {
      data: { action: 'create', slug: 'guestbook', postType: 'boost', message: '字'.repeat(length), authorName: '本地验收' },
    });
    assert.equal(response.status(), length <= 30 ? 200 : 400);
    result.publicBoost.push({ length, status: response.status() });
  }
  const tooLong = await page.request.post(base + '/api/gestures', {
    data: { action: 'boost', gestureId: 'scope_detail', content: '字'.repeat(17) },
  });
  assert.equal(tooLong.status(), 400);
  result.detailBoostLimit = 16;

  await page.goto(base + '/guestbook/');
  await expect(page.locator('.gb-boost-track')).toHaveCount(3);
  const tracks = await page.locator('.gb-boost-track').evaluateAll(nodes => nodes.map(node =>
    [...node.querySelectorAll('.gb-boost-pill__text')].map(el => el.textContent)));
  const all = tracks.flat();
  assert.equal(new Set(all).size, all.length);
  assert.ok(Math.max(...tracks.map(row => row.length)) - Math.min(...tracks.map(row => row.length)) <= 1);
  assert.ok(!all.includes('把想法留在这里'), 'detail Boost must not enter the public wall');
  result.boostRows = tracks.map(row => row.length);
  await page.locator('.gb-boost-wall-head').hover();
  await page.locator('.gb-boost-marquee-container').hover();
  await expect(page.locator('.gb-boost-marquee-container')).toHaveClass(/is-paused/);

  // Verify the original automatic classification through the actual composer and API.
  for (const [length, title, type] of [[30, '', 'boost'], [31, '', 'gesture'], [8, '有标题的话题', 'gesture']]) {
    if (await page.locator('.gd-back-btn').count()) await page.locator('.gd-back-btn').click();
    await page.locator('.gb-new-gesture-btn').first().click();
    await page.getByPlaceholder('说点什么...').fill('文'.repeat(length));
    if (title) await page.getByPlaceholder('标题（可选）').fill(title);
    const requestPromise = page.waitForRequest(request => request.url().endsWith('/api/comments') && request.method() === 'POST');
    await page.locator('.gb-submit-btn').click();
    const request = await requestPromise;
    assert.equal(request.postDataJSON().postType, type);
    await expect(page.getByPlaceholder('说点什么...')).toHaveCount(0);
    result.publicBoost.push({ composerLength: length, title, type });
  }

  for (const theme of ['light', 'dark']) {
    await page.evaluate(theme => {
      localStorage.setItem('shijianus-theme', theme);
      document.documentElement.dataset.theme = theme;
    }, theme);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 1440 ? 960 : 844 });
      await page.goto(base + '/guestbook/');
      await expect(page.locator('.gb-boost-track')).toHaveCount(3);
      await page.mouse.move(0, 0);
      await page.screenshot({ path: `${out}/board-${theme}-${width}.png`, animations: 'disabled' });
      assert.equal(await page.locator('.guestbook-board-container').evaluate(el => getComputedStyle(el).getPropertyValue('--gd-text')), '');
      await page.goto(base + '/guestbook/#gesture-scope_detail');
      await expect(page.locator('#floor-1')).toBeVisible();
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      const color = await page.evaluate(() => {
        const style = selector => getComputedStyle(document.querySelector(selector));
        return { theme: document.documentElement.dataset.theme,
          paper: style('.gd-detail-grid').backgroundColor,
          text: style('.gd-floor-markdown').color,
          accent: style('.gd-detail-root').getPropertyValue('--gd-accent').trim(),
          overflow: document.documentElement.scrollWidth - innerWidth };
      });
      assert.equal(color.theme, theme);
      assert.equal(color.paper, theme === 'light' ? 'rgba(255, 255, 255, 0.94)' : 'rgba(15, 23, 42, 0.88)');
      assert.equal(color.text, theme === 'light' ? 'rgb(54, 54, 54)' : 'rgb(226, 232, 240)');
      assert.equal(color.overflow, 0);
      await page.screenshot({ path: `${out}/detail-${theme}-${width}.png`, animations: 'disabled' });
      const trigger = page.locator('#floor-1 .gd-agg-emoji-pill');
      await trigger.click();
      const popup = page.getByRole('dialog', { name: '选择表情' });
      await expect(popup).toBeVisible();
      const p = await popup.boundingBox(), a = await trigger.boundingBox();
      assert.ok(p.y >= 0 && p.y + p.height < a.y && p.x >= 0 && p.x + p.width <= width);
      const popupColor = await popup.evaluate(el => getComputedStyle(el).backgroundColor);
      assert.equal(popupColor, theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(24, 34, 53)');
      await page.screenshot({ path: `${out}/emoji-${theme}-${width}.png`, animations: 'disabled' });
      await page.keyboard.press('Escape');
      result.themes.push({ width, ...color, popupColor });
      await page.locator('.gd-back-btn').click();
      await expect(page.locator('.gb-boost-track')).toHaveCount(3);
      assert.equal(await page.locator('.guestbook-board-container').evaluate(el => getComputedStyle(el).getPropertyValue('--gd-text')), '');
    }
  }
  // Stored content and Boost remain intact, including the previous initializer's IDs.
  await add('pinned_welcome_official', '原有正文', { views_count: 1280, likes_count: 18, edit_count: 2 });
  await add('reply_floor_2_official', '原有回复', { parent_id: 'pinned_welcome_official', updated_at: '2026-08-03T09:20:00.000Z' });
  await db.prepare("INSERT INTO boosts(id,gesture_id,user_id,author_name,content,created_at) VALUES('boost_detail_op_1','pinned_welcome_official','reader','原读者','原有 Boost','2026-08-03T08:30:00.000Z')").run();
  const saved = await (await page.request.get(base + '/api/gestures?id=pinned_welcome_official&trackView=0')).json();
  assert.equal(saved.topicMap.viewsCount, 1280);
  assert.equal(saved.gesture.editCount, 2);
  assert.equal(saved.subGestures.length, 1);
  assert.equal(saved.boostsByGestureId.pinned_welcome_official[0].content, '原有 Boost');
  // Original public board initializes its read/bookmark badges from localStorage.
  // This exact SSR mismatch is reproduced on production; keep its behavior per scope.
  const baselineWarnings = errors.filter(error => error.startsWith('Minified React error #418;'));
  assert.deepEqual(errors.filter(error => !baselineWarnings.includes(error)), []);
  console.log('Preserved production baseline hydration warnings:', baselineWarnings.length);
  result.baselineHydrationWarnings = baselineWarnings;
  result.ok = true;
});
await writeFile(`${out}/scope-acceptance.json`, JSON.stringify(result, null, 2) + '\n');
console.log('PASS', JSON.stringify(result));
