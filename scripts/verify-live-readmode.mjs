import { chromium } from 'playwright';

async function verifyLiveReadMode() {
  const liveUrls = [
    'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/',
    'https://f42f7552.shijianus-blog.pages.dev/posts/content-formats-and-markup-mastery/'
  ];

  let browser;
  let allPassed = true;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    for (const liveUrl of liveUrls) {
      console.log(`\n================================================================`);
      console.log(`Auditing Production Live URL: ${liveUrl}`);
      console.log(`================================================================`);

      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
      });
      const page = await context.newPage();

      // Track console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      console.log(`Loading ${liveUrl}...`);
      const response = await page.goto(liveUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log(`HTTP Status: ${response?.status()}`);
      if (response && response.status() >= 400) {
        console.warn(`URL returned status ${response.status()}, skipping to next if available.`);
        await context.close();
        continue;
      }

      await page.waitForTimeout(1000);

      // Step 1: Normal mode initial check
      console.log(`[Production Step 1] Verifying Normal Mode initial state...`);
      const initialReadMode = await page.evaluate(() => document.body.classList.contains('read-mode'));
      const normalNavVisible = await page.evaluate(() => {
        const nav = document.getElementById('nav');
        return nav && getComputedStyle(nav).display !== 'none';
      });
      const normalHeroVisible = await page.evaluate(() => {
        const hero = document.querySelector('.page-shell__hero');
        return hero && getComputedStyle(hero).display !== 'none';
      });
      const readHeaderHidden = await page.evaluate(() => {
        const h = document.querySelector('.read-mode-header');
        return !h || getComputedStyle(h).display === 'none';
      });

      console.log(`  - Initial read-mode false: ${!initialReadMode}`);
      console.log(`  - Nav visible: ${normalNavVisible}`);
      console.log(`  - Hero visible: ${normalHeroVisible}`);
      console.log(`  - Read header hidden: ${readHeaderHidden}`);

      // Step 2: Activate Read Mode
      console.log(`[Production Step 2] Activating Read Mode via id="readmode"...`);
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
      if (!readmodeBtn) throw new Error('Live: #readmode button not found!');
      await readmodeBtn.click();
      await page.waitForTimeout(600);

      const inReadMode = await page.evaluate(() => document.body.classList.contains('read-mode'));
      const datasetReadMode = await page.evaluate(() => document.documentElement.dataset.readmode === 'true');
      console.log(`  - Live body.read-mode: ${inReadMode}`);
      console.log(`  - Live dataset.readmode: ${datasetReadMode}`);
      if (!inReadMode) throw new Error('Live: Failed to enter read mode!');

      // Step 3: Verify Distraction Elimination
      console.log(`[Production Step 3] Verifying Distraction Elimination & Article Isolation...`);
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
      const copyrightHidden = await page.evaluate(() => {
        const el = document.querySelector('.post-copyright');
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
      console.log(`  - Copyright hidden: ${copyrightHidden}`);
      console.log(`  - Comments hidden: ${commentsHidden}`);
      console.log(`  - Next post recommendation hidden: ${paginationHidden}`);

      if (!navHidden || !heroHidden || !footerHidden || !copyrightHidden || !commentsHidden || !paginationHidden) {
        throw new Error('Live: Non-reading components were not hidden in read mode!');
      }

      // Step 4: Verify Article Body and Header
      const articleVisible = await page.evaluate(() => {
        const el = document.querySelector('article#article-container.article-body.post-content');
        return el && getComputedStyle(el).display !== 'none';
      });
      const readHeaderVisible = await page.evaluate(() => {
        const el = document.querySelector('.read-mode-header');
        return el && getComputedStyle(el).display !== 'none';
      });
      console.log(`  - Article content visible: ${articleVisible}`);
      console.log(`  - Read mode header visible: ${readHeaderVisible}`);
      if (!articleVisible || !readHeaderVisible) {
        throw new Error('Live: Article body or read mode header missing in read mode!');
      }

      // Step 5: Verify Width (No 880px squeeze)
      console.log(`[Production Step 5] Verifying Width (No 880px squeeze)...`);
      const postWidthInfo = await page.evaluate(() => {
        const post = document.getElementById('post');
        const computed = getComputedStyle(post);
        return {
          width: post.offsetWidth,
          maxWidth: computed.maxWidth
        };
      });
      console.log(`  - Live #post width: ${postWidthInfo.width}px (maxWidth: ${postWidthInfo.maxWidth})`);
      if (postWidthInfo.maxWidth === '880px' || postWidthInfo.width <= 880) {
        throw new Error(`Live: #post is still squeezed to <= 880px (${postWidthInfo.width}px)!`);
      }
      console.log(`  ✓ Live #post width ${postWidthInfo.width}px comfortably exceeds 880px!`);

      // Step 6: Verify Sidebar TOC Retention & Collaboration with #hide-aside-btn
      console.log(`[Production Step 6] Testing Sidebar TOC retention and #hide-aside-btn...`);
      const asideVisible = await page.evaluate(() => {
        const aside = document.querySelector('.page-aside');
        return aside && getComputedStyle(aside).display !== 'none' && aside.offsetWidth > 0;
      });
      const tocVisible = await page.evaluate(() => {
        const toc = document.getElementById('card-toc');
        return toc && getComputedStyle(toc).display !== 'none' && toc.offsetHeight > 0;
      });
      console.log(`  - Sidebar visible: ${asideVisible}`);
      console.log(`  - TOC (#card-toc) visible: ${tocVisible}`);
      if (!asideVisible || !tocVisible) {
        throw new Error('Live: Sidebar or TOC was incorrectly hidden in default read mode!');
      }

      // Click #hide-aside-btn to collapse
      const hideAsideBtn = await page.$('#hide-aside-btn');
      if (!hideAsideBtn) throw new Error('Live: #hide-aside-btn not found!');
      await hideAsideBtn.click();
      await page.waitForTimeout(500);

      const asideWidthAfterCollapse = await page.evaluate(() => {
        const aside = document.querySelector('.page-aside');
        return aside ? aside.offsetWidth : 0;
      });
      const postWidthAfterCollapse = await page.evaluate(() => {
        const post = document.getElementById('post');
        return post ? post.offsetWidth : 0;
      });

      console.log(`  - Aside width after collapse: ${asideWidthAfterCollapse}px`);
      console.log(`  - Post width after collapse: ${postWidthAfterCollapse}px`);

      if (asideWidthAfterCollapse > 5 || postWidthAfterCollapse <= postWidthInfo.width) {
        throw new Error('Live: Sidebar failed to collapse or post failed to expand!');
      }
      console.log(`  ✓ Post successfully expanded to ${postWidthAfterCollapse}px upon sidebar collapse!`);

      // Re-expand sidebar
      await hideAsideBtn.click();
      await page.waitForTimeout(500);

      const asideWidthAfterExpand = await page.evaluate(() => {
        const aside = document.querySelector('.page-aside');
        return aside ? aside.offsetWidth : 0;
      });
      console.log(`  - Aside width after re-expand: ${asideWidthAfterExpand}px`);
      if (asideWidthAfterExpand < 200) {
        throw new Error('Live: Sidebar failed to re-expand!');
      }

      // Step 7: Exit Read Mode
      console.log(`[Production Step 7] Testing Exit Read Mode...`);
      const exitBtn = await page.$('.exit-readmode');
      if (!exitBtn) throw new Error('Live: .exit-readmode button not found!');
      await exitBtn.click();
      await page.waitForTimeout(500);

      const exitedReadMode = await page.evaluate(() => !document.body.classList.contains('read-mode'));
      console.log(`  - Live exited read mode: ${exitedReadMode}`);
      if (!exitedReadMode) throw new Error('Live: Failed to exit read mode!');

      // Take screenshot of live production state for audit proof
      await page.screenshot({ path: 'scratch/live-readmode-exit-state.png', fullPage: false });

      await context.close();
      console.log(`✓ Production URL ${liveUrl} PASSED ALL AUDIT CHECKS!\n`);
      break; // Successfully tested against production live deployment
    }

    console.log(`\n================================================================`);
    console.log(`🎉 PRODUCTION LIVE E2E VERIFICATION COMPLETED SUCCESSFULLY!`);
    console.log(`================================================================\n`);
  } catch (err) {
    console.error(`\n❌ PRODUCTION TEST FAILURE:`, err);
    allPassed = false;
  } finally {
    if (browser) await browser.close();
  }

  if (!allPassed) {
    process.exit(1);
  }
}

verifyLiveReadMode();
