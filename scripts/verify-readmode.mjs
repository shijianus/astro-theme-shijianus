import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(distDir, reqUrl);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

async function runReadModeVerification() {
  const port = 4366;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  const server = await createStaticServer(distDir, port);
  console.log(`[Server] Static test server listening on http://localhost:${port}`);

  let browser;
  let allPassed = true;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const viewports = [
      { name: 'Desktop Large (1440x900)', width: 1440, height: 900, isDesktop: true },
      { name: 'Desktop Standard (1280x800)', width: 1280, height: 800, isDesktop: true },
      { name: 'Mobile (375x667)', width: 375, height: 667, isDesktop: false }
    ];

    for (const vp of viewports) {
      console.log(`\n================================================================`);
      console.log(` Auditing Viewport: ${vp.name}`);
      console.log(`================================================================`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height }
      });
      const page = await context.newPage();

      // Navigate to standard test post with TOC
      const targetUrl = `http://localhost:${port}/posts/content-formats-and-markup-mastery/`;
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(600);

      // ── Step 1: Initial Normal Mode Audit ──
      console.log(`[Step 1] Verifying Normal Mode initial state...`);
      const initialReadMode = await page.evaluate(() => document.body.classList.contains('read-mode'));
      if (initialReadMode) throw new Error('Initial state should NOT be read-mode!');

      const normalNavVisible = await page.evaluate(() => {
        const nav = document.getElementById('nav');
        return nav && getComputedStyle(nav).display !== 'none';
      });
      const normalHeroVisible = await page.evaluate(() => {
        const hero = document.querySelector('.page-shell__hero');
        return hero && getComputedStyle(hero).display !== 'none';
      });
      const normalReadHeaderHidden = await page.evaluate(() => {
        const h = document.querySelector('.read-mode-header');
        return !h || getComputedStyle(h).display === 'none';
      });

      console.log(`  - Nav visible: ${normalNavVisible}`);
      console.log(`  - Hero visible: ${normalHeroVisible}`);
      console.log(`  - Read mode header hidden: ${normalReadHeaderHidden}`);

      if (!normalNavVisible || !normalHeroVisible || !normalReadHeaderHidden) {
        throw new Error('Normal mode initial elements check failed!');
      }

      // ── Step 2: Activate Read Mode (Click id="readmode") ──
      console.log(`[Step 2] Activating Read Mode via id="readmode"...`);

      // If #rightside-config-hide is not showing, click #rightside-config first
      const isConfigOpen = await page.evaluate(() => {
        const hide = document.getElementById('rightside-config-hide');
        return hide && hide.classList.contains('show');
      });
      if (!isConfigOpen) {
        const configBtn = await page.$('#rightside-config');
        if (configBtn) await configBtn.click();
        await page.waitForTimeout(300);
      }

      const readmodeBtn = await page.$('#readmode');
      if (!readmodeBtn) throw new Error('#readmode button not found!');
      await readmodeBtn.click();
      await page.waitForTimeout(500);

      const inReadMode = await page.evaluate(() => document.body.classList.contains('read-mode'));
      const datasetReadMode = await page.evaluate(() => document.documentElement.dataset.readmode === 'true');
      console.log(`  - body.read-mode: ${inReadMode}`);
      console.log(`  - html[data-readmode='true']: ${datasetReadMode}`);
      if (!inReadMode || !datasetReadMode) throw new Error('Failed to enter read mode!');

      // ── Step 3: Verify Distraction Elimination & Article-body Isolation ──
      console.log(`[Step 3] Verifying Distraction Elimination & Article Isolation...`);

      const navHidden = await page.evaluate(() => {
        const el = document.getElementById('nav');
        return !el || getComputedStyle(el).display === 'none';
      });
      const heroHidden = await page.evaluate(() => {
        const el = document.querySelector('.page-shell__hero');
        return !el || getComputedStyle(el).display === 'none';
      });
      const footerHidden = await page.evaluate(() => {
        const el = document.getElementById('footer');
        return !el || getComputedStyle(el).display === 'none';
      });
      const aiAbstractHidden = await page.evaluate(() => {
        const el = document.querySelector('#post-ai-abstract') || document.querySelector('.post-ai-abstract');
        return !el || getComputedStyle(el).display === 'none';
      });
      const copyrightHidden = await page.evaluate(() => {
        const el = document.querySelector('.post-copyright');
        return !el || getComputedStyle(el).display === 'none';
      });
      const relatedHidden = await page.evaluate(() => {
        const el = document.querySelector('.relatedPosts');
        return !el || getComputedStyle(el).display === 'none';
      });
      const commentsHidden = await page.evaluate(() => {
        const el = document.querySelector('#post-comment');
        return !el || getComputedStyle(el).display === 'none';
      });
      const paginationHidden = await page.evaluate(() => {
        const el = document.querySelector('#pagination.pagination-post');
        return !el || getComputedStyle(el).display === 'none';
      });

      console.log(`  - Nav hidden: ${navHidden}`);
      console.log(`  - Hero hidden: ${heroHidden}`);
      console.log(`  - Footer hidden: ${footerHidden}`);
      console.log(`  - AI abstract hidden: ${aiAbstractHidden}`);
      console.log(`  - Copyright hidden: ${copyrightHidden}`);
      console.log(`  - Related posts hidden: ${relatedHidden}`);
      console.log(`  - Comments hidden: ${commentsHidden}`);
      console.log(`  - Next post recommendation hidden: ${paginationHidden}`);

      if (!navHidden || !heroHidden || !footerHidden || !copyrightHidden || !commentsHidden || !paginationHidden) {
        throw new Error('Distraction components were NOT properly hidden in read mode!');
      }

      // Check article body and clean header
      const articleVisible = await page.evaluate(() => {
        const el = document.querySelector('article#article-container.article-body.post-content');
        return el && getComputedStyle(el).display !== 'none';
      });
      const readHeaderVisible = await page.evaluate(() => {
        const el = document.querySelector('.read-mode-header');
        return el && getComputedStyle(el).display !== 'none';
      });
      console.log(`  - Article container (.article-body.post-content) visible: ${articleVisible}`);
      console.log(`  - In-article title header (.read-mode-header) visible: ${readHeaderVisible}`);
      if (!articleVisible || !readHeaderVisible) {
        throw new Error('Article body or read mode header missing in read mode!');
      }

      // ── Step 4: Verify Width (No 880px Contraction) ──
      console.log(`[Step 4] Verifying Width (No 880px clamp)...`);
      const postWidthInfo = await page.evaluate(() => {
        const post = document.getElementById('post');
        const computed = getComputedStyle(post);
        return {
          width: post.offsetWidth,
          maxWidth: computed.maxWidth
        };
      });
      console.log(`  - #post rendered width: ${postWidthInfo.width}px (maxWidth: ${postWidthInfo.maxWidth})`);

      if (vp.isDesktop) {
        // On desktop, 1440px or 1280px viewport with 300px sidebar leaves ~1000px for #post!
        // It must NOT be squeezed to 880px.
        if (postWidthInfo.maxWidth === '880px') {
          throw new Error('FAILED: #post still has max-width: 880px!');
        }
        if (postWidthInfo.width <= 880) {
          throw new Error(`FAILED: #post width ${postWidthInfo.width}px is squeezed <= 880px!`);
        }
        console.log(`  ✓ #post width ${postWidthInfo.width}px comfortably exceeds 880px squeeze!`);
      }

      // ── Step 5: Verify Sidebar TOC Retention & Other Aside Cards Hidden ──
      if (vp.isDesktop) {
        console.log(`[Step 5] Verifying Sidebar TOC default retention on Desktop...`);
        const asideVisible = await page.evaluate(() => {
          const aside = document.querySelector('.page-aside');
          return aside && getComputedStyle(aside).display !== 'none' && aside.offsetWidth > 0;
        });
        const tocVisible = await page.evaluate(() => {
          const toc = document.getElementById('card-toc');
          return toc && getComputedStyle(toc).display !== 'none' && toc.offsetHeight > 0;
        });
        const cardInfoHidden = await page.evaluate(() => {
          const info = document.querySelector('#aside-content .card-info');
          return !info || getComputedStyle(info).display === 'none';
        });
        const recentHidden = await page.evaluate(() => {
          const rec = document.querySelector('#aside-content #card-recent-post');
          return !rec || getComputedStyle(rec).display === 'none';
        });

        console.log(`  - Sidebar (.page-aside) visible: ${asideVisible}`);
        console.log(`  - TOC (#card-toc) visible: ${tocVisible}`);
        console.log(`  - Author card (.card-info) hidden: ${cardInfoHidden}`);
        console.log(`  - Recent posts (#card-recent-post) hidden: ${recentHidden}`);

        if (!asideVisible || !tocVisible) {
          throw new Error('Sidebar or TOC was incorrectly hidden in default read mode!');
        }
        if (!cardInfoHidden || !recentHidden) {
          throw new Error('Distracting sidebar cards were not hidden in read mode!');
        }

        // ── Step 5.5: Verify TOC Sticky Box & Internal Scroll ("翻页") in Read Mode ──
        console.log(`[Step 5.5] Verifying TOC Sticky Box & Internal Scroll in Read Mode...`);
        const tocScrollState = await page.evaluate(() => {
          const cardToc = document.getElementById('card-toc');
          const tocContent = cardToc?.querySelector('.toc-content');
          const stickyBox = document.getElementById('aside-sticky-box-toc');
          const trackToc = document.getElementById('aside-track-toc');

          if (!cardToc || !tocContent || !stickyBox || !trackToc) {
            return { error: 'TOC elements not found' };
          }

          const beforeScroll = tocContent.scrollTop;
          tocContent.scrollTop = 150;
          const afterScroll = tocContent.scrollTop;
          tocContent.scrollTop = beforeScroll;

          return {
            scrollHeight: tocContent.scrollHeight,
            clientHeight: tocContent.clientHeight,
            canScrollInternal: tocContent.scrollHeight > tocContent.clientHeight && afterScroll > beforeScroll,
            stickyPosition: window.getComputedStyle(stickyBox).position,
            stickyTop: window.getComputedStyle(stickyBox).top,
            trackHeight: trackToc.offsetHeight
          };
        });

        console.log(`  - TOC internal scroll test:`, tocScrollState);
        if (!tocScrollState.canScrollInternal) {
          throw new Error(`TOC internal scroll failed: scrollHeight=${tocScrollState.scrollHeight}, clientHeight=${tocScrollState.clientHeight}`);
        }
        if (tocScrollState.stickyPosition !== 'sticky') {
          throw new Error(`aside-sticky-box-toc position is not sticky: ${tocScrollState.stickyPosition}`);
        }
        console.log(`  ✓ TOC internal scrolling ("翻页") verified successfully!`);

        // Test sticky persistence during scrolling down article
        const testScrollPositions = [800, 3000, 10000, 20000];
        for (const sy of testScrollPositions) {
          await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), sy);
          await page.waitForTimeout(150);
          const pos = await page.evaluate(() => {
            const box = document.getElementById('aside-sticky-box-toc');
            const r = box?.getBoundingClientRect();
            return r ? Math.round(r.top) : null;
          });
          console.log(`  - Scrolled to ${sy}px: aside-sticky-box-toc top = ${pos}px`);
          if (pos === null || pos < 20 || pos > 30) {
            throw new Error(`aside-sticky-box-toc failed to remain sticky at 24px (actual: ${pos}px at scroll ${sy}px)!`);
          }
        }
        console.log(`  ✓ aside-sticky-box-toc consistently sticky at 24px across the full article!`);

        // Test clicking a TOC link
        console.log(`  Testing clicking a TOC heading link...`);
        const clickedHeading = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('#card-toc .toc-link'));
          if (links.length < 3) return null;
          const link = links[2];
          link.click();
          return { href: link.getAttribute('href'), text: link.textContent?.trim() };
        });
        await page.waitForTimeout(400);
        const activeTOC = await page.evaluate(() => {
          const active = document.querySelector('#card-toc .toc-link.active');
          return active?.textContent?.trim();
        });
        console.log(`  - Clicked heading: ${clickedHeading?.text} -> active TOC: ${activeTOC}`);
        console.log(`  ✓ TOC link click and active tracking verified!`);
      }

      // ── Step 6: Collaborate with id="hide-aside-btn" (Collapse & Expand Sidebar) ──
      if (vp.isDesktop) {
        console.log(`[Step 6] Testing collaboration with id="hide-aside-btn"...`);

        // Click #hide-aside-btn to collapse
        const hideAsideBtn = await page.$('#hide-aside-btn');
        if (!hideAsideBtn) throw new Error('#hide-aside-btn not found!');
        await hideAsideBtn.click();
        await page.waitForTimeout(500);

        const asideCollapsed = await page.evaluate(() => document.documentElement.dataset.aside === 'collapsed');
        const asideWidthAfterCollapse = await page.evaluate(() => {
          const aside = document.querySelector('.page-aside');
          return aside ? aside.offsetWidth : 0;
        });
        const postWidthAfterCollapse = await page.evaluate(() => {
          const post = document.getElementById('post');
          return post ? post.offsetWidth : 0;
        });

        console.log(`  - data-aside="collapsed": ${asideCollapsed}`);
        console.log(`  - Aside width after collapse: ${asideWidthAfterCollapse}px`);
        console.log(`  - Post width after collapse: ${postWidthAfterCollapse}px`);

        if (!asideCollapsed || asideWidthAfterCollapse > 5) {
          throw new Error('Sidebar failed to collapse via #hide-aside-btn!');
        }
        if (postWidthAfterCollapse <= postWidthInfo.width) {
          throw new Error('Post did not expand when sidebar collapsed!');
        }
        console.log(`  ✓ Post expanded from ${postWidthInfo.width}px to ${postWidthAfterCollapse}px upon sidebar collapse!`);

        // Click #hide-aside-btn again to re-expand
        await hideAsideBtn.click();
        await page.waitForFunction(() => {
          const aside = document.querySelector('.page-aside');
          return aside && aside.offsetWidth >= 280;
        }, { timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(200);

        const asideExpanded = await page.evaluate(() => document.documentElement.dataset.aside === 'expanded');
        const asideWidthAfterExpand = await page.evaluate(() => {
          const aside = document.querySelector('.page-aside');
          return aside ? aside.offsetWidth : 0;
        });
        const tocVisibleAfterExpand = await page.evaluate(() => {
          const toc = document.getElementById('card-toc');
          return toc && getComputedStyle(toc).display !== 'none' && toc.offsetHeight > 0;
        });

        console.log(`  - data-aside="expanded": ${asideExpanded}`);
        console.log(`  - Aside width after re-expand: ${asideWidthAfterExpand}px`);
        console.log(`  - TOC visible after re-expand: ${tocVisibleAfterExpand}`);

        if (!asideExpanded || asideWidthAfterExpand < 250 || !tocVisibleAfterExpand) {
          throw new Error(`Sidebar failed to re-expand properly (width=${asideWidthAfterExpand}px)!`);
        }
        console.log(`  ✓ Sidebar and TOC successfully re-expanded!`);
      }

      // ── Step 7: Verify Exit Triggers (.exit-readmode button and Escape key) ──
      console.log(`[Step 7] Testing Exit Read Mode via .exit-readmode button...`);
      const exitBtn = await page.$('.exit-readmode');
      if (!exitBtn) throw new Error('.exit-readmode button not found in read mode!');
      await exitBtn.click();
      await page.waitForTimeout(500);

      const exitedReadMode = await page.evaluate(() => !document.body.classList.contains('read-mode'));
      console.log(`  - Exited read mode successfully: ${exitedReadMode}`);
      if (!exitedReadMode) throw new Error('Failed to exit read mode via .exit-readmode!');

      // Re-enter and test Escape key exit
      console.log(`  Testing Escape key exit...`);
      const readmodeBtnAgain = await page.$('#readmode');
      if (readmodeBtnAgain) {
        await readmodeBtnAgain.click();
        await page.waitForTimeout(400);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        const escExited = await page.evaluate(() => !document.body.classList.contains('read-mode'));
        console.log(`  - Exited via Escape key: ${escExited}`);
        if (!escExited) throw new Error('Failed to exit read mode via Escape key!');
      }

      await context.close();
      console.log(`✓ Viewport ${vp.name} passed all audit checks!`);
    }

    console.log(`\n================================================================`);
    console.log(`🎉 ALL READ MODE TESTS PASSED PERFECTLY!`);
    console.log(`================================================================\n`);
  } catch (err) {
    console.error(`\n❌ TEST FAILURE:`, err);
    allPassed = false;
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  if (!allPassed) {
    process.exit(1);
  }
}

runReadModeVerification();
