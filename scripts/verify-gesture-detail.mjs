import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { expect } from '@playwright/test';
import { sizes, withGuestbook } from './guestbook-test-server.mjs';

await withGuestbook(async ({ db, page, base, add, errors }) => {
  await page.addInitScript(() => {
    try {
      if (!localStorage.getItem('shijianus-theme')) localStorage.setItem('shijianus-theme', 'dark');
    } catch {}
  });
  const path = base + '/guestbook/#gesture-';
  const shots = process.env.GESTURE_SHOTS;
  if (shots) await mkdir(shots, { recursive: true });
  const shot = async (name, target) => {
    if (!shots) return;
    if (target) {
      await target.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    }
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await page.screenshot({ path: shots + '/' + name + '.png', animations: 'disabled' });
  };
  const req = (payload, token) =>
    page.request.post(base + '/api/gestures', {
      data: payload,
      headers: token ? { 'X-Comment-Session-Token': token } : {},
    });
  const detail = async (id) =>
    (await page.request.get(base + '/api/gestures?id=' + id + '&trackView=0')).json();
  assert.equal((await detail('pinned_welcome_official')).ok, false);
  assert.equal((await db.prepare('SELECT count(*) n FROM comments').first()).n, 0);
  const welcome = 'pinned_welcome_official';
  await add(welcome, '欢迎讨论。', {
    created_at: '2026-08-03T08:15:00.000Z',
    updated_at: '2026-08-04T10:30:00.000Z',
    author_role: 'admin',
    views_count: 1283,
    edit_count: 2,
    likes_count: 18,
    reactions: JSON.stringify({ summary: { '👍': 18 }, users: { reader_alice: '👍' } }),
  });
  await add('reply_floor_2_official', '旧版初始化写入的文字。', {
    parent_id: welcome,
    updated_at: '2026-08-03T09:20:00.000Z',
  });
  assert.equal((await detail(welcome)).topicMap.viewsCount, 1283);
  assert.equal((await detail(welcome)).subGestures.length, 1);
  await add('reply_to_legacy', '这段发言确实回复了旧楼。', {
    parent_id: welcome,
    reply_to_id: 'reply_floor_2_official',
  });
  assert.deepEqual((await detail(welcome)).subGestures.map((n) => n.id).sort(), [
    'reply_floor_2_official',
    'reply_to_legacy',
  ]);
  assert.equal(
    (await db.prepare('SELECT views_count FROM comments WHERE id=?').bind(welcome).first()).views_count,
    1283,
  );
  await add('empty', '只有正文的一条留言。', { author_role: 'admin' });
  await add(
    'citations',
    '[仍可访问的引用](https://example.org/actual-topic?utm_source=reader) 与 /guestbook/#gesture-missing',
  );
  await add('cite_reply', '重复引用 http://example.org/actual-topic/ 。', { parent_id: 'citations' });
  await add('other', '这段文字有一个实际的标题。', { title: '夜读时的摘记' });
  await add('other_reply', '补充一段。', { parent_id: 'other' });
  const message =
    '夜读时记下的问题，常常会在下一次讨论中找到答案。\n\n' +
    '[读者的摘记](/guestbook/#gesture-other) 和 [后续回复](/guestbook/#gesture-other-floor-2)。\n\n' +
    '[排版指南](/posts/content-formats-and-markup-mastery/?utm_source=reader) · ' +
    '[重读](http://blog.epocanvas.com/posts/%63ontent-formats-and-markup-mastery) · [外部讨论](https://linux.do/t/topic/3197718)\n\n' +
    '> 先读正文，再回到上下文。\n\n- 保留引用\n- 回到楼层\n\n行内公式 $a^2+b^2=c^2$。';
  await add('reading', message, {
    title: '读书笔记里的引用，你会怎样整理？',
    status: 'pinned',
    author_name: '南山',
    tag: 'ideas',
  });
  await add('r2', '我会给每条摘记留一个可以回到原文的位置。', {
    parent_id: 'reading',
    reply_to_id: 'reading',
    author_name: '江澄',
  });
  await add('r3', '同意，返回原位之后还可以接着往下读。', {
    parent_id: 'reading',
    reply_to_id: 'r2',
    author_name: '山禾',
    quote_id: 'reading',
    quote_source: JSON.stringify({ id: 'reading', authorName: '南山', excerpt: '夜读时记下的问题' }),
    created_at: '2026-08-09T09:00:00Z',
  });
  const family = '👩🏽‍💻';
  assert.equal(
    (await req({ action: 'boost', gestureId: 'reading', content: family.repeat(17) })).status(),
    400,
  );
  assert.equal((await req({ action: 'boost', gestureId: 'reading', content: 'a\nb' })).status(), 400);
  assert.equal(
    (await req({ action: 'boost', gestureId: 'reading', content: family.repeat(16) })).status(),
    200,
  );
  for (let n = 0; n < 10; n++)
    await req({ action: 'boost', gestureId: 'reading', content: '摘记 ' + (n + 1), authorName: '小河' });
  for (const [i, e] of ['👍', '❤️', '🚀', '💡', '🔥', '🎉'].entries())
    await req({ action: 'react', id: 'reading', emoji: e, authorName: '读者' + i }, 'local-reader-' + i);
  let data = await detail('reading');
  assert.equal(data.relatedLinks.length, 4);
  assert.deepEqual(
    data.relatedLinks.filter((x) => x.kind === 'gesture').map((x) => x.replyCount),
    [1, 1],
  );
  assert.equal(data.relatedLinks.filter((x) => x.kind === 'site').length, 1);
  assert.equal(data.relatedLinks.find((x) => x.kind === 'external').replyCount, undefined);
  const concurrent = await Promise.all(
    ['left', 'right', 'third'].map((k) => req({ action: 'react', id: 'empty', emoji: '💡' }, k)),
  );
  assert.deepEqual(
    concurrent.map((r) => r.status()),
    [200, 200, 200],
  );
  assert.equal((await detail('empty')).topicMap.likesCount, 3);
  assert.equal(
    (await req({ action: 'reply', rootId: 'other', replyToId: 'r2', message: '跨话题的目标' })).status(),
    400,
  );
  assert.equal((await req({ action: 'boost', gestureId: 'missing', content: '不存在' })).status(), 404);
  await db
    .prepare(
      "INSERT INTO users(id,email,name,role,provider) VALUES ('account-reader','reader@example.test','注册读者','reader','epomail')",
    )
    .run();
  await db
    .prepare(
      "INSERT INTO user_sessions(id,user_id,token,expires_at) VALUES ('session-reader','account-reader','local-account-session',datetime('now','+1 day'))",
    )
    .run();
  const accountReply = await (
    await req({ action: 'reply', rootId: 'other', message: '登录读者写下的回复。' }, 'local-account-session')
  ).json();
  assert.equal(accountReply.subGesture.authorId, 'account-reader');
  assert.equal(accountReply.subGesture.authorRole, 'reader');
  assert.equal(
    (await req({ action: 'delete', id: accountReply.subGesture.id }, 'local-account-session')).status(),
    200,
  );
  await page.goto(path + 'empty');
  await expect(page.locator('#floor-1')).toBeVisible();
  await expect(page.locator('.gd-zone3-boost,.gd-zone5-links')).toHaveCount(0);
  await expect(page.locator('.gd-edit-count-badge')).toHaveCount(0);
  assert.ok((await page.locator('.gd-zone6-topic-map').boundingBox()).height <= 58);
  assert.equal(await page.locator('#floor-1 .gd-avatar').evaluate(el => getComputedStyle(el).borderRadius), '50%');
  await shot('quiet-single-post', page.locator('.gd-zone1-title'));
  await add('threshold', '热门阈值验证。', { views_count: 499 });
  for (let i = 0; i < 14; i++) await add('threshold_' + i, '参与讨论 ' + i, { parent_id: 'threshold' });
  await page.goto(path + 'threshold');
  await expect(page.locator('.gd-zone6-topic-map')).toHaveClass(/is-light/);
  await expect(page.locator('.gd-tm-metrics')).toHaveCount(0);
  await add('threshold_14', '第十五条回复', { parent_id: 'threshold' });
  await page.reload();
  await expect(page.locator('.gd-zone6-topic-map')).toHaveClass(/is-hot/);
  await expect(page.locator('.gd-tm-metrics dd')).toHaveCount(4);
  await shot('hot-topic', page.locator('.gd-zone6-topic-map'));
  await db.prepare("UPDATE comments SET views_count=498 WHERE id='threshold'").run();
  await page.reload();
  await expect(page.locator('.gd-zone6-topic-map')).toHaveClass(/is-light/);
  await page.goto(path + 'citations');
  const external = page.getByRole('region', { name: '关联链接' }).getByRole('link');
  await expect(external).toHaveCount(1);
  await expect(external.locator('span').nth(1)).toHaveText('仍可访问的引用');
  await expect(external.locator('.gd-link-clicks')).toHaveText('0');
  await expect(external).toHaveAttribute('href', 'https://example.org/actual-topic');
  const clickRecorded = page.waitForResponse(response => response.url().endsWith('/api/gestures') && response.request().method() === 'POST' && response.request().postDataJSON()?.action === 'link_click');
  const [popup] = await Promise.all([page.waitForEvent('popup'), external.click()]);
  await clickRecorded;
  await popup.close();
  await expect(external.locator('.gd-link-clicks')).toHaveText('1');
  assert.equal((await detail('citations')).topicMap.linksCount, 1);
  await page.goto(path + 'reading');
  const op = page.locator('#floor-1');
  await expect(op).toContainText('夜读时记下');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await expect(page.locator('.gd-tl-latest')).toHaveText(/刚刚|\d+(分钟|小时|天)前/);
  assert.ok(Date.parse(await page.locator('.gd-tl-latest').getAttribute('datetime')) >= Date.parse(data.gesture.createdAt));
  await expect(op.locator('.katex')).toBeVisible();
  await expect(page.locator('.gd-agg-emoji-icons').first().locator('span')).toHaveCount(4);
  const rail = page.getByRole('slider', { name: '跳转楼层' });
  const react = op.locator('.gd-agg-emoji-pill');
  await expect(page.locator('.gd-zone5-links a').filter({ hasText: '夜读时的摘记' })).toHaveCount(2);
  await expect(page.locator('.gd-zone5-links a')).toHaveCount(4);
  await expect(page.locator('.gd-zone5-links a[href^="/posts/"]')).toContainText('shijianus');
  await shot('interaction-top', page.locator('.gd-zone1-header'));
  await shot('body', op.locator('.gd-floor-markdown'));
  await shot('boost', op.locator('.gd-zone3-boost'));
  await shot('links', page.locator('.gd-zone5-links'));
  await shot('map', page.locator('.gd-zone6-topic-map'));
  await shot('reply', page.locator('#floor-2'));
  await shot('rail', rail);
  await shot('bottom', page.locator('#detail-reply-composer'));
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await op
      .locator('.gd-zone4-action-bar')
      .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await op.evaluate(() => {
      const s = document.querySelector('#floor-1 .gd-boost-op-pills');
      if (s) s.scrollLeft = 0;
      return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    const geometry = await op.evaluate((el) => {
      const box = (s) => el.querySelector(s).getBoundingClientRect();
      const css = (s) => getComputedStyle(el.querySelector(s));
      const mainX = document.querySelector('.gd-zone1-title').getBoundingClientRect().x;
      const textX = box('.gd-floor-markdown').x;
      const surface = document.querySelector('.gd-detail-grid');
      const surfaceStyle = getComputedStyle(surface);
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        leftAxis: Math.max(...['.gd-zone1-tags', '.gd-zone6-topic-map', '.gd-subscribe-btn', '#floor-1 > .gd-avatar-rail', '#floor-2 > .gd-avatar-rail'].map(s => Math.abs(document.querySelector(s).getBoundingClientRect().x - mainX))),
        contentAxis: textX - mainX,
        axis: Math.max(...['.gd-zone4-action-bar', '.gd-zone3-boost', '.gd-author-bar'].map(s => Math.abs(box(s).x - textX)), Math.abs(document.querySelector('.gd-zone5-links').getBoundingClientRect().x - textX)),
        borderless: ['.gd-topbar', '.gd-role-badge', '.gd-level-badge', '.gd-zone5-links', '.gd-zone1-tags span', '.gd-subscribe-btn']
          .filter(s => document.querySelector(s))
          .every(s => getComputedStyle(document.querySelector(s)).borderWidth === '0px') &&
          (innerWidth > 760
            ? getComputedStyle(document.querySelector('.gd-timeline-aside')).borderWidth === '0px'
            : getComputedStyle(document.querySelector('.gd-timeline-aside')).borderTopWidth === '0px' &&
              getComputedStyle(document.querySelector('.gd-timeline-aside')).borderLeftWidth === '0px' &&
              getComputedStyle(document.querySelector('.gd-timeline-aside')).borderRightWidth === '0px'),
        pills: [...el.querySelectorAll('.gd-boost-op-pill')].every(p => p.getBoundingClientRect().height <= 26 && getComputedStyle(p).borderWidth === '0px'),
        wrapping: css('.gd-boost-op-pills').flexWrap,
        opAvatarWidth: box('.gd-avatar').width,
        subAvatarWidth: document.querySelector('#floor-2 > .gd-avatar-rail .gd-avatar').getBoundingClientRect().width,
        subAvatarBg: getComputedStyle(document.querySelector('#floor-2 > .gd-avatar-rail .gd-avatar')).backgroundColor,
        bodySize: css('.gd-floor-markdown').fontSize,
        bodyLeading: css('.gd-floor-markdown').lineHeight,
        bodyColor: css('.gd-floor-markdown').color,
        iconColor: css('.gd-icon-btn').color,
        surfaceWidth: surface.getBoundingClientRect().width,
        surfaceCenterError: Math.abs((surface.getBoundingClientRect().left + surface.getBoundingClientRect().right) / 2 - innerWidth / 2),
        surfaceColor: surfaceStyle.backgroundColor,
        surfaceBorder: surfaceStyle.borderColor,
        blur: surfaceStyle.backdropFilter,
        radius: surfaceStyle.borderRadius,
        emojiGap: css('.gd-agg-emoji-icons').gap,
        ruleWidth: getComputedStyle(document.querySelector('.gd-tl-rail'), '::before').width,
        thumbWidth: getComputedStyle(document.querySelector('.gd-tl-thumb')).width,
      };
    });
    assert.equal(geometry.overflow, 0, JSON.stringify(geometry));
    assert.ok(geometry.axis < 1 && geometry.leftAxis < 1, JSON.stringify(geometry));
    assert.equal(geometry.contentAxis, 56);
    assert.ok(geometry.borderless, JSON.stringify(geometry));
    assert.ok(geometry.pills);
    assert.equal(geometry.wrapping, 'wrap');
    assert.equal(geometry.opAvatarWidth, 42);
    assert.equal(geometry.subAvatarWidth, 36);
    assert.ok(
      ['rgb(51, 65, 85)', 'rgb(59, 66, 82)', 'rgb(45, 55, 72)', 'rgb(56, 68, 63)', 'rgb(69, 59, 60)', 'rgb(65, 64, 57)'].includes(geometry.subAvatarBg),
      JSON.stringify(geometry),
    );
    assert.equal(geometry.bodySize, '16px');
    assert.equal(geometry.bodyLeading, '28px');
    assert.equal(geometry.bodyColor, 'rgb(226, 232, 240)');
    assert.equal(geometry.iconColor, 'rgb(100, 116, 139)');
    assert.ok(geometry.surfaceWidth <= 960 && geometry.surfaceCenterError < 2, JSON.stringify(geometry));
    assert.equal(geometry.surfaceColor, 'rgba(13, 17, 26, 0.88)');
    assert.equal(geometry.surfaceBorder, 'rgba(255, 255, 255, 0.06)');
    assert.equal(geometry.blur, 'blur(20px)');
    assert.equal(geometry.radius, '12px');
    assert.equal(geometry.emojiGap, '1px');
    assert.equal(geometry.ruleWidth, '1px');
    assert.equal(geometry.thumbWidth, '3px');
    await react.click();
    const panel = page.getByRole('dialog', { name: '选择表情' });
    await expect(panel).toBeVisible();
    const a = await react.boundingBox(),
      p = await panel.boundingBox();
    assert.ok(
      p.y >= 0 && p.y + p.height <= a.y - 5 && p.x >= 0 && p.x + p.width <= width,
      JSON.stringify({ width, a, p }),
    );
    const hit = await panel.evaluate((el) => {
      const b = el.getBoundingClientRect();
      const bg = getComputedStyle(el).backgroundColor;
      const m = bg.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
      const r = m ? +m[1] : 255,
        g = m ? +m[2] : 255,
        bl = m ? +m[3] : 255,
        a = m && m[4] !== undefined ? +m[4] : 1;
      const luma = (r + g + bl) / 3;
      return {
        contained: el.contains(document.elementFromPoint(b.x + 12, b.y + 12)),
        opaqueDark: a >= 0.95 && luma < 60,
        bg,
      };
    });
    assert.ok(hit.contained);
    assert.ok(hit.opaqueDark, JSON.stringify(hit));
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    const bounds = await rail.boundingBox();
    assert.ok(bounds.width < bounds.height, 'timeline stays a single vertical track on every viewport');
    console.log(width + '×' + height, geometry, 'upward panel and rail verified');
    if (width === 390) await shot('mobile-example', op.locator('.gd-floor-markdown'));
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await op.getByLabel('发送 Boost 短评').click();
  const input = op.getByRole('textbox', { name: 'Boost 短评' });
  await expect(input).toHaveAttribute('maxlength', '16');
  await input.fill('字'.repeat(17));
  assert.equal((await input.inputValue()).length, 16);
  await input.fill('读到这里');
  await op.locator('.gd-boost-inline-submit').click();
  await expect(op.locator('.gd-boost-op-pills')).toContainText('读到这里');
  await react.hover();
  await expect(page.getByRole('dialog', { name: '表态明细' })).toContainText('读者0');
  if (shots) await page.screenshot({ path: shots + '/emoji.png' });
  await react.click();
  await page.getByRole('dialog', { name: '选择表情' }).getByRole('button', { name: '🚀' }).click();
  await expect(react).toHaveAttribute('data-reacted', 'true');
  await react.click();
  await page.getByRole('dialog', { name: '选择表情' }).getByRole('button', { name: '🚀' }).click();
  await expect(react).toHaveAttribute('data-reacted', 'false');
  await op.getByRole('button', { name: /条直接回复/ }).click();
  await expect(op.locator('.gd-reply-context')).toContainText('江澄');
  const childrenRail = await op.locator('.gd-reply-context').evaluate(el => ({
    width: getComputedStyle(el, '::before').width,
    position: getComputedStyle(el.querySelector('.gd-avatar')).position,
    centerOffset: el.querySelector('.gd-avatar').getBoundingClientRect().x + 13 - el.getBoundingClientRect().x,
  }));
  assert.deepEqual(childrenRail, { width: '1px', position: 'static', centerOffset: 13 });
  await op.getByLabel('收起直接回复', { exact: true }).click();
  await expect(op.locator('.gd-reply-context')).toHaveCount(0);
  await page
    .locator('#floor-2')
    .getByRole('button', { name: /条直接回复/ })
    .click();
  await expect(page.locator('#floor-2 .gd-reply-context')).toContainText('山禾');
  await page
    .locator('#floor-2')
    .getByRole('button', { name: /条直接回复/ })
    .click();
  await page.locator('#floor-3 .gd-reply-target-pill').click();
  await expect(page.locator('#floor-3 .gd-reply-context')).toContainText('给每条摘记');
  assert.equal(await page.locator('#floor-3 .gd-context-avatar-stack').evaluate(el => getComputedStyle(el).position), 'sticky');
  assert.equal(await page.locator('#floor-3 .gd-reply-context.is-parent .gd-context-rail').evaluate(el => getComputedStyle(el, '::before').width), '1px');
  await shot('parent', page.locator('#floor-3 .gd-reply-context'));
  await page.locator('#floor-3 .gd-reply-context').getByRole('button', { name: '跳至第 2 楼贴文' }).click();
  await expect(page.locator('.gd-return')).toBeVisible();
  assert.equal(await page.locator('.gd-tl-track-wrap').evaluate(el => el.style.getPropertyValue('--origin-progress')), '100%');
  await page.locator('.gd-return').click();
  await expect(page.locator('.gd-return')).toHaveCount(0);
  await page.locator('#floor-3').getByLabel('展开被引用原贴全文').click();
  await expect(page.locator('#floor-3 .gd-quote-full-md')).toContainText('先读正文');
  await page.locator('#floor-3').getByLabel('跳至被引用楼层').click();
  await expect(op).toHaveClass(/is-jump-highlighted/);
  await page.locator('.gd-return').click();
  await page.locator('#floor-2').getByLabel('回复该楼层').click();
  await page.locator('#floor-3').getByLabel('引用楼层', { exact: true }).click();
  await page.locator('.gd-reply-textarea').fill('这是通过真实输入框发表的一条回复。');
  await page.getByRole('button', { name: '发表回复', exact: true }).click();
  await expect(page.locator('#floor-4')).toContainText('真实输入框');
  data = await detail('reading');
  const created = data.subGestures.at(-1);
  assert.equal(created.replyToId, 'r2');
  assert.equal(created.quoteId, 'r3');
  const own = page.locator('#floor-4');
  await own.getByLabel('更多操作').click();
  await own.getByLabel('编辑贴文').click();
  await own.locator('textarea').fill('修改后的回复正文。');
  await own.getByRole('button', { name: '保存修改' }).click();
  await expect(own).toContainText('修改后的回复');
  await expect(own.locator('.gd-edit-count-badge')).toContainText('1');
  await expect(own.locator('.gd-first-date')).toHaveAttribute('datetime', created.createdAt);
  assert.equal(
    (await req({ action: 'edit', id: created.id, message: '其他会话' }, 'different-reader')).status(),
    403,
  );
  await own.getByLabel('更多操作').click();
  page.once('dialog', (d) => d.accept());
  await own.getByLabel('删除贴文').click();
  await expect(own).toHaveCount(0);
  // Every reply can expand its unique parent, including replies to the OP.
  await expect(page.locator('#floor-2 .gd-reply-target-pill')).toHaveCount(1);
  await expect(page.locator('#floor-3 .gd-reply-target-pill')).toHaveCount(1);
  await op.getByLabel('更多操作').click();
  await expect(op.locator('.gd-more-drawer__items')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(op.locator('.gd-more-drawer__items')).toHaveCount(0);
  await op.getByLabel('更多操作').click();
  await expect(op.locator('.gd-more-drawer__items')).toBeVisible();
  await page.locator('.gd-zone1-title').click();
  await expect(op.locator('.gd-more-drawer__items')).toHaveCount(0);
  await add('r4', '这是第三层嵌套回复，用于验证逐层就地展开。', {
    parent_id: 'reading',
    reply_to_id: 'r3',
    author_name: '清风',
    created_at: '2026-08-10T09:00:00Z',
  });
  await page.reload();
  await page.locator('#floor-2').getByRole('button', { name: /条直接回复/ }).click();
  const r3Context = page.locator('#floor-2 .gd-reply-context').first();
  await expect(r3Context).toContainText('山禾');
  await r3Context.getByRole('button', { name: /1 条回复/ }).click();
  await expect(page.locator('#floor-2 .gd-reply-context.is-nested')).toContainText('第三层嵌套回复');
  await page.locator('#detail-reply-composer').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await expect.poll(async () => Number(await rail.getAttribute('aria-valuenow'))).toBe(4);
  console.log('real D1: Boost, reactions, parent, nested 3-level replies, independent quote, return, timeline tracking, edit and delete passed');
  await add('long', '长讨论用来验证连续阅读和楼层定位。', { title: '长讨论', views_count: 510 });
  await db
    .prepare(
      "WITH RECURSIVE i(n) AS (VALUES(1) UNION ALL SELECT n+1 FROM i WHERE n<1001) INSERT INTO comments (id,post_slug,parent_id,reply_to_id,post_type,author_id,author_name,message,status,created_at,updated_at) SELECT printf('item_%04d',n),'guestbook','long',CASE WHEN n=999 THEN 'item_0001' ELSE 'long' END,'gesture','regular','读者',printf('第 %d 条回复',n),'published',datetime('2026-09-01','+'||n||' minutes'),datetime('2026-09-01','+'||n||' minutes') FROM i",
    )
    .run();
  const longData = await detail('long');
  assert.equal(longData.subGestures.length, 1001);
  const start = performance.now();
  await page.goto(path + 'long-floor-1000');
  await expect(page.locator('#floor-1000')).toBeInViewport();
  await expect(rail).toHaveAttribute('aria-valuenow', '1000');
  const ms = Math.round(performance.now() - start);
  assert.ok((await page.locator('[data-floor-index]').count()) <= 41);
  await expect(rail.locator('*')).toHaveCount(1);
  await expect(page.locator('.gd-zone6-topic-map')).toContainText('分钟阅读');
  await page.locator('#floor-995').evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
  await expect(rail).toHaveAttribute('aria-valuenow', '995');
  await page.locator('#floor-1000').evaluate((el) => el.scrollIntoView({ behavior: 'instant' }));
  await expect(rail).toHaveAttribute('aria-valuenow', '1000');
  const source = page.locator('#floor-1000');
  await source.locator('.gd-reply-target-pill').click();
  const jumpBtn = source.locator('.gd-reply-context').getByRole('button', { name: '跳至第 2 楼贴文' });
  await jumpBtn.scrollIntoViewIfNeeded();
  // Capture the origin at the actual click, after Playwright's actionability scroll.
  await source.evaluate(el => document.addEventListener('click', () => {
    window.__gestureJumpSourceY = el.getBoundingClientRect().top;
  }, { once: true, capture: true }));
  await jumpBtn.click();
  const y = await page.evaluate(() => window.__gestureJumpSourceY);
  await expect(page.locator('#floor-2')).toBeInViewport();
  await page.locator('.gd-return').click();
  await expect(source).toBeInViewport();
  await expect(source.locator('.gd-reply-target-pill')).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(async () => Math.abs((await source.boundingBox()).y - y), { message: 'cross-page return restores the click-time pixel offset' }).toBeLessThan(3);
  console.log('Cross-page return deviation', Math.abs((await source.boundingBox()).y - y), 'px; parent expansion retained');
  await rail.focus();
  await rail.press('End');
  await expect(page.locator('#floor-1002')).toBeInViewport();
  await rail.press('Home');
  await expect(page.locator('#floor-1')).toBeInViewport();
  const box = await rail.boundingBox();
  await page.mouse.click(box.x + 8, box.y + box.height / 2);
  await expect.poll(async () => Number(await rail.getAttribute('aria-valuenow'))).toBeGreaterThan(480);
  await page.locator('.gd-tl-readout summary').click();
  await page.getByLabel('目标楼层').fill('500');
  await page.getByRole('button', { name: '跳转', exact: true }).click();
  await expect(page.locator('#floor-500')).toBeInViewport();
  await page.locator('#floor-500').getByLabel('复制贴文锚点链接').click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(copied.endsWith('-floor-500~item_0499'));
  await db.prepare("UPDATE comments SET status='deleted' WHERE id='item_0002'").run();
  await page.goto('about:blank');
  await page.goto(copied);
  await expect(page.locator('[data-gesture-id="item_0499"]')).toBeInViewport();
  assert.equal(await page.locator('[data-gesture-id="item_0499"]').getAttribute('data-floor-index'), '499');
  console.log(
    '1,001 replies, deep link ' +
      ms +
      ' ms, ' +
      (await page.locator('[data-floor-index]').count()) +
      ' mounted floors, real rail pointer and keyboard jumps',
  );
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(path + 'long-floor-500');
  await expect(rail).toBeInViewport();
  await expect(page.locator('#floor-500')).toBeInViewport();
  assert.ok((await rail.boundingBox()).y >= 56 && (await rail.boundingBox()).y < 112);
  await add(
    'essay',
    '长文段落。'.repeat(800) +
      '\n\n```js\n' +
      'const identifier = 12345; '.repeat(100) +
      '\n```\n\n$$x^2$$\n\n<details><summary>附注</summary>原始说明</details>',
  );
  await add(
    'formatting',
    '##### 分层标题\n\n- 父级\n  - 子级\n\n[这层](#gesture-long-floor-20) 与 [资源][ref]\n\n[ref]: /guestbook/\n\n![作者图像](/media/shijianus/avatar.jpg)\n\n\x60\x60\x60js\nhttps://example.org/code-only\n\x60\x60\x60',
  );
  await page.goto(path + 'formatting');
  await expect(page.getByRole('heading', { name: '分层标题' })).toBeVisible();
  await expect(page.locator('#floor-1 ul ul li')).toHaveText('子级');
  await expect(page.locator('#floor-1 a').filter({ hasText: '这层' })).toHaveAttribute(
    'href',
    '#gesture-long-floor-20',
  );
  await expect(page.locator('#floor-1 a').filter({ hasText: '资源' })).toHaveAttribute('href', '/guestbook/');
  const figure = page.getByRole('img', { name: '作者图像' });
  await figure.focus();
  await figure.press('Enter');
  await expect(page.locator('.gb-lightbox img')).toBeVisible();
  await page.locator('.gb-lightbox__close').click();
  await expect(page.locator('.gb-lightbox')).toHaveCount(0);
  assert.ok(!(await detail('formatting')).relatedLinks.some((l) => l.url.includes('code-only')));
  await add('essay_reply', '文末。', { parent_id: 'essay' });
  await page.locator('#nav-theme-toggle a').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto(path + 'essay');
  await expect(page.locator('#floor-1')).toBeVisible();
  const mainBody = page.locator('#floor-1 .gd-floor-markdown');
  await mainBody.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + 600, behavior: 'instant' }));
  assert.equal(Math.round((await page.locator('#floor-1 > .gd-avatar-rail .gd-avatar').boundingBox()).y), 112);
  const code = page.locator('[data-gesture-id="essay"] pre');
  await code.scrollIntoViewIfNeeded();
  assert.ok(
    await code.evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
      return el.scrollLeft > 0 && document.documentElement.scrollWidth === innerWidth;
    }),
  );
  await expect(page.locator('#floor-1 .katex-display')).toBeVisible();
  const lightIsolation = await page.evaluate(() => {
    const effectiveLuma = (cssBg) => {
      const m = cssBg.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
      if (!m) return 255;
      const a = m[4] !== undefined ? +m[4] : 1;
      const r = +m[1] * a + 255 * (1 - a);
      const g = +m[2] * a + 255 * (1 - a);
      const b = +m[3] * a + 255 * (1 - a);
      return (r + g + b) / 3;
    };
    const katex = document.querySelector('#floor-1 .katex-display');
    const ta = document.querySelector('.gd-reply-textarea');
    ta.focus();
    const katexBg = getComputedStyle(katex).backgroundColor;
    const taBg = getComputedStyle(ta).backgroundColor;
    const katexLuma = effectiveLuma(katexBg);
    const taLuma = effectiveLuma(taBg);
    return {
      theme: document.documentElement.dataset.theme,
      katexBg,
      taBg,
      katexLuma,
      taLuma,
      katexLight: katexLuma >= 220,
      taLight: taLuma >= 220,
    };
  });
  assert.equal(lightIsolation.katexLight, true, JSON.stringify(lightIsolation));
  assert.equal(lightIsolation.taLight, true, JSON.stringify(lightIsolation));
  assert.equal(lightIsolation.theme, 'light');
  await page.locator('#floor-1 .tk-details summary').click();
  await expect(page.locator('#floor-1 .tk-details-content')).toBeVisible();
  await mainBody.evaluate(el => window.scrollBy({ top: el.getBoundingClientRect().bottom - 100, behavior: 'instant' }));
  const stoppedAvatar = await page.locator('#floor-1 > .gd-avatar-rail .gd-avatar').boundingBox();
  assert.ok(stoppedAvatar.y < 112 && stoppedAvatar.y + stoppedAvatar.height <= (await mainBody.boundingBox()).y + (await mainBody.boundingBox()).height + 20, 'avatar stops at body end before actions');
  await rail.focus();
  await rail.press('End');
  await expect(page.locator('#floor-2')).toBeInViewport();
  await page.locator('#floor-2 .gd-reply-target-pill').click();
  const nested = page.locator('#floor-2 .gd-reply-context.is-parent');
  await nested.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + 600, behavior: 'instant' }));
  await expect.poll(async () => Math.round((await page.locator('#floor-2 > .gd-avatar-rail .gd-avatar').boundingBox()).y)).toBe(112);
  assert.equal(Math.round((await nested.locator('.gd-context-avatar-stack .gd-avatar').boundingBox()).y), 112);
  await page.locator('#floor-2 .gd-floor-markdown').evaluate(el => window.scrollBy({ top: el.getBoundingClientRect().top - 400, behavior: 'instant' }));
  const bodyBefore = (await page.locator('#floor-2 .gd-floor-markdown').boundingBox()).y;
  await nested.getByLabel('收起被回复楼层', { exact: true }).click();
  assert.ok(Math.abs((await page.locator('#floor-2 .gd-floor-markdown').boundingBox()).y - bodyBefore) < 3, 'parent collapse compensates body position');
  console.log(
    '360px sticky progress, long text, horizontally scrollable code, display math, expandable Markdown and endpoint jump passed',
  );
  // Original public board initializes its read/bookmark badges from localStorage.
  // This exact SSR mismatch is reproduced on production; keep its behavior per scope.
  const baselineWarnings = errors.filter(error => error.startsWith('Minified React error #418;'));
  assert.deepEqual(errors.filter(error => !baselineWarnings.includes(error)), []);
  console.log('Preserved production baseline hydration warnings:', baselineWarnings.length);
  console.log('Uncaught browser and React hydration errors', errors.length);
});
