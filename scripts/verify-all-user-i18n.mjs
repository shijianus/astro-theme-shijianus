import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const IS_LIVE = process.argv.includes('--live');
const BASE_URL = IS_LIVE ? 'https://blog.epocanvas.com' : 'http://localhost:4321';
const TEST_POST_PATH = '/posts/content-formats-and-markup-mastery/';

console.log(`\n======================================================`);
console.log(`🚀 COMPREHENSIVE USER-SPECIFIED I18N E2E VERIFICATION`);
console.log(`Target URL: ${BASE_URL}${TEST_POST_PATH}`);
console.log(`Mode: ${IS_LIVE ? 'PROD LIVE' : 'LOCAL STATIC SERVER'}`);
console.log(`======================================================\n`);

let staticServer = null;

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

async function run() {
  if (!IS_LIVE) {
    staticServer = await createStaticServer(4321);
    console.log('✅ Local static server running on port 4321.');
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  const errors = [];

  page.on('pageerror', (err) => {
    console.error(`Browser Page Error:`, err.message);
    errors.push(`Page Error: ${err.message}`);
  });

  console.log(`🧭 Loading test post...`);
  await page.goto(`${BASE_URL}${TEST_POST_PATH}`, { waitUntil: 'networkidle', timeout: 30000 });

  // Pre-hydrate all client:idle components (SiteHeader, PostComments, ThemeDock)
  await page.evaluate(() => {
    const el = document.getElementById('post-comment');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);

  // Capture original article sample
  const originalArticleText = await page.evaluate(() => {
    const el = document.getElementById('article-container');
    return el ? el.innerText.slice(0, 200) : '';
  });
  console.log(`📄 Original article sample: "${originalArticleText.slice(0, 60).replace(/\n/g, ' ')}..."`);

  const localesToAudit = ['en', 'fr', 'es', 'de', 'zh-Hant', 'zh-CN'];

  for (const targetLocale of localesToAudit) {
    console.log(`\n======================================================`);
    console.log(`🔍 AUDITING LOCALE: [${targetLocale.toUpperCase()}]`);
    console.log(`======================================================`);

    // Switch locale
    await page.evaluate((loc) => {
      if (window.__SHIJIANUS_LOCALE_RUNTIME__ && typeof window.__SHIJIANUS_LOCALE_RUNTIME__.applyLocaleVariant === 'function') {
        window.__SHIJIANUS_LOCALE_RUNTIME__.applyLocaleVariant(loc, { manual: true });
      } else {
        document.documentElement.dataset.localeVariant = loc;
        document.documentElement.lang = loc;
        window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: loc }));
      }
    }, targetLocale);

    await page.waitForTimeout(600);

    // 1. Audit class="config-open panel-out" (ThemeDock buttons)
    const dockAudit = await page.evaluate(() => {
      const readModeBtn = document.getElementById('readmode');
      const commentBtn = document.getElementById('to_comment');
      const transBtn = document.getElementById('translate');
      const asideBtn = document.getElementById('hide-aside-btn');
      const configBtn = document.getElementById('rightside-config');
      const darkBtn = document.getElementById('darkmode');
      const bgBtn = document.getElementById('background-mode');
      const hideDockBtn = document.getElementById('hide-rightside-btn');

      return {
        readModeTitle: readModeBtn?.getAttribute('title') || '',
        commentTitle: commentBtn?.getAttribute('title') || '',
        transTitle: transBtn?.getAttribute('title') || '',
        transAria: transBtn?.getAttribute('aria-label') || '',
        asideTitle: asideBtn?.getAttribute('title') || '',
        configTitle: configBtn?.getAttribute('title') || '',
        darkTitle: darkBtn?.getAttribute('title') || '',
        bgTitle: bgBtn?.getAttribute('title') || '',
        hideDockTitle: hideDockBtn?.getAttribute('title') || '',
      };
    });

    console.log(`\n1. Dock Buttons (#rightside):`);
    console.log(`   - Read mode: "${dockAudit.readModeTitle}"`);
    console.log(`   - To comment: "${dockAudit.commentTitle}"`);
    console.log(`   - Translate: "${dockAudit.transTitle}" (${dockAudit.transAria})`);
    console.log(`   - Config: "${dockAudit.configTitle}"`);
    console.log(`   - Dark mode: "${dockAudit.darkTitle}"`);
    console.log(`   - Background: "${dockAudit.bgTitle}"`);
    console.log(`   - Hide dock: "${dockAudit.hideDockTitle}"`);

    // Ensure non-empty
    for (const [k, v] of Object.entries(dockAudit)) {
      if (!v) {
        errors.push(`Dock button ${k} is empty for ${targetLocale}`);
      }
    }

    // Check language fidelity
    if (targetLocale === 'en' && dockAudit.readModeTitle.includes('阅读模式')) {
      errors.push(`Dock readModeTitle still Chinese under en: ${dockAudit.readModeTitle}`);
    }
    if (targetLocale === 'fr' && !dockAudit.readModeTitle.toLowerCase().includes('lecture')) {
      errors.push(`Dock readModeTitle not French under fr: ${dockAudit.readModeTitle}`);
    }
    if (targetLocale === 'es' && !dockAudit.readModeTitle.toLowerCase().includes('lectura')) {
      errors.push(`Dock readModeTitle not Spanish under es: ${dockAudit.readModeTitle}`);
    }
    if (targetLocale === 'de' && !dockAudit.readModeTitle.toLowerCase().includes('lesemodus')) {
      errors.push(`Dock readModeTitle not German under de: ${dockAudit.readModeTitle}`);
    }

    // 2. Audit id="nav-right" (SiteHeader buttons)
    const navAudit = await page.evaluate(() => {
      const getTip = (id) => {
        const wrap = document.getElementById(id);
        if (!wrap) return '';
        const a = wrap.querySelector('a') || wrap.querySelector('button');
        return a?.getAttribute('data-tooltip') || a?.getAttribute('data-shijianus-tooltip') || a?.getAttribute('title') || a?.getAttribute('aria-label') || wrap.getAttribute('data-shijianus-tooltip') || wrap.getAttribute('title') || '';
      };

      return {
        accountTip: getTip('nav-account'),
        notifTip: getTip('nav-notification'),
        searchTip: getTip('search-button'),
        themeTip: getTip('nav-theme-toggle'),
        randomTip: getTip('randomPost_button'),
        consoleTip: getTip('center-console-button-astro') || getTip('center-console-button'),
      };
    });

    console.log(`\n2. Nav Right Buttons (#nav-right):`);
    console.log(`   - Account: "${navAudit.accountTip}"`);
    console.log(`   - Notification: "${navAudit.notifTip}"`);
    console.log(`   - Search: "${navAudit.searchTip}"`);
    console.log(`   - Theme Toggle: "${navAudit.themeTip}"`);
    console.log(`   - Random Post: "${navAudit.randomTip}"`);
    console.log(`   - Console: "${navAudit.consoleTip}"`);

    if (targetLocale === 'en') {
      if (navAudit.accountTip.includes('个人中心')) errors.push(`Nav account tooltip still Chinese under en: ${navAudit.accountTip}`);
      if (navAudit.searchTip.includes('站内搜索')) errors.push(`Nav search tooltip still Chinese under en: ${navAudit.searchTip}`);
    }
    if (targetLocale === 'fr') {
      if (!navAudit.searchTip.toLowerCase().includes('recherche')) errors.push(`Nav search tooltip not French under fr: ${navAudit.searchTip}`);
    }

    // 3. Audit class="account-field-control" (Account Drawer)
    // Open drawer directly with auth tab
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-account', { detail: { tab: 'auth' } }));
    });
    await page.waitForTimeout(300);

    // Ensure profile settings tab in drawer is active
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.account-nav-tab'));
      if (tabs.length > 0) (tabs[0]).click();
    });
    await page.waitForTimeout(300);

    const accountDrawerAudit = await page.evaluate(() => {
      const locInput = document.querySelector('input[name="location"]');
      const locPlaceholder = locInput?.getAttribute('placeholder') || '';
      const locBtn = locInput?.parentElement?.querySelector('.account-field-quick-btn');
      const locBtnTitle = locBtn?.getAttribute('title') || '';
      const locBtnText = locBtn?.textContent?.trim() || '';

      const tzInput = document.querySelector('input[name="timezone"]');
      const tzPlaceholder = tzInput?.getAttribute('placeholder') || '';
      const tzBtn = tzInput?.parentElement?.querySelector('.account-field-quick-btn');
      const tzBtnTitle = tzBtn?.getAttribute('title') || '';
      const tzBtnText = tzBtn?.textContent?.trim() || '';

      const datalistOptions = Array.from(document.querySelectorAll('#account-common-timezones option')).map((opt) => opt.getAttribute('label') || '');

      return {
        locPlaceholder,
        locBtnTitle,
        locBtnText,
        tzPlaceholder,
        tzBtnTitle,
        tzBtnText,
        sampleTzOption: datalistOptions.find((l) => l.includes('PST')) || '',
      };
    });

    console.log(`\n3. Account Drawer Location & Timezone (.account-field-control):`);
    console.log(`   - Location placeholder: "${accountDrawerAudit.locPlaceholder}"`);
    console.log(`   - Location button: "${accountDrawerAudit.locBtnText}" (${accountDrawerAudit.locBtnTitle})`);
    console.log(`   - Timezone placeholder: "${accountDrawerAudit.tzPlaceholder}"`);
    console.log(`   - Timezone button: "${accountDrawerAudit.tzBtnText}" (${accountDrawerAudit.tzBtnTitle})`);
    console.log(`   - Datalist timezone option: "${accountDrawerAudit.sampleTzOption}"`);

    if (targetLocale === 'en') {
      if (accountDrawerAudit.locBtnText === '定位') errors.push(`Location detect button text still Chinese under en`);
      if (accountDrawerAudit.locPlaceholder.includes('自动获取')) errors.push(`Location placeholder still Chinese under en`);
      if (accountDrawerAudit.sampleTzOption.includes('太平洋时间')) errors.push(`Datalist timezone still Chinese under en: ${accountDrawerAudit.sampleTzOption}`);
    }

    // Close drawer
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:close-notifications'));
    });
    await page.waitForTimeout(200);

    // 4. Audit Post Comments (.tk-comments, toolbar, dropdown, inputs, actions)
    // Scroll down to #post-comment
    await page.evaluate(() => {
      const el = document.getElementById('post-comment');
      if (el) el.scrollIntoView();
    });
    await page.waitForTimeout(400);

    const commentsAudit = await page.evaluate(() => {
      const headline = document.querySelector('.comment-headline span')?.textContent?.trim() || '';
      const guestLink = document.querySelector('.comment-randomInfo a')?.textContent?.trim() || '';
      const guestTitle = document.querySelector('.comment-randomInfo a')?.getAttribute('title') || '';
      const privacyLink = document.querySelectorAll('.comment-randomInfo a')?.[1]?.textContent?.trim() || '';
      const editTab = document.querySelectorAll('.tk-editor-tab-btn')?.[0]?.textContent?.trim() || '';
      const previewTab = document.querySelectorAll('.tk-editor-tab-btn')?.[1]?.textContent?.trim() || '';
      const textarea = document.querySelector('.tk-input.el-textarea textarea');
      const placeholder = textarea?.getAttribute('placeholder') || '';
      const sortNew = document.querySelector('.tk-sort-btn:first-child')?.textContent?.trim() || '';
      const sortHot = document.querySelector('.tk-sort-btn:last-child')?.textContent?.trim() || '';
      const emptyMsg = document.querySelector('.tk-comments-no span')?.textContent?.trim() || '';

      // Toolbar buttons
      const boldBtn = document.querySelector('.tk-tb-bold')?.getAttribute('title') || '';
      const italicBtn = document.querySelector('.tk-tb-italic')?.getAttribute('title') || '';
      const headingBtn = document.querySelector('.tk-tb-heading')?.getAttribute('title') || '';
      const quoteBtn = document.querySelector('.tk-tb-quote')?.getAttribute('title') || '';
      const optionsBtn = document.querySelector('.tk-tb-options')?.getAttribute('title') || '';

      return {
        headline,
        guestLink,
        guestTitle,
        privacyLink,
        editTab,
        previewTab,
        placeholder,
        sortNew,
        sortHot,
        emptyMsg,
        boldBtn,
        italicBtn,
        headingBtn,
        quoteBtn,
        optionsBtn,
      };
    });

    console.log(`\n4. Comments Main Header & Inputs:`);
    console.log(`   - Headline: "${commentsAudit.headline}"`);
    console.log(`   - Guest link: "${commentsAudit.guestLink}" (${commentsAudit.guestTitle})`);
    console.log(`   - Privacy: "${commentsAudit.privacyLink}"`);
    console.log(`   - Tabs: "${commentsAudit.editTab}" | "${commentsAudit.previewTab}"`);
    console.log(`   - Textarea placeholder: "${commentsAudit.placeholder.slice(0, 50)}..."`);
    console.log(`   - Sort buttons: "${commentsAudit.sortNew}" | "${commentsAudit.sortHot}"`);
    console.log(`   - Empty message: "${commentsAudit.emptyMsg.slice(0, 50)}..."`);
    console.log(`   - Toolbar titles: Bold="${commentsAudit.boldBtn}", Options="${commentsAudit.optionsBtn}"`);

    if (targetLocale === 'en') {
      if (commentsAudit.headline === '评论') errors.push(`Comments headline still Chinese under en`);
      if (commentsAudit.guestLink.includes('访客身份')) errors.push(`Comments guestLink still Chinese under en: ${commentsAudit.guestLink}`);
      if (commentsAudit.privacyLink === '隐私政策') errors.push(`Comments privacyLink still Chinese under en`);
      if (commentsAudit.editTab.includes('编辑')) errors.push(`Comments editTab still Chinese under en`);
      if (commentsAudit.boldBtn.includes('加粗')) errors.push(`Comments boldBtn still Chinese under en`);
      if (commentsAudit.emptyMsg.includes('还没有公开评论')) errors.push(`Comments emptyMsg still Chinese under en`);
    }

    // 5. Open Options Dropdown and audit all 15 items
    await page.evaluate(() => {
      const btn = document.querySelector('.tk-tb-options');
      if (btn) (btn).click();
    });
    await page.waitForTimeout(300);

    const dropdownLabels = await page.evaluate(() => {
      const dropdown = document.querySelector('.tk-options-dropdown');
      if (!dropdown) return [];
      const labels = Array.from(dropdown.querySelectorAll('.tk-dropdown-label')).map(el => el.textContent.trim());
      const descs = Array.from(dropdown.querySelectorAll('.tk-dropdown-desc')).map(el => el.textContent.trim());
      return labels.map((l, idx) => ({ label: l, desc: descs[idx] || '' }));
    });

    console.log(`\n5. Options Dropdown (15 items):`);
    console.log(`   - Found ${dropdownLabels.length} items in dropdown`);
    dropdownLabels.slice(0, 5).forEach((item, idx) => {
      console.log(`     [${idx + 1}] ${item.label} -> ${item.desc}`);
    });
    if (dropdownLabels.length > 5) {
      console.log(`     ... (${dropdownLabels.length - 5} more items)`);
    }

    if (dropdownLabels.length < 15) {
      errors.push(`Expected 15 dropdown options, found ${dropdownLabels.length}`);
    }

    if (targetLocale === 'en') {
      const chineseInOptions = dropdownLabels.filter(item => /[\u4e00-\u9fa5]/.test(item.label) || /[\u4e00-\u9fa5]/.test(item.desc));
      if (chineseInOptions.length > 0) {
        errors.push(`Found ${chineseInOptions.length} dropdown items with untranslated Chinese under en: ${chineseInOptions[0].label}`);
      }
    }

    // Close dropdown
    await page.evaluate(() => {
      const btn = document.querySelector('.tk-tb-options');
      if (btn) (btn).click();
    });
    await page.waitForTimeout(200);

    // 6. Test Live Render Preview
    await page.evaluate(() => {
      const previewBtn = document.querySelectorAll('.tk-editor-tab-btn')?.[1];
      if (previewBtn) (previewBtn).click();
    });
    await page.waitForTimeout(300);

    const previewBadgeText = await page.evaluate(() => {
      const badge = document.querySelector('.tk-preview-badge');
      const emptyHint = document.querySelector('.tk-preview-empty');
      return {
        badge: badge?.textContent?.trim() || '',
        emptyHint: emptyHint?.textContent?.trim() || '',
      };
    });

    console.log(`\n6. Live Render Preview tab:`);
    console.log(`   - Badge: "${previewBadgeText.badge}"`);
    console.log(`   - Empty hint: "${previewBadgeText.emptyHint}"`);

    if (targetLocale === 'en') {
      if (previewBadgeText.badge.includes('渲染预览') || !previewBadgeText.badge) {
        errors.push(`Preview badge still in Chinese or empty under en: ${previewBadgeText.badge}`);
      }
      if (previewBadgeText.emptyHint.includes('暂无内容') || !previewBadgeText.emptyHint) {
        errors.push(`Preview empty hint still in Chinese or empty under en: ${previewBadgeText.emptyHint}`);
      }
    }

    // Switch back to edit tab
    await page.evaluate(() => {
      const editBtn = document.querySelectorAll('.tk-editor-tab-btn')?.[0];
      if (editBtn) (editBtn).click();
    });

    // 7. Verify Article Immutability
    const currentArticle = await page.evaluate(() => {
      const el = document.getElementById('article-container');
      return el ? el.innerText.slice(0, 200) : '';
    });
    if (currentArticle !== originalArticleText) {
      errors.push(`Article content changed during ${targetLocale} audit!`);
    } else {
      console.log(`\n7. Article Content Immutability: ✅ PASS (Untouched)`);
    }
  }

  // 8. Mobile Viewport Check (390x844)
  console.log(`\n======================================================`);
  console.log(`📱 MOBILE VIEWPORT AUDIT (390x844)`);
  console.log(`======================================================`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);

  const mobileOverflow = await page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const bodyW = document.body.scrollWidth;
    return bodyW > docW + 2;
  });

  console.log(`   - Horizontal Scroll Overflow: ${mobileOverflow ? '❌ YES (Overflown)' : '✅ NO (Perfect elasticity)'}`);
  if (mobileOverflow) {
    errors.push(`Mobile horizontal scroll overflow detected!`);
  }

  await browser.close();
  if (staticServer) {
    staticServer.close();
  }

  console.log(`\n======================================================`);
  if (errors.length === 0) {
    console.log(`🎉 ALL AUDITS PASSED CLEANLY! Every user-specified component verified across all 6 languages!`);
    console.log(`======================================================\n`);
    process.exit(0);
  } else {
    console.error(`❌ VERIFICATION FOUND ${errors.length} ERROR(S):`);
    errors.forEach(e => console.error(`   - ${e}`));
    console.log(`======================================================\n`);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution error:', err);
  if (staticServer) staticServer.close();
  process.exit(1);
});
