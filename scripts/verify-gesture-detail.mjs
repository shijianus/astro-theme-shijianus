import { chromium } from 'playwright';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import net from 'net';
import path from 'path';

const COMMENTS_DEV_PATH = path.resolve(process.cwd(), '.comments-dev.json');
const BOOSTS_DEV_PATH = path.resolve(process.cwd(), '.boosts-dev.json');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = typeof addr === 'object' && addr ? addr.port : 4339;
      srv.close(() => resolve(port));
    });
  });
}

async function waitForServer(url, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for server at ${url}`);
}

function assert(cond, msg) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

async function run() {
  try {
    execSync('node ./node_modules/astro/bin/astro.mjs dev stop', { cwd: process.cwd(), stdio: 'ignore' });
  } catch {}
  const PORT = await getFreePort();
  const BASE_URL = `http://localhost:${PORT}`;
  const hadComments = fs.existsSync(COMMENTS_DEV_PATH);
  const origComments = hadComments ? fs.readFileSync(COMMENTS_DEV_PATH, 'utf8') : null;
  const hadBoosts = fs.existsSync(BOOSTS_DEV_PATH);
  const origBoosts = hadBoosts ? fs.readFileSync(BOOSTS_DEV_PATH, 'utf8') : null;

  console.log(`[Verify] Starting Astro dev server on port ${PORT}...`);
  const devProc = spawn('node', ['./node_modules/astro/bin/astro.mjs', 'dev', '--port', String(PORT), '--host', '127.0.0.1'], {
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'development' },
  });

  let serverLogs = '';
  devProc.stdout.on('data', (d) => { serverLogs += d.toString(); });
  devProc.stderr.on('data', (d) => { serverLogs += d.toString(); });

  let browser;
  try {
    await waitForServer(`${BASE_URL}/guestbook/`).catch((err) => {
      console.error('[Verify] Server logs on timeout:\n', serverLogs.slice(-3000));
      throw err;
    });
    console.log('[Verify] Dev server ready.');

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 920 } });
    const page = await context.newPage();

    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    console.log('[Verify] 1. Navigating to /guestbook/#gesture-pinned_welcome_official ...');
    await page.goto(`${BASE_URL}/guestbook/#gesture-pinned_welcome_official`, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector('.gd-monolithic-shell[data-detail-loaded="true"]', { timeout: 15000 });
    await page.waitForSelector('#floor-1 .gd-edit-count-badge', { timeout: 15000 });
    await page.waitForSelector('#floor-5 .gd-reply-target-pill', { timeout: 15000 });
    await page.waitForSelector('.gd-zone5-links', { timeout: 15000 });
    await page.waitForTimeout(300);

    // 1. Detail isolation & centered 960px layout
    const boostWallCount = await page.locator('.gb-boost-wall-card').count();
    const navBarCount = await page.locator('.gb-nav-bar').count();
    assert(boostWallCount === 0, `Home boost wall must be removed in detail view, got ${boostWallCount}`);
    assert(navBarCount === 0, `Home filter/search nav bar must be removed in detail view, got ${navBarCount}`);

    const gridLayout = await page.$eval('.gd-detail-grid', (el) => {
      const cs = window.getComputedStyle(el);
      const shell = el.querySelector('.gd-monolithic-shell');
      const topbarInShell = Boolean(shell && shell.querySelector('.gd-topbar'));
      return {
        maxWidth: cs.maxWidth,
        display: cs.display,
        gap: cs.gap,
        topbarInShell,
      };
    });
    assert(gridLayout.maxWidth === '960px', `Detail grid maxWidth must be 960px, got ${gridLayout.maxWidth}`);
    assert(gridLayout.display === 'flex', `Detail grid display must be flex, got ${gridLayout.display}`);
    assert(gridLayout.gap === '36px', `Detail grid gap must be 36px, got ${gridLayout.gap}`);
    assert(gridLayout.topbarInShell, 'Topbar must be built inside .gd-monolithic-shell');
    console.log('[Verify] ✓ Centered 960px flex layout & built-in borderless topbar verified');

    // 2. Matte high-opacity dark glass shell & zero redundant borders
    const matteChecks = await page.evaluate(() => {
      const shell = document.querySelector('.gd-monolithic-shell');
      const shellCs = shell ? window.getComputedStyle(shell) : null;
      const backBtn = document.querySelector('.gd-back-btn');
      const backCs = backBtn ? window.getComputedStyle(backBtn) : null;
      const roleBadge = document.querySelector('.gd-role-badge');
      const roleCs = roleBadge ? window.getComputedStyle(roleBadge) : null;
      const levelBadge = document.querySelector('.gd-level-badge');
      const levelCs = levelBadge ? window.getComputedStyle(levelBadge) : null;
      const staticBadge = document.querySelector('.gd-static-badge');
      const staticCs = staticBadge ? window.getComputedStyle(staticBadge) : null;
      const linksSec = document.querySelector('.gd-zone5-links');
      const linksCs = linksSec ? window.getComputedStyle(linksSec) : null;
      const tlAside = document.querySelector('.gd-timeline-aside');
      const tlAsideCs = tlAside ? window.getComputedStyle(tlAside) : null;
      const tlCard = document.querySelector('.gd-timeline-card');
      const tlCardCs = tlCard ? window.getComputedStyle(tlCard) : null;

      return {
        shellBg: shellCs?.backgroundColor,
        shellBackdrop: shellCs?.backdropFilter || shellCs?.webkitBackdropFilter,
        shellBorderRadius: shellCs?.borderRadius,
        shellOverflow: shellCs?.overflow,
        backBorder: backCs?.borderTopWidth,
        backBg: backCs?.backgroundColor,
        roleBorder: roleCs?.borderTopWidth,
        roleBg: roleCs?.backgroundColor,
        roleColor: roleCs?.color,
        levelBorder: levelCs?.borderTopWidth,
        levelBg: levelCs?.backgroundColor,
        levelColor: levelCs?.color,
        staticBorder: staticCs?.borderTopWidth,
        linksBorder: linksCs?.borderTopWidth,
        linksBg: linksCs?.backgroundColor,
        tlAsideWidth: tlAsideCs?.width,
        tlCardBg: tlCardCs?.backgroundColor,
        tlCardBorder: tlCardCs?.borderTopWidth,
      };
    });
    console.log('[Verify] Matte & borderless styles:', matteChecks);
    assert(matteChecks.shellOverflow !== 'hidden', `Shell overflow must not be hidden, got ${matteChecks.shellOverflow}`);
    assert(matteChecks.shellBackdrop?.includes('blur(20px)'), `Expected blur(20px), got ${matteChecks.shellBackdrop}`);
    assert(matteChecks.shellBg === 'rgba(13, 17, 26, 0.88)', `Expected matte bg rgba(13, 17, 26, 0.88), got ${matteChecks.shellBg}`);
    assert(matteChecks.backBorder === '0px' && matteChecks.backBg === 'rgba(0, 0, 0, 0)', 'Topbar back button must be borderless & transparent');
    assert(matteChecks.roleBorder === '0px' && matteChecks.roleBg === 'rgba(0, 0, 0, 0)', 'Role badge must be borderless text');
    assert(matteChecks.levelBorder === '0px' && matteChecks.levelBg === 'rgba(0, 0, 0, 0)', 'Level badge must be borderless text');
    assert(matteChecks.roleColor === 'rgb(100, 116, 139)' && matteChecks.levelColor === 'rgb(100, 116, 139)', 'Role/level must be muted #64748B');
    assert(matteChecks.staticBorder === '0px', 'Category static tags must have 0px border');
    assert(matteChecks.linksBorder === '0px' && matteChecks.linksBg === 'rgba(0, 0, 0, 0)', 'Related links block must be borderless & transparent');
    assert(matteChecks.tlAsideWidth === '96px', `Timeline aside width must be 96px, got ${matteChecks.tlAsideWidth}`);
    assert(matteChecks.tlCardBorder === '0px' && matteChecks.tlCardBg === 'rgba(0, 0, 0, 0)', 'Timeline card must have no background or border');
    console.log('[Verify] ✓ High-opacity matte glass & global borderless verification passed');

    // 3. Dual Vertical Alignment Axes (0px and 56px) + Protagonist Typography + Matte Avatars
    const axisCheck = await page.evaluate(() => {
      const title = document.querySelector('.gd-zone1-title');
      const tags = document.querySelector('.gd-zone1-tags');
      const opAvatar = document.querySelector('#floor-1 .gd-sticky-avatar-wrap .gd-avatar');
      const subAvatar = document.querySelector('#floor-2 .gd-sticky-avatar-wrap .gd-avatar');
      const topicMap = document.querySelector('.gd-zone6-topic-map');
      const topicMapLeft = document.querySelector('.gd-topic-map-left');

      const authorName = document.querySelector('#floor-1 .gd-author-name');
      const body = document.querySelector('#floor-1 .gd-floor-markdown');
      const actionBar = document.querySelector('#floor-1 .gd-zone4-action-bar');
      const boostSec = document.querySelector('#floor-1 .gd-zone3-boost');
      const linksSec = document.querySelector('.gd-zone5-links');

      const bodyCs = body ? window.getComputedStyle(body) : null;
      const opAvatarCs = opAvatar ? window.getComputedStyle(opAvatar) : null;
      const f2Avatar = document.querySelector('#floor-2 .gd-sticky-avatar-wrap .gd-avatar');
      const f2AvatarCs = f2Avatar ? window.getComputedStyle(f2Avatar) : null;
      const iconBtn = document.querySelector('#floor-1 .gd-icon-btn');
      const iconCs = iconBtn ? window.getComputedStyle(iconBtn) : null;

      return {
        x0_title: title?.getBoundingClientRect().left ?? -1,
        x0_tags: tags?.getBoundingClientRect().left ?? -1,
        x0_opAvatar: opAvatar?.getBoundingClientRect().left ?? -1,
        x0_subAvatar: subAvatar?.getBoundingClientRect().left ?? -1,
        x0_topicMapLeft: topicMapLeft?.getBoundingClientRect().left ?? -1,
        x56_author: authorName?.getBoundingClientRect().left ?? -1,
        x56_body: body?.getBoundingClientRect().left ?? -1,
        x56_actionBar: actionBar?.getBoundingClientRect().left ?? -1,
        x56_boost: boostSec?.getBoundingClientRect().left ?? -1,
        x56_links: linksSec?.getBoundingClientRect().left ?? -1,
        bodyFontSize: bodyCs?.fontSize,
        bodyColor: bodyCs?.color,
        bodyLineHeight: bodyCs?.lineHeight,
        bodyMarginTop: bodyCs?.marginTop,
        bodyMarginBottom: bodyCs?.marginBottom,
        opAvatarWidth: opAvatarCs?.width,
        opAvatarRadius: opAvatarCs?.borderRadius,
        f2AvatarBg: f2AvatarCs?.backgroundColor,
        f2AvatarBgImg: f2AvatarCs?.backgroundImage,
        iconDefaultColor: iconCs?.color,
        topicMapTopBorder: topicMap ? window.getComputedStyle(topicMap).borderTopWidth : '',
        topicMapBg: topicMap ? window.getComputedStyle(topicMap).backgroundColor : '',
      };
    });
    console.log('[Verify] Dual-axis & typography metrics:', axisCheck);
    assert(Math.abs(axisCheck.x0_title - axisCheck.x0_opAvatar) <= 1, `Title (${axisCheck.x0_title}) and OP avatar (${axisCheck.x0_opAvatar}) must align on 0px axis`);
    assert(Math.abs(axisCheck.x0_tags - axisCheck.x0_opAvatar) <= 1, `Tags and OP avatar must align on 0px axis`);
    assert(Math.abs(axisCheck.x0_subAvatar - axisCheck.x0_opAvatar) <= 1, `SubGesture avatar and OP avatar must align on 0px axis`);
    assert(Math.abs(axisCheck.x0_topicMapLeft - axisCheck.x0_opAvatar) <= 1, `Topic Map left and OP avatar must align on 0px axis`);

    assert(Math.abs(axisCheck.x56_author - axisCheck.x0_opAvatar - 56) <= 1, `Content axis must be +56px from 0px axis (${axisCheck.x56_author} vs ${axisCheck.x0_opAvatar})`);
    assert(Math.abs(axisCheck.x56_body - axisCheck.x56_author) <= 1, 'Body must align on 56px content axis');
    assert(Math.abs(axisCheck.x56_actionBar - axisCheck.x56_author) <= 1, 'Action bar must align on 56px content axis');
    assert(Math.abs(axisCheck.x56_boost - axisCheck.x56_author) <= 1, 'Boost section must align on 56px content axis');
    assert(Math.abs(axisCheck.x56_links - axisCheck.x56_author) <= 1, 'Related links must align on 56px content axis');

    assert(axisCheck.bodyFontSize === '16px', `Body fontSize must be 16px, got ${axisCheck.bodyFontSize}`);
    assert(axisCheck.bodyColor === 'rgb(226, 232, 240)', `Body color must be #E2E8F0, got ${axisCheck.bodyColor}`);
    assert(axisCheck.bodyMarginTop === '14px' && axisCheck.bodyMarginBottom === '20px', `Body margin must be 14px / 20px, got ${axisCheck.bodyMarginTop}/${axisCheck.bodyMarginBottom}`);
    assert(axisCheck.opAvatarWidth === '42px' && axisCheck.opAvatarRadius === '50%', `OP avatar must be 42px circle, got ${axisCheck.opAvatarWidth} / ${axisCheck.opAvatarRadius}`);
    assert(axisCheck.f2AvatarBgImg === 'none', `Default letter avatar must use solid matte Morandi bg, not gradient (${axisCheck.f2AvatarBgImg})`);
    assert(axisCheck.iconDefaultColor === 'rgb(100, 116, 139)', `Default action icons must be #64748B, got ${axisCheck.iconDefaultColor}`);
    console.log('[Verify] ✓ Dual-axis alignment (0px / 56px), protagonist typography & matte avatars verified');

    // 4. Boost: <= 16 chars frontend + backend enforcement, horizontal wrapping micro-pills, OP [+ Boost], SubGesture zero footprint
    const opBoostLayout = await page.$eval('#floor-1', (el) => {
      const pillsWrap = el.querySelector('.gd-boost-op-pills');
      const pills = Array.from(el.querySelectorAll('.gd-boost-op-pill'));
      const pillsCs = pillsWrap ? window.getComputedStyle(pillsWrap) : null;
      const addBtn = el.querySelector('.gd-boost-add-trigger');
      return {
        flexDirection: pillsCs?.flexDirection,
        flexWrap: pillsCs?.flexWrap,
        gap: pillsCs?.gap,
        pillCount: pills.length,
        hasAddTrigger: Boolean(addBtn),
      };
    });
    assert(opBoostLayout.flexDirection === 'row' && opBoostLayout.flexWrap === 'wrap', `Boost pills must flow horizontally with wrap, got ${opBoostLayout.flexDirection}/${opBoostLayout.flexWrap}`);
    assert(opBoostLayout.pillCount >= 2 && opBoostLayout.hasAddTrigger, 'OP must show horizontal boost micro-pills and [+ Boost] trigger');

    // Backend hard 16-char cap check
    const overLimitRes = await page.evaluate(async () => {
      const r = await fetch('/api/gestures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'boost',
          gestureId: 'pinned_welcome_official',
          content: '一二三四五六七八九十十一十二十三十四十五十六十七',
        }),
      });
      return { status: r.status, body: await r.json() };
    });
    assert(overLimitRes.status === 400 && !overLimitRes.body.ok, `Backend must reject Boost > 16 chars, got ${JSON.stringify(overLimitRes)}`);

    const f2BoostBefore = await page.locator('#floor-2 .gd-zone3-boost').count();
    assert(f2BoostBefore === 0, `Floor 2 with 0 boosts must have zero DOM footprint, got ${f2BoostBefore}`);

    await page.locator('#floor-2 button[aria-label="发送 Boost 短评"]').click();
    await page.waitForSelector('#floor-2 .gd-boost-inline-input');
    const maxLenAttr = await page.locator('#floor-2 .gd-boost-inline-input').getAttribute('maxlength');
    assert(maxLenAttr === '16', `Boost input maxLength must be 16, got ${maxLenAttr}`);
    await page.locator('#floor-2 .gd-boost-inline-input').blur();
    await page.waitForTimeout(150);
    assert((await page.locator('#floor-2 .gd-zone3-boost').count()) === 0, 'Empty SubGesture boost input must auto-collapse on blur');

    await page.locator('#floor-2 button[aria-label="发送 Boost 短评"]').click();
    await page.locator('#floor-2 .gd-boost-inline-input').fill('测试子楼层 Boost');
    await page.locator('#floor-2 .gd-boost-inline-submit').click();
    await page.waitForSelector('#floor-2 .gd-boost-op-pill', { timeout: 5000 });
    console.log('[Verify] ✓ Boost <= 16 chars (FE+BE), horizontal micro-pills & SubGesture zero footprint verified');

    // 5. Emoji cluster tight gap (1px) + strict UPWARD popovers
    await page.locator('#floor-1 .gd-agg-emoji-pill').hover();
    await page.waitForSelector('#floor-1 .gd-reaction-breakdown-popover', { timeout: 3000 });
    const breakdownPos = await page.evaluate(() => {
      const pill = document.querySelector('#floor-1 .gd-agg-emoji-pill')?.getBoundingClientRect();
      const pop = document.querySelector('#floor-1 .gd-reaction-breakdown-popover')?.getBoundingClientRect();
      const icons = document.querySelector('#floor-1 .gd-agg-emoji-icons');
      const iconsGap = icons ? window.getComputedStyle(icons).gap : '';
      return { popBottom: pop?.bottom ?? 9999, pillTop: pill?.top ?? 0, iconsGap };
    });
    assert(breakdownPos.iconsGap === '1px', `Top-4 emoji icons gap must be 1px, got ${breakdownPos.iconsGap}`);
    assert(breakdownPos.popBottom <= breakdownPos.pillTop + 1, `Breakdown popover must pop UPWARD (${breakdownPos.popBottom} <= ${breakdownPos.pillTop})`);

    await page.locator('#floor-1 .gd-heart-btn').click();
    await page.waitForSelector('#floor-1 .gd-quick-emoji-bar', { timeout: 3000 });
    const quickBarPos = await page.evaluate(() => {
      const btn = document.querySelector('#floor-1 .gd-heart-btn')?.getBoundingClientRect();
      const bar = document.querySelector('#floor-1 .gd-quick-emoji-bar')?.getBoundingClientRect();
      return { barBottom: bar?.bottom ?? 9999, btnTop: btn?.top ?? 0 };
    });
    assert(quickBarPos.barBottom <= quickBarPos.btnTop + 1, `Quick emoji picker must pop UPWARD (${quickBarPos.barBottom} <= ${quickBarPos.btnTop})`);
    await page.locator('#floor-1 .gd-heart-btn').click();
    console.log('[Verify] ✓ Tight emoji cluster & strict upward popovers verified');

    // 6. Related links authenticity & Adaptive Topic Map (lightweight vs hot mode)
    const linksCount = await page.locator('.gd-zone5-links .gd-related-link-row').count();
    assert(linksCount === 2, `Expected strictly 2 real links from OP (no fabricated sibling links), got ${linksCount}`);
    const tmLightCheck = await page.$eval('.gd-zone6-topic-map', (el) => {
      const isLight = el.classList.contains('is-light-mode');
      const stackedMetrics = el.querySelectorAll('.gd-topic-map-metrics.is-stacked').length;
      const avatars = Array.from(el.querySelectorAll('.gd-tm-avatar-item'));
      const firstAvatarBox = avatars[0]?.querySelector('.gd-avatar')?.getBoundingClientRect();
      return {
        isLight,
        stackedMetrics,
        text: el.textContent || '',
        avatarCount: avatars.length,
        avatarWidth: firstAvatarBox?.width || 0,
        firstIsOp: avatars[0]?.classList.contains('is-op-avatar') || false,
      };
    });
    assert(tmLightCheck.isLight && tmLightCheck.stackedMetrics === 0, 'Topic Map with < 15 replies must render in lightweight single-row mode');
    assert(tmLightCheck.text.includes('觀看') && tmLightCheck.text.includes('總結'), 'Lightweight Topic Map must show views & [總結]');
    assert(Math.round(tmLightCheck.avatarWidth) === 26, `Topic Map avatars must be 26px, got ${tmLightCheck.avatarWidth}`);
    assert(tmLightCheck.firstIsOp, 'First avatar in Topic Map must be OP');
    console.log('[Verify] ✓ Related links authenticity (2 real links) & Lightweight Topic Map verified');

    // 7. Right Timeline Scroller: zero dots! 1px rail + 3px thumb
    const railCheck = await page.evaluate(() => {
      const notches = document.querySelectorAll('.gd-tl-notch, .gb-scroller-notch').length;
      const rail = document.querySelector('.gd-tl-rail');
      const thumb = document.querySelector('.gd-tl-thumb-bar');
      const latestText = document.querySelector('.gd-tl-latest-time')?.textContent?.trim() || '';
      return {
        notches,
        railWidth: rail ? window.getComputedStyle(rail).width : '',
        thumbWidth: thumb ? window.getComputedStyle(thumb).width : '',
        latestText,
      };
    });
    assert(railCheck.notches === 0, `Timeline rail must NEVER render dots/notches, got ${railCheck.notches}`);
    assert(railCheck.railWidth === '1px', `Timeline rail must be 1px wide, got ${railCheck.railWidth}`);
    assert(railCheck.thumbWidth === '3px', `Timeline active thumb must be 3px wide, got ${railCheck.thumbWidth}`);
    assert(railCheck.latestText.length > 0, 'Timeline latest relative time must be displayed');
    console.log('[Verify] ✓ Pure 1px timeline rail, 3px thumb, zero dots & relative time verified:', railCheck);

    // 8. Scene A: 1-to-N Direct Replies Timeline on Floor 2 & ├─ [ 返回 ] fade-out
    await page.locator('#floor-2 .gd-direct-replies-btn').click();
    await page.waitForSelector('#floor-2 .gd-direct-replies-timeline');
    const timelineRows = await page.locator('#floor-2 .gd-timeline-reply-row').count();
    assert(timelineRows === 2, `Expected 2 direct replies under Floor 2, got ${timelineRows}`);
    const timelineAvatarPos = await page.$eval('#floor-2 .gd-timeline-avatar', (el) => window.getComputedStyle(el).position);
    assert(timelineAvatarPos === 'static', `Timeline reply avatar must be non-sticky (static), got ${timelineAvatarPos}`);

    await page.locator('#floor-2 .gd-timeline-reply-row .gd-jump-post-btn').first().click();
    await page.waitForSelector('.gd-tl-return-anchor', { timeout: 3000 });
    await page.waitForTimeout(450);

    await page.locator('.gd-tl-return-btn').click();
    await page.waitForTimeout(450);
    assert((await page.locator('.gd-tl-return-anchor').count()) === 0, 'Return anchor must fade out after clicking [返回]');

    await page.locator('#floor-2 .gd-timeline-bottom-collapse-btn').click();
    await page.waitForTimeout(150);
    assert((await page.locator('#floor-2 .gd-direct-replies-timeline').count()) === 0, 'Bottom [ ^ ] must collapse Scene A timeline');
    console.log('[Verify] ✓ Scene A 1-to-N timeline & ├─ [ 返回 ] fade-out verified');

    // 9. Scene B: Dual Sticky Avatars + 1px │ Line + Scroll Compensation
    const f5Badge = page.locator('#floor-5 .gd-reply-target-pill');
    await f5Badge.scrollIntoViewIfNeeded();
    await f5Badge.click();
    await page.waitForSelector('#floor-5 .gd-nested-parent-box');

    const dualSticky = await page.$eval('#floor-5', (el) => {
      const outer = el.querySelector(':scope > .gd-floor-split .gd-sticky-avatar-wrap');
      const inner = el.querySelector('.gd-nested-parent-sticky-cluster');
      const line = el.querySelector('.gd-nested-rail-line');
      return {
        outerPos: outer ? window.getComputedStyle(outer).position : '',
        innerPos: inner ? window.getComputedStyle(inner).position : '',
        lineWidth: line ? window.getComputedStyle(line).width : '',
      };
    });
    assert(dualSticky.outerPos === 'sticky' && dualSticky.innerPos === 'sticky', `Dual sticky avatars required, got ${JSON.stringify(dualSticky)}`);
    assert(dualSticky.lineWidth === '1px', `Inner vertical line must be 1px, got ${dualSticky.lineWidth}`);

    await page.evaluate(() => {
      const card = document.querySelector('#floor-5 .gd-floor-markdown');
      if (card) card.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    await page.waitForTimeout(150);
    const collapseBtnBox = await page.locator('#floor-5 .gd-nested-collapse-btn').boundingBox();
    assert(collapseBtnBox, 'Collapse button boundingBox missing');
    const beforeCollapse = await page.evaluate(() => {
      const body = document.querySelector('#floor-5 .gd-floor-markdown');
      return { bodyTop: body ? body.getBoundingClientRect().top : 0 };
    });
    await page.mouse.click(collapseBtnBox.x + collapseBtnBox.width / 2, collapseBtnBox.y + collapseBtnBox.height / 2);
    await page.waitForTimeout(100);
    const afterCollapse = await page.evaluate(() => {
      const body = document.querySelector('#floor-5 .gd-floor-markdown');
      return { bodyTop: body ? body.getBoundingClientRect().top : 0 };
    });
    const topDrift = Math.abs(afterCollapse.bodyTop - beforeCollapse.bodyTop);
    assert(topDrift <= 4, `Expected replyer body to stay stationary after collapse compensation, drift=${topDrift}px`);
    console.log('[Verify] ✓ Scene B dual sticky avatars, 1px │ line & scroll compensation verified');

    // 10. Orthogonal Quote Card
    await page.locator('#floor-5 .gd-quote-action-btn[title="展开被引用原贴全文"]').click();
    await page.waitForSelector('#floor-5 .gd-quote-full-md');
    await page.locator('#floor-5 .gd-quote-action-btn[title="跳至被引用楼层"]').click();
    await page.waitForSelector('.gd-tl-return-anchor');
    await page.locator('.gd-tl-return-btn').click();
    await page.waitForTimeout(350);
    console.log('[Verify] ✓ Orthogonal Quote card verified');

    // 11. Live SubGesture Reply Creation
    await page.locator('#detail-reply-composer textarea').fill('端到端测试跟帖：验证高遮罩哑光深色底板、双轴对齐与极简时间轴。');
    await page.locator('.gd-submit-reply-btn').click();
    await page.waitForSelector('#floor-6', { timeout: 8000 });
    console.log('[Verify] ✓ Live SubGesture reply persistence verified');

    // 12. Hot Topic Mode (>= 15 replies & >= 500 views) + 0-links hidden check via mocked response
    await page.route('**/api/gestures?id=hot_topic_mock*', async (route) => {
      const baseCreated = '2026-08-03T08:00:00.000Z';
      const subGestures = Array.from({ length: 16 }).map((_, idx) => ({
        id: `hot_sub_${idx + 2}`,
        postSlug: 'guestbook',
        parentId: 'hot_topic_mock',
        postType: 'gesture',
        floorIndex: idx + 2,
        authorId: `u_${idx}`,
        authorName: `User${idx}`,
        authorRole: 'reader',
        message: `Hot reply #${idx + 2}`,
        likesCount: 2,
        status: 'published',
        createdAt: `2026-08-04T0${Math.min(9, idx)}:00:00.000Z`,
      }));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          gesture: {
            id: 'hot_topic_mock',
            postSlug: 'guestbook',
            postType: 'gesture',
            tag: 'tech',
            title: '高热度讨论帖测试',
            tags: ['技术探讨'],
            editCount: 0,
            viewsCount: 680,
            floorIndex: 1,
            authorId: 'u_op',
            authorName: 'TopicAuthor',
            authorRole: 'reader',
            message: '纯文本讨论，没有任何引用链接。',
            likesCount: 10,
            status: 'published',
            createdAt: baseCreated,
          },
          subGestures,
          boostsByGestureId: {},
          relatedLinks: [],
          topicMap: {
            viewsCount: 680,
            likesCount: 42,
            linksCount: 0,
            usersCount: 17,
            participants: [{ authorId: 'u_op', authorName: 'TopicAuthor', authorRole: 'reader', count: 1 }],
            estimatedReadMinutes: 3,
            latestReplyAt: '2026-08-04T09:00:00.000Z',
          },
          subscribed: false,
        }),
      });
    });

    await page.goto(`${BASE_URL}/guestbook/#gesture-hot_topic_mock`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.gd-zone6-topic-map.is-hot-mode', { timeout: 10000 });
    const hotCheck = await page.evaluate(() => {
      const metricStrong = document.querySelector('.gd-topic-map-metrics.is-stacked .gd-tm-stat strong');
      return {
        linksCount: document.querySelectorAll('.gd-zone5-links').length,
        editBadgeCount: document.querySelectorAll('#floor-1 .gd-edit-count-badge').length,
        stackedCount: document.querySelectorAll('.gd-topic-map-metrics.is-stacked .gd-tm-stat').length,
        numColor: metricStrong ? window.getComputedStyle(metricStrong).color : '',
        numSize: metricStrong ? window.getComputedStyle(metricStrong).fontSize : '',
      };
    });
    assert(hotCheck.linksCount === 0, `0-links post must hide .gd-zone5-links completely, got ${hotCheck.linksCount}`);
    assert(hotCheck.editBadgeCount === 0, `editCount=0 must hide edit badge completely, got ${hotCheck.editBadgeCount}`);
    assert(hotCheck.stackedCount === 4, `Hot Topic mode must render 4 stacked metrics, got ${hotCheck.stackedCount}`);
    assert(hotCheck.numColor === 'rgb(56, 189, 248)' && hotCheck.numSize === '18px', `Hot Topic metric numbers must be 18px #38bdf8, got ${hotCheck.numSize}/${hotCheck.numColor}`);
    console.log('[Verify] ✓ Hot Topic Mode (4 stacked metrics), 0-links zero height & editCount=0 hidden verified');

    // 13. Mobile viewport check
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const mobileMetrics = await page.evaluate(() => {
      const aside = document.querySelector('.gd-timeline-aside');
      const asideRect = aside ? aside.getBoundingClientRect() : null;
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        asideLeft: asideRect ? asideRect.left : 0,
      };
    });
    assert(mobileMetrics.scrollWidth <= mobileMetrics.innerWidth + 2, `Mobile horizontal overflow: ${mobileMetrics.scrollWidth} > ${mobileMetrics.innerWidth}`);
    assert(mobileMetrics.asideLeft > 120, `Mobile timeline aside should stay on bottom-right, left=${mobileMetrics.asideLeft}`);
    console.log('[Verify] ✓ Mobile viewport & zero horizontal overflow verified');

    assert(pageErrors.length === 0, `Page runtime errors detected: ${pageErrors.join('; ')}`);
    console.log('\n===============================================================');
    console.log('🎉 ALL GESTURE DETAIL VISUAL DE-NOISING E2E CHECKS PASSED 100%!');
    console.log('===============================================================\n');
  } finally {
    if (browser) await browser.close();
    try {
      execSync('node ./node_modules/astro/bin/astro.mjs dev stop', { cwd: process.cwd(), stdio: 'ignore' });
    } catch {}
    try {
      if (devProc.pid) process.kill(-devProc.pid, 'SIGKILL');
    } catch {
      try { devProc.kill('SIGKILL'); } catch {}
    }
    await new Promise((r) => setTimeout(r, 200));
    if (hadComments && origComments !== null) fs.writeFileSync(COMMENTS_DEV_PATH, origComments, 'utf8');
    else if (fs.existsSync(COMMENTS_DEV_PATH)) fs.unlinkSync(COMMENTS_DEV_PATH);
    if (hadBoosts && origBoosts !== null) fs.writeFileSync(BOOSTS_DEV_PATH, origBoosts, 'utf8');
    else if (fs.existsSync(BOOSTS_DEV_PATH)) fs.unlinkSync(BOOSTS_DEV_PATH);
  }
}

run().catch((err) => {
  console.error('[Verify] FAILED:', err);
  process.exit(1);
});
