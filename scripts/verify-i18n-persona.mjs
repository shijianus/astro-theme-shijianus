import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { 
  inferUserPersona, 
  ensureUserPersona, 
  updateCandidatePairWithManualChoice,
  SUPPORTED_LOCALES 
} from '../src/lib/user-persona.ts';
import { 
  convertText, 
  LOCALE_METADATA, 
  MULTILINGUAL_DICTIONARY 
} from '../src/lib/client-locale.ts';

async function testPersonaInferenceEngine() {
  console.log('\n--- 1. Testing User Persona Inference Engine & Weights (45% IME, 40% TZ, 15% IP) ---');

  // Case 1: Pinyin IME (45%) + Taipei Timezone (40%) + MY Proxy IP (15%)
  const case1 = inferUserPersona({
    inputMethodLocale: 'zh-Hans-CN',
    languages: ['zh-Hans-CN', 'zh-CN', 'zh'],
    timezone: 'Asia/Taipei',
    ipCountry: 'MY',
  });
  console.log('   Case 1 Result:', {
    primary: case1.primaryLocale,
    pair: case1.candidatePair,
    isProxy: case1.traits.isLikelyProxy,
    confidence: case1.confidence,
    reason: case1.traits.reasoning,
  });

  if (case1.primaryLocale !== 'zh-CN') {
    throw new Error(`Case 1 failed: primaryLocale should be zh-CN, got ${case1.primaryLocale}`);
  }
  if (case1.candidatePair[0] !== 'zh-CN' || case1.candidatePair[1] !== 'zh-Hant') {
    throw new Error(`Case 1 failed: candidatePair should be ['zh-CN', 'zh-Hant'], got ${JSON.stringify(case1.candidatePair)}`);
  }
  if (!case1.traits.isLikelyProxy) {
    throw new Error('Case 1 failed: isLikelyProxy should be true for MY IP with Chinese mainland traits');
  }

  // Case 2: Traditional Chinese IME + Taipei Timezone + TW IP
  const case2 = inferUserPersona({
    inputMethodLocale: 'zh-TW',
    languages: ['zh-TW', 'zh-Hant', 'en'],
    timezone: 'Asia/Taipei',
    ipCountry: 'TW',
  });
  console.log('   Case 2 (Traditional):', { primary: case2.primaryLocale, pair: case2.candidatePair });
  if (case2.primaryLocale !== 'zh-Hant' || case2.candidatePair[0] !== 'zh-Hant') {
    throw new Error(`Case 2 failed: expected zh-Hant, got ${case2.primaryLocale}`);
  }

  // Case 3: French user (fr-FR + Europe/Paris + FR IP)
  const case3 = inferUserPersona({
    inputMethodLocale: 'fr-FR',
    languages: ['fr-FR', 'fr', 'en-US'],
    timezone: 'Europe/Paris',
    ipCountry: 'FR',
  });
  console.log('   Case 3 (French):', { primary: case3.primaryLocale, pair: case3.candidatePair });
  if (case3.primaryLocale !== 'fr' || case3.candidatePair[0] !== 'fr' || case3.candidatePair[1] !== 'en') {
    throw new Error(`Case 3 failed: expected fr and pair [fr, en], got ${JSON.stringify(case3)}`);
  }

  // Case 4: Spanish user (es-ES + Europe/Madrid + ES IP)
  const case4 = inferUserPersona({
    inputMethodLocale: 'es-ES',
    languages: ['es-ES', 'es', 'en'],
    timezone: 'Europe/Madrid',
    ipCountry: 'ES',
  });
  console.log('   Case 4 (Spanish):', { primary: case4.primaryLocale, pair: case4.candidatePair });
  if (case4.primaryLocale !== 'es' || case4.candidatePair[0] !== 'es' || case4.candidatePair[1] !== 'en') {
    throw new Error(`Case 4 failed: expected es and pair [es, en], got ${JSON.stringify(case4)}`);
  }

  // Case 5: German user (de-DE + Europe/Berlin + DE IP)
  const case5 = inferUserPersona({
    inputMethodLocale: 'de-DE',
    languages: ['de-DE', 'de', 'en'],
    timezone: 'Europe/Berlin',
    ipCountry: 'DE',
  });
  console.log('   Case 5 (German):', { primary: case5.primaryLocale, pair: case5.candidatePair });
  if (case5.primaryLocale !== 'de' || case5.candidatePair[0] !== 'de' || case5.candidatePair[1] !== 'en') {
    throw new Error(`Case 5 failed: expected de and pair [de, en], got ${JSON.stringify(case5)}`);
  }

  // Case 6: English user
  const case6 = inferUserPersona({
    inputMethodLocale: 'en-US',
    languages: ['en-US', 'en'],
    timezone: 'America/New_York',
    ipCountry: 'US',
  });
  console.log('   Case 6 (English):', { primary: case6.primaryLocale, pair: case6.candidatePair });
  if (case6.primaryLocale !== 'en') {
    throw new Error(`Case 6 failed: expected en, got ${case6.primaryLocale}`);
  }

  console.log('✅ Persona inference engine passed all 6 demographic scenarios!');
}

