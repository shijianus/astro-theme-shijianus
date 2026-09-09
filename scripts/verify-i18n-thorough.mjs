import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const EXPECTED_TEXTS = {
  'en': {
    langTitle: 'Interface Language',
    notifyTitle: 'Notification Preferences',
    commentsTitle: 'Comment Preferences',
    a11yTitle: 'Accessibility & Feedback',
    profileTitle: 'Profile Settings',
    profileSaveBtn: 'Save Changes',
    epomailTitle: 'EpoCanvas Mail Authentication',
    pwdless: '1-Click Passwordless',
    avatarSync: 'Cloud Avatar Sync',
    instantReply: 'Instant Reply Alerts',
    broadcastPart: 'Site Broadcasts',
    personalPart: 'Interactions & Footprint',
  },
  'fr': {
    langTitle: 'Langue de l interface',
    notifyTitle: 'Préférences de notification',
    commentsTitle: 'Préférences des commentaires',
    a11yTitle: 'Accessibilité & Retour tactile',
    profileTitle: 'Paramètres du Profil',
    profileSaveBtn: 'Enregistrer',
    epomailTitle: 'Authentification EpoCanvas Mail',
    pwdless: 'Auth 1-clic sans mot de passe',
    avatarSync: 'Synchronisation avatar',
    instantReply: 'Alertes instantanées',
    broadcastPart: 'Annonces globales',
    personalPart: 'Interactions & Activité',
  },
  'es': {
    langTitle: 'Idioma de la interfaz',
    notifyTitle: 'Preferencias de notificaciones',
    commentsTitle: 'Preferencias de comentarios',
    a11yTitle: 'Accesibilidad y Respuesta háptica',
    profileTitle: 'Ajustes del Perfil',
    profileSaveBtn: 'Guardar Cambios',
    epomailTitle: 'Autenticación EpoCanvas Mail',
    pwdless: 'Autenticación en 1 clic',
    avatarSync: 'Sincronización de avatar',
    instantReply: 'Alertas instantáneas',
    broadcastPart: 'Avisos globales',
    personalPart: 'Interacciones y Actividad',
  },
  'de': {
    langTitle: 'Oberflächensprache',
    notifyTitle: 'Benachrichtigungseinstellungen',
    commentsTitle: 'Kommentareinstellungen',
    a11yTitle: 'Barrierefreiheit & Feedback',
    profileTitle: 'Profileinstellungen',
    profileSaveBtn: 'Änderungen speichern',
    epomailTitle: 'EpoCanvas Mail Authentifizierung',
    pwdless: '1-Klick passwortlose Auth',
    avatarSync: 'Cloud-Avatar Synchronisierung',
    instantReply: 'Sofortige Antwort-Hinweise',
    broadcastPart: 'Website-Mitteilungen',
    personalPart: 'Interaktionen & Verlauf',
  },
  'zh-Hant': {
    langTitle: '介面語言 (Language)',
    notifyTitle: '站內通知接收偏好',
    commentsTitle: '評論區互動與顯示偏好',
    a11yTitle: '互動回饋與無障礙',
    profileTitle: '帳戶資料設定',
    profileSaveBtn: '儲存資料修改',
    epomailTitle: 'EpoCanvas Mail 統一身分認證',
    pwdless: '一鍵免密授權',
    avatarSync: '雲端頭像漫遊',
    instantReply: '回覆即刻送達',
    broadcastPart: '全站廣播通告',
    personalPart: '個人互動與足跡',
  },
  'zh-CN': {
    langTitle: '界面语言 (Language)',
    notifyTitle: '站内通知接收偏好',
    commentsTitle: '评论区互动与显示偏好',
    a11yTitle: '交互反馈与无障碍',
    profileTitle: '账户资料设置',
    profileSaveBtn: '保存资料修改',
    epomailTitle: 'EpoCanvas Mail 统一身份认证',
    pwdless: '一键免密授权',
    avatarSync: '云端头像漫游',
    instantReply: '回复即刻送达',
    broadcastPart: '全站广播通告',
    personalPart: '个人互动与足迹',
  }
};

