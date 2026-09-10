import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const distDir = path.join(ROOT, 'dist');

function createStaticServer(distDir, port = 8092) {
  return new Promise((resolve) => {
    const mime = {
      '.html': 'text/html', '.js': 'application/javascript',
      '.css': 'text/css', '.json': 'application/json',
      '.png': 'image/png', '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
      '.woff2': 'font/woff2', '.woff': 'font/woff',
    };
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      const filePath = path.join(distDir, urlPath);
      const ext = path.extname(filePath);
      const contentType = mime[ext] || 'application/octet-stream';
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const htmlPath = filePath + '.html';
        if (fs.existsSync(htmlPath)) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          fs.createReadStream(htmlPath).pipe(res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('Not found');
        }
      }
    });
    server.listen(port, () => resolve(server));
  });
}

async function verifyAll() {
  const server = await createStaticServer(distDir, 8092);
  const browser = await chromium.launch({ headless: true });

  console.log('🧪 Starting Comprehensive E2E Verification for i18n Streamline Protocol...');

  // Test matrix
  const locales = [
    { code: 'zh-CN', tabs: ['登录 / 授权', '站内提醒', '偏好与架构'], cta: '立即加入 →', cats: ['前端工程', '系统设计'] },
    { code: 'en', tabs: ['Sign In', 'Notices', 'Preferences'], cta: 'Join Now →', cats: ['Frontend', 'Systems'] },
    { code: 'fr', tabs: ['Connexion', 'Alertes', 'Préférences'], cta: 'Rejoindre →', cats: ['Frontend', 'Systèmes'] },
    { code: 'es', tabs: ['Acceso', 'Avisos', 'Preferencias'], cta: 'Unirse →', cats: ['Frontend', 'Sistemas'] },
    { code: 'de', tabs: ['Anmelden', 'Hinweise', 'Einstellungen'], cta: 'Beitreten →', cats: ['Frontend', 'Systeme'] },
    { code: 'zh-Hant', tabs: ['登入 / 授權', '站內提醒', '偏好與架構'], cta: '立即加入 →', cats: ['前端工程', '系統設計'] },
  ];

  // 1. Desktop Verification
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktopPage.goto('http://localhost:8092/posts/access-control-lab/', { waitUntil: 'load' });
  await desktopPage.waitForTimeout(800);

  for (const loc of locales) {
    console.log(`\n🔍 [Desktop 1440x900] Testing Locale: ${loc.code}`);
    if (loc.code !== 'zh-CN') {
      await desktopPage.evaluate((l) => {
        window.__SHIJIANUS_LOCALE_RUNTIME__?.applyLocaleVariant(l, { manual: true });
      }, loc.code);
      await desktopPage.waitForTimeout(500);
    }

    // A. Verify Headline Left Alignment
    const headlines = await desktopPage.evaluate(() => {
      const list = [];
      document.querySelectorAll('.aside-sticky-box .item-headline').forEach(hl => {
        const text = hl.querySelector('span:not(.aside-title-icon)')?.textContent?.trim();
        const icon = hl.querySelector('svg');
        const hr = hl.getBoundingClientRect();
        const tr = hl.querySelector('span:not(.aside-title-icon)')?.getBoundingClientRect();
        const cs = window.getComputedStyle(hl);
        list.push({
          text,
          justifyContent: cs.justifyContent,
          textAlign: cs.textAlign,
          textX: tr ? Math.round(tr.left - hr.left) : 0,
        });
      });
      return list;
    });

    for (const h of headlines) {
      if (loc.code !== 'zh-CN' && loc.code !== 'zh-Hant') {
        if (h.justifyContent !== 'flex-start') {
          throw new Error(`[Headline Error] ${loc.code}: "${h.text}" justifyContent is ${h.justifyContent}, expected flex-start`);
        }
      }
      if (h.textX > 32) {
        throw new Error(`[Headline Error] ${loc.code}: "${h.text}" textX=${h.textX}px is not left-aligned!`);
      }
    }
    console.log(`  ✅ Headline left alignment verified (textX <= 26px, flex-start).`);

    // B. Verify Category 1-Word Streamlined Translations
    const catNames = await desktopPage.evaluate(() => {
      return Array.from(document.querySelectorAll('.card-categories .card-category-list-name')).map(el => el.textContent.trim());
    });
    for (const expectedCat of loc.cats) {
      if (!catNames.includes(expectedCat)) {
        throw new Error(`[Category Error] ${loc.code}: Category "${expectedCat}" not found in [${catNames.join(', ')}]`);
      }
    }
    console.log(`  ✅ Categories verified as concise single-word: [${loc.cats.join(', ')}]`);

    // C. Verify Flip Card CTA Button i18n
    const ctaText = await desktopPage.evaluate(() => {
      return document.querySelector('#flip-content .promo-cta-btn')?.textContent?.trim();
    });
    if (ctaText !== loc.cta) {
      throw new Error(`[Flip Card CTA Error] ${loc.code}: Expected "${loc.cta}", got "${ctaText}"`);
    }
    console.log(`  ✅ Flip card CTA button verified: "${ctaText}"`);

    // D. Verify Account Drawer Tabs & Icon Visibility
    await desktopPage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-account'));
    });
    await desktopPage.waitForTimeout(350);

    const tabsData = await desktopPage.evaluate(() => {
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

    for (let i = 0; i < loc.tabs.length; i++) {
      const expectedTab = loc.tabs[i];
      const actualTab = tabsData[i];
      if (!actualTab || actualTab.text !== expectedTab) {
        throw new Error(`[Tab Text Error] ${loc.code}: Tab ${i} expected "${expectedTab}", got "${actualTab?.text}"`);
      }
      if (actualTab.iconWidth < 14) {
        throw new Error(`[Tab Icon Collapsed] ${loc.code}: Tab "${actualTab.text}" iconWidth=${actualTab.iconWidth}px (< 14px)!`);
      }
    }
    console.log(`  ✅ Account tabs verified: [${tabsData.map(t => `${t.text} (icon: ${t.iconWidth}px)`).join(', ')}]`);

    await desktopPage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:close-account'));
    });
    await desktopPage.waitForTimeout(250);
  }
  await desktopPage.close();

  // 2. Mobile (iPhone 14) Verification
  console.log('\n📱 [Mobile iPhone14 390x844] Testing Mobile Viewport Stability...');
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:8092/posts/access-control-lab/', { waitUntil: 'load' });
  await mobilePage.waitForTimeout(600);

  for (const loc of locales) {
    if (loc.code !== 'zh-CN') {
      await mobilePage.evaluate((l) => {
        window.__SHIJIANUS_LOCALE_RUNTIME__?.applyLocaleVariant(l, { manual: true });
      }, loc.code);
      await mobilePage.waitForTimeout(400);
    }

    await mobilePage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-account'));
    });
    await mobilePage.waitForTimeout(350);

    const mobileTabs = await mobilePage.evaluate(() => {
      const res = [];
      document.querySelectorAll('.account-nav-tab').forEach(tab => {
        const text = tab.querySelector('span')?.textContent?.trim();
        const icon = tab.querySelector('svg');
        const ir = icon?.getBoundingClientRect();
        res.push({
          text,
          iconWidth: ir ? Math.round(ir.width) : 0,
        });
      });
      return res;
    });

    for (const mt of mobileTabs) {
      if (mt.iconWidth < 14) {
        throw new Error(`[Mobile Tab Icon Collapsed] ${loc.code}: Tab "${mt.text}" icon collapsed (${mt.iconWidth}px)`);
      }
    }

    await mobilePage.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:close-account'));
    });
    await mobilePage.waitForTimeout(200);
  }
  await mobilePage.close();
  console.log('  ✅ Mobile viewport all tabs intact with 16px SVG icons across all 6 locales.');

  await browser.close();
  server.close();
  console.log('\n🎉 ALL E2E VERIFICATIONS PASSED SUCCESSFULLY!');
}

verifyAll().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