async function testDictionaryAndTextConversion() {
  console.log('\n--- 2. Testing Multilingual Dictionaries & Text Conversion ---');

  const testPhrases = [
    { zh: '首页', en: 'Home', fr: 'Accueil', es: 'Inicio', de: 'Startseite' },
    { zh: '文章目录', en: 'Table of contents', fr: 'Sommaire', es: 'Índice', de: 'Inhaltsverzeichnis' },
    { zh: '回到顶部', en: 'Back to top', fr: 'Haut de page', es: 'Volver arriba', de: 'Nach oben' },
    { zh: '账号中心', en: 'Account', fr: 'Compte', es: 'Cuenta', de: 'Konto' },
    { zh: '切换背景：晨光背景', en: 'Background: Daybreak', fr: 'Arrière-plan: Aurore', es: 'Fondo: Amanecer', de: 'Hintergrund: Morgengrauen' },
  ];

  for (const item of testPhrases) {
    for (const lang of ['en', 'fr', 'es', 'de']) {
      const translated = convertText(item.zh, lang);
      if (translated !== item[lang]) {
        throw new Error(`Dictionary translation mismatch for "${item.zh}" in ${lang}: expected "${item[lang]}", got "${translated}"`);
      }
    }
  }

  console.log(`✅ Multilingual dictionary verified across all test phrases in en, fr, es, and de!`);
}

function startDistServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };

  const server = http.createServer((req, res) => {
    let reqPath = req.url ? req.url.split('?')[0] : '/';
    let filePath = path.join(distDir, decodeURIComponent(reqPath));

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, '404.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

async function testBrowserE2E() {
  console.log('\n--- 3. Testing Browser E2E Interaction (#translate cycling & Account Drawer) ---');

  const port = 4345;
  const distDir = path.resolve('dist');
  if (!fs.existsSync(distDir)) {
    throw new Error('dist directory does not exist! Please run npm run build first.');
  }

  const server = await startDistServer(distDir, port);
  console.log(`   -> Dist static server listening on http://127.0.0.1:${port}`);

  const cleanup = () => {
    try {
      server.close();
    } catch {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'zh-CN',
    timezoneId: 'Asia/Taipei',
  });

  const page = await context.newPage();
  page.on('console', (msg) => console.log('   [Browser console]', msg.text()));

  // Mock /api/geo-profile to simulate Malaysia IP (proxy evaluation rule)
  await page.route('**/api/geo-profile*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        country: 'MY',
        countryName: '马来西亚',
        isMainland: false,
        city: 'Kuala Lumpur',
        location: '马来西亚·Kuala Lumpur',
        locale: 'zh-CN',
      }),
    });
  });

  await page.goto(`http://127.0.0.1:${port}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // 1. Check rightside translate button
  const configBtn = page.locator('#rightside-config');
  await configBtn.waitFor({ state: 'visible', timeout: 5000 });
  await configBtn.click();
  await page.waitForTimeout(500);

  const translateBtn = page.locator('#translate');
  await translateBtn.waitFor({ state: 'visible', timeout: 5000 });

  // Initial badge in zh-CN should be "简"
  const initialText = await translateBtn.innerText();
  console.log('   -> Initial #translate badge:', initialText.trim());
  if (initialText.trim() !== '简') {
    throw new Error(`Initial #translate badge should be "简", got "${initialText.trim()}"`);
  }

  // 2. Click #translate: Should cycle to "繁" (zh-Hant)
  await translateBtn.click();
  await page.waitForTimeout(600);

  const secondText = await translateBtn.innerText();
  console.log('   -> After 1st click #translate badge:', secondText.trim());
  if (secondText.trim() !== '繁') {
    throw new Error(`After first toggle, badge should be "繁", got "${secondText.trim()}"`);
  }

  const htmlLang1 = await page.getAttribute('html', 'lang');
  console.log('   -> HTML lang after 1st toggle:', htmlLang1);
  if (htmlLang1 !== 'zh-Hant') {
    throw new Error(`HTML lang should be zh-Hant, got ${htmlLang1}`);
  }

  // 3. Click #translate again: Should cycle back to "简" (zh-CN)
  await translateBtn.click();
  await page.waitForTimeout(600);

  const thirdText = await translateBtn.innerText();
  console.log('   -> After 2nd click #translate badge:', thirdText.trim());
  if (thirdText.trim() !== '简') {
    throw new Error(`After second toggle, badge should cycle back to "简", got "${thirdText.trim()}"`);
  }

  // 4. Test Account Drawer Preferences (free language choice for all 6 languages)
  console.log('   -> Testing Account Drawer Preferences (free 6-language picker)...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('shijianus:open-notifications', { detail: { tab: 'settings' } }));
  });
  await page.waitForTimeout(700);

  const localeGrid = page.locator('.account-locale-grid');
  await localeGrid.waitFor({ state: 'visible', timeout: 5000 });

  const buttons = await localeGrid.locator('button').all();
  console.log('   -> Locale grid button count:', buttons.length);
  if (buttons.length !== 6) {
    throw new Error(`Account drawer should present all 6 mainstream languages, got ${buttons.length}`);
  }

  // Verify Persona card is visible with traits and confidence
  const personaCard = page.locator('.account-persona-card');
  await personaCard.waitFor({ state: 'visible', timeout: 5000 });
  const personaText = await personaCard.innerText();
  console.log('   -> User persona card text snippet:', personaText.replace(/\n/g, ' '));
  if (!personaText.includes('45%') || !personaText.includes('40%') || !personaText.includes('15%')) {
    throw new Error('Persona card does not display all weight factors (45%, 40%, 15%)');
  }

  // Click Français (fr) in the account card
  const frBtn = localeGrid.locator('button:has-text("Français")');
  await frBtn.click();
  await page.waitForTimeout(800);

  const htmlLangFr = await page.getAttribute('html', 'lang');
  console.log('   -> HTML lang after clicking Français:', htmlLangFr);
  if (htmlLangFr !== 'fr') {
    throw new Error(`HTML lang should be fr, got ${htmlLangFr}`);
  }

  // Close account drawer and test #translate button under French persona
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const frBadge = await translateBtn.innerText();
  console.log('   -> #translate badge after selecting French:', frBadge.trim());
  if (frBadge.trim() !== 'FR') {
    throw new Error(`Under French mode, badge should display "FR", got "${frBadge.trim()}"`);
  }

  // Click #translate: Should cycle to English (FR ⇋ EN)
  await translateBtn.click();
  await page.waitForTimeout(600);
  const enBadge = await translateBtn.innerText();
  console.log('   -> #translate badge after cycling from FR:', enBadge.trim());
  if (enBadge.trim() !== 'EN') {
    throw new Error(`Under French persona, cycling should switch to "EN", got "${enBadge.trim()}"`);
  }

  await browser.close();
  cleanup();
  console.log('✅ Browser E2E interaction verified: #translate 2-language cycling, 6-language picker, and persona profiling passed!');
}

async function runAll() {
  try {
    await testPersonaInferenceEngine();
    await testDictionaryAndTextConversion();
    await testBrowserE2E();
    console.log('\n🌟 ALL I18N, PERSONA & TRANSLATE CYCLING VERIFICATIONS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exit(1);
  }
}

runAll();
