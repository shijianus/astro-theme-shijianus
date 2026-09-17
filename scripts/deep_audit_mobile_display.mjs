import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:4321'; // 先测试本地或者线上

async function runDeepAudit() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const routes = [
    '/',
    '/posts/content-formats-and-markup-mastery/',
    '/support/',
    '/categories/',
    '/tags/',
    '/archives/'
  ];

  const issues = [];

  for (const route of routes) {
    const url = `https://blog.epocanvas.com${route}`;
    console.log(`\n🔍 Auditing route: ${route} (${url})`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // 1. Check Horizontal Overflow
    const overflow = await page.evaluate(() => {
      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowWidth: window.innerWidth,
        hasOverflow: document.body.scrollWidth > window.innerWidth,
        overflowDelta: document.body.scrollWidth - window.innerWidth
      };
    });
    if (overflow.hasOverflow) {
      issues.push({ route, type: 'HORIZONTAL_OVERFLOW', detail: `ScrollWidth ${overflow.bodyScrollWidth} > Viewport ${overflow.windowWidth} (+${overflow.overflowDelta}px)` });
    }

    // 2. Check Floating / Fixed elements that cover interactive areas
    const fixedOverlaps = await page.evaluate(() => {
      const fixed = Array.from(document.querySelectorAll('*')).filter(el => {
        const s = window.getComputedStyle(el);
        if (s.position === 'fixed' && s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0) {
          const r = el.getBoundingClientRect();
          return r.width > 30 && r.height > 30 && r.top < window.innerHeight && r.bottom > 0;
        }
        return false;
      }).map(el => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          id: el.id,
          cls: el.className ? (typeof el.className === 'string' ? el.className.split(' ').slice(0, 3).join('.') : '') : '',
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
        };
      });
      return fixed;
    });

    console.log(`  Fixed visible elements on ${route}:`, fixedOverlaps.length);
    for (const f of fixedOverlaps) {
      console.log(`    - [${f.tag}] id="${f.id}" class="${f.cls}" rect:`, f.rect);
    }

    // 3. Check Support Page specific issues
    if (route === '/support/') {
      const supportDetails = await page.evaluate(() => {
        const presets = Array.from(document.querySelectorAll('.grid-cols-3 button, .support-preset-tier-btn')).map(b => {
          const r = b.getBoundingClientRect();
          return {
            text: b.innerText.replace(/\n/g, ' '),
            width: Math.round(r.width),
            height: Math.round(r.height),
            truncatedText: Array.from(b.querySelectorAll('*')).filter(c => {
              const s = window.getComputedStyle(c);
              return s.textOverflow === 'ellipsis' && c.scrollWidth > c.clientWidth;
            }).map(c => c.innerText)
          };
        });

        // Check if music pocket or rightside overlaps preset buttons
        const music = document.querySelector('.shijianus-music-pocket');
        const rightside = document.getElementById('rightside');
        const mRect = music ? music.getBoundingClientRect() : null;
        const rRect = rightside ? rightside.getBoundingClientRect() : null;

        const overlaps = [];
        const btns = document.querySelectorAll('.grid-cols-3 button');
        btns.forEach((btn, idx) => {
          const bRect = btn.getBoundingClientRect();
          if (mRect && !(bRect.right < mRect.left || bRect.left > mRect.right || bRect.bottom < mRect.top || bRect.top > mRect.bottom)) {
            overlaps.push({ target: `PresetBtn #${idx}`, overlappedBy: 'music-pocket' });
          }
          if (rRect && !(bRect.right < rRect.left || bRect.left > rRect.right || bRect.bottom < rRect.top || bRect.top > rRect.bottom)) {
            overlaps.push({ target: `PresetBtn #${idx}`, overlappedBy: 'rightside' });
          }
        });

        return { presets, overlaps };
      });
      console.log('  Support page details:', JSON.stringify(supportDetails, null, 2));
    }

    // 4. Check Post Detail specific issues
    if (route === '/posts/content-formats-and-markup-mastery/') {
      const postDetails = await page.evaluate(() => {
        // Check hero lede, badges, code blocks
        const codeBlocks = Array.from(document.querySelectorAll('figure.highlight, pre')).map(c => ({
          tag: c.tagName,
          w: c.scrollWidth,
          cw: c.clientWidth,
          hasOverflow: c.scrollWidth > c.clientWidth
        }));

        const tocDrawer = document.getElementById('mobile-toc-button');
        const tocVisible = tocDrawer ? window.getComputedStyle(tocDrawer).display !== 'none' : false;

        return {
          codeBlocksOverflowCount: codeBlocks.filter(c => c.hasOverflow).length,
          hasMobileTocButton: !!tocDrawer,
          mobileTocVisible: tocVisible
        };
      });
      console.log('  Post detail info:', postDetails);
    }
  }

  console.log('\n================ AUDIT SUMMARY ================');
  console.log('Issues found:', issues);
  await browser.close();
}

runDeepAudit().catch(console.error);
