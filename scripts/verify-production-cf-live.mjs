import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const TARGET_URL = process.env.TEST_URL || 'https://blog.epocanvas.com';

async function run() {
  console.log(`🚀 [Production Verification] 开始对生产环境 ${TARGET_URL} 进行严密核验...`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 EpoCanvas-Inspector/1.0',
    });
    const page = await context.newPage();

    // 收集所有控制台输出与网络请求
    const consoleLogs = [];
    const pageErrors = [];
    page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // ==========================================
    // 1. 生产环境导航栏底色非透明与毛玻璃核验
    // ==========================================
    console.log('\n🧭 [Check 1] 校验生产环境导航栏 .site-header.not-top-img.nav-fixed.nav-visible 与 #nav 磨砂底色...');
    await page.goto(`${TARGET_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });

    const navStyle = await page.evaluate(() => {
      const header = document.getElementById('page-header');
      const nav = document.getElementById('nav');
      const csHeader = window.getComputedStyle(header);
      const csNav = window.getComputedStyle(nav);
      return {
        headerClass: header?.className || '',
        headerPos: csHeader.position,
        navBg: csNav.backgroundColor,
        navBackdrop: csNav.backdropFilter || csNav.webkitBackdropFilter || csNav.getPropertyValue('backdrop-filter') || csNav.getPropertyValue('-webkit-backdrop-filter') || '',
        navBorderBottom: csNav.borderBottom,
        navBoxShadow: csNav.boxShadow,
      };
    });

    console.log('  -> 线上导航栏计算样式:', navStyle);
    assert.ok(navStyle.headerClass.includes('nav-fixed'), '线上 header 必须包含 nav-fixed');
    assert.ok(navStyle.headerClass.includes('not-top-img'), '线上 header 必须包含 not-top-img');
    assert.ok(navStyle.headerClass.includes('nav-visible'), '线上 header 必须包含 nav-visible');
    assert.equal(navStyle.headerPos, 'fixed', '线上 header 必须为 position: fixed 固定定位');

    // 严禁完全透明 rgba(0, 0, 0, 0)
    assert.notEqual(navStyle.navBg, 'rgba(0, 0, 0, 0)', '线上 nav 背景色绝对不可为完全透明 rgba(0, 0, 0, 0)');
    assert.notEqual(navStyle.navBg, 'transparent', '线上 nav 背景色绝对不可为 transparent');
    assert.ok(navStyle.navBg.includes('255, 255, 255') || navStyle.navBg.includes('18, 20, 24'), '线上 nav 背景色必须具有磨砂高对比度底色');
    assert.ok(navStyle.navBackdrop.includes('blur'), '线上 nav 必须包含毛玻璃模糊 backdrop-filter');
    console.log('  ✅ [Check 1 通过] 生产环境导航栏非透明磨砂底色核验 100% 达标！');

    // 深色模式核验
    console.log('  -> 切换生产环境至深色模式复核导航栏底色...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    const darkNavStyle = await page.evaluate(() => {
      const nav = document.getElementById('nav');
      const cs = window.getComputedStyle(nav);
      return {
        navBg: cs.backgroundColor,
        navBackdrop: cs.backdropFilter || cs.webkitBackdropFilter || cs.getPropertyValue('backdrop-filter') || cs.getPropertyValue('-webkit-backdrop-filter') || '',
      };
    });
    console.log('  -> 线上深色模式导航栏计算样式:', darkNavStyle);
    assert.notEqual(darkNavStyle.navBg, 'rgba(0, 0, 0, 0)', '线上深色模式 nav 背景色不可为透明');
    assert.ok(darkNavStyle.navBackdrop.includes('blur'), '线上深色模式 nav 必须包含 blur 毛玻璃');
    console.log('  ✅ [Check 1.1 通过] 生产环境深色模式导航栏底色与滤镜核验通过！');

    // 恢复浅色模式
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });

    // ==========================================
    // 2. 生产环境随身音乐口袋默认开启与音轨集成核验
    // ==========================================
    console.log('\n🎵 [Check 2] 校验生产环境随身音乐口袋默认开启与音轨集成...');
    const musicState = await page.evaluate(() => {
      const pocket = document.querySelector('.shijianus-music-pocket');
      const audio = document.querySelector('audio');
      const toggleBtn = document.getElementById('toggle-music-pocket');
      return {
        hasPocket: Boolean(pocket),
        pocketVisible: pocket ? window.getComputedStyle(pocket).display !== 'none' : false,
        hasAudio: Boolean(audio),
        audioSrc: audio ? audio.src : '',
        toggleBtnActive: toggleBtn?.classList.contains('is-active') ?? false,
      };
    });

    console.log('  -> 线上音乐口袋状态:', musicState);
    assert.equal(musicState.hasPocket, true, '线上页面必须挂载 .shijianus-music-pocket');
    assert.equal(musicState.pocketVisible, true, '线上音乐口袋必须默认可见（不可默认隐藏）');
    assert.equal(musicState.hasAudio, true, '线上必须存在 HTML5 <audio> 音频底层');
    assert.ok(musicState.audioSrc.length > 0, '线上音频底层必须成功载入音轨 URL');
    console.log('  ✅ [Check 2 通过] 生产环境音乐口袋默认集成开启核验通过！');

    // ==========================================
    // 3. 生产环境精准域转场流转核验
    // ==========================================
    console.log('\n🎬 [Check 3] 校验生产环境转场生命周期（/ 到 /lab 转场，/lab 下分界面 0ms 秒开）...');

    // 清理 sessionStorage 模拟全新进站
    await page.evaluate(() => sessionStorage.clear());

    // 3.1 首次进站 / 根目录
    console.log('  -> 3.1 进站访问生产主域名 /...');
    await page.goto(`${TARGET_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      return document.documentElement.classList.contains('theme-ready') && !document.getElementById('loading-box');
    }, null, { timeout: 10000 });
    console.log('  -> 生产根目录首次进站：转场平滑完成并进入 theme-ready！');

    // 3.2 从 / 根目录跳转至 /lab/ 试验田
    console.log('  -> 3.2 从生产根目录点击跳转至 /lab/ 试验田...');
    await page.click('a.footer-item[href="/lab/"]');
    await page.waitForURL('**/lab/**');
    await page.waitForFunction(() => {
      return document.documentElement.classList.contains('theme-ready') && !document.getElementById('loading-box');
    }, null, { timeout: 10000 });
    console.log('  -> 生产 /lab/ 跨域转场验证通过：平滑完成仪式感转场！');

    // 3.3 从 /lab/ 进入分根目录下的 /lab/playground/
    console.log('  -> 3.3 从 /lab/ 进入 /lab/playground/ 子界面...');
    await page.click('a[href="/lab/playground/"]');
    await page.waitForURL('**/lab/playground/**');

    const loaderInPlayground = await page.evaluate(() => Boolean(document.getElementById('loading-box')));
    assert.equal(loaderInPlayground, false, '线上 /lab/playground/ 绝对不可包含 loading-box 遮罩');
    const isReadyInPlayground = await page.evaluate(() => document.documentElement.classList.contains('theme-ready'));
    assert.equal(isReadyInPlayground, true, '线上 /lab/playground/ 必须瞬间为 theme-ready (0ms 秒开)');
    console.log('  -> 生产 /lab/playground/ 核验通过：0ms 瞬间秒开，零转场延迟！');

    // 3.4 从 /lab/playground/ 返回 /lab/ 广场：同一个 /lab 下，绝不重复转场！
    console.log('  -> 3.4 从 /lab/playground/ 返回 /lab/ 广场...');
    await page.click('a.crumb-link[href="/lab/"]');
    await page.waitForURL('**/lab/**');

    const loaderOnReturnToLab = await page.evaluate(() => Boolean(document.getElementById('loading-box')));
    assert.equal(loaderOnReturnToLab, false, '线上从 /lab/playground/ 返回 /lab/ 时绝对不可重复出现 loading-box');
    console.log('  -> 生产返回 /lab/ 核验通过：同一个 /lab/ 域绝不重复加载！');

    // 3.5 从 /lab/ 返回 / 根目录：跨域切换，平滑转场
    console.log('  -> 3.5 从 /lab/ 返回 / 根目录...');
    await page.click('#blog_name a');
    await page.waitForURL(`${TARGET_URL}/`);
    await page.waitForFunction(() => {
      return document.documentElement.classList.contains('theme-ready') && !document.getElementById('loading-box');
    }, null, { timeout: 10000 });
    console.log('  -> 生产返回 / 根目录核验通过：跨域平滑转场执行完毕！');

    console.log('\n🎉 [Production All Green] 生产环境真实全链路 100% 严密核验通过！');
    await context.close();
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ 生产环境核验失败:', err);
  process.exit(1);
});
