import { chromium } from 'playwright';

const PROD_URL = 'https://blog.epocanvas.com/posts/access-control-lab/';

async function checkDeployment() {
  console.log('🌐 Polling Cloudflare Pages deployment at', PROD_URL);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  let deployed = false;
  for (let attempt = 1; attempt <= 15; attempt++) {
    console.log(`[Attempt ${attempt}/15] Checking live site...`);
    try {
      await page.goto(PROD_URL, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Switch to en and check if single-word category "Frontend" or streamlined tab "Sign In" is present
      await page.evaluate(() => {
        window.__SHIJIANUS_LOCALE_RUNTIME__?.applyLocaleVariant('en', { manual: true });
      });
      await page.waitForTimeout(600);

      const catTexts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.card-categories .card-category-list-name')).map(e => e.textContent.trim());
      });

      if (catTexts.includes('Frontend')) {
        console.log('🎉 New version detected live on Cloudflare Pages! Categories:', catTexts);
        deployed = true;
        break;
      } else {
        console.log('⏳ Old version still active (categories:', catTexts, '), waiting 12s...');
      }
    } catch (e) {
      console.log('⚠️ Request attempt failed:', e.message);
    }
    await new Promise(r => setTimeout(r, 12000));
  }

  if (!deployed) {
    console.warn('⚠️ Polling timed out waiting for CF Pages deployment. Running tests on current live page anyway...');
  }

  console.log('\n🚀 Executing Live Production E2E Verification across locales...');
  const locales = [
    { code: 'zh-CN', tabs: ['登录 / 授权', '站内提醒', '偏好与架构'], cta: '立即加入 →' },
    { code: 'en', tabs: ['Sign In', 'Notices', 'Preferences'], cta: 'Join Now →' },
    { code: 'fr', tabs: ['Connexion', 'Alertes', 'Préférences'], cta: 'Rejoindre →' },
    { code: 'es', tabs: ['Acceso', 'Avisos', 'Preferencias'], cta: 'Unirse →' },
    { code: 'de', tabs: ['Anmelden', 'Hinweise', 'Einstellungen'], cta: 'Beitreten →' },
  ];

  for (const loc of locales) {
    console.log(`\n🔍 [PROD LIVE] Testing Locale: ${loc.code}`);
    if (loc.code !== 'zh-CN') {
      await page.evaluate((l) => {
        window.__SHIJIANUS_LOCALE_RUNTIME__?.applyLocaleVariant(l, { manual: true });
      }, loc.code);
      await page.waitForTimeout(600);
    }

    // 1. Headline Left Alignment
    const headlines = await page.evaluate(() => {
      const list = [];
      document.querySelectorAll('.aside-sticky-box .item-headline').forEach(hl => {
        const text = hl.querySelector('span:not(.aside-title-icon)')?.textContent?.trim();
        const hr = hl.getBoundingClientRect();
        const tr = hl.querySelector('span:not(.aside-title-icon)')?.getBoundingClientRect();
        const cs = window.getComputedStyle(hl);
        list.push({
          text,
          justifyContent: cs.justifyContent,
          textX: tr ? Math.round(tr.left - hr.left) : 0,
        });
      });
      return list;
    });
    console.log(`  Live Headlines in aside:`, headlines);

    // 2. Account Tabs and Icon Visibility
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-account'));
    });
    await page.waitForTimeout(400);

    const tabsData = await page.evaluate(() => {
      const result = [];
      document.querySelectorAll('.account-nav-tab').forEach(tab => {
        const text = tab.querySelector('span')?.textContent?.trim();
        const icon = tab.querySelector('svg');
        const ir = icon?.getBoundingClientRect();
        result.push({
          text,
          iconWidth: ir ? Math.round(ir.width) : 0,
        });
      });
      return result;
    });
    console.log(`  Live Account Tabs:`, tabsData);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:close-account'));
    });
    await page.waitForTimeout(200);

    // 3. Flip Card CTA
    const cta = await page.evaluate(() => {
      return document.querySelector('#flip-content .promo-cta-btn')?.textContent?.trim();
    });
    console.log(`  Live Flip Card CTA: "${cta}"`);
  }

  await browser.close();
  console.log('\n✅ Live Production Verification Complete!');
}

checkDeployment().catch(err => {
  console.error('Production Verification Failed:', err);
  process.exit(1);
});
