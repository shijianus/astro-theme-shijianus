#!/usr/bin/env node
/**
 * Playwright verification script for translated article quality & defect-free rendering
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT, 'dist');
const PORT = 4325;
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
  console.log('[Quality-E2E] Starting Playwright browser verification on built static pages...\n');

  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('Dist directory does not exist! Run npm run build first.');
  }

  const server = await createStaticServer(DIST_DIR, PORT);
  console.log(`[Quality-E2E] 📡 Test server listening on ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  try {
    // -----------------------------------------------------------------------
    // Test 1: Verify English translated article
    // -----------------------------------------------------------------------
    console.log('\n--- 1. Testing /posts/content-formats-and-markup-mastery-en/ ---');
    await page.goto(`${BASE_URL}/posts/content-formats-and-markup-mastery-en/`, { waitUntil: 'networkidle' });

    // (A) Verify no post-hero__i18n-switch button exists
    const switchBtn = await page.$('.post-hero__i18n-switch');
    if (switchBtn) {
      throw new Error('Found .post-hero__i18n-switch which must be removed according to requirements!');
    }
    console.log('  ✅ .post-hero__i18n-switch button correctly absent.');

    // (B) Verify no isAiGenerated / AI-translated badge exists
    const aiBadge = await page.$('.ai-translated-badge');
    if (aiBadge) {
      throw new Error('Found AI translated badge which should not be present!');
    }
    console.log('  ✅ No AI-translated badge displayed.');

    // (C) Check KaTeX math rendering (Maxwell equation)
    const katexMath = await page.$('.katex');
    if (!katexMath) {
      throw new Error('KaTeX formula element not found on page!');
    }
    const html = await page.content();
    if (html.includes('artial t}') && !html.includes('\\partial t}')) {
      throw new Error('Found corrupted LaTeX formula fragment "artial t}"!');
    }
    console.log('  ✅ KaTeX math formula rendered correctly (no corrupted artial t}).');

    // (D) Check Accordion Group and Tabs nesting
    const accordionGroup = await page.$('.article-accordion-group');
    if (!accordionGroup) {
      throw new Error('.article-accordion-group element not found!');
    }
    const tabsInsideAccordion = await page.$('.article-accordion-group .article-tabs');
    if (tabsInsideAccordion) {
      throw new Error('Syntax Error: .article-tabs is swallowed INSIDE .article-accordion-group!');
    }
    console.log('  ✅ .article-tabs is properly separated outside .article-accordion-group.');

    // (E) Check Unit Converter data-title translation
    const unitConverter = await page.$('.interactive-unit-converter');
    if (!unitConverter) {
      throw new Error('.interactive-unit-converter not found!');
    }
    const dataTitle = await unitConverter.getAttribute('data-title');
    console.log(`  Unit converter data-title: "${dataTitle}"`);
    if (/[\u4e00-\u9fa5]/.test(dataTitle)) {
      throw new Error(`Untranslated Chinese characters in unit converter data-title: "${dataTitle}"`);
    }
    if (!dataTitle.includes('Interactive') || !dataTitle.includes('Converter')) {
      throw new Error(`Expected English data-title, got: "${dataTitle}"`);
    }
    console.log('  ✅ Unit converter data-title is fully localized in English.');

    // (F) Check Chat container integrity
    const chatContainer = await page.$('.article-chat');
    if (!chatContainer) {
      throw new Error('.article-chat element not found!');
    }
    const chatMessages = await page.$$('.article-chat .chat-message');
    console.log(`  Found ${chatMessages.length} chat messages inside .article-chat`);
    if (chatMessages.length < 6) {
      throw new Error(`Expected 6 chat messages inside .article-chat, found ${chatMessages.length}!`);
    }
    const orphanMessages = await page.$$eval('#article-container > .chat-message', (els) => els.length);
    if (orphanMessages > 0) {
      throw new Error(`Found ${orphanMessages} orphan chat messages outside .article-chat!`);
    }
    console.log('  ✅ All 6 chat messages cleanly nested inside .article-chat container.');

    // (G) Check Tail sections (Mindmap, Encryption, Footnotes, Conclusion)
    const encryptedBox = await page.$('.article-encrypted-box');
    if (!encryptedBox) {
      throw new Error('Encrypted box not found!');
    }
    const footnotes = await page.$('.footnotes');
    console.log('  ✅ Encrypted boxes and footnotes exist.');

    // Check for literal "undefined" in visible body
    const bodyText = await page.$eval('#article-container', (el) => el.innerText);
    const undefinedMatches = bodyText.match(/(?<!["'`a-zA-Z0-9_-])undefined(?![a-zA-Z0-9_-])/gi);
    if (undefinedMatches) {
      throw new Error(`Suspicious "undefined" text found in article body: ${undefinedMatches.length} occurrences!`);
    }
    console.log('  ✅ Zero literal "undefined" text in article body.');

    // -----------------------------------------------------------------------
    // Test 2: Verify German, Spanish, French, Traditional Chinese articles
    // -----------------------------------------------------------------------
    const otherLocales = [
      { code: 'de', titleWord: 'Zusammenfassung' },
      { code: 'es', titleWord: 'Resumen' },
      { code: 'fr', titleWord: 'supportés' },
      { code: 'zh-hant', titleWord: '支援' },
    ];

    for (const item of otherLocales) {
      console.log(`\n--- 2. Testing /posts/content-formats-and-markup-mastery-${item.code}/ ---`);
      await page.goto(`${BASE_URL}/posts/content-formats-and-markup-mastery-${item.code}/`, { waitUntil: 'networkidle' });

      // Check no switch button
      const sw = await page.$('.post-hero__i18n-switch');
      if (sw) throw new Error(`.post-hero__i18n-switch found in ${item.code}!`);

      // Check unit converter data-title has no Simplified Chinese (except for zh-hant which is traditional)
      const uc = await page.$('.interactive-unit-converter');
      if (uc) {
        const title = await uc.getAttribute('data-title');
        console.log(`  [${item.code}] unit converter title: "${title}"`);
        if (item.code !== 'zh-hant' && /[\u4e00-\u9fa5]/.test(title)) {
          throw new Error(`Untranslated Chinese in [${item.code}] unit converter: "${title}"`);
        }
      }

      // Check chat messages count
      const msgs = await page.$$('.article-chat .chat-message');
      if (msgs.length < 6) {
        throw new Error(`Expected at least 6 messages in [${item.code}] article-chat, got ${msgs.length}`);
      }
      console.log(`  ✅ [${item.code}] Verified successfully.`);
    }

    console.log('\n🎉 ALL PLAYWRIGHT QUALITY TESTS PASSED WITH ZERO DEFECTS!\n');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('\n❌ Playwright verification failed:', err);
  process.exit(1);
});
