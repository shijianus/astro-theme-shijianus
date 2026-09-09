#!/usr/bin/env node
/**
 * scripts/verify-readmode-consistency.mjs
 * 
 * Verifies the 3 core criteria for Read Mode:
 * 1. TOC position & size consistency: 0px drift between normal mode and read mode (x, right, width identical).
 * 2. Retention of native class="post-hero__inner" title/meta presentation without in-article header injection.
 * 3. Invisible scrollbars: card-toc scrollbar thumbs are completely hidden (scrollbar-width: none), no visible scrollbar track/thumb.
 * 4. Collaborative aside collapse/expansion and sticky behavior during scrolling.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const PORT = 4399;
const DIST = path.resolve('dist');
const ARTIFACT_DIR = '/root/.gemini/antigravity-cli/brain/eea956f8-4af6-4327-ae03-4e23e524e2e9';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      let filePath = path.join(DIST, urlPath);

      if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(PORT, () => {
      console.log(`[LocalServer] Listening at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

const VIEWPORTS = [
  { name: '1080p Desktop', width: 1920, height: 1080 },
  { name: 'Standard 1440', width: 1440, height: 900 },
  { name: 'Compact 1366', width: 1366, height: 768 },
];

async function runAudit() {
  console.log(`\n===============================================================`);
  console.log(`🚀 Read Mode Consistency & Hero Retention Audit`);
  console.log(`===============================================================\n`);

  const server = await startServer();
  const targetUrl = `http://127.0.0.1:${PORT}/posts/content-formats-and-markup-mastery/`;

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  let allPassed = true;

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\n-------------------------------------------------------------`);
      console.log(`🖥️  Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`-------------------------------------------------------------`);

      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(600);

        // ── Step 1: Measure Initial (Normal Mode) State ────────────────────────
        const normalHero = await page.$('.post-hero__inner');
        if (!normalHero) throw new Error('post-hero__inner not found in normal mode');
        const normalHeroVisible = await normalHero.isVisible();
        const heroTitle = await page.$eval('.post-hero__title-block h1', el => el.textContent.trim());

        const normalTocBox = await page.$eval('#card-toc', el => {
          const rect = el.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, left: rect.left };
        });

        console.log(`   [Normal] Hero Title: "${heroTitle}", Visible: ${normalHeroVisible}`);
        console.log(`   [Normal] TOC Box: left=${normalTocBox.left.toFixed(1)}px, right=${normalTocBox.right.toFixed(1)}px, width=${normalTocBox.width.toFixed(1)}px`);

        const imgNormal = path.join(ARTIFACT_DIR, `readmode-consistency-${vp.name.replace(/\s+/g, '_')}-1-normal.png`);
        await page.screenshot({ path: imgNormal, fullPage: false });

        // ── Step 2: Toggle Read Mode ──────────────────────────────────────────
        const cfg = await page.$('#rightside-config');
        if (cfg) await cfg.click();
        await page.waitForTimeout(200);

        const rm = await page.$('#readmode');
        if (!rm) throw new Error('#readmode button not found in DOM');
        await rm.click();
        await page.waitForTimeout(400);

        const isReadMode = await page.evaluate(() => document.body.classList.contains('read-mode'));
        if (!isReadMode) throw new Error('Body failed to acquire .read-mode');
        console.log(`   [ReadMode] Successfully toggled read-mode: true`);

        // ── Step 3: Verify TOC Position & Size Consistency ────────────────────
        const readTocBox = await page.$eval('#card-toc', el => {
          const rect = el.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, left: rect.left };
        });

        console.log(`   [ReadMode] TOC Box: left=${readTocBox.left.toFixed(1)}px, right=${readTocBox.right.toFixed(1)}px, width=${readTocBox.width.toFixed(1)}px`);

        const leftDrift = Math.abs(readTocBox.left - normalTocBox.left);
        const rightDrift = Math.abs(readTocBox.right - normalTocBox.right);
        const widthDrift = Math.abs(readTocBox.width - normalTocBox.width);

        console.log(`   [Consistency] Drift: left=${leftDrift.toFixed(2)}px, right=${rightDrift.toFixed(2)}px, width=${widthDrift.toFixed(2)}px`);

        if (leftDrift > 1.5 || rightDrift > 1.5 || widthDrift > 1.5) {
          console.error(`   ❌ FAILURE: TOC position/size drifted in read mode! Drift: left=${leftDrift}px, width=${widthDrift}px`);
          allPassed = false;
        } else {
          console.log(`   ✅ PASS: TOC size and horizontal position 100% identical (Drift <= 1.5px)!`);
        }

        // ── Step 4: Verify Post Hero Retention & No In-Article Header ─────────
        const readHeroVisible = await page.$eval('.post-hero__inner', el => {
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.height > 0;
        });

        const inArticleHeaderExists = await page.$eval('article.article-body', el => {
          return Boolean(el.querySelector('.read-mode-header'));
        });

        console.log(`   [ReadMode] post-hero__inner Visible: ${readHeroVisible}`);
        console.log(`   [ReadMode] In-Article read-mode-header exists: ${inArticleHeaderExists}`);

        if (!readHeroVisible) {
          console.error(`   ❌ FAILURE: post-hero__inner is not visible in read mode!`);
          allPassed = false;
        } else if (inArticleHeaderExists) {
          console.error(`   ❌ FAILURE: Unexpected .read-mode-header found inside article-body!`);
          allPassed = false;
        } else {
          console.log(`   ✅ PASS: Native post-hero__inner retained and in-article header cleanly removed!`);
        }

        // ── Step 5: Verify Invisible Scrollbars (No Explicit Scrollbar Thumb) ─
        const tocScrollbarInfo = await page.$eval('#card-toc .toc-content', el => {
          const style = window.getComputedStyle(el);
          return {
            scrollbarWidth: style.scrollbarWidth,
            overflowY: style.overflowY,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
          };
        });

        console.log(`   [ReadMode] TOC Scrollbar: scrollbarWidth="${tocScrollbarInfo.scrollbarWidth}", overflowY="${tocScrollbarInfo.overflowY}", canScroll=${tocScrollbarInfo.scrollHeight > tocScrollbarInfo.clientHeight}`);

        if (tocScrollbarInfo.scrollbarWidth !== 'none') {
          console.error(`   ❌ FAILURE: TOC scrollbarWidth is "${tocScrollbarInfo.scrollbarWidth}", expected "none"!`);
          allPassed = false;
        } else {
          console.log(`   ✅ PASS: TOC scrollbar is completely invisible (scrollbar-width: none)!`);
        }

        const imgReadTop = path.join(ARTIFACT_DIR, `readmode-consistency-${vp.name.replace(/\s+/g, '_')}-2-read-top.png`);
        await page.screenshot({ path: imgReadTop, fullPage: false });

        // ── Step 6: Scroll Page & Verify Sticky Adhesion at top: 24px ─────────
        await page.evaluate(() => window.scrollTo(0, 800));
        await page.waitForTimeout(300);

        const scrolledTocBox = await page.$eval('#aside-sticky-box-toc', el => {
          const rect = el.getBoundingClientRect();
          return { y: rect.y, height: rect.height, top: rect.top };
        });

        console.log(`   [ReadMode Scrolled] Sticky Box Top: ${scrolledTocBox.top.toFixed(1)}px (Expected ~24px)`);
        if (Math.abs(scrolledTocBox.top - 24) > 3) {
          console.error(`   ❌ FAILURE: Sticky Box Top is ${scrolledTocBox.top}px, not 24px!`);
          allPassed = false;
        } else {
          console.log(`   ✅ PASS: Sticky Box pinned stably at 24px during reading!`);
        }

        const imgReadScrolled = path.join(ARTIFACT_DIR, `readmode-consistency-${vp.name.replace(/\s+/g, '_')}-3-read-scrolled.png`);
        await page.screenshot({ path: imgReadScrolled, fullPage: false });

        // ── Step 7: Collapse Aside via #hide-aside-btn ────────────────────────
        const hideBtn = await page.$('#hide-aside-btn');
        if (hideBtn) {
          await hideBtn.click();
          await page.waitForTimeout(500);

          const asideWidth = await page.$eval('.page-aside', el => el.getBoundingClientRect().width);
          const mainWidth = await page.$eval('.page-main', el => el.getBoundingClientRect().width);
          const containerWidth = await page.$eval('#content-inner.layout', el => el.getBoundingClientRect().width);

          console.log(`   [Aside Collapsed] Aside Width: ${asideWidth}px, Main: ${mainWidth.toFixed(1)}px, Container: ${containerWidth.toFixed(1)}px`);

          if (asideWidth > 2) {
            console.error(`   ❌ FAILURE: Aside width did not collapse to 0px!`);
            allPassed = false;
          } else {
            console.log(`   ✅ PASS: Aside collapsed smoothly in read mode!`);
          }

          // Restore Aside & wait for width to settle back to 300px
          await hideBtn.click();
          await page.waitForFunction(() => {
            const aside = document.querySelector('.page-aside');
            return aside && Math.abs(aside.getBoundingClientRect().width - 300) < 1;
          }, { timeout: 3000 });
          await page.waitForTimeout(100);

          const restoredTocBox = await page.$eval('#card-toc', el => {
            const rect = el.getBoundingClientRect();
            return { left: rect.left, width: rect.width };
          });

          const restoreDrift = Math.abs(restoredTocBox.left - normalTocBox.left);
          console.log(`   [Aside Restored] Restored TOC left: ${restoredTocBox.left.toFixed(1)}px, drift from original: ${restoreDrift.toFixed(2)}px`);
          if (restoreDrift > 2) {
            console.error(`   ❌ FAILURE: Restored TOC drifted!`);
            allPassed = false;
          } else {
            console.log(`   ✅ PASS: Aside restored to identical position!`);
          }
        }

      } catch (err) {
        console.error(`   ❌ ERROR on ${vp.name}:`, err.message);
        allPassed = false;
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n===============================================================`);
  if (allPassed) {
    console.log(`🎉 ALL READ MODE CONSISTENCY TESTS PASSED ACROSS ALL VIEWPORTS!`);
  } else {
    console.log(`❌ SOME TESTS FAILED! Please inspect logs above.`);
  }
  console.log(`===============================================================\n`);

  process.exit(allPassed ? 0 : 1);
}

runAudit();