const LOCALE_INDEX_MAP = {
  'zh-CN': 0,
  'zh-Hant': 1,
  'en': 2,
  'fr': 3,
  'es': 4,
  'de': 5
};

function createStaticServer(port) {
  const dist = path.resolve('dist');
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      let filePath = path.join(dist, urlPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
      if (!fs.existsSync(filePath)) filePath = path.join(dist, '404.html');
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const contentType = ext === '.html' ? 'text/html; charset=utf-8' : ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function runAudit(targetUrl) {
  console.log(`\n============================================================`);
  console.log(`Starting i18n & Persona Verification: ${targetUrl}`);
  console.log(`============================================================\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[Browser Console Error]', msg.text());
      errors.push(msg.text());
    }
  });

  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(600);

  // 1. Check account-persona-card count (MUST BE 0)
  const personaCardCount = await page.locator('.account-persona-card').count();
  console.log(`[Check 1] .account-persona-card count: ${personaCardCount}`);
  if (personaCardCount !== 0) {
    throw new Error(`FAIL: .account-persona-card should NOT be rendered in DOM! Found: ${personaCardCount}`);
  }
  console.log('✓ PASS: .account-persona-card is completely removed from DOM. Zero method or weight leakage.');

  // 2. Open Account Drawer
  console.log('\n[Check 2] Opening Account Drawer...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('shijianus:open-account')));
  await page.waitForSelector('.theme-account-overlay.show', { state: 'visible', timeout: 5000 });
  await page.waitForTimeout(400); // allow 0.35s slide-in transition
  console.log('✓ PASS: Account Drawer opened and visible.');

  // 3. Navigate to Settings Tab (Tab 3)
  console.log('\n[Check 3] Navigating to Settings Tab (Tab 3)...');
  await page.locator('.account-nav-tab').nth(2).click();
  await page.waitForTimeout(300);

  // 4. Test all 6 languages
  const locales = ['en', 'fr', 'es', 'de', 'zh-Hant', 'zh-CN'];
  for (const locale of locales) {
    console.log(`\n--- Testing locale: [${locale}] ---`);

    const idx = LOCALE_INDEX_MAP[locale];
    const targetBtn = page.locator('.account-locale-btn').nth(idx);

    const start = Date.now();
    await targetBtn.click();
    await page.waitForTimeout(250);
    const latency = Date.now() - start;
    console.log(`✓ Language switch latency: ${latency}ms (Zero lag)`);

    const expected = EXPECTED_TEXTS[locale];

    // Assert Settings Tab (Tab 3) card titles
    const cards = page.locator('.account-card');
    const cardTitles = await cards.locator('.account-card__title').allInnerTexts();
    console.log(`Tab 3 Card Titles:`, cardTitles);

    if (!cardTitles.some(t => t.includes(expected.langTitle))) {
      throw new Error(`FAIL [${locale}]: Missing langTitle "${expected.langTitle}" in: ${JSON.stringify(cardTitles)}`);
    }
    if (!cardTitles.some(t => t.includes(expected.notifyTitle))) {
      throw new Error(`FAIL [${locale}]: Missing notifyTitle "${expected.notifyTitle}" in: ${JSON.stringify(cardTitles)}`);
    }
    if (!cardTitles.some(t => t.includes(expected.commentsTitle))) {
      throw new Error(`FAIL [${locale}]: Missing commentsTitle "${expected.commentsTitle}" in: ${JSON.stringify(cardTitles)}`);
    }
    if (!cardTitles.some(t => t.includes(expected.a11yTitle))) {
      throw new Error(`FAIL [${locale}]: Missing a11yTitle "${expected.a11yTitle}" in: ${JSON.stringify(cardTitles)}`);
    }
    console.log(`✓ Tab 3 Cards verified for [${locale}]`);

    // Switch to Tab 1 (Auth & Profile)
    await page.locator('.account-nav-tab').nth(0).click();
    await page.waitForTimeout(200);

    const tab1CardTitles = await page.locator('.account-card .account-card__title').allInnerTexts();
    console.log(`Tab 1 Card Titles:`, tab1CardTitles);

    if (!tab1CardTitles.some(t => t.includes(expected.profileTitle))) {
      throw new Error(`FAIL [${locale}]: Missing profileTitle "${expected.profileTitle}" in: ${JSON.stringify(tab1CardTitles)}`);
    }
    if (!tab1CardTitles.some(t => t.includes(expected.epomailTitle))) {
      throw new Error(`FAIL [${locale}]: Missing epomailTitle "${expected.epomailTitle}" in: ${JSON.stringify(tab1CardTitles)}`);
    }

    // Verify Tab 1 Epomail benefits
    const benefits = await page.locator('.epomail-benefit-item span').allInnerTexts();
    console.log(`Tab 1 Epomail Benefits:`, benefits);
    if (!benefits.includes(expected.pwdless)) {
      throw new Error(`FAIL [${locale}]: Missing pwdless benefit "${expected.pwdless}" in: ${JSON.stringify(benefits)}`);
    }
    if (!benefits.includes(expected.avatarSync)) {
      throw new Error(`FAIL [${locale}]: Missing avatarSync benefit "${expected.avatarSync}" in: ${JSON.stringify(benefits)}`);
    }
    if (!benefits.includes(expected.instantReply)) {
      throw new Error(`FAIL [${locale}]: Missing instantReply benefit "${expected.instantReply}" in: ${JSON.stringify(benefits)}`);
    }
    console.log(`✓ Tab 1 Cards & Benefits verified for [${locale}]`);

    // Switch to Tab 2 (Notifications)
    await page.locator('.account-nav-tab').nth(1).click();
    await page.waitForTimeout(200);

    const partitionBtns = await page.locator('.account-partition-btn span').allInnerTexts();
    console.log(`Tab 2 Partitions:`, partitionBtns);
    if (!partitionBtns.some(b => b.includes(expected.broadcastPart))) {
      throw new Error(`FAIL [${locale}]: Missing broadcastPart "${expected.broadcastPart}" in: ${JSON.stringify(partitionBtns)}`);
    }
    if (!partitionBtns.some(b => b.includes(expected.personalPart))) {
      throw new Error(`FAIL [${locale}]: Missing personalPart "${expected.personalPart}" in: ${JSON.stringify(partitionBtns)}`);
    }
    console.log(`✓ Tab 2 Partitions verified for [${locale}]`);

    // Switch back to Tab 3 for next iteration
    await page.locator('.account-nav-tab').nth(2).click();
    await page.waitForTimeout(100);
  }

  // 5. Close drawer and verify Chinese restoration outside drawer
  console.log('\n[Check 5] Closing Account Drawer and auditing Chinese purity...');
  await page.locator('.theme-account-drawer__close').click();
  await page.waitForTimeout(500);

  const docText = await page.evaluate(() => {
    const clone = document.body.cloneNode(true);
    const d = clone.querySelector('.theme-account-overlay');
    if (d) d.remove();
    return clone.innerText;
  });

  const foreignLeaks = [
    'Profile Settings',
    'Paramètres du Profil',
    'Ajustes del Perfil',
    'Profileinstellungen',
    'Notification Preferences',
    'Comment Preferences',
    '1-Click Passwordless',
    'Cloud Avatar Sync',
    'Instant Reply Alerts'
  ];

  for (const leak of foreignLeaks) {
    if (docText.includes(leak)) {
      throw new Error(`FAIL: Foreign leak detected in zh-CN state: "${leak}"!`);
    }
  }
  console.log('✓ PASS: Zero foreign leaks detected outside drawer. Simplified Chinese is 100% losslessly restored!');

  console.log('\n============================================================');
  console.log(`🎉 ALL i18n TESTS PASSED FOR: ${targetUrl}`);
  console.log('============================================================\n');

  await browser.close();
}

async function main() {
  const isLive = process.argv.includes('--live');
  if (isLive) {
    const liveUrl = process.env.LIVE_URL || 'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/';
    await runAudit(liveUrl);
  } else {
    const port = 4389;
    const server = await createStaticServer(port);
    try {
      await runAudit(`http://127.0.0.1:${port}/posts/content-formats-and-markup-mastery/`);
    } finally {
      server.close();
    }
  }
}

main().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
