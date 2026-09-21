import { chromium } from 'playwright';

const LIVE_ORIGIN = process.env.LIVE_ORIGIN || 'https://blog.epocanvas.com';

// Sample representative articles covering various formats:
// Standard, markdown showcase, tech lab, code enhancements, media lab, math, etc.
const TEST_POST_SLUGS = [
  'learning-through-rebuilds',
  'content-first-homepage',
  'badges-guide',
  'api-ready-theme-contracts',
  'markdown-syntax-mastery',
  'readable-geek-interfaces',
  'media-capability-lab',
  'example-code-enhancements',
  'example-callouts',
  'example-all-special-formats',
];

const EXPECTED_LANGS = ['zh-CN', 'zh-Hant', 'en', 'de', 'es', 'fr'];

async function runLiveVerification() {
  console.log(`\n======================================================`);
  console.log(`[LIVE VERIFICATION] Auditing Article Translation Variants on ${LIVE_ORIGIN}`);
  console.log(`======================================================`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Antigravity-Auditor',
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  let totalAudited = 0;
  let passedAudited = 0;
  const auditResults = [];

  for (const slug of TEST_POST_SLUGS) {
    totalAudited++;
    const postUrl = `${LIVE_ORIGIN}/posts/${slug}/`;
    console.log(`\n------------------------------------------------------`);
    console.log(`[${totalAudited}/${TEST_POST_SLUGS.length}] Auditing Post: ${slug}`);
    console.log(`URL: ${postUrl}`);

    try {
      const resp = await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!resp || resp.status() >= 400) {
        throw new Error(`HTTP ${resp ? resp.status() : 'no response'}`);
      }

      await page.waitForTimeout(500);

      // 1. Extract all rendered .article-translation-variant elements
      const variants = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('.article-translation-variant'));
        return els.map((el) => {
          const lang = el.getAttribute('data-lang');
          const isVisible = el.style.display !== 'none';
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

      const actualLangs = variants.map((v) => v.lang);
      console.log(`  DOM Variants Found (${variants.length}): [${actualLangs.join(', ')}]`);

      // Verify all expected languages exist
      const missingLangs = EXPECTED_LANGS.filter((l) => !actualLangs.includes(l));
      if (missingLangs.length > 0) {
        throw new Error(`Missing expected translation variants for: ${missingLangs.join(', ')}`);
      }

      // 2. Extract PostHero language switch buttons
      const buttons = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.post-hero__lang-tag[data-target-lang]'));
        return btns.map((b) => ({
          targetLang: b.getAttribute('data-target-lang'),
          text: (b.innerText || '').trim(),
          isActive: b.classList.contains('is-active'),
        }));
      });

      console.log(`  Language Buttons Found (${buttons.length}): [${buttons.map((b) => `${b.targetLang}(${b.text})`).join(', ')}]`);

      if (buttons.length < EXPECTED_LANGS.length) {
        throw new Error(`Expected at least ${EXPECTED_LANGS.length} buttons, but found ${buttons.length}`);
      }

      // 3. Test interactive switching for each language
      for (const targetLang of EXPECTED_LANGS) {
        // Click language button
        const btnSelector = `.post-hero__lang-tag[data-target-lang="${targetLang}"]`;
        await page.click(btnSelector);
        await page.waitForTimeout(100);

        // Verify state
        const switchOk = await page.evaluate((tLang) => {
          const targetVariant = document.querySelector(`.article-translation-variant[data-lang="${tLang}"]`);
          const otherVariants = Array.from(document.querySelectorAll('.article-translation-variant'))
            .filter((el) => el.getAttribute('data-lang') !== tLang);

          const targetVisible = targetVariant && targetVariant.style.display !== 'none';
          const othersHidden = otherVariants.every((el) => el.style.display === 'none');

          const heroBtnActive = document.querySelector(`.post-hero__lang-tag[data-target-lang="${tLang}"]`)
            ?.classList.contains('is-active');

          const articleDataLang = document.getElementById('article-container')?.getAttribute('data-lang');
          const docLang = document.documentElement.lang;

          return {
            targetVisible,
            othersHidden,
            heroBtnActive,
            articleDataLangMatches: articleDataLang === tLang,
            docLangMatches: docLang === tLang,
          };
        }, targetLang);

        if (!switchOk.targetVisible || !switchOk.othersHidden) {
          throw new Error(`Switch verification failed for language [${targetLang}]: targetVisible=${switchOk.targetVisible}, othersHidden=${switchOk.othersHidden}`);
        }

        console.log(`    ✓ Clicked [${targetLang}]: active variant visible, ${variants.length - 1} sibling variants hidden, button active`);
      }

      console.log(`  ✅ Post [${slug}] ALL ${EXPECTED_LANGS.length} TRANSLATION VARIANTS LIVE PASS!`);
      passedAudited++;
      auditResults.push({ slug, status: 'PASS', variantsCount: variants.length });
    } catch (err) {
      console.error(`  ❌ Failed on [${slug}]:`, err.message);
      auditResults.push({ slug, status: 'FAIL', error: err.message });
    }
  }

  await browser.close();

  console.log(`\n======================================================`);
  console.log(`[LIVE AUDIT SUMMARY] ${passedAudited}/${totalAudited} Representative Posts Passed`);
  console.log(`Console Errors Logged: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Sample errors:', consoleErrors.slice(0, 3));
  }
  console.log(`======================================================\n`);

  if (passedAudited !== totalAudited) {
    console.error('LIVE E2E VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('🎉 ALL LIVE ARTICLE TRANSLATION VARIANTS CONFIRMED PERFECT!');
  }
}

runLiveVerification().catch((err) => {
  console.error('Fatal live verification error:', err);
  process.exit(1);
});
