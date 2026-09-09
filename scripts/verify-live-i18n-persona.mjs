import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function verifyLiveProduction() {
  console.log('\n======================================================');
  console.log('🌐 LIVE PRODUCTION E2E AUDIT: https://blog.epocanvas.com');
  console.log('======================================================\n');

  const targetUrl = 'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/';
  console.log(`Auditing target URL: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Taipei',
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('1. Navigating to live production article...');
  const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
  console.log(`   -> Live response status: ${response ? response.status() : 'unknown'}`);
  if (!response || response.status() >= 400) {
    throw new Error(`Failed to load live page: HTTP ${response ? response.status() : 'null'}`);
  }

  // Ensure artifacts scratch dir exists
  const scratchDir = path.resolve('scratch');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  // Take initial live screenshot
  await page.screenshot({ path: path.join(scratchDir, 'live-initial-page.png') });
  console.log('   -> Captured live initial screenshot: scratch/live-initial-page.png');

  // 2. Locate rightside config and translate button
  console.log('\n2. Testing live rightside #translate button & minimal 2-language cycle...');
  const configBtn = page.locator('#rightside-config');
  await configBtn.waitFor({ state: 'visible', timeout: 8000 });
  await configBtn.click();
  await page.waitForTimeout(600);

  const translateBtn = page.locator('#translate');
  await translateBtn.waitFor({ state: 'visible', timeout: 8000 });

  const initialBadge = (await translateBtn.innerText()).trim();
  console.log(`   -> Live initial #translate badge: "${initialBadge}"`);
  if (initialBadge !== '简') {
    throw new Error(`Expected initial badge to be "简", got "${initialBadge}"`);
  }

  // Click 1: Cycle to Traditional Chinese
  console.log('   -> Clicking #translate once to toggle to Traditional Chinese...');
  await translateBtn.click();
  await page.waitForTimeout(1000);

  const secondBadge = (await translateBtn.innerText()).trim();
  const liveLang1 = await page.getAttribute('html', 'lang');
  console.log(`   -> Live badge after 1st click: "${secondBadge}", html.lang: "${liveLang1}"`);
  if (secondBadge !== '繁') {
    throw new Error(`Expected badge after 1st click to be "繁", got "${secondBadge}"`);
  }
  if (liveLang1 !== 'zh-Hant') {
    throw new Error(`Expected html.lang to be "zh-Hant", got "${liveLang1}"`);
  }

  // Capture Traditional Chinese state
  await page.screenshot({ path: path.join(scratchDir, 'live-zh-hant-state.png') });

  // Click 2: Cycle back to Simplified Chinese
  console.log('   -> Clicking #translate again to cycle back to Simplified Chinese...');
  await translateBtn.click();
  await page.waitForTimeout(1000);

  const thirdBadge = (await translateBtn.innerText()).trim();
  const liveLang2 = await page.getAttribute('html', 'lang');
  console.log(`   -> Live badge after 2nd click: "${thirdBadge}", html.lang: "${liveLang2}"`);
  if (thirdBadge !== '简') {
    throw new Error(`Expected badge after 2nd click to cycle back to "简", got "${thirdBadge}"`);
  }
  if (liveLang2 !== 'zh-CN') {
    throw new Error(`Expected html.lang to be "zh-CN", got "${liveLang2}"`);
  }

  // 3. Testing Account Drawer and 6 mainstream languages
  console.log('\n3. Testing live Account Drawer with 6 mainstream languages and persona card...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('shijianus:open-notifications', { detail: { tab: 'settings' } }));
  });
  await page.waitForTimeout(1000);

  const localeGrid = page.locator('.account-locale-grid');
  await localeGrid.waitFor({ state: 'visible', timeout: 8000 });

  const buttons = await localeGrid.locator('button').all();
  console.log(`   -> Live account locale button count: ${buttons.length} (Expected: 6)`);
  if (buttons.length !== 6) {
    throw new Error(`Expected 6 mainstream languages in drawer, got ${buttons.length}`);
  }

  const personaCardCount = await page.locator('.account-persona-card').count();
  console.log(`   -> Live .account-persona-card count: ${personaCardCount} (Expected: 0)`);
  if (personaCardCount !== 0) {
    throw new Error(`FAIL: .account-persona-card should NOT be visible or rendered! Found: ${personaCardCount}`);
  }

  // Capture account drawer screenshot
  await page.screenshot({ path: path.join(scratchDir, 'live-account-drawer.png') });
  console.log('   -> Captured live drawer screenshot: scratch/live-account-drawer.png');

  // Click Français in the drawer
  console.log('\n4. Testing live selection of Français in account drawer...');
  const frBtn = localeGrid.locator('button:has-text("Français")');
  await frBtn.click();
  await page.waitForTimeout(1200);

  const htmlLangFr = await page.getAttribute('html', 'lang');
  console.log(`   -> Live html.lang after clicking Français: "${htmlLangFr}"`);
  if (htmlLangFr !== 'fr') {
    throw new Error(`Expected html.lang to be "fr", got "${htmlLangFr}"`);
  }

  // Close drawer and verify #translate button under French mode
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  const frBadge = (await translateBtn.innerText()).trim();
  console.log(`   -> Live #translate badge in French mode: "${frBadge}"`);
  if (frBadge !== 'FR') {
    throw new Error(`Expected badge in French mode to be "FR", got "${frBadge}"`);
  }

  // Cycle from French: should switch to English
  console.log('   -> Cycling #translate from FR mode (should switch to EN)...');
  await translateBtn.click();
  await page.waitForTimeout(1000);

  const enBadge = (await translateBtn.innerText()).trim();
  const htmlLangEn = await page.getAttribute('html', 'lang');
  console.log(`   -> Live badge after cycling from FR: "${enBadge}", html.lang: "${htmlLangEn}"`);
  if (enBadge !== 'EN' || htmlLangEn !== 'en') {
    throw new Error(`Expected badge "EN" and lang "en", got badge "${enBadge}" and lang "${htmlLangEn}"`);
  }

  // Final screenshot under English mode
  await page.screenshot({ path: path.join(scratchDir, 'live-french-en-cycled.png') });
  console.log('   -> Captured final screenshot: scratch/live-french-en-cycled.png');

  await browser.close();

  console.log('\n======================================================');
  console.log('🎉 LIVE PRODUCTION VERIFICATION PASSED 100% PERFECTLY!');
  console.log('======================================================\n');
}

verifyLiveProduction().catch((err) => {
  console.error('\n❌ LIVE PRODUCTION AUDIT FAILED:', err);
  process.exit(1);
});
