import { chromium } from 'playwright';
import { spawn } from 'child_process';
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

async function waitForServer(url, timeoutMs = 45000) {
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
    await waitForServer(`${BASE_URL}/guestbook/`);
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

    await page.waitForSelector('.gd-monolithic-shell', { timeout: 15000 });
    await page.waitForSelector('#floor-1 .gd-edit-count-badge', { timeout: 15000 });
    await page.waitForSelector('#floor-5 .gd-reply-target-pill', { timeout: 15000 });
    await page.waitForTimeout(300);

    // 1. Detail isolation: home boost wall & filter nav bar MUST be completely removed
    const boostWallCount = await page.locator('.gb-boost-wall-card').count();
    const navBarCount = await page.locator('.gb-nav-bar').count();
    assert(boostWallCount === 0, `Home boost wall must be removed in detail view, got ${boostWallCount}`);
    assert(navBarCount === 0, `Home filter/search nav bar must be removed in detail view, got ${navBarCount}`);
    console.log('[Verify] ✓ Detail immersive isolation verified (home boost wall & nav removed)');

    // 2. Monolithic dark frosted glass & no #1 楼主 badge
    const shellStyle = await page.$eval('.gd-monolithic-shell', (el) => {
      const cs = window.getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        backdrop: cs.backdropFilter || cs.webkitBackdropFilter,
        overflow: cs.overflow,
      };
    });
    console.log('[Verify] Monolithic shell style:', shellStyle);
    assert(shellStyle.overflow !== 'hidden', `Monolithic shell overflow must not be hidden (got ${shellStyle.overflow})`);
    assert(shellStyle.backdrop.includes('blur'), `Expected backdrop-filter blur, got ${shellStyle.backdrop}`);

    const floorNumTextCount = await page.locator('.gb-floor-number').count();
    assert(floorNumTextCount === 0, 'Must NOT render explicit #1 楼主 label');
    console.log('[Verify] ✓ Monolithic dark frosted glass & implicit floor_index verified');

    // 3. ZONE 1: Title & static read-only tags
    const titleInfo = await page.$eval('.gd-zone1-title', (el) => ({
      text: el.textContent?.trim(),
      fontSize: parseFloat(window.getComputedStyle(el).fontSize),
    }));
    assert(titleInfo.text?.includes('欢迎来到读者留言与交流广场'), `Unexpected title: ${titleInfo.text}`);
    assert(titleInfo.fontSize >= 22, `Title font size should be >= 22px, got ${titleInfo.fontSize}`);
    const staticTagsCount = await page.locator('.gd-zone1-tags .gd-static-badge').count();
    assert(staticTagsCount >= 2, `Expected at least 2 static badges, got ${staticTagsCount}`);
    console.log(`[Verify] ✓ ZONE 1 title (${titleInfo.fontSize}px) & ${staticTagsCount} static read-only tags verified`);

    // 4. ZONE 2: Sticky avatar, NO vertical line on normal rail, NO IP location, edit_count + createdAt
    const opRailCheck = await page.$eval('#floor-1 .gd-avatar-rail', (el) => {
      const cs = window.getComputedStyle(el);
      const stickyEl = el.querySelector('.gd-sticky-avatar-wrap');
      const stickyCs = stickyEl ? window.getComputedStyle(stickyEl) : null;
      return {
        borderLeftWidth: cs.borderLeftWidth,
        bg: cs.backgroundColor,
        stickyPos: stickyCs?.position,
        stickyTop: stickyCs?.top,
      };
    });
    assert(opRailCheck.stickyPos === 'sticky', `OP avatar must be sticky, got ${opRailCheck.stickyPos}`);
    assert(opRailCheck.borderLeftWidth === '0px', `Normal avatar rail must have no line, got ${opRailCheck.borderLeftWidth}`);

    const opAuthorMeta = await page.locator('#floor-1 .gd-author-meta-right').textContent();
    assert(opAuthorMeta?.includes('2') && opAuthorMeta?.includes('8月 3日'), `Expected edit_count + first date, got "${opAuthorMeta}"`);
    assert(!opAuthorMeta?.includes('杭州') && !opAuthorMeta?.includes('中国'), `Must NOT show IP location in author bar`);
    console.log('[Verify] ✓ ZONE 2 sticky avatar, clean rail, and author meta verified');

    // 5. ZONE 3: Scoped Boost (OP always visible; SubGesture Floor 2 zero-footprint until [⚡] clicked)
    const opBoostCount = await page.locator('#floor-1 .gd-zone3-boost.is-op .gd-boost-op-pill').count();
    if (opBoostCount < 2) {
      console.log('[Debug] #floor-1 .gd-zone3-boost HTML:', await page.locator('#floor-1 .gd-zone3-boost').innerHTML());
    }
    assert(opBoostCount >= 2, `Expected OP starter boosts >= 2, got ${opBoostCount}`);

    const f2BoostBefore = await page.locator('#floor-2 .gd-zone3-boost').count();
    assert(f2BoostBefore === 0, `Floor 2 with 0 boosts must have zero DOM footprint, got ${f2BoostBefore}`);

    // Click [⚡] on Floor 2 -> input slides open; blur while empty -> auto-collapses
    await page.locator('#floor-2 button[aria-label="发送 Boost 短评"]').click();
    await page.waitForSelector('#floor-2 .gd-boost-inline-input');
    await page.locator('#floor-2 .gd-boost-inline-input').blur();
    await page.waitForTimeout(150);
    const f2BoostAfterBlur = await page.locator('#floor-2 .gd-zone3-boost').count();
    assert(f2BoostAfterBlur === 0, 'Empty SubGesture boost input must auto-collapse on blur');

    // Re-open Floor 2 Boost and actually submit a scoped boost
    await page.locator('#floor-2 button[aria-label="发送 Boost 短评"]').click();
    await page.locator('#floor-2 .gd-boost-inline-input').fill('测试子楼层 Boost 微语');
    await page.locator('#floor-2 .gd-boost-inline-submit').click();
    await page.waitForSelector('#floor-2 .gd-boost-compact-strip', { timeout: 5000 });
    console.log('[Verify] ✓ ZONE 3 scoped Boost progressive disclosure & submission verified');

    // 6. ZONE 4: Top-4 Aggregated Emoji pill + Hover Breakdown + [•••] Slide-Out Drawer
    const topIconsCount = await page.locator('#floor-1 .gd-agg-emoji-char').count();
    assert(topIconsCount <= 4 && topIconsCount >= 1, `Expected 1..4 top emoji icons, got ${topIconsCount}`);
    await page.locator('#floor-1 .gd-agg-emoji-pill').hover();
    await page.waitForSelector('#floor-1 .gd-reaction-breakdown-popover', { timeout: 3000 });

    await page.locator('#floor-1 button[aria-label="更多操作"]').click();
    await page.waitForSelector('#floor-1 .gd-more-drawer.is-open');
    console.log('[Verify] ✓ ZONE 4 Top-4 Emoji pill hover breakdown & animated [•••] drawer verified');

    // 7. ZONE 5 & ZONE 6: Related links + Topic Map + AI summary + Hot filter
    const linksCount = await page.locator('.gd-zone5-links .gd-related-link-row').count();
    assert(linksCount >= 2, `Expected >= 2 related links in ZONE 5, got ${linksCount}`);
    const tmStatsText = await page.locator('.gd-zone6-topic-map').textContent();
    assert(tmStatsText?.includes('觀看') && tmStatsText?.includes('個讚') && tmStatsText?.includes('使用者'), 'Topic Map metrics missing');
    await page.locator('button[title="AI 讨论脉络摘要"]').click();
    await page.waitForSelector('.gd-ai-digest-panel');
    console.log('[Verify] ✓ ZONE 5 related links & ZONE 6 Topic Map + AI summary verified');

    // 8. Scene A: 1-to-N Direct Replies Timeline on Floor 2 (Alice -> 2 replies: lanfeng & Mr.XiWang)
    const f2DirectBtn = page.locator('#floor-2 .gd-direct-replies-btn');
    await f2DirectBtn.click();
    await page.waitForSelector('#floor-2 .gd-direct-replies-timeline');
    const timelineRows = await page.locator('#floor-2 .gd-timeline-reply-row').count();
    assert(timelineRows === 2, `Expected 2 direct replies under Floor 2, got ${timelineRows}`);
    const timelineAvatarPos = await page.$eval('#floor-2 .gd-timeline-avatar', (el) => window.getComputedStyle(el).position);
    assert(timelineAvatarPos === 'static', `Timeline reply avatar must be non-sticky (static), got ${timelineAvatarPos}`);

    // Click [↓ 跳至贴文] on first timeline reply -> should jump & pin ├─ [ 返回 ]
    await page.locator('#floor-2 .gd-timeline-reply-row .gd-jump-post-btn').first().click();
    await page.waitForSelector('.gd-tl-return-anchor', { timeout: 3000 });
    await page.waitForTimeout(450);

    // Click ├─ [ 返回 ] -> returns and clears anchor
    await page.locator('.gd-tl-return-btn').click();
    await page.waitForTimeout(450);
    const returnAnchorAfter = await page.locator('.gd-tl-return-anchor').count();
    assert(returnAnchorAfter === 0, 'Return anchor must fade out after clicking [返回]');

    // Collapse Scene A via bottom [ ^ ] button
    await page.locator('#floor-2 .gd-timeline-bottom-collapse-btn').click();
    await page.waitForTimeout(150);
    const timelineCollapsed = await page.locator('#floor-2 .gd-direct-replies-timeline').count();
    assert(timelineCollapsed === 0, 'Bottom [ ^ ] must collapse Scene A direct replies timeline');
    console.log('[Verify] ✓ Scene A 1-to-N timeline, non-sticky avatars, bidirectional collapse & ├─ [ 返回 ] verified');

    // 9. Scene B: 1-to-1 Nested Parent SubGesture on Floor 5 (Mr.XiWang -> [↪ Alice]) + Scroll Compensation
    const f5Badge = page.locator('#floor-5 .gd-reply-target-pill');
    await f5Badge.scrollIntoViewIfNeeded();
    await f5Badge.click();
    await page.waitForSelector('#floor-5 .gd-nested-parent-box');

    // Verify dual sticky avatars (outer Floor 5 + inner Alice) and explicit 1px vertical line
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

    // Measure scroll compensation when collapsing Scene B via inner [⌄]
    await page.evaluate(() => {
      const card = document.querySelector('#floor-5 .gd-floor-markdown');
      if (card) card.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    await page.waitForTimeout(150);
    const collapseBtnBox = await page.locator('#floor-5 .gd-nested-collapse-btn').boundingBox();
    assert(collapseBtnBox, 'Collapse button boundingBox missing');
    const beforeCollapse = await page.evaluate(() => {
      const body = document.querySelector('#floor-5 .gd-floor-markdown');
      return {
        scrollY: window.scrollY,
        bodyTop: body ? body.getBoundingClientRect().top : 0,
      };
    });
    // Click at exact rendered coordinates of sticky collapse button so Playwright doesn't auto-scroll sticky node
    await page.mouse.click(collapseBtnBox.x + collapseBtnBox.width / 2, collapseBtnBox.y + collapseBtnBox.height / 2);
    await page.waitForTimeout(100);
    const afterCollapse = await page.evaluate(() => {
      const body = document.querySelector('#floor-5 .gd-floor-markdown');
      return {
        scrollY: window.scrollY,
        bodyTop: body ? body.getBoundingClientRect().top : 0,
      };
    });
    const topDrift = Math.abs(afterCollapse.bodyTop - beforeCollapse.bodyTop);
    console.log(`[Verify] Scene B collapse scroll compensation: scrollY ${Math.round(beforeCollapse.scrollY)} -> ${Math.round(afterCollapse.scrollY)}, bodyTop drift = ${Math.round(topDrift)}px`);
    assert(topDrift <= 4, `Expected replyer body to stay stationary after collapse compensation, drift=${topDrift}px`);
    console.log('[Verify] ✓ Scene B dual sticky avatars, explicit 1px │ line & scroll compensation verified');

    // 10. Orthogonal Quote Card on Floor 5
    const quoteCard = page.locator('#floor-5 .gd-quote-card');
    assert((await quoteCard.count()) === 1, 'Expected orthogonal Quote card on Floor 5');
    await page.locator('#floor-5 .gd-quote-action-btn[title="展开被引用原贴全文"]').click();
    await page.waitForSelector('#floor-5 .gd-quote-full-md');
    await page.locator('#floor-5 .gd-quote-action-btn[title="跳至被引用楼层"]').click();
    await page.waitForSelector('.gd-tl-return-anchor');
    await page.locator('.gd-tl-return-btn').click();
    await page.waitForTimeout(300);
    console.log('[Verify] ✓ Orthogonal Quote card expansion & [↑] jump + [返回] verified');

    // 11. Right Timeline Scroller Controls ([📖] quick jump, [📚] hot filter, [🔔] subscribe)
    await page.locator('.gd-tl-overview-btn').click();
    await page.waitForSelector('.gd-tl-quick-popover');
    await page.locator('.gd-tl-overview-btn').click();
    await page.locator('.gd-tl-dock-btn.is-hot-filter').click();
    await page.waitForSelector('.gd-hot-filter-banner');
    await page.locator('.gd-hot-filter-banner button').click();
    await page.locator('.gd-tl-dock-btn[aria-label="订阅通知"]').click();
    await page.waitForSelector('.gd-tl-dock-btn.is-subscribed');
    console.log('[Verify] ✓ Right timeline scroller controls verified');

    // 12. Reply creation in detail view
    await page.locator('#detail-reply-composer textarea').fill('自动化端到端测试跟帖：验证单层暗色毛玻璃与右侧时间轴滑块联动！');
    await page.locator('.gd-submit-reply-btn').click();
    await page.waitForSelector('#floor-6', { timeout: 8000 });
    console.log('[Verify] ✓ Live SubGesture reply persistence & floor 6 rendering verified');

    // 13. Mobile viewport check (avoiding bottom-left MusicPocket & zero horizontal overflow)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    const mobileMetrics = await page.evaluate(() => {
      const aside = document.querySelector('.gd-timeline-aside');
      const asideRect = aside ? aside.getBoundingClientRect() : null;
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        asideRight: asideRect ? asideRect.right : 0,
        asideLeft: asideRect ? asideRect.left : 0,
      };
    });
    console.log('[Verify] Mobile metrics:', mobileMetrics);
    assert(mobileMetrics.scrollWidth <= mobileMetrics.innerWidth + 2, `Mobile horizontal overflow: ${mobileMetrics.scrollWidth} > ${mobileMetrics.innerWidth}`);
    assert(mobileMetrics.asideLeft > 120, `Mobile timeline aside should stay on bottom-right away from MusicPocket, left=${mobileMetrics.asideLeft}`);
    console.log('[Verify] ✓ Mobile layout & MusicPocket clearance verified');

    assert(pageErrors.length === 0, `Page runtime errors detected: ${pageErrors.join('; ')}`);
    console.log('\n===============================================================');
    console.log('🎉 ALL GESTURE DETAIL PAGE E2E VERIFICATIONS PASSED 100%!');
    console.log('===============================================================\n');
  } finally {
    if (browser) await browser.close();
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
