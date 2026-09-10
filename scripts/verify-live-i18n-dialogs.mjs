import { chromium } from 'playwright';

const LIVE_TARGETS = [
  'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/',
  'https://46838664.shijianus-blog.pages.dev/posts/content-formats-and-markup-mastery/'
];

async function verifyUrl(targetUrl) {
  console.log(`\n======================================================`);
  console.log(`Starting Live Production E2E Verification on: ${targetUrl}`);
  console.log(`======================================================`);

  const browser = await chromium.launch({ headless: true });
  const testLocales = ['en', 'fr', 'de', 'es', 'zh-Hant'];

  try {
    for (const lang of testLocales) {
      console.log(`\n--> Testing Live Locale: ${lang} on ${targetUrl}`);
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();

      await page.addInitScript((l) => {
        localStorage.setItem('shijianus-locale-variant', l);
      }, lang);

      const resp = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`  HTTP status: ${resp.status()}`);
      if (resp.status() !== 200) {
        throw new Error(`Expected HTTP 200, got ${resp.status()}`);
      }
      await page.waitForTimeout(600);

      // 1. Search Dialog
      console.log(`  [${lang}] Verifying Search Dialog...`);
      await page.keyboard.press('Control+KeyK');
      await page.waitForSelector('.search-dialog', { state: 'visible', timeout: 5000 });
      const searchPlaceholder = await page.$eval('.search-input-wrap input', el => el.getAttribute('placeholder'));
      console.log(`    Search input placeholder: "${searchPlaceholder}"`);
      if (/[\u4e00-\u9fa5]/.test(searchPlaceholder) && lang !== 'zh-Hant') {
        throw new Error(`Untranslated Chinese in live search dialog for ${lang}: ${searchPlaceholder}`);
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // 2. PostComments Toolbar & Modals
      console.log(`  [${lang}] Verifying Comments Toolbars & Modals...`);
      await page.evaluate(() => {
        const comment = document.getElementById('post-comment');
        if (comment) comment.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(800);

      await page.waitForSelector('.tk-tb-btn-options', { state: 'visible', timeout: 8000 });
      await page.click('.tk-tb-btn-options');
      await page.waitForSelector('.tk-options-dropdown', { state: 'visible', timeout: 5000 });
      
      const dropdownTitle = await page.$eval('.tk-options-dropdown .tk-dropdown-title', el => el.textContent.trim());
      console.log(`    Options dropdown title: "${dropdownTitle}"`);
      if (/[\u4e00-\u9fa5]/.test(dropdownTitle) && lang !== 'zh-Hant') {
        throw new Error(`Untranslated dropdown title in live for ${lang}: ${dropdownTitle}`);
      }

      // Open Table Modal
      const optionsItems = await page.$$('.tk-options-dropdown .tk-dropdown-item');
      await optionsItems[1].click();
      await page.waitForSelector('.tk-tool-modal', { state: 'visible', timeout: 5000 });

      const modalTitle = await page.$eval('.tk-tool-modal-title', el => el.textContent.trim());
      const ruleTitle = await page.$eval('.tk-modal-rule-title', el => el.textContent.trim());
      const confirmBtn = await page.$eval('.tk-modal-btn-confirm', el => el.textContent.trim());
      const cancelBtn = await page.$eval('.tk-modal-btn-cancel', el => el.textContent.trim());

      console.log(`    Table Modal Title: "${modalTitle}"`);
      console.log(`    Rule Title: "${ruleTitle}"`);
      console.log(`    Buttons: "${confirmBtn}" / "${cancelBtn}"`);

      if (lang !== 'zh-Hant') {
        if (/[\u4e00-\u9fa5]/.test(modalTitle)) throw new Error(`Live modal title has Chinese for ${lang}: ${modalTitle}`);
        if (/[\u4e00-\u9fa5]/.test(ruleTitle)) throw new Error(`Live rule title has Chinese for ${lang}: ${ruleTitle}`);
        if (/[\u4e00-\u9fa5]/.test(confirmBtn)) throw new Error(`Live confirm btn has Chinese for ${lang}: ${confirmBtn}`);
        if (/[\u4e00-\u9fa5]/.test(cancelBtn)) throw new Error(`Live cancel btn has Chinese for ${lang}: ${cancelBtn}`);
      }

      await page.click('.tk-modal-btn-cancel');
      await page.waitForTimeout(300);

      // Image Modal
      console.log(`  [${lang}] Verifying Image Upload Modal...`);
      await page.click('.tk-tb-image');
      await page.waitForSelector('.tk-tool-modal', { state: 'visible', timeout: 5000 });
      const tabTexts = await page.$$eval('.tk-modal-tab-btn', btns => btns.map(b => b.textContent.trim()));
      const dropzonePrimary = await page.$eval('.tk-dropzone-primary-text', el => el.textContent.trim());
      console.log(`    Image Tabs: ${JSON.stringify(tabTexts)}`);
      console.log(`    Dropzone: "${dropzonePrimary}"`);

      if (lang !== 'zh-Hant') {
        for (const t of tabTexts) {
          if (/[\u4e00-\u9fa5]/.test(t)) throw new Error(`Live image modal tab has Chinese for ${lang}: ${t}`);
        }
        if (/[\u4e00-\u9fa5]/.test(dropzonePrimary)) throw new Error(`Live dropzone has Chinese for ${lang}: ${dropzonePrimary}`);
      }

      await page.click('.tk-tool-modal-close');
      await page.waitForTimeout(300);

      // 3. Right Click Menu
      console.log(`  [${lang}] Verifying Context Menu...`);
      await page.mouse.click(500, 300, { button: 'right' });
      await page.waitForSelector('#rightMenu.show', { state: 'visible', timeout: 5000 });
      const rightMenuItems = await page.$$eval('#rightMenu .rightMenu-item span', spans => spans.map(s => s.textContent.trim()));
      console.log(`    Right menu: ${JSON.stringify(rightMenuItems.slice(0, 4))}...`);
      if (lang !== 'zh-Hant') {
        for (const item of rightMenuItems) {
          if (/[\u4e00-\u9fa5]/.test(item)) throw new Error(`Live right menu has Chinese for ${lang}: ${item}`);
        }
      }

      // 4. Snackbar dismiss label
      console.log(`  [${lang}] Verifying Snackbar Dismiss Button...`);
      await page.evaluate(() => {
        window.showToast('Production Test Notification', 4000, true);
      });
      await page.waitForTimeout(300);
      const dismissLabel = await page.$eval('#global-activity-action', el => el.textContent.trim());
      console.log(`    Dismiss button label: "${dismissLabel}"`);
      if (lang === 'en' && dismissLabel !== 'Dismiss') throw new Error(`Expected 'Dismiss', got: ${dismissLabel}`);
      if (lang === 'fr' && dismissLabel !== 'Compris') throw new Error(`Expected 'Compris', got: ${dismissLabel}`);
      if (lang === 'de' && dismissLabel !== 'Verstanden') throw new Error(`Expected 'Verstanden', got: ${dismissLabel}`);
      if (lang === 'es' && dismissLabel !== 'Entendido') throw new Error(`Expected 'Entendido', got: ${dismissLabel}`);

      await context.close();
      console.log(`  ✅ [${lang}] LIVE PRODUCTION VERIFIED 100%!`);
    }

    console.log(`\n🎉 SUCCESS: All 5 locales verified on production URL: ${targetUrl}`);
    return true;
  } catch (err) {
    console.error(`❌ Verification failed on ${targetUrl}:`, err);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  for (const target of LIVE_TARGETS) {
    const ok = await verifyUrl(target);
    if (ok) {
      console.log(`\n✨ Production verification passed on ${target}!`);
      process.exit(0);
    }
  }
  console.error('\n❌ Production verification failed on all targets.');
  process.exit(1);
}

main();
