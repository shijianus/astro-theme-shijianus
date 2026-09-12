#!/usr/bin/env node
/**
 * End-to-End Playwright Verification for AI-Assisted Article i18n
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT, 'dist');
const PORT = 4324;
const BASE_URL = `http://localhost:${PORT}`;

function createStaticServer(distDir, port) {
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.webp': 'image/webp',
  };

  const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    let filePath = path.join(distDir, urlPath);
    if (!path.extname(filePath)) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = mime[ext] || 'application/octet-stream';

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404 Not Found</h1>');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  console.log('[E2E-i18n] 🚀 Starting Playwright verification on static build...');

  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('Dist directory does not exist! Run npm run build first.');
  }

  const server = await createStaticServer(DIST_DIR, PORT);
  console.log(`[E2E-i18n] 📡 Static test server running on ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // Test 1: Load Chinese original article /posts/hello-world/
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Chinese original article (/posts/hello-world/) ---');
    await page.goto(`${BASE_URL}/posts/hello-world/`, { waitUntil: 'networkidle' });

    const zhTitle = await page.$eval('.post-hero h1', (el) => el.textContent.trim());
    console.log(`  Article title: "${zhTitle}"`);
    if (!zhTitle.includes('主题重构启动记录')) {
      throw new Error(`Expected Chinese title "主题重构启动记录", got "${zhTitle}"`);
    }

    // Verify TOC in Chinese (H2 headings)
    const zhTocHeadings = await page.$$eval('#card-toc .toc-link .toc-text', (els) => els.map((el) => el.textContent.trim()));
    console.log(`  TOC headings:`, zhTocHeadings);
    if (!zhTocHeadings.some((h) => h.includes('这次重构的判断') || h.includes('判断'))) {
      throw new Error(`Expected Chinese TOC heading "这次重构的判断", got: ${JSON.stringify(zhTocHeadings)}`);
    }

    // Verify i18n switcher presence
    const i18nSwitch = await page.$('.post-hero__i18n-switch');
    if (!i18nSwitch) {
      throw new Error('Expected .post-hero__i18n-switch to exist on article page with multiple languages!');
    }
    const pillTexts = await page.$$eval('.post-hero__i18n-pill', (els) => els.map((el) => el.textContent.trim()));
    console.log(`  i18n switch pills:`, pillTexts);
    if (!pillTexts.some((p) => p.includes('English'))) {
      throw new Error(`Expected English pill in i18n switcher, got: ${JSON.stringify(pillTexts)}`);
    }

    const activePill = await page.$eval('.post-hero__i18n-pill.is-active', (el) => el.textContent.trim());
    console.log(`  Active pill: "${activePill}"`);
    if (!activePill.includes('简体中文')) {
      throw new Error(`Expected active pill to be 简体中文, got "${activePill}"`);
    }

    // -------------------------------------------------------------
    // Test 2: Switch to English via pill click
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Switch to English via pill click ---');
    const enPill = await page.$('.post-hero__i18n-pill[data-target-lang="en"]');
    if (!enPill) {
      throw new Error('Could not find English pill button!');
    }
    await enPill.click();
    await page.waitForURL(/hello-world-en/);
    await page.waitForLoadState('networkidle');

    const enTitle = await page.$eval('.post-hero h1', (el) => el.textContent.trim());
    console.log(`  Switched to English title: "${enTitle}"`);
    // Flexible check: AI may produce "Theme Refactor Kickoff Log" or "Theme Refactoring Kickoff Log"
    if (!enTitle.toLowerCase().includes('theme') || !enTitle.toLowerCase().includes('refactor')) {
      throw new Error(`Expected English title containing "Theme" and "Refactor", got "${enTitle}"`);
    }
    console.log(`  ✅ English title is valid: "${enTitle}"`);

    // Verify TOC updated to English headings
    const enTocHeadings = await page.$$eval('#card-toc .toc-link .toc-text', (els) => els.map((el) => el.textContent.trim()));
    console.log(`  English TOC headings:`, enTocHeadings);
    // Flexible: look for any English keyword indicating correct locale switch
    const hasEnglishToc = enTocHeadings.some((h) =>
      /[A-Z]/.test(h) && h.length > 3
    );
    if (!hasEnglishToc) {
      throw new Error(`Expected English TOC headings, got: ${JSON.stringify(enTocHeadings)}`);
    }
    console.log(`  ✅ English TOC headings verified.`);

    // Verify English body content
    const bodySnippet = await page.$eval('#article-container p', (el) => el.textContent.trim());
    console.log(`  English body snippet: "${bodySnippet.slice(0, 70)}..."`);
    // Must contain substantial Latin characters (not Chinese-only)
    const hasEnglishBody = /[a-zA-Z]{4,}/.test(bodySnippet) && bodySnippet.length > 20;
    if (!hasEnglishBody) {
      throw new Error(`Body does not appear to be localized English: "${bodySnippet}"`);
    }
    console.log(`  ✅ English body content verified.`);

    // Verify active pill updated
    const enActivePill = await page.$eval('.post-hero__i18n-pill.is-active', (el) => el.textContent.trim());
    console.log(`  Active pill on English page: "${enActivePill}"`);
    if (!enActivePill.includes('English')) {
      throw new Error(`Expected active pill to be English, got "${enActivePill}"`);
    }

    // -------------------------------------------------------------
    // Test 3: Switch back to Chinese via pill
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Switch back to Chinese via pill ---');
    const zhPill = await page.$('.post-hero__i18n-pill[data-target-lang="zh-CN"]');
    if (!zhPill) {
      throw new Error('Could not find Chinese pill on English page!');
    }
    await zhPill.click();
    await page.waitForURL(/\/posts\/hello-world\/?$/);
    await page.waitForLoadState('networkidle');

    const restoredTitle = await page.$eval('.post-hero h1', (el) => el.textContent.trim());
    console.log(`  Restored Chinese title: "${restoredTitle}"`);
    if (!restoredTitle.includes('主题重构启动记录')) {
      throw new Error(`Failed to restore Chinese title, got "${restoredTitle}"`);
    }

    // -------------------------------------------------------------
    // Test 4: Second localized article /posts/api-ready-theme-contracts-en/
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Verify api-ready-theme-contracts-en ---');
    await page.goto(`${BASE_URL}/posts/api-ready-theme-contracts-en/`, { waitUntil: 'networkidle' });

    const contractEnTitle = await page.$eval('.post-hero h1', (el) => el.textContent.trim());
    console.log(`  Contract English title: "${contractEnTitle}"`);
    if (!contractEnTitle.includes('Turning Theme Configuration into an API-Ready Contract')) {
      throw new Error(`Expected English contract title, got "${contractEnTitle}"`);
    }

    const contractToc = await page.$$eval('#card-toc .toc-link .toc-text', (els) => els.map((el) => el.textContent.trim()));
    console.log(`  Contract English TOC:`, contractToc);
    // Flexible: any English heading proves i18n switch worked
    const hasEnglishContractToc = contractToc.some((h) => /[a-zA-Z]{3,}/.test(h));
    if (!hasEnglishContractToc) {
      throw new Error(`Expected English contract TOC heading, got: ${JSON.stringify(contractToc)}`);
    }
    console.log(`  ✅ Contract English TOC verified.`);

    // -------------------------------------------------------------
    // Test 5: Homepage deduplication check
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Verify Homepage Feed deduplicates translations ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    const postCardLinks = await page.$$eval('.recent-post-item a[href^="/posts/"]', (els) =>
      els.map((el) => el.getAttribute('href')),
    );
    console.log(`  Found ${postCardLinks.length} post links on homepage feed.`);

    const helloWorldLinks = postCardLinks.filter((l) => l && l.includes('hello-world'));
    console.log(`  hello-world cards on home feed: ${JSON.stringify(helloWorldLinks)}`);
    if (helloWorldLinks.length > 1) {
      throw new Error(`Homepage shows duplicate cards for hello-world translations: ${JSON.stringify(helloWorldLinks)}`);
    }

    const contractLinks = postCardLinks.filter((l) => l && l.includes('api-ready-theme-contracts'));
    console.log(`  api-ready-theme-contracts cards on home feed: ${JSON.stringify(contractLinks)}`);
    if (contractLinks.length > 1) {
      throw new Error(`Homepage shows duplicate cards for contract translations: ${JSON.stringify(contractLinks)}`);
    }

    console.log('\n✅ ALL PLAYWRIGHT E2E VERIFICATION TESTS PASSED PERFECTLY!');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('\n❌ Playwright verification failed:', err);
  process.exit(1);
});
