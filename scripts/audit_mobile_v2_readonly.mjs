import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const LIVE_URL = 'https://blog.epocanvas.com';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'scripts/audit_screenshots/mobile_full_audit_v2');

async function runReadOnlyAudit() {
  console.log('=====================================================================');
  console.log('🚀 RUNNING READ-ONLY MOBILE FULL AUDIT V2 (PLAYWRIGHT MCP)');
  console.log(`🎯 Production URL: ${LIVE_URL}`);
  console.log(`📁 Screenshot Output: ${SCREENSHOT_DIR}`);
  console.log('=====================================================================\n');

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  const auditData = {
    timestamp: new Date().toISOString(),
    routesChecked: [],
    modalsChecked: [],
    tocStackingAnalysis: null,
    loadingBoxAnalysis: null,
    extendedFindings: []
  };

  try {
    // 1. Mobile Context (iPhone 14/15 Pro: 390x844)
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();

    // 1.1 Core Pages Audit
    const pages = [
      { name: '01_home', url: '/' },
      { name: '02_post_formats', url: '/posts/content-formats-and-markup-mastery/' },
      { name: '03_post_embeds', url: '/posts/example-embeds/' },
      { name: '04_post_code', url: '/posts/example-code-enhancements/' },
      { name: '05_support', url: '/support/' },
      { name: '06_categories', url: '/categories/' },
      { name: '07_tags', url: '/tags/' },
      { name: '08_archives', url: '/archives/' },
      { name: '09_friends', url: '/friends/' },
      { name: '10_about', url: '/about/' },
      { name: '11_status', url: '/status/' }
    ];

    for (const p of pages) {
      console.log(`\n🔍 Checking [${p.name}] ${LIVE_URL}${p.url}`);
      try {
        await page.goto(`${LIVE_URL}${p.url}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1800);

        const res = await page.evaluate(() => {
          const sw = document.body.scrollWidth;
          const cw = window.innerWidth;
          const dw = document.documentElement.scrollWidth;
          return {
            scrollWidth: sw,
            clientWidth: cw,
            docScrollWidth: dw,
            hasOverflow: sw > cw || dw > cw,
            overflowDelta: Math.max(sw, dw) - cw
          };
        });

        console.log(`   Overflow: ${res.hasOverflow ? `⚠️ OVERFLOW (+${res.overflowDelta}px)` : '✅ ZERO (390px)'}`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${p.name}.png`) });

        auditData.routesChecked.push({ ...p, ...res });
      } catch (err) {
        console.log(`   ⚠️ Failed loading ${p.url}:`, err.message);
        auditData.routesChecked.push({ ...p, error: err.message });
      }
    }

    // 1.2 Deep Inspection of #mobile-toc-button and #rightside stacking
    console.log('\n🔍 Deep Inspection: #mobile-toc-button and #rightside stacking on post page...');
    await page.goto(`${LIVE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const tocAnalysis = await page.evaluate(() => {
      const tocBtn = document.getElementById('mobile-toc-button');
      const rightside = document.getElementById('rightside');
      const showGroup = document.getElementById('rightside-config-show');
      const hideGroup = document.getElementById('rightside-config-hide');

      const getBox = el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        return {
          id: el.id,
          tag: el.tagName,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          display: s.display,
          visibility: s.visibility,
          opacity: s.opacity,
          zIndex: s.zIndex,
          pointerEvents: s.pointerEvents,
          parent: el.parentElement ? el.parentElement.id || el.parentElement.tagName : null
        };
      };

      // Check if tocBtn is overlapped by anything
      let hitElementAtCenter = null;
      let isCovered = false;
      if (tocBtn) {
        const tr = tocBtn.getBoundingClientRect();
        const cx = tr.x + tr.width / 2;
        const cy = tr.y + tr.height / 2;
        const hit = document.elementFromPoint(cx, cy);
        hitElementAtCenter = hit ? {
          tag: hit.tagName,
          id: hit.id,
          cls: hit.className
        } : null;
        isCovered = hit !== tocBtn && !tocBtn.contains(hit);
      }

      return {
        tocBtn: getBox(tocBtn),
        rightside: getBox(rightside),
        showGroup: getBox(showGroup),
        hideGroup: getBox(hideGroup),
        hitElementAtCenter,
        isCovered
      };
    });

    console.log('TOC Stacking Analysis:', JSON.stringify(tocAnalysis, null, 2));
    auditData.tocStackingAnalysis = tocAnalysis;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_post_toc_stacking_closeup.png') });

    // 1.3 Deep Inspection of Loading Screen (#loading-box)
    console.log('\n🔍 Deep Inspection: Loading Screen behavior...');
    const loadingAnalysis = await page.evaluate(() => {
      const box = document.getElementById('loading-box');
      if (!box) return { exists: false };
      const s = window.getComputedStyle(box);
      return {
        exists: true,
        classList: Array.from(box.classList),
        display: s.display,
        opacity: s.opacity,
        visibility: s.visibility,
        pointerEvents: s.pointerEvents,
        hasLoadedClass: box.classList.contains('loaded')
      };
    });
    console.log('Loading Box State on Idle:', loadingAnalysis);
    auditData.loadingBoxAnalysis = loadingAnalysis;

    // 1.4 Deep Inspection of Support Page Tiers & Overlap
    console.log('\n🔍 Deep Inspection: Support Page preset cards and music disc...');
    await page.goto(`${LIVE_URL}/support/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    const supportAnalysis = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.support-dashboard button[title*="赞赏支持"]')).map(b => {
        const r = b.getBoundingClientRect();
        const truncated = Array.from(b.querySelectorAll('*')).filter(c => {
          const s = window.getComputedStyle(c);
          return s.textOverflow === 'ellipsis' && c.scrollWidth > c.clientWidth;
        }).map(c => c.innerText);
        return {
          text: b.innerText.replace(/\n/g, ' ').trim(),
          width: Math.round(r.width),
          height: Math.round(r.height),
          rect: { x: Math.round(r.x), y: Math.round(r.y) },
          truncated
        };
      });

      const musicToggle = document.querySelector('.shijianus-music-pocket__toggle');
      const mRect = musicToggle ? musicToggle.getBoundingClientRect() : null;

      // Check overlap
      let overlappedCards = [];
      if (mRect) {
        cards.forEach((c, idx) => {
          const bRect = { left: c.rect.x, right: c.rect.x + c.width, top: c.rect.y, bottom: c.rect.y + c.height };
          if (!(bRect.right < mRect.left || bRect.left > mRect.right || bRect.bottom < mRect.top || bRect.top > mRect.bottom)) {
            overlappedCards.push(idx);
          }
        });
      }

      return {
        cardCount: cards.length,
        firstCardWidth: cards[0]?.width || 0,
        cards,
        truncatedCount: cards.filter(c => c.truncated.length > 0).length,
        musicToggleSize: mRect ? { w: Math.round(mRect.width), h: Math.round(mRect.height) } : null,
        overlappedCards
      };
    });

    console.log('Support Analysis:', JSON.stringify(supportAnalysis, null, 2));
    auditData.supportAnalysis = supportAnalysis;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_support_closeup.png') });

    // 1.5 Deep Inspection of Comment Section on Mobile
    console.log('\n🔍 Deep Inspection: Comment Section (#post-comment) on Mobile...');
    await page.goto(`${LIVE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);

    const commentAnalysis = await page.evaluate(() => {
      const comment = document.getElementById('post-comment');
      if (!comment) return { exists: false };
      comment.scrollIntoView();
      const s = window.getComputedStyle(comment);
      const r = comment.getBoundingClientRect();
      const submitBtn = comment.querySelector('button[type="submit"], .tk-submit button');
      const modeTabs = Array.from(comment.querySelectorAll('.comment-mode-tab, button')).filter(b => b.innerText.includes('评论') || b.innerText.includes('Boost') || b.innerText.includes('表情'));

      return {
        exists: true,
        width: Math.round(r.width),
        modeTabsCount: modeTabs.length,
        modeTabsText: modeTabs.map(t => t.innerText.trim()),
        hasSubmitBtn: !!submitBtn
      };
    });
    console.log('Comment Section Analysis:', commentAnalysis);
    auditData.commentAnalysis = commentAnalysis;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_post_comment_mobile.png') });

    // 1.6 Deep Inspection of Post Pagination Floating Card
    console.log('\n🔍 Deep Inspection: Pagination Post Recommendation on Mobile...');
    const paginationAnalysis = await page.evaluate(() => {
      const pagin = document.querySelector('#pagination.pagination-post');
      if (!pagin) return { exists: false };
      const r = pagin.getBoundingClientRect();
      const s = window.getComputedStyle(pagin);
      return {
        exists: true,
        rect: { w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(window.innerHeight - r.bottom), right: Math.round(window.innerWidth - r.right) },
        display: s.display,
        visibility: s.visibility,
        opacity: s.opacity
      };
    });
    console.log('Pagination Post Analysis:', paginationAnalysis);
    auditData.paginationAnalysis = paginationAnalysis;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_post_pagination_mobile.png') });

  } finally {
    await browser.close();
  }

  // Save audit data
  const dataPath = path.resolve(SCREENSHOT_DIR, 'readonly_audit_data.json');
  fs.writeFileSync(dataPath, JSON.stringify(auditData, null, 2), 'utf-8');
  console.log(`\n📊 Audit data successfully saved to: ${dataPath}`);
  return auditData;
}

runReadOnlyAudit().catch(err => {
  console.error('Audit Error:', err);
  process.exit(1);
});
