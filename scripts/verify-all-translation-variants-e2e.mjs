import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4322';
const IS_REMOTE = BASE_URL.includes('blog.epocanvas.com');

// All 27 canonical slugs from existing repository + 3 new edge test posts
const ALL_CANONICAL_SLUGS = [
  // 1. Comprehensive & Special format showcases (6 langs each: zh-CN, zh-Hant, en, de, es, fr)
  'content-formats-and-markup-mastery',
  'learning-through-rebuilds',
  'content-first-homepage',
  'badges-guide',
  'api-ready-theme-contracts',
  'markdown-syntax-mastery',
  'readable-geek-interfaces',
  'media-capability-lab',
  'anzhiyu-markdown-showcase',
  'hello-world',
  'markdown-scan-showcase',
  'example-all-special-formats',
  'example-callouts',
  'example-code-enhancements',
  'example-details-collapse',
  'example-embeds',
  'example-frontmatter-fields',
  'example-gallery-figure',
  'example-math',
  'example-mermaid',
  'example-mindmap',
  'example-tabs',
  // 2. Access control post (protected by server-side rules)
  'access-control-lab',
  // 3. Existing edge test cases
  'test-i18n-resilience',
  'test-matrix-casing',
  'test-matrix-native',
  'test-native-english-clean',
  // 4. Newly created edge test posts (auditing polyglot, monolingual, dot-notation)
  'test-audit-polyglot-matrix',
  'test-audit-monolingual-single',
  'test-audit-dot-casing',
];

