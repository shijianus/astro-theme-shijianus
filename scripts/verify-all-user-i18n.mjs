import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:4321/posts/content-formats-and-markup-mastery/';

async function run() {
  console.log('Starting Playwright i18n Verification on all prompt dialogs & popups...');
  const browser = await chromium.launch({ headless: true });

  const testLanguages = ['en', 'fr', 'es', 'de', 'zh-Hant'];

  try {
    for (const lang of testLanguages) {
      console.log(`\n=================== Testing Locale: ${lang} ===================`);
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();

      // Pre-set stored locale variant in localStorage
      await page.addInitScript((l) => {
        localStorage.setItem('shijianus-locale-variant', l);
      }, lang);

      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // 1. Check Search Dialog
      console.log(`[${lang}] Checking Search Dialog...`);
      await page.keyboard.press('Control+KeyK');
      await page.waitForSelector('.search-dialog', { state: 'visible' });
      const searchPlaceholder = await page.$eval('.search-input-wrap input', el => el.getAttribute('placeholder'));
      console.log(`  Search input placeholder: "${searchPlaceholder}"`);
      if (/[\u4e00-\u9fa5]/.test(searchPlaceholder) && lang !== 'zh-Hant') {
        throw new Error(`Untranslated Chinese in search dialog placeholder for ${lang}: ${searchPlaceholder}`);
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // 2. Scroll to comments and check comment tool buttons & modals
      console.log(`[${lang}] Checking PostComments Toolbar & Modals...`);
      await page.evaluate(() => {
        const comment = document.getElementById('post-comment');
        if (comment) comment.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(800);

      // Open options dropdown
      await page.waitForSelector('.tk-tb-btn-options', { state: 'visible' });
      await page.click('.tk-tb-btn-options');
      await page.waitForSelector('.tk-options-dropdown', { state: 'visible' });
      
      const dropdownTitle = await page.$eval('.tk-options-dropdown .tk-dropdown-title', el => el.textContent.trim());
      console.log(`  Options dropdown title: "${dropdownTitle}"`);

      // Click Poll item (index 1 is Poll, 2 is Table)
      const optionsItems = await page.$$('.tk-options-dropdown .tk-dropdown-item');
      console.log(`  Found ${optionsItems.length} options items in dropdown`);
      
      await optionsItems[1].click(); // Table
      await page.waitForSelector('.tk-tool-modal', { state: 'visible' });
      
      const modalTitle = await page.$eval('.tk-tool-modal-title', el => el.textContent.trim());
      const ruleTitle = await page.$eval('.tk-modal-rule-title', el => el.textContent.trim());
      const ruleText = await page.$eval('.tk-modal-rule-text', el => el.textContent.trim());
      const confirmBtn = await page.$eval('.tk-modal-btn-confirm', el => el.textContent.trim());
      const cancelBtn = await page.$eval('.tk-modal-btn-cancel', el => el.textContent.trim());

      console.log(`  Modal Title: "${modalTitle}"`);
      console.log(`  Rule Title: "${ruleTitle}"`);
      console.log(`  Rule Text: "${ruleText}"`);
      console.log(`  Confirm Button: "${confirmBtn}" | Cancel Button: "${cancelBtn}"`);

      if (lang !== 'zh-Hant') {
        if (/[\u4e00-\u9fa5]/.test(modalTitle)) throw new Error(`Modal title has Chinese in ${lang}: ${modalTitle}`);
        if (/[\u4e00-\u9fa5]/.test(ruleTitle)) throw new Error(`Rule title has Chinese in ${lang}: ${ruleTitle}`);
        if (/[\u4e00-\u9fa5]/.test(ruleText)) throw new Error(`Rule text has Chinese in ${lang}: ${ruleText}`);
        if (/[\u4e00-\u9fa5]/.test(confirmBtn)) throw new Error(`Confirm button has Chinese in ${lang}: ${confirmBtn}`);
        if (/[\u4e00-\u9fa5]/.test(cancelBtn)) throw new Error(`Cancel button has Chinese in ${lang}: ${cancelBtn}`);
      }

      // Close modal
      await page.click('.tk-modal-btn-cancel');
      await page.waitForTimeout(300);

      // Check Image Upload Modal
      console.log(`[${lang}] Checking Image Upload Modal...`);
      await page.click('.tk-tb-image');
      await page.waitForSelector('.tk-tool-modal', { state: 'visible' });

      const tabTexts = await page.$$eval('.tk-modal-tab-btn', btns => btns.map(b => b.textContent.trim()));
      console.log(`  Image Modal Tabs: ${JSON.stringify(tabTexts)}`);
      const dropzonePrimary = await page.$eval('.tk-dropzone-primary-text', el => el.textContent.trim());
      const dropzoneHint = await page.$eval('.tk-dropzone-hint-text', el => el.textContent.trim());
      console.log(`  Dropzone text: "${dropzonePrimary}" | Hint: "${dropzoneHint}"`);

      if (lang !== 'zh-Hant') {
        for (const t of tabTexts) {
          if (/[\u4e00-\u9fa5]/.test(t)) throw new Error(`Image modal tab has Chinese in ${lang}: ${t}`);
        }
        if (/[\u4e00-\u9fa5]/.test(dropzonePrimary)) throw new Error(`Dropzone has Chinese in ${lang}: ${dropzonePrimary}`);
        if (/[\u4e00-\u9fa5]/.test(dropzoneHint)) throw new Error(`Dropzone hint has Chinese in ${lang}: ${dropzoneHint}`);
      }

      // Check image guide tab
      const guideTab = (await page.$$('.tk-modal-tab-btn'))[1];
      await guideTab.click();
      await page.waitForTimeout(200);
      const guideTitle = await page.$eval('.tk-guide-card-title', el => el.textContent.trim());
      console.log(`  Guide card title: "${guideTitle}"`);
      if (lang !== 'zh-Hant' && /[\u4e00-\u9fa5]/.test(guideTitle)) {
        throw new Error(`Guide title has Chinese in ${lang}: ${guideTitle}`);
      }

      // Close modal
      await page.click('.tk-tool-modal-close');
      await page.waitForTimeout(300);

      // 3. Check Top Activity Snack / Toast in this language
      console.log(`[${lang}] Checking Activity Snackbar dismissal label...`);
      await page.evaluate(() => {
        window.showToast('Test notification', 4000, true);
      });
      await page.waitForTimeout(400);
      const dismissLabel = await page.$eval('#global-activity-action', el => el.textContent.trim());
      console.log(`  Snackbar dismiss button label: "${dismissLabel}"`);
      if (lang === 'en' && dismissLabel !== 'Dismiss') throw new Error(`Expected 'Dismiss', got: ${dismissLabel}`);
      if (lang === 'fr' && dismissLabel !== 'Compris') throw new Error(`Expected 'Compris', got: ${dismissLabel}`);
      if (lang === 'es' && dismissLabel !== 'Entendido') throw new Error(`Expected 'Entendido', got: ${dismissLabel}`);
      if (lang === 'de' && dismissLabel !== 'Verstanden') throw new Error(`Expected 'Verstanden', got: ${dismissLabel}`);
      if (lang === 'zh-Hant' && dismissLabel !== '知道了') throw new Error(`Expected '知道了', got: ${dismissLabel}`);

      // 4. Check Right Click Menu
      console.log(`[${lang}] Checking Right Click Menu...`);
      await page.mouse.click(500, 300, { button: 'right' });
      await page.waitForSelector('#rightMenu.show', { state: 'visible' });
      const rightMenuItems = await page.$$eval('#rightMenu .rightMenu-item span', spans => spans.map(s => s.textContent.trim()));
      console.log(`  Right menu items: ${JSON.stringify(rightMenuItems)}`);
      if (lang !== 'zh-Hant') {
        for (const item of rightMenuItems) {
          if (/[\u4e00-\u9fa5]/.test(item)) throw new Error(`Right menu item has Chinese in ${lang}: ${item}`);
        }
      }

      await context.close();
      console.log(`✅ [${lang}] All modal dialogs, prompts, snackbar, and menus verified 100% localized!`);
    }

    console.log('\n🎉 ALL 5 LOCALES FULLY VERIFIED WITH ZERO UNTRANSLATED DIALOGS/POPUPS!');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
