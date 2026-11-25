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
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    await page.screenshot({ path: shots + '/' + name + '.png', animations: 'disabled' });
  };
  const req = (payload, token) =>
    page.request.post(base + '/api/gestures', {
      data: payload,
      headers: token ? { 'X-Comment-Session-Token': token } : {},
    });
  const detail = async (id) =>
    (await page.request.get(base + '/api/gestures?id=' + id + '&trackView=0')).json();

  // 1. Verify legacy pinned_welcome_official fake ad links & >16-char Boost are purged even if persisted in D1
  assert.equal((await detail('pinned_welcome_official')).ok, false);
  assert.equal((await db.prepare('SELECT count(*) n FROM comments').first()).n, 0);
  const welcome = 'pinned_welcome_official';
  await add(
    welcome,
    `欢迎在此留下你的足迹、想法与问候，探讨技术、交流灵感或随心闲聊，期待与你的每一次思想碰撞！✨

在这里你可以自由开启话题（Gesture）、发送短评微语（Boost），或者通过右侧时间轴滑块快速穿梭于长篇讨论之中。相关参考：[博客功能与内容格式指南](/posts/content-formats-and-markup-mastery/) 与 [社区规范与等级体系](/community/identity-levels-and-badges/)。`,
    {
      title: '🌟 欢迎来到读者留言与交流广场',
      tags: JSON.stringify(['官方置顶', '随心闲聊']),
      status: 'pinned',
      created_at: '2026-08-03T08:15:00.000Z',
      updated_at: '2026-08-04T10:30:00.000Z',
      author_id: 'admin',
      author_name: 'shijianus',
      author_avatar: '/media/shijianus/avatar.jpg',
      author_role: 'admin',
      views_count: 1283,
      edit_count: 2,
      likes_count: 19,
      reactions: JSON.stringify({
        summary: { '👍': 8, '❤️': 5, '🚀': 4, '💡': 2 },
        users: { reader_alice: '👍', reader_bob: '🚀' },
        userProfiles: { reader_alice: { name: 'Alice' }, reader_bob: { name: 'Bob_Dev' } },
      }),
    },
  );
  await add('reply_floor_2_official', '体验了右侧的长条百分比楼层滑块，拖拽和点击跳转指定楼层非常灵敏！', {
    parent_id: welcome,
    reply_to_id: welcome,
    author_id: 'reader_alice',
    author_name: 'Alice',
    created_at: '2026-08-03T09:20:00.000Z',
    updated_at: '2026-08-03T09:20:00.000Z',
  });
  await add('reply_floor_3_official', '分级 Boost 把即时短评和深度长帖彻底解耦，单层毛玻璃质感很舒服。', {
    parent_id: welcome,
    reply_to_id: 'reply_floor_2_official',
    author_id: 'reader_bob',
    author_name: 'Bob_Dev',
    created_at: '2026-08-03T11:45:00.000Z',
    updated_at: '2026-08-03T11:45:00.000Z',
  });
  // Insert legacy starter boosts including the old 17-char boost
  await db
    .prepare(
      "INSERT INTO boosts(id,gesture_id,user_id,author_name,author_avatar,content,created_at) VALUES ('boost_detail_op_1','pinned_welcome_official','reader_alice','Alice','','打卡报道！前排支持站长~','2026-08-03T08:30:00.000Z'), ('boost_detail_op_2','pinned_welcome_official','reader_bob','Bob_Dev','','星空背景太帅了！毛玻璃透出质感绝佳','2026-08-03T09:05:00.000Z')",
    )
    .run();

  const welcomeDetail = await detail(welcome);
  assert.equal(welcomeDetail.topicMap.viewsCount, 1283);
  assert.equal(welcomeDetail.subGestures.length, 2);
  assert.ok(!welcomeDetail.gesture.message.includes('博客功能与内容格式指南'), 'fake starter link must be stripped from OP');
  assert.ok(!welcomeDetail.gesture.message.includes('社区规范与等级体系'), 'fake starter link must be stripped from OP');
  assert.equal(welcomeDetail.relatedLinks.length, 0, 'fake starter links must produce 0 related links');
  const opBoosts = welcomeDetail.boostsByGestureId[welcome];
  assert.equal(opBoosts.length, 2);
  assert.ok(
    opBoosts.every((b) => Array.from(b.content).length <= 16),
    'legacy overlong starter boost must be clamped to <= 16 chars: ' + JSON.stringify(opBoosts),
  );

  // Visit welcome thread and verify visual cleanup, reply badge restraint & horizontal Boost pills
  await page.goto(path + welcome);
  await expect(page.locator('#floor-1')).toBeVisible();
  await expect(page.locator('#floor-1 .gd-floor-markdown')).not.toContainText('博客功能与内容格式指南');
  await expect(page.locator('.gd-zone5-links')).toHaveCount(0);
  await expect(page.locator('.gd-zone1-tags')).toHaveText('官方置顶·随心闲聊');
  await expect(page.locator('.gd-tm-views')).toHaveText('1.3 千 觀看');
  await expect(page.locator('.gd-monolithic-shell')).toHaveCount(0);
  await expect(page.locator('.gd-stream-tools')).toHaveCount(0);
  await expect(page.locator('#floor-2 .gd-zone3-boost')).toHaveCount(0);
  // Bug 1 check: Floor 2 (replies to OP) and Floor 3 (immediately below Floor 2) must NEVER show [↪] badge
  await expect(page.locator('#floor-2 .gd-reply-target-pill')).toHaveCount(0);
  await expect(page.locator('#floor-3 .gd-reply-target-pill')).toHaveCount(0);
  await shot('welcome-dark-1440', page.locator('.gd-topbar'));

  // 2. Seed additional real threads for full feature & edge-case coverage
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
    created_at: '2026-08-08T09:30:00Z',
  });
  await add('r3', '同意，紧邻上一楼回复时无需右上角徽章干扰视线。', {
    parent_id: 'reading',
    reply_to_id: 'r2',
    author_name: '山禾',
    quote_id: 'reading',
    quote_source: JSON.stringify({ id: 'reading', authorName: '南山', excerpt: '夜读时记下的问题' }),
    created_at: '2026-08-09T09:00:00Z',
  });
  await add('r4', '跨楼层回复二楼时，右上角才展示 16px 头像徽章并支持原地展开父楼。', {
    parent_id: 'reading',
    reply_to_id: 'r2',
    author_name: '青岚',
    created_at: '2026-08-09T10:00:00Z',
  });

  // Boost 16-grapheme strict backend checks
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
  for (let n = 0; n < 8; n++) {
    await req({ action: 'boost', gestureId: 'reading', content: '摘记 ' + (n + 1), authorName: '小河' });
  }
  for (const [i, e] of ['👍', '❤️', '🚀', '💡', '🔥', '🎉'].entries()) {
    await req({ action: 'react', id: 'reading', emoji: e, authorName: '读者' + i }, 'local-reader-' + i);
  }

  let data = await detail('reading');
  assert.equal(data.relatedLinks.length, 4);
  assert.deepEqual(
    data.relatedLinks.filter((x) => x.kind === 'gesture').map((x) => x.replyCount),
    [1, 1],
  );
  assert.equal(data.relatedLinks.filter((x) => x.kind === 'site').length, 1);
  assert.equal(data.relatedLinks.find((x) => x.kind === 'external').replyCount, undefined);

  // Concurrent reactions
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

  // Authenticated reader reply & delete
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

  // Empty OP: 0 related links (hidden), 0 boost footprint until [⚡] clicked, 0 duplicate buttons
  await page.goto(path + 'empty');
  await expect(page.locator('#floor-1')).toBeVisible();
  await expect(page.locator('.gd-zone5-links')).toHaveCount(0);
  await expect(page.locator('#floor-1 .gd-zone3-boost')).toHaveCount(0);
  await expect(page.locator('#floor-1 .gd-boost-pill')).toHaveCount(0);
  await expect(page.locator('.gd-boost-add')).toHaveCount(0);
  await expect(page.locator('.gd-topbar-btn')).toHaveCount(0);
  await expect(page.locator('.gd-edit-count-badge')).toHaveCount(0);
  assert.ok((await page.locator('.gd-zone6-topic-map').boundingBox()).height <= 58);
  assert.equal(await page.locator('#floor-1 .gd-avatar').evaluate((el) => getComputedStyle(el).borderRadius), '50%');

  // Topic Map adaptive degradation (< 15 replies vs >= 15 & >= 500 views)
  await add('threshold', '热门阈值验证。', { views_count: 499 });
  for (let i = 0; i < 14; i++) await add('threshold_' + i, '参与讨论 ' + i, { parent_id: 'threshold' });
  await page.goto(path + 'threshold');
  await expect(page.locator('.gd-zone6-topic-map')).toHaveClass(/is-light/);
  await expect(page.locator('.gd-tm-metrics')).toHaveCount(0);
  await add('threshold_14', '第十五条回复', { parent_id: 'threshold' });
  await page.reload();
  await expect(page.locator('.gd-zone6-topic-map')).toHaveClass(/is-hot/);
  await expect(page.locator('.gd-tm-metrics dd')).toHaveCount(4);
  await db.prepare("UPDATE comments SET views_count=498 WHERE id='threshold'").run();
  await page.reload();
  await expect(page.locator('.gd-zone6-topic-map')).toHaveClass(/is-light/);

  // Deduplicated real citations + click tracking
  await page.goto(path + 'citations');
  const external = page.getByRole('region', { name: '关联链接' }).getByRole('link');
  await expect(external).toHaveCount(1);
  await expect(external.locator('.gd-related-link-title')).toHaveText('仍可访问的引用');
  await expect(external.locator('.gd-link-clicks')).toHaveText('0');
  await expect(external).toHaveAttribute('href', 'https://example.org/actual-topic');
  const clickRecorded = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/gestures') &&
      response.request().method() === 'POST' &&
      response.request().postDataJSON()?.action === 'link_click',
  );
  const [popup] = await Promise.all([page.waitForEvent('popup'), external.click()]);
  await clickRecorded;
  await popup.close();
  await expect(external.locator('.gd-link-clicks')).toHaveText('1');
  assert.equal((await detail('citations')).topicMap.linksCount, 1);

  // Full 6-spec + bidirectional reply + geometry audit on 'reading' across ALL 7 viewports
  await page.goto(path + 'reading');
  const op = page.locator('#floor-1');
  await expect(op).toContainText('夜读时记下');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await expect(page.locator('.gd-tl-latest')).toHaveText(/刚刚|\d+(分钟|小时|天|个月|年)前/);
  assert.ok(Date.parse(await page.locator('.gd-tl-latest').getAttribute('datetime')) >= Date.parse(data.gesture.createdAt));
  await expect(op.locator('.katex')).toBeVisible();
  await expect(page.locator('.gd-agg-emoji-icons').first().locator('span')).toHaveCount(4);
  // SubGesture #floor-2 has 0 boosts -> zero footprint
  await expect(page.locator('#floor-2 .gd-zone3-boost')).toHaveCount(0);

  const rail = page.getByRole('slider', { name: '跳转楼层' });
  const react = op.locator('.gd-agg-emoji-pill');
  await expect(page.locator('.gd-zone5-links a').filter({ hasText: '夜读时的摘记' })).toHaveCount(2);
  await expect(page.locator('.gd-zone5-links a')).toHaveCount(4);
  await expect(page.locator('.gd-zone5-links a[href^="/posts/"]')).toContainText('shijianus');
  // Bottom minimal borderless timeline buttons exist
  await expect(page.locator('.gd-tl-hot-btn')).toBeVisible();
  await expect(page.locator('.gd-timeline-aside').getByLabel('回复主贴')).toBeVisible();
  await expect(page.locator('.gd-timeline-aside').getByLabel('订阅讨论')).toBeVisible();

  await shot('reading-dark-1440', page.locator('.gd-topbar'));

  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.mouse.move(0, 0);
    await op
      .locator('.gd-zone4-action-bar')
      .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(180);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

    const geometry = await op.evaluate((el) => {
      const box = (s) => el.querySelector(s).getBoundingClientRect();
      const css = (s) => getComputedStyle(el.querySelector(s));
      const mainX = document.querySelector('.gd-zone1-title').getBoundingClientRect().x;
      const textX = box('.gd-floor-markdown').x;
      const shell = document.querySelector('.gd-detail-shell');
      const grid = document.querySelector('.gd-detail-grid');
      const gridStyle = getComputedStyle(grid);
      const canvas = document.querySelector('.gd-reading-canvas');
      const canvasStyle = getComputedStyle(canvas);
      const topbar = document.querySelector('.gd-topbar');
      const topbarStyle = getComputedStyle(topbar);
      const aside = document.querySelector('.gd-timeline-aside');
      const asideStyle = getComputedStyle(aside);
      const boostFlow = el.querySelector('.gd-zone3-boost');
      const boostStyle = getComputedStyle(boostFlow);
      const pills = [...el.querySelectorAll('.gd-boost-pill')];
      const rowYCounts = new Map();
      for (const p of pills) {
        const y = Math.round(p.getBoundingClientRect().y);
        rowYCounts.set(y, (rowYCounts.get(y) || 0) + 1);
      }
      const maxPillsPerRow = Math.max(0, ...rowYCounts.values());
      const tlActionButtons = [...document.querySelectorAll('.gd-tl-actions > button')];
      const tlActionYs = tlActionButtons.map((b) => Math.round(b.getBoundingClientRect().y));
      const tlTopBtn = document.querySelector('.gd-tl-top-btn');
      const tlTopStyle = tlTopBtn ? getComputedStyle(tlTopBtn) : null;
      const tlTopRect = tlTopBtn ? tlTopBtn.getBoundingClientRect() : null;
      const leftZone = el.querySelector('.gd-zone4-left');
      const rightZone = el.querySelector('.gd-zone4-right');
      const opRightLabels = [...el.querySelectorAll('.gd-zone4-right > button, .gd-zone4-right .gd-heart-trigger-btn, .gd-zone4-right .gd-more-drawer > button')].map((b) => b.getAttribute('aria-label'));
      const subRightLabels = [...document.querySelectorAll('#floor-2 .gd-zone4-right > button, #floor-2 .gd-zone4-right .gd-heart-trigger-btn, #floor-2 .gd-zone4-right .gd-more-drawer > button')].map((b) => b.getAttribute('aria-label'));
      const headerRef = document.querySelector('.gd-zone1-tags') || document.querySelector('.gd-zone1-title');
      const opMainTop = el.querySelector('.gd-floor-main').getBoundingClientRect().top;
      const headerToOpGap = Math.round(opMainTop - headerRef.getBoundingClientRect().bottom);
      const sub2Style = getComputedStyle(document.querySelector('#floor-2'));
      const tmStyle = getComputedStyle(document.querySelector('.gd-zone6-topic-map'));
      const parseRgba = (str) => {
        const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
      };

      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        leftAxis: Math.max(
          ...['.gd-zone1-tags', '.gd-zone6-topic-map', '.gd-subscribe-btn', '#floor-1 .gd-avatar-rail', '#floor-2 .gd-avatar-rail'].map((s) =>
            Math.abs(document.querySelector(s).getBoundingClientRect().x - mainX),
          ),
        ),
        contentAxis: Math.round(textX - mainX),
        axis: Math.max(
          ...['.gd-zone4-action-bar', '.gd-zone3-boost', '.gd-author-bar'].map((s) => Math.abs(box(s).x - textX)),
          Math.abs(document.querySelector('.gd-zone5-links').getBoundingClientRect().x - textX),
        ),
        monolithicGone: document.querySelectorAll('.gd-monolithic-shell').length === 0,
        streamToolsGone: document.querySelectorAll('.gd-stream-tools').length === 0,
        firstSubNoDoubleBorder: sub2Style.borderTopWidth === '0px',
        headerToOpGap,
        subFloorPadding: [sub2Style.paddingTop, sub2Style.paddingBottom],
        topicMapPadding: [tmStyle.paddingTop, tmStyle.paddingBottom],
        topbarExternal: !canvas.contains(topbar),
        topbarTransparent: topbarStyle.backgroundColor === 'rgba(0, 0, 0, 0)' && topbarStyle.borderBottomWidth === '0px',
        gridTransparent: gridStyle.backgroundColor === 'rgba(0, 0, 0, 0)' && gridStyle.borderWidth === '0px',
        gridGap: gridStyle.columnGap || gridStyle.gap,
        shellWidth: shell.getBoundingClientRect().width,
        shellCenterError: Math.abs((shell.getBoundingClientRect().left + shell.getBoundingClientRect().right) / 2 - innerWidth / 2),
        shellVeilBg: getComputedStyle(shell, '::before').backgroundImage,
        canvasBg: canvasStyle.backgroundColor,
        canvasBlur: canvasStyle.backdropFilter,
        canvasBorderWidth: canvasStyle.borderTopWidth,
        canvasRadius: canvasStyle.borderRadius,
        canvasShadow: canvasStyle.boxShadow,
        asideTransparent: innerWidth > 760 ? asideStyle.backgroundColor === 'rgba(0, 0, 0, 0)' && asideStyle.borderWidth === '0px' : asideStyle.borderWidth === '0px',
        asideWidth: innerWidth > 760 ? Math.round(aside.getBoundingClientRect().width) : null,
        asideMarginTop: innerWidth > 760 ? asideStyle.marginTop : null,
        trackHeight: innerWidth > 760 ? Math.round(document.querySelector('.gd-tl-track-wrap').getBoundingClientRect().height) : null,
        tlTopBtnOk: innerWidth > 760
          ? Boolean(
              tlTopRect &&
                Math.round(tlTopRect.width) === 30 &&
                Math.round(tlTopRect.height) === 30 &&
                tlTopStyle.borderRadius === '6px' &&
                tlTopStyle.color === 'rgb(148, 163, 184)' &&
                tlTopStyle.borderTopColor === 'rgba(255, 255, 255, 0.1)' &&
                tlTopStyle.backgroundColor === 'rgba(255, 255, 255, 0.05)',
            )
          : tlTopStyle?.display === 'none',
        tlActionsRow: tlActionButtons.length === 3 && Math.max(...tlActionYs) - Math.min(...tlActionYs) <= 2,
        tlActionButtonsStyleOk: tlActionButtons.every((b) => {
          const s = getComputedStyle(b);
          const r = b.getBoundingClientRect();
          return (
            Math.round(r.height) === 30 &&
            s.borderRadius === '6px' &&
            s.color === 'rgb(203, 213, 225)' &&
            s.borderTopColor === 'rgba(255, 255, 255, 0.1)' &&
            s.backgroundColor === 'rgba(255, 255, 255, 0.05)'
          );
        }),
        emojiInLeft: Boolean(leftZone.querySelector('.gd-agg-emoji-pill')) && !rightZone.querySelector('.gd-agg-emoji-pill'),
        emojiRestTransparent: getComputedStyle(el.querySelector('.gd-agg-emoji-pill')).backgroundColor === 'rgba(0, 0, 0, 0)',
        leftZoneGap: getComputedStyle(leftZone).gap,
        rightZoneGap: getComputedStyle(rightZone).gap,
        directReplyColor: getComputedStyle(el.querySelector('.gd-direct-replies-btn')).color,
        directReplyBorderWidth: getComputedStyle(el.querySelector('.gd-direct-replies-btn')).borderTopWidth,
        opRightLabels,
        subRightLabels,
        badgeBorderless: ['.gd-level-badge', '.gd-zone5-links', '.gd-zone1-tag', '.gd-subscribe-btn']
          .filter((s) => document.querySelector(s))
          .every((s) => getComputedStyle(document.querySelector(s)).borderWidth === '0px' && getComputedStyle(document.querySelector(s)).backgroundColor === 'rgba(0, 0, 0, 0)'),
        titleSize: getComputedStyle(document.querySelector('.gd-zone1-title')).fontSize,
        titleColor: getComputedStyle(document.querySelector('.gd-zone1-title')).color,
        authorColor: css('.gd-author-name').color,
        metaTagColor: getComputedStyle(document.querySelector('.gd-zone1-tag')).color,
        dateColor: css('.gd-first-date').color,
        tlDateColor: getComputedStyle(document.querySelector('.gd-tl-latest')).color,
        tlReadoutSummary: [
          getComputedStyle(document.querySelector('.gd-tl-readout summary')).color,
          getComputedStyle(document.querySelector('.gd-tl-readout summary')).fontWeight,
        ],
        bodySize: css('.gd-floor-markdown').fontSize,
        bodyLeading: css('.gd-floor-markdown').lineHeight,
        bodyColor: css('.gd-floor-markdown').color,
        iconColor: css('.gd-icon-btn').color,
        ruleColor: tmStyle.borderTopColor,
        boostDirection: boostStyle.flexDirection,
        boostWrap: boostStyle.flexWrap,
        boostGap: boostStyle.gap,
        boostMarginLeft: boostStyle.marginLeft,
        maxPillsPerRow,
        pillStyleOk: pills.every((p) => {
          const ps = getComputedStyle(p);
          const bg = parseRgba(ps.backgroundColor);
          return (
            ps.borderRadius === '9999px' &&
            ps.whiteSpace === 'nowrap' &&
            ps.backgroundImage === 'none' &&
            bg &&
            bg.r === 255 &&
            bg.g === 255 &&
            bg.b === 255 &&
            Math.abs(bg.a - 0.065) < 0.005 &&
            ps.borderTopWidth === '0px' &&
            ps.fontSize === '12.5px' &&
            ps.color === 'rgb(212, 212, 216)' &&
            p.querySelector('.gd-boost-pill__author') === null &&
            Boolean(p.getAttribute('title')?.includes(':')) &&
            Math.round(p.querySelector('.gd-avatar')?.getBoundingClientRect().width || 0) === 20
          );
        }),
        topbarButtonsGone: document.querySelectorAll('.gd-topbar-btn').length === 0,
        boostAddGone: document.querySelectorAll('.gd-boost-add').length === 0,
        quoteCardStyle: (() => {
          const q = document.querySelector('.gd-quote-card');
          if (!q) return null;
          const qs = getComputedStyle(q);
          return {
            bg: qs.backgroundColor,
            radius: qs.borderRadius,
            leftBorder: `${qs.borderLeftWidth} ${qs.borderLeftColor}`,
            topBorder: qs.borderTopWidth,
            avatarWidth: Math.round(q.querySelector('.gd-avatar')?.getBoundingClientRect().width || 0),
          };
        })(),
        composerStyle: (() => {
          const ta = document.querySelector('.gd-reply-textarea');
          const btn = document.querySelector('.gd-submit-reply-btn');
          return ta && btn
            ? {
                taBg: getComputedStyle(ta).backgroundColor,
                taBorder: getComputedStyle(ta).borderBottomColor,
                btnBg: getComputedStyle(btn).backgroundColor,
                btnColor: getComputedStyle(btn).color,
              }
            : null;
        })(),
        opAvatarWidth: box('.gd-avatar').width,
        subAvatarWidth: document.querySelector('#floor-2 .gd-avatar-rail .gd-avatar').getBoundingClientRect().width,
        subAvatarBg: getComputedStyle(document.querySelector('#floor-2 .gd-avatar-rail .gd-avatar')).backgroundColor,
        emojiGap: css('.gd-agg-emoji-icons').gap,
        emojiPillGap: css('.gd-agg-emoji-pill').gap,
        ruleWidth: getComputedStyle(document.querySelector('.gd-tl-rail'), '::before').width,
        railTrackColor: getComputedStyle(document.querySelector('.gd-tl-rail'), '::before').backgroundColor,
        railChildren: document.querySelector('.gd-tl-rail').children.length,
        thumbWidth: getComputedStyle(document.querySelector('.gd-tl-thumb')).width,
        thumbHeight: getComputedStyle(document.querySelector('.gd-tl-thumb')).height,
        thumbColor: getComputedStyle(document.querySelector('.gd-tl-thumb')).backgroundColor,
      };
    });

    assert.equal(geometry.overflow, 0, JSON.stringify(geometry));
    assert.ok(geometry.axis < 1 && geometry.leftAxis < 1, JSON.stringify(geometry));
    assert.equal(geometry.contentAxis, 56, JSON.stringify(geometry));
    assert.equal(geometry.monolithicGone, true);
    assert.equal(geometry.streamToolsGone, true);
    assert.equal(geometry.firstSubNoDoubleBorder, true);
    assert.ok(geometry.headerToOpGap >= 20 && geometry.headerToOpGap <= 22, JSON.stringify(geometry));
    if (width > 760) assert.deepEqual(geometry.subFloorPadding, ['20px', '20px']);
    assert.deepEqual(geometry.topicMapPadding, ['12px', '12px']);
    assert.equal(geometry.topbarExternal, true);
    assert.equal(geometry.topbarTransparent, true);
    assert.equal(geometry.gridTransparent, true, JSON.stringify(geometry));
    if (width > 760) assert.equal(geometry.gridGap, '28px');
    assert.ok(geometry.shellWidth <= 1060 && geometry.shellCenterError < 2, JSON.stringify(geometry));
    assert.ok(
      geometry.shellVeilBg.includes('rgba(10, 15, 28, 0.68)') &&
        geometry.shellVeilBg.includes('rgba(11, 16, 30, 0.78)'),
      JSON.stringify(geometry.shellVeilBg),
    );
    assert.equal(geometry.canvasBg, 'rgba(0, 0, 0, 0)');
    assert.equal(geometry.canvasBlur, 'none');
    assert.equal(geometry.canvasBorderWidth, '0px');
    assert.equal(geometry.canvasRadius, '0px');
    assert.equal(geometry.canvasShadow, 'none');
    assert.equal(geometry.asideTransparent, true, JSON.stringify(geometry));
    if (width > 760) {
      assert.equal(geometry.asideWidth, 140);
      assert.equal(geometry.asideMarginTop, '98px');
      assert.equal(geometry.trackHeight, 220);
      assert.equal(geometry.rightZoneGap, '14px');
    }
    assert.equal(geometry.tlTopBtnOk, true, JSON.stringify(geometry));
    assert.equal(geometry.tlActionsRow, true, JSON.stringify(geometry));
    assert.equal(geometry.tlActionButtonsStyleOk, true, JSON.stringify(geometry));
    assert.equal(geometry.emojiInLeft, true, JSON.stringify(geometry));
    assert.equal(geometry.emojiRestTransparent, true);
    assert.equal(geometry.leftZoneGap, '12px');
    assert.equal(geometry.directReplyColor, 'rgb(148, 163, 184)');
    assert.equal(geometry.directReplyBorderWidth, '0px');
    assert.deepEqual(geometry.opRightLabels, ['表态点赞', '发送 Boost 短评', '复制贴文锚点链接', '更多操作', '回复主贴']);
    assert.deepEqual(geometry.subRightLabels, ['表态点赞', '发送 Boost 短评', '复制贴文锚点链接', '回复该楼层']);
    assert.equal(geometry.badgeBorderless, true, JSON.stringify(geometry));
    assert.equal(geometry.titleSize, '24px');
    assert.equal(geometry.titleColor, 'rgb(241, 245, 249)');
    assert.equal(geometry.authorColor, 'rgb(241, 245, 249)');
    assert.equal(geometry.metaTagColor, 'rgb(148, 163, 184)');
    assert.equal(geometry.dateColor, 'rgb(148, 163, 184)');
    assert.equal(geometry.tlDateColor, 'rgb(148, 163, 184)');
    assert.deepEqual(geometry.tlReadoutSummary, ['rgb(241, 245, 249)', '700']);
    assert.equal(geometry.bodySize, '16px');
    assert.equal(geometry.bodyLeading, '28px');
    assert.equal(geometry.bodyColor, 'rgb(226, 232, 240)');
    assert.equal(geometry.iconColor, 'rgb(148, 163, 184)');
    assert.equal(geometry.ruleColor, 'rgba(148, 163, 184, 0.14)');
    assert.equal(geometry.boostDirection, 'row');
    assert.equal(geometry.boostWrap, 'wrap');
    assert.equal(geometry.boostGap, '6px');
    assert.equal(geometry.boostMarginLeft, '56px');
    if (width >= 768) assert.ok(geometry.maxPillsPerRow >= 3, 'Boost pills must pack horizontally: ' + JSON.stringify(geometry));
    assert.equal(geometry.pillStyleOk, true, JSON.stringify(geometry));
    assert.equal(geometry.topbarButtonsGone, true);
    assert.equal(geometry.boostAddGone, true);
    assert.deepEqual(geometry.quoteCardStyle, {
      bg: 'rgba(255, 255, 255, 0.027)',
      radius: '6px',
      leftBorder: '2px rgba(255, 255, 255, 0.22)',
      topBorder: '0px',
      avatarWidth: 18,
    });
    assert.deepEqual(geometry.composerStyle, {
      taBg: 'rgb(12, 14, 19)',
      taBorder: 'rgba(255, 255, 255, 0.1)',
      btnBg: 'rgb(228, 228, 231)',
      btnColor: 'rgb(9, 9, 11)',
    });
    assert.equal(geometry.opAvatarWidth, 42);
    assert.equal(geometry.subAvatarWidth, 36);
    assert.ok(
      ['rgb(51, 65, 85)', 'rgb(59, 66, 82)', 'rgb(46, 58, 78)', 'rgb(56, 68, 63)', 'rgb(66, 59, 66)', 'rgb(60, 64, 72)'].includes(
        geometry.subAvatarBg,
      ),
      JSON.stringify(geometry),
    );
    assert.equal(geometry.emojiGap, '1px');
    assert.equal(geometry.emojiPillGap, '6px');
    assert.equal(geometry.ruleWidth, '2px');
    assert.equal(geometry.railTrackColor, 'rgba(56, 189, 248, 0.24)');
    assert.equal(geometry.railChildren, 1, 'Zero dots on timeline rail');
    assert.equal(geometry.thumbWidth, '3px');
    if (width > 760) assert.equal(geometry.thumbHeight, '32px');
    assert.equal(geometry.thumbColor, 'rgb(56, 189, 248)');

    // Upward Emoji Picker check
    await react.click();
    const panel = page.getByRole('dialog', { name: '选择表情' });
    await expect(panel).toBeVisible();
    const a = await react.boundingBox();
    const p = await panel.boundingBox();
    assert.ok(
      p.y >= 0 && p.y + p.height <= a.y - 5 && p.x >= 0 && p.x + p.width <= width,
      JSON.stringify({ width, a, p }),
    );
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);

    const bounds = await rail.boundingBox();
    assert.ok(bounds.width < bounds.height, 'timeline stays a single vertical track on every viewport');
    console.log(width + '×' + height, 'glass, axes, horizontal boost, 2px rail & upward emoji verified');
    if (width === 390) await shot('reading-dark-390', page.locator('.gd-topbar'));
  }

  // Interactive Boost (unified via [⚡] action icon), Emoji, Bidirectional Replies, Quote, Cross-Jump Return, Edit/Delete
  await page.setViewportSize({ width: 1440, height: 900 });
  await op.getByLabel('发送 Boost 短评').click();
  const input = op.getByRole('textbox', { name: 'Boost 短评' });
  await expect(input).toHaveAttribute('maxlength', '16');
  assert.equal(await input.evaluate((el) => getComputedStyle(el).boxShadow), 'none');
  await input.fill('字'.repeat(17));
  assert.equal((await input.inputValue()).length, 16);
  await input.fill('读到这里');
  await op.locator('.gd-boost-inline-submit').click();
  await expect(op.locator('.gd-zone3-boost')).toContainText('读到这里');

  await react.hover();
  await expect(page.getByRole('dialog', { name: '表态明细' })).toContainText('读者0');
  if (shots) await page.screenshot({ path: shots + '/emoji-upward.png', animations: 'disabled' });
  await react.click();
  await page.getByRole('dialog', { name: '选择表情' }).getByRole('button', { name: '🚀' }).click();
  await expect(react).toHaveAttribute('data-reacted', 'true');
  await react.click();
  await page.getByRole('dialog', { name: '选择表情' }).getByRole('button', { name: '🚀' }).click();
  await expect(react).toHaveAttribute('data-reacted', 'false');

  // OP [•••] smooth inline expand reveals [🚩] and [🔖]
  await op.getByLabel('更多操作').click();
  await expect(op.getByLabel('举报与申诉')).toBeVisible();
  await expect(op.getByLabel('书签')).toBeVisible();
  await op.getByLabel('更多操作').click();

  // Bidirectional Replies: 1-to-N children continuous 1px line + zero mouse click focus ring
  const directToggleBtn = op.getByRole('button', { name: /条直接回复/ });
  await directToggleBtn.click();
  await expect(op.locator('.gd-reply-context')).toContainText('江澄');
  const toggleFocusAfterClick = await directToggleBtn.evaluate((el) => {
    const s = getComputedStyle(el);
    return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, borderTopWidth: s.borderTopWidth, bg: s.backgroundColor };
  });
  assert.equal(toggleFocusAfterClick.outlineStyle, 'none', JSON.stringify(toggleFocusAfterClick));
  assert.equal(toggleFocusAfterClick.borderTopWidth, '0px', JSON.stringify(toggleFocusAfterClick));
  assert.equal(toggleFocusAfterClick.bg, 'rgba(0, 0, 0, 0)', JSON.stringify(toggleFocusAfterClick));
  const childrenRail = await op.locator('.gd-reply-context').evaluate((el) => {
    const collapseBtn = el.querySelector('.gd-context-collapse');
    const cs = getComputedStyle(collapseBtn);
    return {
      width: getComputedStyle(el, '::before').width,
      railColor: getComputedStyle(el, '::before').backgroundColor,
      position: getComputedStyle(el.querySelector('.gd-avatar')).position,
      centerOffset: Math.round(el.querySelector('.gd-avatar').getBoundingClientRect().x + 13 - el.getBoundingClientRect().x),
      collapseBox: { w: cs.width, h: cs.height, radius: cs.borderRadius, bg: cs.backgroundColor },
    };
  });
  assert.deepEqual(childrenRail, {
    width: '1px',
    railColor: 'rgba(255, 255, 255, 0.12)',
    position: 'static',
    centerOffset: 13,
    collapseBox: { w: '22px', h: '22px', radius: '5px', bg: 'rgb(14, 16, 21)' },
  });
  if (shots) await page.screenshot({ path: shots + '/direct-replies-expanded.png', animations: 'disabled' });
  await op.getByLabel('收起直接回复', { exact: true }).click();
  await expect(op.locator('.gd-reply-context')).toHaveCount(0);
  // Ensure collapsing with mouse does not leave a stray focus box on the toggle button
  assert.equal(await directToggleBtn.evaluate((el) => getComputedStyle(el).outlineStyle), 'none');

  // Bug 1 check: Floor 2 (replies to OP) and Floor 3 (adjacent reply to Floor 2) hide [↪]; Floor 4 (cross-floor reply to Floor 2) shows 16px [↪]
  await expect(page.locator('#floor-2 .gd-reply-target-pill')).toHaveCount(0);
  await expect(page.locator('#floor-3 .gd-reply-target-pill')).toHaveCount(0);
  await expect(page.locator('#floor-4 .gd-reply-target-pill')).toHaveCount(1);
  assert.equal(
    Math.round((await page.locator('#floor-4 .gd-reply-target-pill .gd-avatar').boundingBox()).width),
    16,
  );

  // Bidirectional Replies: 1-to-1 parent sticky rail + 1px line + cross-jump return anchor
  await page.locator('#floor-4 .gd-reply-target-pill').click();
  await expect(page.locator('#floor-4 .gd-reply-context')).toContainText('给每条摘记');
  assert.equal(
    await page.locator('#floor-4 .gd-context-avatar-stack').evaluate((el) => getComputedStyle(el).position),
    'sticky',
  );
  assert.equal(
    await page
      .locator('#floor-4 .gd-reply-context.is-parent .gd-context-rail')
      .evaluate((el) => getComputedStyle(el, '::before').width),
    '1px',
  );
  await shot('bidirectional-parent', page.locator('#floor-4 .gd-reply-context'));
  await expect(page.locator('.gd-return')).toHaveCount(0);
  await page.locator('#floor-4 .gd-reply-context').getByRole('button', { name: '跳至第 2 楼贴文' }).click();
  await expect(page.locator('.gd-return')).toBeVisible();
  assert.equal(await page.locator('.gd-tl-track-wrap').evaluate((el) => el.style.getPropertyValue('--origin-progress')), '100%');
  await page.locator('.gd-return').click();
  await expect(page.locator('.gd-return')).toHaveCount(0);

  // Independent quote expand & jump + return
  await page.locator('#floor-3').getByLabel('展开被引用原贴全文').click();
  await expect(page.locator('#floor-3 .gd-quote-full-md')).toContainText('先读正文');
  await page.locator('#floor-3').getByLabel('跳至被引用楼层').click();
  await expect(op).toHaveClass(/is-jump-highlighted/);
  await page.locator('.gd-return').click();
  await expect(page.locator('.gd-return')).toHaveCount(0);

  // Reply, edit, delete
  await page.locator('#floor-2').getByLabel('回复该楼层').click();
  await page.locator('.gd-reply-textarea').fill('这是通过真实输入框发表的一条回复。');
  await page.getByRole('button', { name: '发表回复', exact: true }).click();
  await expect(page.locator('#floor-5')).toContainText('真实输入框');
  data = await detail('reading');
  const created = data.subGestures.at(-1);
  assert.equal(created.replyToId, 'r2');
  const own = page.locator('#floor-5');
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

  // 3. Silky-smooth zero-jitter pointer drag test on a multi-floor thread
  await add('dragtest', '主贴正文：测试丝滑无抖动拖拽状态机。'.repeat(18), { title: '拖拽状态机专项验证' });
  for (let i = 1; i <= 10; i++) {
    await add('drag_' + i, `第 ${i} 条回复正文：用于撑开页面高度，验证 PointerCapture 与瞬时滚动完全同步无回跳。`.repeat(12), {
      parent_id: 'dragtest',
      reply_to_id: 'dragtest',
      created_at: `2026-08-08T10:${String(i).padStart(2, '0')}:00Z`,
    });
  }
  await page.goto(path + 'dragtest');
  await expect(page.locator('#floor-11')).toBeVisible();
  const dragRailBox = await rail.boundingBox();
  const cx = dragRailBox.x + dragRailBox.width / 2;
  await page.mouse.move(cx, dragRailBox.y + 4);
  await page.mouse.down();
  await expect(page.locator('.gd-tl-track-wrap')).toHaveAttribute('data-dragging', 'true');
  const scrollSamples = [];
  for (const frac of [0.2, 0.45, 0.7, 0.95]) {
    await page.mouse.move(cx, dragRailBox.y + dragRailBox.height * frac, { steps: 3 });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const sample = await page.evaluate(() => ({
      scrollY: window.scrollY,
      floor: Number(document.querySelector('[role="slider"]').getAttribute('aria-valuenow')),
      dragging: document.querySelector('.gd-tl-track-wrap').getAttribute('data-dragging'),
    }));
    scrollSamples.push(sample);
  }
  await page.mouse.up();
  await expect(page.locator('.gd-tl-track-wrap')).toHaveAttribute('data-dragging', 'false');
  for (let i = 1; i < scrollSamples.length; i++) {
    assert.ok(scrollSamples[i].dragging === 'true', 'must stay in dragging state');
    assert.ok(scrollSamples[i].scrollY >= scrollSamples[i - 1].scrollY, 'scrollY must increase monotonically with zero jitter: ' + JSON.stringify(scrollSamples));
    assert.ok(scrollSamples[i].floor >= scrollSamples[i - 1].floor, 'floor preview must increase monotonically: ' + JSON.stringify(scrollSamples));
  }
  assert.ok(scrollSamples.at(-1).scrollY > 500 && scrollSamples.at(-1).floor >= 9, 'drag must scroll smoothly to bottom floors: ' + JSON.stringify(scrollSamples));
  console.log('Silky drag state machine verified (zero jitter):', scrollSamples);

  // 4. Paginated 1,001-reply stress test + cross-page jump/return + keyboard + input jump
  await add('long', '长讨论用来验证连续阅读和楼层定位。', { title: '长讨论', views_count: 510 });
  await db
    .prepare(
      "WITH RECURSIVE i(n) AS (VALUES(1) UNION ALL SELECT n+1 FROM i WHERE n<1001) INSERT INTO comments (id,post_slug,parent_id,reply_to_id,post_type,author_id,author_name,message,status,created_at,updated_at) SELECT printf('item_%04d',n),'guestbook','long',CASE WHEN n=999 THEN 'item_0001' ELSE 'long' END,'gesture','regular','读者',printf('第 %d 条回复',n),'published',datetime('2026-09-01','+'||n||' minutes'),datetime('2026-09-01','+'||n||' minutes') FROM i",
    )
    .run();
  await page.goto(path + 'long-floor-1000');
  await expect(page.locator('#floor-1000')).toBeInViewport();
  await expect(rail).toHaveAttribute('aria-valuenow', '1000');
  assert.ok((await page.locator('[data-floor-index]').count()) <= 41);
  await expect(rail.locator('*')).toHaveCount(1);

  const source = page.locator('#floor-1000');
  await source.locator('.gd-reply-target-pill').click();
  const jumpBtn = source.locator('.gd-reply-context').getByRole('button', { name: '跳至第 2 楼贴文' });
  await jumpBtn.scrollIntoViewIfNeeded();
  await source.evaluate((el) =>
    document.addEventListener(
      'click',
      () => {
        window.__gestureJumpSourceY = el.getBoundingClientRect().top;
      },
      { once: true, capture: true },
    ),
  );
  await jumpBtn.click();
  const y = await page.evaluate(() => window.__gestureJumpSourceY);
  await expect(page.locator('#floor-2')).toBeInViewport();
  await page.locator('.gd-return').click();
  await expect(source).toBeInViewport();
  await expect(source.locator('.gd-reply-target-pill')).toHaveAttribute('aria-expanded', 'true');
  await expect
    .poll(async () => Math.abs((await source.boundingBox()).y - y))
    .toBeLessThan(3);

  await rail.focus();
  await rail.press('End');
  await expect(page.locator('#floor-1002')).toBeInViewport();
  await rail.press('Home');
  await expect(page.locator('#floor-1')).toBeInViewport();
  const box = await rail.boundingBox();
  await page.mouse.click(box.x + 8, box.y + box.height / 2);
  await expect.poll(async () => Number(await rail.getAttribute('aria-valuenow'))).toBeGreaterThan(480);

  // 5. Light theme + mobile 360px sticky avatar stopping & parent collapse compensation
  await add('essay', '长文段落。'.repeat(800) + '\n\n```js\n' + 'const identifier = 12345; '.repeat(100) + '\n```\n\n$$x^2$$', {
    title: '长文粘性头像验证',
    created_at: '2026-08-08T08:00:00Z',
  });
  await add('essay_long_parent', '这是一条较长的二楼回复，用来验证跨楼展开父楼时的双粘性头像与收起滚动补偿。'.repeat(160), {
    parent_id: 'essay',
    reply_to_id: 'essay',
    author_name: '林深',
    created_at: '2026-08-08T08:10:00Z',
  });
  await add('essay_mid', '中间插楼讨论。', {
    parent_id: 'essay',
    reply_to_id: 'essay',
    author_name: '知秋',
    created_at: '2026-08-08T08:20:00Z',
  });
  await add('essay_reply', '跨楼层回复二楼长文。', {
    parent_id: 'essay',
    reply_to_id: 'essay_long_parent',
    author_name: '拾光',
    created_at: '2026-08-08T08:30:00Z',
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#nav-theme-toggle a').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto(path + welcome);
  await expect(page.locator('#floor-1')).toBeVisible();
  assert.equal(
    await page.locator('.gd-reading-canvas').evaluate((el) => getComputedStyle(el).backgroundColor),
    'rgba(0, 0, 0, 0)',
  );
  assert.ok(
    await page
      .locator('.gd-detail-shell')
      .evaluate((el) => getComputedStyle(el, '::before').backgroundImage.includes('rgba(255, 255, 255, 0.78)')),
  );
  await shot('welcome-light-1440', page.locator('.gd-topbar'));

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(path + 'essay');
  await expect(page.locator('#floor-1')).toBeVisible();
  const mainBody = page.locator('#floor-1 .gd-floor-markdown');
  await mainBody.evaluate((el) =>
    window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + 600, behavior: 'instant' }),
  );
  assert.equal(Math.round((await page.locator('#floor-1 .gd-avatar-rail .gd-avatar').boundingBox()).y), 112);
  await mainBody.evaluate((el) =>
    window.scrollBy({ top: el.getBoundingClientRect().bottom - 100, behavior: 'instant' }),
  );
  const stoppedAvatar = await page.locator('#floor-1 .gd-avatar-rail .gd-avatar').boundingBox();
  const bodyBox = await mainBody.boundingBox();
  assert.ok(
    stoppedAvatar.y < 112 && stoppedAvatar.y + stoppedAvatar.height <= bodyBox.y + bodyBox.height + 20,
    'avatar must stop cleanly above action bar',
  );
  await rail.focus();
  await rail.press('End');
  await expect(page.locator('#floor-4')).toBeInViewport();
  await page.locator('#floor-4 .gd-reply-target-pill').click();
  const nested = page.locator('#floor-4 .gd-reply-context.is-parent');
  await nested.evaluate((el) =>
    window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + 600, behavior: 'instant' }),
  );
  await expect
    .poll(async () => Math.round((await page.locator('#floor-4 .gd-avatar-rail .gd-avatar').boundingBox()).y))
    .toBe(112);
  assert.equal(Math.round((await nested.locator('.gd-context-avatar-stack .gd-avatar').boundingBox()).y), 112);
  await page
    .locator('#floor-4 .gd-floor-markdown')
    .evaluate((el) => window.scrollBy({ top: el.getBoundingClientRect().top - 400, behavior: 'instant' }));
  const bodyBefore = (await page.locator('#floor-4 .gd-floor-markdown').boundingBox()).y;
  await nested.getByLabel('收起被回复楼层', { exact: true }).click();
  assert.ok(
    Math.abs((await page.locator('#floor-4 .gd-floor-markdown').boundingBox()).y - bodyBefore) < 3,
    'parent collapse must compensate body scroll position',
  );

  const baselineWarnings = errors.filter((error) => error.startsWith('Minified React error #418;'));
  assert.deepEqual(
    errors.filter((error) => !baselineWarnings.includes(error)),
    [],
  );
  console.log('ALL GESTURE DETAIL REWRITE CHECKS PASSED! Baseline warnings:', baselineWarnings.length);
});
