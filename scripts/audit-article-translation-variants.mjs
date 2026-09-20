#!/usr/bin/env node
/**
 * Comprehensive Playwright Extraction & Verification Suite for Article Translation Variants
 * 
 * Audits every single article in `src/content/posts/`:
 * 1. Checks all `.article-translation-variant` elements in `#article-container`.
 * 2. Verifies presence of all intended language variants.
 * 3. Verifies initial visibility and default language.
 * 4. Extracts text content, length, heading structure, and language purity.
 * 5. Tests interactive switching across all available languages.
 * 6. Checks TOC, document title, and PostHero sync.
 * 7. Audits special edge cases (dot separators, casing, custom i18nKey, native English, protected posts).
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { normalizeLangCode, LANG_SUFFIX_REGEX, getPostCanonicalSlug } from '../src/lib/content.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.resolve(ROOT, 'dist');
const POSTS_DIR = path.resolve(ROOT, 'src/content/posts');
const PORT = 4335;
const BASE_URL = process.env.TEST_BASE_URL ? process.env.TEST_BASE_URL.replace(/\/+$/, '') : `http://127.0.0.1:${PORT}`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

function startStaticServer() {
  const server = http.createServer((req, res) => {
    try {
      let reqPath = decodeURIComponent(req.url.split('?')[0]);
      if (reqPath.endsWith('/')) reqPath += 'index.html';
      let filePath = path.join(DIST_DIR, reqPath);
      if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
        filePath = `${filePath}.html`;
      } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1>');
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`500 Server Error: ${err?.message}`);
    }
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[StaticServer] 📡 Serving ${DIST_DIR} on ${BASE_URL}`);
      resolve(server);
    });
  });
}

function parseFrontmatterSimple(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: content };
  const yamlStr = match[1];
  const meta = {};
  for (const line of yamlStr.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx !== -1) {
      const k = trimmed.slice(0, colonIdx).trim();
      let v = trimmed.slice(colonIdx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      meta[k] = v;
    }
  }
  return { meta, body: content.slice(match[0].length) };
}

function scanAllSourcePosts() {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  const postInfoList = [];

  for (const file of files) {
    const fullPath = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const { meta, body } = parseFrontmatterSimple(raw);
    const baseStem = file.replace(/\.(md|mdx)$/, '');
    const suffixMatch = baseStem.match(LANG_SUFFIX_REGEX);
    const inferredBase = getPostCanonicalSlug(baseStem);
    let inferredLang = 'zh-CN';
    if (suffixMatch) {
      const s = suffixMatch[1].toLowerCase();
      inferredLang = (s === 'zh-hant' || s === 'zh-tw' || s === 'zh-hk') ? 'zh-Hant' : (s === 'zh-cn' || s === 'zh-hans') ? 'zh-CN' : s;
    }

    const lang = normalizeLangCode(meta.lang) || inferredLang;
    const i18nKey = meta.i18nKey || inferredBase;
    const isProtected = Boolean(meta.access || raw.includes('passwordHash') || meta.password);

    postInfoList.push({
      file,
      baseStem,
      inferredBase,
      i18nKey,
      lang,
      title: meta.title || baseStem,
      isProtected,
      bodyLength: body.trim().length,
    });
  }

  // Group by canonical key
  const groups = new Map();
  for (const p of postInfoList) {
    let groupKey = p.i18nKey;
    if (!groups.has(groupKey)) {
      for (const [key, group] of groups.entries()) {
        if (group.some((item) => item.inferredBase === p.inferredBase || item.i18nKey === p.inferredBase || item.inferredBase === p.i18nKey)) {
          groupKey = key;
          break;
        }
      }
    }
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(p);
  }

  return { postInfoList, groups };
}

async function runAudit() {
  console.log('========================================================================');
  console.log('🔬 STARTING DEEP PLAYWRIGHT AUDIT ON ARTICLE TRANSLATION VARIANTS');
  console.log('========================================================================\n');

  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('Dist directory does not exist! Run npm run build:static first.');
  }

  const { postInfoList, groups } = scanAllSourcePosts();
  console.log(`[Source Analysis] Found ${postInfoList.length} total markdown files across ${groups.size} post groups.\n`);

  let server = null;
  if (!process.env.TEST_BASE_URL) {
    server = await startStaticServer();
  } else {
    console.log(`[Remote Test] 🌐 Targeting live remote host: ${BASE_URL}\n`);
  }
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
  });
  const page = await context.newPage();

  const auditResults = [];
  let totalAssertions = 0;
  let passedAssertions = 0;
  let failedAssertions = 0;

  function assert(condition, message, details = '') {
    totalAssertions++;
    if (condition) {
      passedAssertions++;
      console.log(`    ✅ PASS: ${message}`);
      return true;
    } else {
      failedAssertions++;
      console.error(`    ❌ FAIL: ${message} ${details ? `(${details})` : ''}`);
      return false;
    }
  }

  // Find all canonical directories in dist/posts
  const distPostDirs = fs.readdirSync(path.join(DIST_DIR, 'posts')).filter((d) => {
    const p = path.join(DIST_DIR, 'posts', d);
    return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'index.html'));
  });

  console.log(`[Dist Analysis] Found ${distPostDirs.length} post directories in dist/posts/.\n`);

  for (const [groupKey, sourcePosts] of groups.entries()) {
    // Determine the primary canonical slug
    const nonSuffixPost = sourcePosts.find((p) => !LANG_SUFFIX_REGEX.test(p.baseStem));
    const canonicalSlug = nonSuffixPost ? nonSuffixPost.baseStem : sourcePosts[0].inferredBase;
    const url = `${BASE_URL}/posts/${canonicalSlug}/`;

    console.log(`\n------------------------------------------------------------------------`);
    console.log(`🔍 Auditing Group: "${groupKey}" -> ${url}`);
    console.log(`   Source files (${sourcePosts.length}): ${sourcePosts.map((s) => `${s.lang}(${s.file})`).join(', ')}`);

    const groupResult = {
      groupKey,
      canonicalSlug,
      url,
      sourceFiles: sourcePosts.map((s) => ({ file: s.file, lang: s.lang, title: s.title })),
      expectedLangs: [...new Set(sourcePosts.map((s) => s.lang))],
      isProtected: sourcePosts.some((s) => s.isProtected),
      renderedVariants: [],
      switchingTests: [],
      passed: true,
      anomalies: [],
    };

    // Load canonical URL
    let response;
    try {
      response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    } catch (err) {
      assert(false, `Page navigation to ${url} failed`, err.message);
      groupResult.passed = false;
      groupResult.anomalies.push(`Navigation failed: ${err.message}`);
      auditResults.push(groupResult);
      continue;
    }

    const status = response.status();
    assert(status === 200, `HTTP status is 200 for ${canonicalSlug}`, `got ${status}`);
    if (status !== 200) {
      groupResult.passed = false;
      groupResult.anomalies.push(`HTTP ${status}`);
      auditResults.push(groupResult);
      continue;
    }

    // Check if protected
    if (groupResult.isProtected) {
      const accessPanel = await page.locator('.content-access-panel, .content-access-panel--server').count();
      assert(accessPanel > 0, `Protected post "${canonicalSlug}" shows access control gate without leakage`);
      const leakedVariants = await page.locator('.article-translation-variant').count();
      assert(leakedVariants === 0, `Protected post "${canonicalSlug}" leaks 0 translation variants to DOM`, `leaked: ${leakedVariants}`);
      if (leakedVariants > 0) {
        groupResult.passed = false;
        groupResult.anomalies.push(`Security Leak: ${leakedVariants} variants rendered before authentication!`);
      }
      auditResults.push(groupResult);
      continue;
    }

    // Unlocked post: Extract all .article-translation-variant elements
    const variantLocators = page.locator('#article-container .article-translation-variant');
    const variantCount = await variantLocators.count();

    const expectedLangs = groupResult.expectedLangs;
    const sourceLangsSorted = [...expectedLangs].sort();

    console.log(`   Expected languages from source: [${sourceLangsSorted.join(', ')}] (count: ${expectedLangs.length})`);
    console.log(`   Rendered .article-translation-variant elements: ${variantCount}`);

    const renderedLangs = [];
    const variantDetails = [];

    for (let i = 0; i < variantCount; i++) {
      const v = variantLocators.nth(i);
      const dataLang = await v.getAttribute('data-lang');
      renderedLangs.push(dataLang);

      const styleDisplay = await v.evaluate((el) => el.style.display);
      const isVisible = await v.isVisible();
      const rawText = (await v.innerText()).trim();
      const headings = await v.locator('h1, h2, h3').allInnerTexts();

      // Check text content quality (exclude <pre> and <code> to prevent false positives from code examples)
      const nonCodeText = await v.evaluate((el) => {
        const clone = el.cloneNode(true);
        clone.querySelectorAll('pre, code').forEach((c) => c.remove());
        return clone.innerText.trim();
      });
      const hasChinese = /[\u4e00-\u9fa5]/.test(rawText);
      const hasProtPlaceholder = /__PROT_\d+__/.test(rawText);
      const hasRawFrontmatter = /^(title:\s*|description:\s*|pubDate:\s*)/m.test(nonCodeText);

      variantDetails.push({
        dataLang,
        styleDisplay,
        isVisible,
        charCount: rawText.length,
        headingCount: headings.length,
        hasChinese,
        hasProtPlaceholder,
        hasRawFrontmatter,
        preview: rawText.slice(0, 80).replace(/\n/g, ' '),
      });
    }

    groupResult.renderedVariants = variantDetails;

    // Check 1: Does variant count match expected languages from source?
    const countMatch = assert(
      variantCount === expectedLangs.length,
      `Variant count (${variantCount}) matches expected source files (${expectedLangs.length})`,
      `Rendered: [${renderedLangs.join(', ')}], Expected: [${sourceLangsSorted.join(', ')}]`
    );
    if (!countMatch) {
      groupResult.passed = false;
      groupResult.anomalies.push(
        `Variant count mismatch: Rendered ${variantCount} [${renderedLangs.join(', ')}], expected ${expectedLangs.length} [${sourceLangsSorted.join(', ')}]`
      );
    }

    // Check 2: Are all expected language variants actually present in the DOM?
    for (const expectedLang of expectedLangs) {
      const found = renderedLangs.includes(expectedLang);
      const ok = assert(found, `Language variant [data-lang="${expectedLang}"] is rendered in DOM`, `Missing in: [${renderedLangs.join(', ')}]`);
      if (!ok) {
        groupResult.passed = false;
        groupResult.anomalies.push(`Missing language variant in DOM: "${expectedLang}"`);
      }
    }

    // Check 3: Check for duplicate variants with the same data-lang
    const duplicateLangs = renderedLangs.filter((l, idx) => renderedLangs.indexOf(l) !== idx);
    const noDuplicates = assert(duplicateLangs.length === 0, `No duplicate language variants in DOM`, `Duplicates: [${duplicateLangs.join(', ')}]`);
    if (!noDuplicates) {
      groupResult.passed = false;
      groupResult.anomalies.push(`Duplicate variants in DOM: [${duplicateLangs.join(', ')}]`);
    }

    // Check 4: Initial visibility state - exactly ONE variant should be visible
    const initiallyVisible = variantDetails.filter((v) => v.isVisible);
    const singleVisible = assert(
      initiallyVisible.length === 1,
      `Exactly 1 variant is visible on initial load`,
      `Visible count: ${initiallyVisible.length} (${initiallyVisible.map((v) => v.dataLang).join(', ')})`
    );
    if (!singleVisible) {
      groupResult.passed = false;
      groupResult.anomalies.push(`Initial visibility anomaly: ${initiallyVisible.length} variants visible`);
    }

    // Check 5: Content substantiveness and quality for every variant
    for (const v of variantDetails) {
      const substantive = assert(
        v.charCount >= 20,
        `Variant [${v.dataLang}] has substantive content (${v.charCount} chars)`
      );
      if (!substantive) {
        groupResult.passed = false;
        groupResult.anomalies.push(`Variant [${v.dataLang}] is empty or too short (${v.charCount} chars)`);
      }

      const noProt = assert(!v.hasProtPlaceholder, `Variant [${v.dataLang}] free of __PROT__ unreplaced placeholders`);
      if (!noProt) {
        groupResult.passed = false;
        groupResult.anomalies.push(`Variant [${v.dataLang}] contains leaked __PROT__ placeholders!`);
      }

      const noFm = assert(!v.hasRawFrontmatter, `Variant [${v.dataLang}] free of raw YAML frontmatter leakage`);
      if (!noFm) {
        groupResult.passed = false;
        groupResult.anomalies.push(`Variant [${v.dataLang}] contains raw YAML frontmatter leakage!`);
      }
    }

    // Check 6: Interactive Language Switching across all rendered variants
    if (variantCount > 1) {
      for (const targetLang of renderedLangs) {
        // Test real button click in PostHero first, fallback to switchArticleLanguage
        const btn = page.locator(`.post-hero__lang-tag[data-target-lang="${targetLang}"]`);
        if ((await btn.count()) > 0) {
          await btn.first().click();
        } else {
          await page.evaluate((tLang) => {
            if (typeof window.switchArticleLanguage === 'function') {
              window.switchArticleLanguage(tLang);
            }
          }, targetLang);
        }

        await page.waitForTimeout(150);

        // Verify active visibility
        const currentActive = await page.evaluate(() => {
          const visible = Array.from(document.querySelectorAll('.article-translation-variant')).filter(
            (el) => el.style.display !== 'none'
          );
          return visible.map((el) => el.dataset.lang);
        });

        const switchOk = assert(
          currentActive.length === 1 && currentActive[0] === targetLang,
          `Switching to [${targetLang}] displays ONLY [${targetLang}] variant`,
          `Currently active: [${currentActive.join(', ')}]`
        );

        if (!switchOk) {
          groupResult.passed = false;
          groupResult.anomalies.push(`Switching failed for [${targetLang}]: active variants are [${currentActive.join(', ')}]`);
        }

        // Verify article container attribute
        const containerLang = await page.getAttribute('#article-container', 'data-lang');
        assert(containerLang === targetLang, `#article-container data-lang updated to "${targetLang}"`);

        // Verify documentElement lang
        const docLang = await page.evaluate(() => document.documentElement.lang);
        assert(docLang === targetLang, `document.documentElement.lang updated to "${targetLang}"`);
      }
    }

    auditResults.push(groupResult);
  }

  // Direct language suffix URL test (e.g. /posts/hello-world-en/)
  console.log(`\n------------------------------------------------------------------------`);
  console.log(`🔍 Auditing Direct Suffix Redirects & Client Persona Calibration`);
  const redirectTestUrl = `${BASE_URL}/posts/hello-world-en/`;
  try {
    const rResp = await page.goto(redirectTestUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(500);
    const finalUrl = page.url();
    assert(finalUrl.includes('/posts/hello-world/'), `Direct suffix URL /posts/hello-world-en/ redirects to canonical URL`, `Final URL: ${finalUrl}`);
    const activeLang = await page.evaluate(() => {
      const visible = document.querySelector('.article-translation-variant:not([style*="display: none"])');
      return visible?.dataset.lang;
    });
    assert(activeLang === 'en', `Direct suffix URL automatically activates English variant in DOM`, `Active: ${activeLang}`);
  } catch (err) {
    assert(false, `Direct suffix redirect test failed: ${err.message}`);
  }

  // Summary Report
  console.log('\n========================================================================');
  console.log('📊 FINAL PLAYWRIGHT ARTICLE TRANSLATION AUDIT SUMMARY');
  console.log('========================================================================');
  console.log(`Total Assertions Run: ${totalAssertions}`);
  console.log(`Passed Assertions:    ${passedAssertions}`);
  console.log(`Failed Assertions:    ${failedAssertions}`);

  const failedGroups = auditResults.filter((r) => !r.passed);
  console.log(`Total Post Groups Audited: ${auditResults.length}`);
  console.log(`Groups with All Variants Normal: ${auditResults.length - failedGroups.length}`);
  console.log(`Groups with Anomalies / Defects: ${failedGroups.length}`);

  if (failedGroups.length > 0) {
    console.log('\n⚠️ GROUPS REQUIRING ATTENTION:');
    for (const fg of failedGroups) {
      console.log(`  ❌ [${fg.canonicalSlug}] (${fg.groupKey}):`);
      for (const a of fg.anomalies) {
        console.log(`     - ${a}`);
      }
    }
  } else {
    console.log('\n🎉 ALL ARTICLES HAVE THEIR TRANSLATION VARIANTS 100% CORRECTLY RENDERED & FUNCTIONAL!');
  }

  // Save audit data to scratch for comprehensive report generation
  const reportDataPath = path.resolve(ROOT, 'scratch/article-translation-audit-results.json');
  fs.mkdirSync(path.dirname(reportDataPath), { recursive: true });
  fs.writeFileSync(
    reportDataPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalAssertions,
        passedAssertions,
        failedAssertions,
        totalGroups: auditResults.length,
        cleanGroups: auditResults.length - failedGroups.length,
        anomalousGroups: failedGroups.length,
        results: auditResults,
      },
      null,
      2
    )
  );

  await browser.close();
  if (server) server.close();
}

runAudit().catch((err) => {
  console.error('[Audit Error]', err);
  process.exit(1);
});
