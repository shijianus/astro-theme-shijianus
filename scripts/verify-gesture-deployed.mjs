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
const result = {
  base,
  id,
  viewports: [],
  screenshots: [],
  interactions: [],
  pageErrors: [],
  assetFailures: [],
  blockedWrites: [],
};

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('shijianus-theme', 'dark'));
  await context.route('**/*', (route) => {
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
  page.on('pageerror', (error) => result.pageErrors.push(error.message));
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.origin === base && response.status() >= 400 && /\.(js|css|woff2?)(?:$|\?)/.test(url.pathname)) {
      result.assetFailures.push({ path: url.pathname, status: response.status() });
    }
  });

  const board = base + '/guestbook/';
  await page.goto(board, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await expect(page.locator('.gb-gesture-row').first()).toBeVisible({ timeout: 45000 });
  await expect(page.locator('.gb-boost-track')).toHaveCount(3);
  result.publicBoostRows = await page
    .locator('.gb-boost-track')
    .evaluateAll((rows) => rows.map((row) => row.querySelectorAll('.gb-boost-pill-card').length));
  result.visibleTopics = await page.locator('.gb-gesture-row').count();

  // Simulate real-user navigation from a scrolled /guestbook/ board into the detail view
  await page.evaluate(() => window.scrollTo({ top: 360, behavior: 'instant' }));
  const responsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === '/api/gestures' && url.searchParams.get('id') === id;
  });
  const matchingRow = page.locator('.gb-gesture-row').first();
  if (id === 'pinned_welcome_official' && (await matchingRow.count())) {
    await matchingRow.click();
  } else {
    await page.goto(board + '#gesture-' + id, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  const response = await responsePromise;
  assert.equal(response.status(), 200);
  assert.match(response.headers()['content-type'], /application\/json/);
  const data = await response.json();
  assert.equal(data.gesture?.id, id);
  result.topic = {
    title: data.gesture.title,
    replies: data.subGestures.length,
    views: data.topicMap.viewsCount,
    links: data.relatedLinks.length,
    boosts: (data.boostsByGestureId?.[id] || []).map((b) => b.content),
  };

  if (id === 'pinned_welcome_official') {
    assert.ok(!data.gesture.message.includes('博客功能与内容格式指南'), 'fake starter ref must be stripped');
    assert.ok(!data.gesture.message.includes('社区规范与等级体系'), 'fake starter ref must be stripped');
    assert.equal(data.relatedLinks.length, 0, 'pinned_welcome_official should have 0 fake related links');
  }
  for (const list of Object.values(data.boostsByGestureId || {})) {
    for (const b of list) {
      assert.ok(Array.from(b.content).length <= 16, 'Boost exceeds 16 chars: ' + b.content);
    }
  }

  const op = page.locator('#floor-1');
  await expect(op.locator('.gd-floor-markdown')).toBeVisible({ timeout: 45000 });
  await expect(page.locator('.gd-zone1-title')).toHaveText(data.gesture.title);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(260);
  // Assert topbar is NOT swallowed by fixed #nav right after navigating from scrolled /guestbook/
  const initialEntry = await page.evaluate(() => ({
    scrollY: Math.round(window.scrollY),
    navClearance: Math.round(
      document.querySelector('.gd-topbar').getBoundingClientRect().top -
        document.querySelector('#nav').getBoundingClientRect().bottom,
    ),
  }));
  assert.equal(initialEntry.scrollY, 0, 'Entering detail view must start at top: ' + JSON.stringify(initialEntry));
  assert.ok(initialEntry.navClearance >= 16, 'Topbar swallowed by #nav on entry: ' + JSON.stringify(initialEntry));

  const screenshot = async (name) => {
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    });
    await page.screenshot({ path: resolve(output, name + '.png'), animations: 'disabled' });
    result.screenshots.push(name + '.png');
  };

  const hot = data.subGestures.length >= 15 && data.topicMap.viewsCount >= 500;
  await expect(page.locator('.gd-zone6-topic-map')).toHaveClass(hot ? /is-hot/ : /is-light/);
  await expect(page.locator('.gd-tm-metrics')).toHaveCount(hot ? 1 : 0);
  if (!data.relatedLinks.length) await expect(page.locator('.gd-zone5-links')).toHaveCount(0);
  assert.equal(new Set(data.relatedLinks.map((link) => link.url)).size, data.relatedLinks.length);

  for (const node of data.subGestures) {
    const floor = page.locator('[data-gesture-id="' + node.id + '"]');
    if (!(await floor.count())) continue;
    await expect(floor.locator('.gd-edit-count-badge')).toHaveCount(node.editCount > 0 ? 1 : 0);
    await expect(floor.locator('.gd-first-date')).toHaveAttribute('datetime', node.createdAt);
    if (!(data.boostsByGestureId?.[node.id]?.length)) {
      await expect(floor.locator('.gd-zone3-boost')).toHaveCount(0);
    }
  }

  const sizes = [
    [1920, 1080],
    [1440, 900],
    [1280, 800],
    [1024, 768],
    [768, 1024],
    [390, 844],
    [360, 800],
  ];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.mouse.move(0, 0);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

    const geometry = await page.evaluate(() => {
      const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
      const style = (selector) => getComputedStyle(document.querySelector(selector));
      const left = rect('.gd-zone1-title').x;
      const content = rect('#floor-1 .gd-floor-markdown').x;
      const shellBox = rect('.gd-detail-shell');
      const canvas = document.querySelector('.gd-reading-canvas');
      const topbar = document.querySelector('.gd-topbar');
      const leftTargets = [
        '.gd-zone1-tags',
        '.gd-zone6-topic-map',
        ...Array.from(document.querySelectorAll('[data-floor-index]'), (el) => '#' + el.id + ' .gd-avatar-rail'),
      ].filter((selector) => document.querySelector(selector));
      const contentTargets = [
        '#floor-1 .gd-author-bar',
        '#floor-1 .gd-zone4-action-bar',
        '.gd-zone5-links',
        '#floor-1 .gd-zone3-boost',
      ].filter((selector) => document.querySelector(selector));
      const borderless = ['.gd-role-badge', '.gd-level-badge', '.gd-zone5-links', '.gd-zone1-tag']
        .filter((selector) => document.querySelector(selector))
        .every((selector) => style(selector).borderWidth === '0px');
      const boostFlow = document.querySelector('#floor-1 .gd-zone3-boost');
      const boostStyle = boostFlow ? getComputedStyle(boostFlow) : null;
      const boostPills = [...document.querySelectorAll('#floor-1 .gd-boost-pill')];
      const tlButtons = [...document.querySelectorAll('.gd-tl-actions > button')];
      const tlButtonYs = tlButtons.map((b) => Math.round(b.getBoundingClientRect().y));
      const tlTopBtn = document.querySelector('.gd-tl-top-btn');
      const tlTopStyle = tlTopBtn ? getComputedStyle(tlTopBtn) : null;
      const tlTopRect = tlTopBtn ? tlTopBtn.getBoundingClientRect() : null;
      const opLeft = document.querySelector('#floor-1 .gd-zone4-left');
      const opRight = document.querySelector('#floor-1 .gd-zone4-right');
      const headerRef = document.querySelector('.gd-zone1-tags') || document.querySelector('.gd-zone1-title');
      const opMainTop = document.querySelector('#floor-1 .gd-floor-main').getBoundingClientRect().top;
      const headerToOpGap = Math.round(opMainTop - headerRef.getBoundingClientRect().bottom);
      const asideTop = rect('.gd-timeline-aside').top;
      const opAvatarTop = rect('#floor-1 .gd-avatar-rail .gd-avatar').top;
      const tmStyle = style('.gd-zone6-topic-map');
      const parseRgba = (str) => {
        const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null;
      };
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        leftAxisError: Math.max(...leftTargets.map((selector) => Math.abs(rect(selector).x - left))),
        contentAxis: Math.round(content - left),
        contentAxisError: Math.max(...contentTargets.map((selector) => Math.abs(rect(selector).x - content))),
        centerError: Math.abs(shellBox.x + shellBox.width / 2 - innerWidth / 2),
        shellWidth: shellBox.width,
        shellVeilBg: getComputedStyle(document.querySelector('.gd-detail-shell'), '::before').backgroundImage,
        shellVeilRightExtent: parseFloat(getComputedStyle(document.querySelector('.gd-detail-shell'), '::before').right),
        monolithicGone: document.querySelectorAll('.gd-monolithic-shell').length === 0,
        streamToolsGone: document.querySelectorAll('.gd-stream-tools').length === 0,
        topbarButtonsGone: document.querySelectorAll('.gd-topbar-btn').length === 0,
        boostAddGone: document.querySelectorAll('.gd-boost-add').length === 0,
        topbarExternal: !canvas.contains(topbar),
        topbarBottomBorder: style('.gd-topbar').borderBottomWidth,
        navClearance: Math.round(rect('.gd-topbar').y - rect('#nav').bottom),
        topbarToCanvasGap: Math.round((innerWidth > 760 ? canvas : document.querySelector('.gd-detail-grid')).getBoundingClientRect().top - topbar.getBoundingClientRect().bottom),
        headerToOpGap,
        topicMapPadding: [tmStyle.paddingTop, tmStyle.paddingBottom],
        ruleColor: tmStyle.borderTopColor,
        timelineVsOpAvatarDelta: innerWidth > 760 ? Math.round(asideTop - opAvatarTop) : null,
        gridBg: style('.gd-detail-grid').backgroundColor,
        gridGap: style('.gd-detail-grid').columnGap || style('.gd-detail-grid').gap,
        canvasBg: style('.gd-reading-canvas').backgroundColor,
        canvasBlur: style('.gd-reading-canvas').backdropFilter,
        canvasBorderWidth: style('.gd-reading-canvas').borderTopWidth,
        canvasRadius: style('.gd-reading-canvas').borderRadius,
        canvasShadow: style('.gd-reading-canvas').boxShadow,
        title: [style('.gd-zone1-title').fontSize, style('.gd-zone1-title').color],
        body: [
          style('.gd-floor-markdown').fontSize,
          style('.gd-floor-markdown').lineHeight,
          style('.gd-floor-markdown').color,
        ],
        icon: style('.gd-icon-btn').color,
        directReplyColor: opLeft.querySelector('.gd-direct-replies-btn') ? getComputedStyle(opLeft.querySelector('.gd-direct-replies-btn')).color : null,
        directReplyBorderWidth: opLeft.querySelector('.gd-direct-replies-btn') ? getComputedStyle(opLeft.querySelector('.gd-direct-replies-btn')).borderTopWidth : null,
        emojiInLeft: Boolean(opLeft.querySelector('.gd-agg-emoji-pill')) && !opRight.querySelector('.gd-agg-emoji-pill'),
        leftGap: getComputedStyle(opLeft).gap,
        rightGap: getComputedStyle(opRight).gap,
        borderless,
        boostFlow: boostStyle
          ? { dir: boostStyle.flexDirection, wrap: boostStyle.flexWrap, ml: boostStyle.marginLeft, gap: boostStyle.gap }
          : null,
        boostMatteOk: boostPills.every((p) => {
          const ps = getComputedStyle(p);
          const bg = parseRgba(ps.backgroundColor);
          return (
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
            Math.round(p.querySelector('.gd-avatar')?.getBoundingClientRect().width || 0) === 20
          );
        }),
        railWidth: getComputedStyle(document.querySelector('.gd-tl-rail'), '::before').width,
        railTrackColor: getComputedStyle(document.querySelector('.gd-tl-rail'), '::before').backgroundColor,
        trackHeight: innerWidth > 760 ? Math.round(rect('.gd-tl-track-wrap').height) : null,
        thumbWidth: style('.gd-tl-thumb').width,
        thumbHeight: style('.gd-tl-thumb').height,
        thumbColor: style('.gd-tl-thumb').backgroundColor,
        tlReadoutSummary: [
          style('.gd-tl-readout summary').color,
          style('.gd-tl-readout summary').fontWeight,
        ],
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
        railChildren: document.querySelector('.gd-tl-rail').children.length,
        timelineBg: style('.gd-timeline-aside').backgroundColor,
        tlActionsRow: tlButtons.length === 3 && Math.max(...tlButtonYs) - Math.min(...tlButtonYs) <= 2,
        tlActionButtonsStyleOk: tlButtons.every((b) => {
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
        activityWhiteSpace: style('.gd-tl-latest').whiteSpace,
        opAvatar: rect('#floor-1 .gd-avatar-rail .gd-avatar').width,
        subAvatars: Array.from(document.querySelectorAll('.is-sub-floor .gd-avatar-rail .gd-avatar'), (el) =>
          el.getBoundingClientRect().width,
        ),
      };
    });

    assert.equal(geometry.overflow, 0, JSON.stringify(geometry));
    assert.ok(geometry.leftAxisError < 1 && geometry.contentAxisError < 1, JSON.stringify(geometry));
    assert.equal(geometry.contentAxis, 56, JSON.stringify(geometry));
    assert.ok(geometry.shellWidth <= 1060 && geometry.centerError < 2, JSON.stringify(geometry));
    assert.ok(
      geometry.shellVeilBg.includes('rgba(10, 15, 28, 0.68)') &&
        geometry.shellVeilBg.includes('rgba(11, 16, 30, 0.78)'),
      JSON.stringify(geometry.shellVeilBg),
    );
    if (width >= 1280) assert.ok(geometry.shellVeilRightExtent <= -100, JSON.stringify(geometry));
    assert.equal(geometry.monolithicGone, true);
    assert.equal(geometry.streamToolsGone, true);
    assert.equal(geometry.topbarButtonsGone, true);
    assert.equal(geometry.boostAddGone, true);
    assert.equal(geometry.topbarExternal, true);
    assert.equal(geometry.topbarBottomBorder, '0px');
    assert.ok(geometry.navClearance >= 16, 'topbar must clear fixed #nav by >= 16px: ' + JSON.stringify(geometry));
    assert.ok(geometry.topbarToCanvasGap >= 12 && geometry.topbarToCanvasGap <= 16, JSON.stringify(geometry));
    assert.ok(geometry.headerToOpGap >= 20 && geometry.headerToOpGap <= 22, JSON.stringify(geometry));
    assert.deepEqual(geometry.topicMapPadding, ['12px', '12px']);
    assert.equal(geometry.ruleColor, 'rgba(148, 163, 184, 0.14)');
    assert.equal(geometry.gridBg, 'rgba(0, 0, 0, 0)');
    if (width > 760) {
      assert.equal(geometry.gridGap, '28px');
      assert.equal(geometry.rightGap, '14px');
    }
    assert.equal(geometry.canvasBg, 'rgba(0, 0, 0, 0)');
    assert.equal(geometry.canvasBlur, 'none');
    assert.equal(geometry.canvasBorderWidth, '0px');
    assert.equal(geometry.canvasRadius, '0px');
    assert.equal(geometry.canvasShadow, 'none');
    assert.deepEqual(geometry.title, ['24px', 'rgb(241, 245, 249)']);
    assert.deepEqual(geometry.body, ['16px', '28px', 'rgb(226, 232, 240)']);
    assert.equal(geometry.icon, 'rgb(148, 163, 184)');
    if (geometry.directReplyColor) {
      assert.equal(geometry.directReplyColor, 'rgb(148, 163, 184)');
      assert.equal(geometry.directReplyBorderWidth, '0px');
    }
    assert.equal(geometry.emojiInLeft, true);
    assert.equal(geometry.leftGap, '12px');
    assert.ok(geometry.borderless);
    if (geometry.boostFlow) {
      assert.deepEqual(geometry.boostFlow, { dir: 'row', wrap: 'wrap', ml: '56px', gap: '6px' });
      assert.equal(geometry.boostMatteOk, true, JSON.stringify(geometry));
    }
    assert.equal(geometry.railWidth, '2px');
    assert.equal(geometry.railTrackColor, 'rgba(56, 189, 248, 0.24)');
    if (width > 760) {
      assert.equal(geometry.trackHeight, 220);
      assert.equal(geometry.thumbHeight, '32px');
    }
    assert.equal(geometry.thumbWidth, '3px');
    assert.equal(geometry.thumbColor, 'rgb(56, 189, 248)');
    assert.deepEqual(geometry.tlReadoutSummary, ['rgb(241, 245, 249)', '700']);
    assert.equal(geometry.tlTopBtnOk, true, JSON.stringify(geometry));
    assert.equal(geometry.railChildren, 1);
    assert.equal(geometry.timelineBg, 'rgba(0, 0, 0, 0)');
    assert.equal(geometry.tlActionsRow, true);
    assert.equal(geometry.tlActionButtonsStyleOk, true, JSON.stringify(geometry));
    if (width <= 760) assert.equal(geometry.activityWhiteSpace, 'nowrap');
    assert.equal(geometry.opAvatar, 42);
    assert.ok(geometry.subAvatars.every((value) => value === 36));
    result.viewports.push({ width, height, ...geometry });
    console.log('Layout', width + '×' + height, JSON.stringify(geometry));
    if ([1440, 390, 360].includes(width)) await screenshot('dark-' + width);

    const trigger = op.locator('.gd-agg-emoji-pill');
    await trigger.click();
    const panel = page.getByRole('dialog', { name: '选择表情' });
    await expect(panel).toBeVisible();
    const a = await trigger.boundingBox();
    const p = await panel.boundingBox();
    assert.ok(p.y >= 0 && p.y + p.height <= a.y - 5 && p.x >= 0 && p.x + p.width <= width, JSON.stringify({ width, a, p }));
    if (width === 1440) await screenshot('emoji-upward');
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
  }
  result.interactions.push('Upward Emoji picker at all seven viewport sizes');

  await page.setViewportSize({ width: 1440, height: 900 });
  await op.getByLabel('发送 Boost 短评').click();
  const boost = op.getByRole('textbox', { name: 'Boost 短评', exact: true });
  await expect(boost).toHaveAttribute('maxlength', '16');
  assert.equal(await boost.evaluate((el) => getComputedStyle(el).boxShadow), 'none');
  await boost.fill('字'.repeat(17));
  assert.equal((await boost.inputValue()).length, 16);
  await boost.fill('');
  await page.locator('.gd-zone1-title').click();
  result.interactions.push('Unified [⚡] Boost input rejects character 17 with zero blue glow; no submission');

  await page.locator('.gd-summary-toggle').click();
  await expect(page.getByRole('region', { name: '讨论摘录' })).toBeVisible();
  await page.locator('.gd-summary-toggle').click();
  result.interactions.push('Topic Map summary toggles in place');

  await expect(page.locator('.gd-tl-latest')).toHaveText(/刚刚|\d+(分钟|小时|天|个月|年)前/);
  assert.ok(Date.parse(await page.locator('.gd-tl-latest').getAttribute('datetime')) >= Date.parse(data.gesture.createdAt));

  // Verify pointer drag on live timeline
  const rail = page.getByRole('slider', { name: '跳转楼层' });
  const rbox = await rail.boundingBox();
  await page.mouse.move(rbox.x + rbox.width / 2, rbox.y + 4);
  await page.mouse.down();
  await expect(page.locator('.gd-tl-track-wrap')).toHaveAttribute('data-dragging', 'true');
  await page.mouse.move(rbox.x + rbox.width / 2, rbox.y + rbox.height * 0.8, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator('.gd-tl-track-wrap')).toHaveAttribute('data-dragging', 'false');
  result.interactions.push('Live timeline pointer drag state machine verified');

  if (data.subGestures.length) {
    const childrenToggle = op.locator('.gd-direct-replies-btn');
    if (await childrenToggle.count()) {
      await expect(childrenToggle).toHaveText(/^\d+ 条回复$/);
      await childrenToggle.click();
      const childrenCtx = op.locator('.gd-reply-context.is-children');
      await expect(childrenCtx).toBeVisible();
      // Verify clicking [N 条回复] leaves zero outline/underline and 1px rail aligns strictly at 0px error + ↓ jump below body left
      const toggleMetrics = await childrenToggle.evaluate((el) => {
        const s = getComputedStyle(el);
        return { outlineStyle: s.outlineStyle, textDecorationLine: s.textDecorationLine, borderBottomWidth: s.borderBottomWidth };
      });
      assert.deepEqual(toggleMetrics, { outlineStyle: 'none', textDecorationLine: 'none', borderBottomWidth: '0px' });
      const childrenRailMetrics = await page.evaluate(() => {
        const ctx = document.querySelector('#floor-1 .gd-reply-context.is-children');
        const ctxRect = ctx.getBoundingClientRect();
        const railStyle = getComputedStyle(ctx, '::before');
        const railCenter = ctxRect.left + parseFloat(railStyle.left) + parseFloat(railStyle.width) / 2;
        const centers = [
          ...[...ctx.querySelectorAll(':scope > .gd-context-entry .gd-avatar')].map((a) => {
            const r = a.getBoundingClientRect();
            return r.left + r.width / 2;
          }),
          (() => {
            const r = ctx.querySelector(':scope > .gd-context-collapse').getBoundingClientRect();
            return r.left + r.width / 2;
          })(),
        ];
        const entry = ctx.querySelector(':scope > .gd-context-entry');
        const bodyRect = entry.querySelector('.gd-markdown-body').getBoundingClientRect();
        const jumpRect = entry.querySelector('.gd-context-footer .gd-context-jump-btn').getBoundingClientRect();
        return {
          railDelta: Math.max(...centers.map((cx) => Math.abs(cx - railCenter))),
          jumpBelowBody: jumpRect.top >= bodyRect.bottom,
          jumpLeftDelta: Math.abs(Math.round(jumpRect.left - bodyRect.left)),
          headingHasJump: Boolean(entry.querySelector('.gd-context-heading .gd-context-jump-btn')),
        };
      });
      assert.ok(childrenRailMetrics.railDelta <= 0.5, 'children 1px rail center mismatch: ' + JSON.stringify(childrenRailMetrics));
      assert.equal(childrenRailMetrics.jumpBelowBody, true, JSON.stringify(childrenRailMetrics));
      assert.ok(childrenRailMetrics.jumpLeftDelta <= 1, JSON.stringify(childrenRailMetrics));
      assert.equal(childrenRailMetrics.headingHasJump, false, JSON.stringify(childrenRailMetrics));
      await childrenCtx.scrollIntoViewIfNeeded();
      await page.screenshot({ path: resolve(output, 'bidirectional-children.png'), animations: 'disabled' });
      result.screenshots.push('bidirectional-children.png');
      await op.getByLabel('收起直接回复', { exact: true }).click();
      await expect(childrenCtx).toHaveCount(0);
      assert.equal(await childrenToggle.evaluate((el) => getComputedStyle(el).outlineStyle), 'none');
      assert.equal(await childrenToggle.evaluate((el) => getComputedStyle(el).textDecorationLine), 'none');
      result.interactions.push('Expanded real direct replies list with continuous 1px rail, bottom-left ↓ jump & zero underline');
    }
    const parentToggle = page.locator('.is-sub-floor .gd-reply-target-pill').first();
    if (await parentToggle.count()) {
      await parentToggle.click();
      const parent = page.locator('.gd-reply-context.is-parent');
      await expect(parent).toBeVisible();
      assert.equal(await parentToggle.evaluate((el) => getComputedStyle(el).outlineStyle), 'none');
      const parentRailMetrics = await page.evaluate(() => {
        const ctx = document.querySelector('.gd-reply-context.is-parent');
        const rail = ctx.querySelector('.gd-context-rail');
        const railRect = rail.getBoundingClientRect();
        const railStyle = getComputedStyle(rail, '::before');
        const railCenter = railRect.left + parseFloat(railStyle.left) + parseFloat(railStyle.width) / 2;
        const av = ctx.querySelector('.gd-avatar').getBoundingClientRect();
        const btn = ctx.querySelector('.gd-context-parent-collapse').getBoundingClientRect();
        const jump = ctx.querySelector('.gd-context-heading button').getBoundingClientRect();
        const authorRight = ctx.closest('.gd-floor-article').querySelector('.gd-author-meta-right').getBoundingClientRect();
        return {
          railDelta: Math.max(Math.abs(av.left + av.width / 2 - railCenter), Math.abs(btn.left + btn.width / 2 - railCenter)),
          jumpRightOffset: Math.abs(Math.round(authorRight.right - jump.right)),
        };
      });
      assert.ok(parentRailMetrics.railDelta <= 0.5, 'parent 1px rail center mismatch: ' + JSON.stringify(parentRailMetrics));
      assert.ok(parentRailMetrics.jumpRightOffset <= 1, 'parent jump right edge mismatch: ' + JSON.stringify(parentRailMetrics));
      await parent.scrollIntoViewIfNeeded();
      await page.screenshot({ path: resolve(output, 'bidirectional-parent.png'), animations: 'disabled' });
      result.screenshots.push('bidirectional-parent.png');
      await parent.getByRole('button', { name: /跳至第 .* 楼贴文/ }).click();
      await expect(page.locator('.gd-return')).toBeVisible();
      await page.locator('.gd-return').click();
      await expect(page.locator('.gd-return')).toHaveCount(0);
      await expect(parentToggle).toHaveAttribute('aria-expanded', 'true');
      result.interactions.push('Expanded real parent jump preserves return anchor and restores expansion');
    }
    const composer = page.locator('#detail-reply-composer');
    await composer.scrollIntoViewIfNeeded();
    await composer.locator('.gd-reply-textarea').click();
    assert.equal(await composer.locator('.gd-reply-textarea').evaluate((el) => getComputedStyle(el).boxShadow), 'none');
    await page.screenshot({ path: resolve(output, 'quote-and-composer.png'), animations: 'disabled' });
    result.screenshots.push('quote-and-composer.png');
    result.interactions.push('Verified etched matte quote block and matte obsidian reply composer');
  }

  // Light theme verification: borderless wide soft-white veil covering timeline, grounded matte letter avatars, crisp light timeline & 1px rail
  await page.locator('#nav-theme-toggle a').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.snackbar-container.show')).toHaveCount(0, { timeout: 10000 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(120);
  const lightMetrics = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.gd-reading-canvas'));
    const subAv = document.querySelector('.is-sub-floor .gd-avatar-rail .gd-avatar');
    const pill = document.querySelector('#floor-1 .gd-boost-pill');
    const topBtn = getComputedStyle(document.querySelector('.gd-tl-top-btn'));
    const veilStyle = getComputedStyle(document.querySelector('.gd-detail-shell'), '::before');
    return {
      veilBg: veilStyle.backgroundImage,
      veilRightExtent: parseFloat(veilStyle.right),
      canvasBg: cs.backgroundColor,
      canvasBlur: cs.backdropFilter,
      canvasBorderWidth: cs.borderTopWidth,
      canvasRadius: cs.borderRadius,
      lightAvatarBg: subAv ? getComputedStyle(subAv).backgroundColor : null,
      lightAvatarColor: subAv ? getComputedStyle(subAv).color : null,
      lightBoostColor: pill ? getComputedStyle(pill).color : null,
      lightTlTrack: getComputedStyle(document.querySelector('.gd-tl-rail'), '::before').backgroundColor,
      lightTlThumb: getComputedStyle(document.querySelector('.gd-tl-thumb')).backgroundColor,
      lightTlBtnBg: topBtn.backgroundColor,
      lightTlBtnBorder: topBtn.borderTopColor,
      lightTlBtnColor: topBtn.color,
    };
  });
  assert.ok(
    lightMetrics.veilBg.includes('rgba(255, 255, 255, 0.8)') &&
      lightMetrics.veilBg.includes('rgba(255, 255, 255, 0.72)'),
    JSON.stringify(lightMetrics),
  );
  assert.ok(lightMetrics.veilRightExtent <= -100, JSON.stringify(lightMetrics));
  assert.equal(lightMetrics.canvasBg, 'rgba(0, 0, 0, 0)');
  assert.equal(lightMetrics.canvasBlur, 'none');
  assert.equal(lightMetrics.canvasBorderWidth, '0px');
  assert.equal(lightMetrics.canvasRadius, '0px');
  if (lightMetrics.lightAvatarBg) {
    assert.ok(
      ['rgb(71, 85, 105)', 'rgb(79, 93, 117)', 'rgb(61, 90, 128)', 'rgb(92, 103, 125)', 'rgb(74, 96, 112)', 'rgb(82, 94, 117)'].includes(
        lightMetrics.lightAvatarBg,
      ),
      'light letter avatar must use grounded mid-dark matte Morandi bg: ' + JSON.stringify(lightMetrics),
    );
    assert.equal(lightMetrics.lightAvatarColor, 'rgb(255, 255, 255)');
  }
  if (lightMetrics.lightBoostColor) assert.equal(lightMetrics.lightBoostColor, 'rgb(51, 65, 85)');
  assert.equal(lightMetrics.lightTlTrack, 'rgba(37, 99, 235, 0.25)');
  assert.equal(lightMetrics.lightTlThumb, 'rgb(37, 99, 235)');
  assert.equal(lightMetrics.lightTlBtnBg, 'rgba(255, 255, 255, 0.72)');
  assert.equal(lightMetrics.lightTlBtnBorder, 'rgba(255, 255, 255, 0.85)');
  assert.equal(lightMetrics.lightTlBtnColor, 'rgb(51, 65, 85)');
  await screenshot('light-1440');

  if (data.subGestures.length && (await op.locator('.gd-direct-replies-btn').count())) {
    await op.locator('.gd-direct-replies-btn').click();
    const lightCtx = op.locator('.gd-reply-context.is-children');
    await expect(lightCtx).toBeVisible();
    const lightRailCheck = await page.evaluate(() => {
      const ctx = document.querySelector('#floor-1 .gd-reply-context.is-children');
      const btn = getComputedStyle(ctx.querySelector('.gd-context-collapse'));
      return {
        toggleUnderline: getComputedStyle(document.querySelector('#floor-1 .gd-direct-replies-btn')).textDecorationLine,
        railColor: getComputedStyle(ctx, '::before').backgroundColor,
        collapseBg: btn.backgroundColor,
        collapseBorder: btn.borderTopColor,
        collapseColor: btn.color,
      };
    });
    assert.deepEqual(lightRailCheck, {
      toggleUnderline: 'none',
      railColor: 'rgba(15, 23, 42, 0.18)',
      collapseBg: 'rgb(255, 255, 255)',
      collapseBorder: 'rgba(15, 23, 42, 0.14)',
      collapseColor: 'rgb(71, 85, 105)',
    });
    await screenshot('light-1440-replies');
    await op.getByLabel('收起直接回复', { exact: true }).click();
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(page.locator('.gd-timeline-aside')).toHaveAttribute('data-stuck', 'false');
  await screenshot('light-390');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);

  await page.locator('.gd-back-btn').click();
  await expect(page.locator('.gb-gesture-row').first()).toBeVisible({ timeout: 45000 });
  await expect(page.locator('.gb-boost-track')).toHaveCount(3);
  assert.equal(
    await page.locator('.guestbook-board-container').evaluate((el) => getComputedStyle(el).getPropertyValue('--gd-text')),
    '',
  );

  result.baselineHydrationWarnings = result.pageErrors.filter((error) => error.startsWith('Minified React error #418;'));
  assert.deepEqual(
    result.pageErrors.filter((error) => !result.baselineHydrationWarnings.includes(error)),
    [],
  );
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