async function runTranslationAudit() {
  console.log(`\n================================================================`);
  console.log(`[E2E TRANSLATION AUDIT] Target Environment: ${BASE_URL}`);
  console.log(`Auditing ${ALL_CANONICAL_SLUGS.length} articles across all translation variants...`);
  console.log(`================================================================\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Antigravity-Translation-Auditor',
  });
  const page = await context.newPage();

  const auditLog = [];
  let passedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < ALL_CANONICAL_SLUGS.length; i++) {
    const slug = ALL_CANONICAL_SLUGS[i];
    const postUrl = `${BASE_URL.replace(/\/$/, '')}/posts/${slug}/`;
    console.log(`[${i + 1}/${ALL_CANONICAL_SLUGS.length}] Auditing: ${slug} (${postUrl})`);

    const postErrors = [];
    const consoleHandler = (msg) => {
      if (msg.type() === 'error') {
        const txt = msg.text();
        if (!txt.includes('favicon') && !txt.includes('gtag') && !txt.includes('analytics')) {
          postErrors.push(`Console: ${txt}`);
        }
      }
    };
    const pageErrorHandler = (err) => {
      postErrors.push(`PageError: ${err.message}`);
    };

    page.on('console', consoleHandler);
    page.on('pageerror', pageErrorHandler);

    const record = {
      index: i + 1,
      slug,
      url: postUrl,
      httpStatus: null,
      isProtected: false,
      variantCount: 0,
      variants: [],
      buttons: [],
      switchTests: [],
      passed: false,
      errors: [],
    };

    try {
      const resp = await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
      record.httpStatus = resp ? resp.status() : 0;

      if (!resp || resp.status() >= 400) {
        throw new Error(`HTTP ${record.httpStatus}`);
      }

      await page.waitForTimeout(300);

      // Check if it is a protected post
      const isProtected = await page.evaluate(() => {
        return Boolean(document.querySelector('.content-access-panel--server'));
      });
      record.isProtected = isProtected;

      if (isProtected) {
        console.log(`  🔒 Article is protected with server access-control.`);
        // For protected post in static mode: verify the i18n hint exists and content is safely blocked
        const hintText = await page.evaluate(() => {
          return document.querySelector('.content-access-panel__i18n-hint')?.innerText?.trim() || '';
        });
        console.log(`  🔒 i18n Hint detected: "${hintText}"`);
        if (!hintText.includes('语言译本')) {
          throw new Error(`Access control panel missing multilingual translation hint!`);
        }
        
        record.variantCount = 0;
        record.passed = true;
        passedCount++;
        console.log(`  ✅ PASSED: Protected article access panel verified with multilingual indicator.`);
        continue;
      }

      // 1. Extract all rendered .article-translation-variant elements
      const extractedVariants = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('.article-translation-variant'));
        return els.map((el) => {
          const lang = el.getAttribute('data-lang') || '';
          const computedDisplay = window.getComputedStyle(el).display;
          const isVisible = computedDisplay !== 'none';
          const text = (el.innerText || '').trim();
          const headings = Array.from(el.querySelectorAll('h1, h2, h3, h4')).map((h) => h.innerText.trim());
          return {
            lang,
            isVisible,
            textLength: text.length,
            headingsCount: headings.length,
            sampleSnippet: text.slice(0, 60).replace(/\s+/g, ' '),
          };
        });
      });

      record.variantCount = extractedVariants.length;
      record.variants = extractedVariants;

      if (extractedVariants.length === 0) {
        throw new Error('No .article-translation-variant elements found in DOM!');
      }

      // Check single visibility rule (exactly 1 visible variant by default)
      const visibleInitial = extractedVariants.filter((v) => v.isVisible);
      if (visibleInitial.length !== 1) {
        throw new Error(`Expected exactly 1 initially visible variant, found ${visibleInitial.length}`);
      }

      // Check that all variants have content
      for (const v of extractedVariants) {
        if (v.textLength === 0) {
          throw new Error(`Variant [${v.lang}] has 0 characters of content!`);
        }
      }

      // 2. Extract PostHero language switch buttons
      const extractedButtons = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.post-hero__lang-tag[data-target-lang]'));
        return btns.map((b) => ({
          targetLang: b.getAttribute('data-target-lang'),
          text: (b.innerText || '').trim(),
          isActive: b.classList.contains('is-active'),
          ariaPressed: b.getAttribute('aria-pressed'),
        }));
      });
      record.buttons = extractedButtons;

      // If multiple variants exist, language buttons MUST exist and match variants
      if (extractedVariants.length > 1) {
        if (extractedButtons.length !== extractedVariants.length) {
          throw new Error(`Button count (${extractedButtons.length}) mismatch with variant count (${extractedVariants.length})`);
        }

        // 3. Perform interactive switching test for EVERY language button
        for (const btnInfo of extractedButtons) {
          const targetLang = btnInfo.targetLang;
          const btnSelector = `.post-hero__lang-tag[data-target-lang="${targetLang}"]`;

          // Trigger switch via click
          await page.click(btnSelector);
          await page.waitForTimeout(150);

          // Verify that this variant is now uniquely visible
          const switchCheck = await page.evaluate((tLang) => {
            const allVariants = Array.from(document.querySelectorAll('.article-translation-variant'));
            const targetEl = document.querySelector(`.article-translation-variant[data-lang="${tLang}"]`);
            const targetVisible = targetEl && window.getComputedStyle(targetEl).display !== 'none';
            const otherVisible = allVariants.filter((v) => v !== targetEl && window.getComputedStyle(v).display !== 'none');
            const heroTitle = document.querySelector('.post-hero__title-block h1')?.innerText?.trim() || '';
            const activeBtn = document.querySelector(`.post-hero__lang-tag[data-target-lang="${tLang}"]`);
            const btnActive = activeBtn && activeBtn.classList.contains('is-active');

            return {
              targetVisible,
              otherVisibleCount: otherVisible.length,
              heroTitle,
              btnActive,
            };
          }, targetLang);

          if (!switchCheck.targetVisible) {
            throw new Error(`Variant [${targetLang}] did not become visible after button click!`);
          }
          if (switchCheck.otherVisibleCount > 0) {
            throw new Error(`Other variants remained visible after switching to [${targetLang}]!`);
          }

          record.switchTests.push({
            lang: targetLang,
            success: true,
            title: switchCheck.heroTitle,
          });
        }
      } else {
        // Monolingual single article: verify no lang buttons are rendered
        if (extractedButtons.length > 0) {
          throw new Error(`Monolingual post rendered unexpected language buttons (${extractedButtons.length})`);
        }
      }

      if (postErrors.length > 0) {
        record.errors.push(...postErrors);
      }

      record.passed = true;
      passedCount++;
      console.log(`  ✅ PASSED: ${extractedVariants.length} variants [${extractedVariants.map((v) => v.lang).join(', ')}] | ${record.switchTests.length} switches verified`);
    } catch (err) {
      record.passed = false;
      record.errors.push(err.message);
      failedCount++;
      console.log(`  ❌ FAILED: ${err.message}`);
    } finally {
      page.off('console', consoleHandler);
      page.off('pageerror', pageErrorHandler);
      auditLog.push(record);
    }
  }

  await browser.close();

  console.log(`\n================================================================`);
  console.log(`[AUDIT SUMMARY] Total: ${ALL_CANONICAL_SLUGS.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log(`================================================================\n`);

  // Write out complete raw audit results to disk
  const outputPath = path.resolve(process.cwd(), 'audit-e2e-raw-results-local.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalAudited: ALL_CANONICAL_SLUGS.length,
    passedCount,
    failedCount,
    results: auditLog,
  }, null, 2), 'utf-8');

  console.log(`Raw audit data saved to: ${outputPath}`);
  return { passedCount, failedCount, total: ALL_CANONICAL_SLUGS.length, auditLog };
}

runTranslationAudit().then(({ failedCount }) => {
  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
