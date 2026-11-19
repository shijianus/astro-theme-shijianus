import assert from 'node:assert/strict';
import { expect } from '@playwright/test';
import { sizes, withGuestbook } from './guestbook-test-server.mjs';

await withGuestbook(async ({ page, base, add, errors }) => {
  await page.goto(base + '/guestbook/');
  await expect(page.getByText('暂无留言', { exact: true })).toBeVisible();
  await expect(page.locator('.gb-board-boosts,.gb-gesture-row')).toHaveCount(0);
  for (let i = 0; i < 23; i++)
    await add('entry_' + i, '留下阅读时想继续讨论的一段文字。', {
      title: '讨论 ' + i,
      tag: i % 2 ? 'ideas' : 'tech',
      status: i === 1 ? 'pinned' : 'published',
    });
  await add('old_reply', '针对这条讨论的回复。', { parent_id: 'entry_1' });
  await page.reload();
  const rows = page.locator('.gb-gesture-row');
  await expect(rows).toHaveCount(20);
  await page.getByRole('button', { name: /查看更多留言/ }).click();
  await expect(rows).toHaveCount(23);
  await expect(rows.first()).toContainText('讨论 1');
  await expect(rows.first().getByTitle('回复数')).toHaveText('1');
  await rows.first().getByLabel('书签').click();
  await page.locator('[data-cat-id="bookmarked"]').click();
  await expect(rows).toHaveCount(1);
  await page.reload();
  await page.locator('[data-cat-id="bookmarked"]').click();
  await expect(rows).toHaveCount(1);
  await page.locator('[data-cat-id="my"]').click();
  await expect(rows).toHaveCount(0);
  await page.locator('[data-cat-id="featured"]').click();
  await expect(rows).toHaveCount(1);
  await page.locator('[data-cat-id="recent"]').click();
  await expect(rows).toContainText(['讨论 1']);
  await page.locator('[data-cat-id="hot"]').click();
  await expect(rows.first()).toContainText('讨论 1');
  await page.locator('[data-cat-id="latest"]').click();
  await page.locator('.gb-dim-dropdown-btn').click();
  await page.getByRole('option', { name: /技术探讨/ }).click();
  await expect(rows).toHaveCount(12);
  await page.locator('.gb-dim-dropdown-btn').click();
  await page.getByRole('option', { name: /全部维度/ }).click();
  await page.getByLabel('搜索留言').fill('讨论 12');
  await expect(rows).toHaveCount(1);
  await rows.getByRole('link').click();
  await expect(page.locator('#floor-1')).toContainText('阅读时');
  await page.getByRole('button', { name: '留言广场', exact: true }).click();
  await page.getByLabel('搜索留言').fill('');
  await page.locator('[data-cat-id="read"]').click();
  await expect(rows).toHaveCount(1);
  await page.locator('[data-cat-id="latest"]').click();
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
    const header = await page.locator('#nav').boundingBox(),
      title = await page.locator('.gb-board-header h1').boundingBox();
    assert.ok(title.y >= header.y + header.height, 'site header covers list heading at ' + width);
    const brand = await page.locator('#site-name').boundingBox(),
      tools = await page.locator('#nav-right').boundingBox();
    assert.ok(brand.x + brand.width <= tools.x, 'site header controls cover brand at ' + width);
    await expect(page.getByLabel('搜索留言')).toBeVisible();
    await expect(page.locator('.gb-board-header button')).toBeVisible();
    await page.locator('.gb-dim-dropdown-btn').click();
    const box = await page.getByRole('listbox').boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width);
    await page.locator('.gb-dim-dropdown-btn').click();
    console.log(width + '×' + height + ' board, search, dimension menu within viewport');
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('.gb-board-header button').click();
  const draft = page.locator('.gb-floating-composer');
  const drag = draft.locator('.gb-drag-handle-btn');
  const box = await drag.boundingBox();
  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.down();
  await page.mouse.move(box.x + 55, box.y + 15);
  await page.mouse.up();
  await expect(draft).toHaveClass(/is-dragged/);
  await draft.getByTitle('最小化').click();
  await page.getByTitle('展开', { exact: true }).click();
  await expect(draft).toBeVisible();
  await draft.getByRole('button', { name: 'Boost 短评' }).click();
  await draft.getByLabel('广场 Boost').fill('🥝'.repeat(17));
  await expect(draft.getByRole('button', { name: '发布', exact: true })).toBeDisabled();
  await draft.getByLabel('广场 Boost').fill('阅读留痕');
  await draft.getByRole('button', { name: '发布', exact: true }).click();
  await expect(page.locator('.gb-board-boosts')).toContainText('阅读留痕');
  await page.locator('.gb-board-header button').click();
  await draft.getByRole('button', { name: 'Gesture 讨论' }).click();
  await draft.getByPlaceholder('标题（可选）').fill('读者新主题');
  await draft.getByPlaceholder('说点什么...').fill('这里是新发表的主题正文。');
  await draft.locator('.gb-composer-channel-trigger').click();
  await draft.getByRole('option', { name: /灵感交流/ }).click();
  await draft.locator('.gb-composer-tag-input').fill('摘记');
  await draft.locator('.gb-composer-tag-input').press('Enter');
  await draft.getByTitle('插入表情').click();
  await page
    .getByRole('dialog', { name: '贴文表情' })
    .getByRole('button', { name: '👍', exact: true })
    .click();
  await draft.getByRole('button', { name: '实时预览' }).click();
  await expect(draft.locator('.gb-preview-box .gd-markdown-body')).toContainText('新发表的主题正文');
  const composerBgDark = await draft.evaluate((el) => {
    const m = getComputedStyle(el).backgroundColor.match(/\d+/g);
    return m ? (+m[0] + +m[1] + +m[2]) / 3 < 80 : false;
  });
  assert.equal(composerBgDark, true);
  await draft.getByRole('button', { name: '发布', exact: true }).click();
  await expect(page.locator('.gd-zone1-title')).toHaveText('读者新主题');
  await expect(page.locator('.gd-zone1-tags')).toContainText('摘记');
  await expect(page.locator('.gd-zone1-tags')).toContainText('灵感交流');
  await page.getByLabel('订阅通知').click();
  await expect(page.getByLabel('订阅通知')).toHaveAttribute('aria-pressed', 'true');
  const op = page.locator('#floor-1');
  await op.getByLabel('更多操作').click();
  await op.getByLabel('编辑贴文').click();
  await op.locator('.gd-inline-edit-title').fill('修改后的主题');
  await op.getByRole('button', { name: '保存修改' }).click();
  await expect(page.locator('.gd-zone1-title')).toHaveText('修改后的主题');
  await op.getByLabel('更多操作').click();
  page.once('dialog', (d) => d.accept());
  await op.getByLabel('删除贴文').click();
  await expect(page.locator('.gb-board-header')).toBeVisible();
  console.log(
    'real D1: empty board, all seven tabs, search, pagination, bookmarks, dimensions, floating draft, Boost and Gesture CRUD',
  );
  assert.deepEqual(errors, []);
});
