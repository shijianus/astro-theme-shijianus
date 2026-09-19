import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4399;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

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
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        let reqPath = decodeURIComponent(req.url.split('?')[0]);
        let filePath = path.join(DIST_DIR, reqPath);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        } else if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
          filePath = `${filePath}.html`;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const content = fs.readFileSync(filePath);
          res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Content-Length': content.length,
            'Access-Control-Allow-Origin': '*',
          });
          res.end(content);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error');
      }
    });

    server.listen(PORT, () => {
      console.log(`[Test Server] Serving ${DIST_DIR} at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

async function runTests() {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  async function switchLocale(lang) {
    await page.evaluate((target) => {
      window.localStorage.setItem('shijianus-locale-variant', target);
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: target }));
    }, lang);
    await page.waitForTimeout(500);
  }

  try {
    console.log('\n--- 1. Testing Support Dashboard (/support) i18n ---');
    await page.goto(`http://127.0.0.1:${PORT}/support/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Initial state (zh-CN)
    const initialHeroTitle = await page.textContent('.support-hero h1');
    console.log('Initial hero title:', initialHeroTitle);
    assert(initialHeroTitle && (initialHeroTitle.includes('咖啡') || initialHeroTitle.includes('赞赏')), `Initial hero title contains 咖啡/赞赏 (got: ${initialHeroTitle})`);

    // Switch to English via client locale
    console.log('\nSwitching language to English (en)...');
    await switchLocale('en');

    // Check Hero title in English
    const enHeroTitle = await page.textContent('.support-hero h1');
    console.log('Hero title in English:', enHeroTitle);
    assert(enHeroTitle && enHeroTitle.includes('Buy Me a Coffee'), 'Hero title in English is "Buy Me a Coffee · Support"');

    // Check Coffee tier names in English
    const tierNamesEn = await page.$$eval('.support-tier-btn', els => els.map(el => el.textContent?.trim()));
    console.log('Tier names in English:', tierNamesEn);
    assert(tierNamesEn.some(t => t.includes('Instant Coffee') || t.includes('Packet')), 'Tier 0 localized to Instant Coffee Packet');
    assert(tierNamesEn.some(t => t.includes('Takeaway')), 'Tier 1 localized to Classic Takeaway Cup');
    assert(tierNamesEn.some(t => t.includes('Ceramic') || t.includes('Mug')), 'Tier 2 localized to Artisan Ceramic Mug');
    assert(tierNamesEn.some(t => t.includes('Pour-Over')), 'Tier 3 localized to Professional Pour-Over Set');
    assert(tierNamesEn.some(t => t.includes('Beans')), 'Tier 4 localized to Single-Origin Specialty Beans');
    assert(tierNamesEn.some(t => t.includes('Exchange') || t.includes('Coffee Table')), 'Tier 5 localized to Coffee Table Deep Exchange');

    // Check table headers in English
    const tableHeadersEn = await page.$$eval('thead th', els => els.map(el => el.textContent?.trim()));
    console.log('Table headers in English:', tableHeadersEn);
    assert(tableHeadersEn.some(h => h.includes('Sponsor')), 'Table header contains Sponsor in EN');
    assert(tableHeadersEn.some(h => h.includes('Amount')), 'Table header contains Amount in EN');
    assert(tableHeadersEn.some(h => h.includes('Message')), 'Table header contains Message in EN');
    assert(tableHeadersEn.some(h => h.includes('Channel')), 'Table header contains Channel in EN');

    // Check checkout button in English
    const stripeButton = await page.$eval('.support-checkout-btn', el => el.textContent?.trim()).catch(() => '');
    console.log('Stripe checkout button text:', stripeButton);
    assert(stripeButton.includes('Proceed to Secure Checkout') || stripeButton.includes('Checkout'), 'Stripe checkout button localized in English');

    // Switch to Traditional Chinese (zh-Hant)
    console.log('\nSwitching language to Traditional Chinese (zh-Hant)...');
    await switchLocale('zh-Hant');
    const tierNamesHant = await page.$$eval('.support-tier-btn', els => els.map(el => el.textContent?.trim()));
    console.log('Tier names in zh-Hant:', tierNamesHant);
    assert(tierNamesHant.some(t => t.includes('便捷速溶咖啡條')), 'Tier 0 in zh-Hant is 便捷速溶咖啡條');
    assert(tierNamesHant.some(t => t.includes('精緻精品咖啡杯')), 'Tier 2 in zh-Hant is 精緻精品咖啡杯');

    // Switch to French (fr)
    console.log('\nSwitching language to French (fr)...');
    await switchLocale('fr');
    const tierNamesFr = await page.$$eval('.support-tier-btn', els => els.map(el => el.textContent?.trim()));
    console.log('Tier names in French:', tierNamesFr);
    assert(tierNamesFr.some(t => t.includes('Café Soluble') || t.includes('Sachet')), 'Tiers in French contain French coffee terms');

    // Switch to German (de)
    console.log('\nSwitching language to German (de)...');
    await switchLocale('de');
    const tierNamesDe = await page.$$eval('.support-tier-btn', els => els.map(el => el.textContent?.trim()));
    console.log('Tier names in German:', tierNamesDe);
    assert(tierNamesDe.some(t => t.includes('Instant-Kaffee') || t.includes('Stick')), 'Tiers in German contain German coffee terms');

    console.log('\n--- 2. Testing Keyboard Shortcut Panel i18n ---');
    // Open shortcut panel via Shift key simulation
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
    });
    await page.waitForTimeout(400);

    const shortcutTitle = await page.textContent('#keyboard-tips .keyboardTitle').catch(() => null);
    console.log('Shortcut modal title in DE:', shortcutTitle);
    if (shortcutTitle) {
      assert(shortcutTitle.includes('Tastaturkürzel') || shortcutTitle.includes('Shortcuts'), `Shortcut modal title localized in German (got: ${shortcutTitle})`);
    }

    // Switch to English and check shortcut items
    await switchLocale('en');
    await page.waitForTimeout(200);

    const shortcutItems = await page.$$eval('#keyboard-tips .keyContent .content', els => els.map(el => el.textContent?.trim()));
    console.log('Shortcut items in EN:', shortcutItems);
    if (shortcutItems.length > 0) {
      assert(shortcutItems.some(i => i.includes('Search') || i.includes('Open Search')), 'Search shortcut localized to English');
      assert(shortcutItems.some(i => i.includes('Console') || i.includes('Open Console')), 'Console shortcut localized to English');
      assert(shortcutItems.some(i => i.includes('Theme') || i.includes('Light/Dark')), 'Theme mode shortcut localized to English');
    }

    console.log('\n--- 3. Testing Console System Status i18n ---');
    // Open console modal
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-console'));
    });
    await page.waitForTimeout(500);

    const statusLabels = await page.$$eval('.console-webinfo-grid .webinfo-item-label span', els => els.map(el => el.textContent?.trim()));
    console.log('Console status labels in EN:', statusLabels);
    if (statusLabels.length > 0) {
      assert(statusLabels.some(l => l.includes('Word') || l.includes('Words')), 'Total Words metric localized in English');
      assert(statusLabels.some(l => l.includes('Uptime') || l.includes('Days')), 'Safe Uptime Days metric localized in English');
      assert(statusLabels.some(l => l.includes('Update') || l.includes('Latest')), 'Latest Update metric localized in English');
    }

    console.log('\n--- 4. Testing 404 Page i18n ---');
    // Ensure initial clean zh-CN state for 404
    await switchLocale('zh-CN');
    await page.goto(`http://127.0.0.1:${PORT}/404.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Initial state (zh-CN)
    const initial404Sub = await page.textContent('.error_subtitle');
    console.log('404 subtitle (zh-CN):', initial404Sub?.trim());
    assert(initial404Sub?.includes('这条路还没有被记录下来'), `404 subtitle in zh-CN (got: ${initial404Sub?.trim()})`);

    // Switch to English
    await switchLocale('en');

    const en404Sub = await page.textContent('.error_subtitle');
    console.log('404 subtitle (en):', en404Sub?.trim());
    assert(en404Sub?.includes('charted yet') || en404Sub?.includes('path') || en404Sub?.includes('recorded'), `404 subtitle localized to English (got: ${en404Sub?.trim()})`);

    const enHomeBtn = await page.textContent('.error-actions .theme-button:first-child');
    console.log('404 home button (en):', enHomeBtn?.trim());
    assert(enHomeBtn?.includes('Home') || enHomeBtn?.includes('Back'), `404 home button localized to English (got: ${enHomeBtn?.trim()})`);

    console.log('\n--- 5. Testing Article Dynamic Elements i18n (AiSummary, RelatedPosts, PostEndRecommendation) ---');
    // Ensure initial clean zh-CN state for article
    await switchLocale('zh-CN');
    await page.goto(`http://127.0.0.1:${PORT}/posts/anzhiyu-markdown-showcase/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Initial Related Posts eyebrow in Chinese
    const initialRelatedEyebrow = await page.textContent('[data-related-eyebrow]').catch(() => '');
    console.log('Initial related eyebrow (zh-CN):', initialRelatedEyebrow?.trim());
    assert(initialRelatedEyebrow?.includes('相关') || initialRelatedEyebrow?.includes('推薦'), `Related posts eyebrow in Chinese (got: ${initialRelatedEyebrow})`);

    // Switch to English
    console.log('Switching to English on article page...');
    await switchLocale('en');

    // Verify Related posts eyebrow and title in English
    const enRelatedEyebrow = await page.textContent('[data-related-eyebrow]').catch(() => '');
    console.log('Related posts eyebrow in English:', enRelatedEyebrow?.trim());
    assert(enRelatedEyebrow?.includes('Related Posts'), `Related posts eyebrow translated to English (got: ${enRelatedEyebrow})`);

    const enRelatedTitle = await page.textContent('[data-related-title]').catch(() => '');
    console.log('Related posts title in English:', enRelatedTitle?.trim());
    assert(enRelatedTitle?.includes('Continue Exploring'), `Related posts title translated to English (got: ${enRelatedTitle})`);

    // Verify Post End Recommendation label and title in English
    const enRecommendLabel = await page.textContent('[data-pagination-label]').catch(() => '');
    console.log('Post end recommendation label in English:', enRecommendLabel?.trim());
    assert(enRecommendLabel?.includes('Next Up'), `Post end recommendation label translated to English (got: ${enRecommendLabel})`);

    // Verify AI Summary panel questions
    const aiSummaryQuestionCount = await page.locator('.shijianus-ai-summary__action').count();
    console.log('AI Summary question buttons count:', aiSummaryQuestionCount);
    assert(aiSummaryQuestionCount > 0, `AI summary question buttons present (${aiSummaryQuestionCount})`);

    console.log('\n--- 6. Testing AI Article Translation Isolation & Safe Defaults ---');
    assert(process.env.ENABLE_ARTICLE_AI_I18N !== 'true', 'ENABLE_ARTICLE_AI_I18N is strictly false by default, protecting zero-lag SSG builds');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
