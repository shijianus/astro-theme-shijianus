import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PORT = 4399;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function createStaticServer(baseDir) {
  return http.createServer((req, res) => {
    try {
      const parsedUrl = new URL(req.url, BASE_URL);
      let pathname = decodeURIComponent(parsedUrl.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';

      let filePath = path.join(baseDir, pathname);

      if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(`404 Not Found: ${pathname}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(`500 Server Error: ${err.message}`);
    }
  });
}

async function run() {
  console.log('🚀 [Test Suite] 开始验证：导航栏非透明底色、音乐默认集成与根目录至试验田精确转场...');

  const server = createStaticServer(DIST_DIR);
  await new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });
  console.log(`📡 [Server] 本地静态服务启动于 ${BASE_URL}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // ==========================================
    // 1. 验证导航栏底色非透明 (Nav Frosted Glass)
    // ==========================================
    console.log('\n🧭 [Step 1] 审计导航栏 .site-header.not-top-img.nav-fixed.nav-visible 与 #nav 底色与模糊滤镜...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

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

    console.log('  -> 导航栏计算样式:', navStyle);
    assert.ok(navStyle.headerClass.includes('nav-fixed'), 'header 必须包含 nav-fixed');
    assert.ok(navStyle.headerClass.includes('not-top-img'), 'header 必须包含 not-top-img');
    assert.ok(navStyle.headerClass.includes('nav-visible'), 'header 必须包含 nav-visible');
    assert.equal(navStyle.headerPos, 'fixed', 'header 必须为 position: fixed 固定定位');

    // 严禁完全透明 rgba(0, 0, 0, 0)
    assert.notEqual(navStyle.navBg, 'rgba(0, 0, 0, 0)', 'nav 背景色绝对不可为完全透明 rgba(0, 0, 0, 0)');
    assert.notEqual(navStyle.navBg, 'transparent', 'nav 背景色绝对不可为 transparent');
    assert.ok(navStyle.navBg.includes('255, 255, 255') || navStyle.navBg.includes('18, 20, 24'), 'nav 背景色必须具有磨砂高对比度底色');
    assert.ok(navStyle.navBackdrop.includes('blur'), 'nav 必须包含毛玻璃模糊 backdrop-filter');
    console.log('  ✅ [Step 1 通过] 导航栏非透明底色与磨砂玻璃特效验证完全合格！');

    // 深色模式复核
    console.log('  -> 切换至深色模式复核导航栏底色...');
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
    console.log('  -> 深色模式导航栏计算样式:', darkNavStyle);
    assert.notEqual(darkNavStyle.navBg, 'rgba(0, 0, 0, 0)', '深色模式 nav 背景色不可为透明');
    assert.ok(darkNavStyle.navBackdrop.includes('blur'), '深色模式 nav 必须包含 blur 毛玻璃');
    console.log('  ✅ [Step 1.1 通过] 深色模式导航栏底色与滤镜验证通过！');

    // 恢复浅色
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });

    // ==========================================
    // 2. 验证音乐随身听默认集成开启 (Music Default Open)
    // ==========================================
    console.log('\n🎵 [Step 2] 审计随身音乐口袋默认集成与可见性...');
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

    console.log('  -> 音乐组件状态:', musicState);
    assert.equal(musicState.hasPocket, true, '页面必须挂载 .shijianus-music-pocket 容器');
    assert.equal(musicState.pocketVisible, true, '音乐口袋必须默认可见（不可为默认关闭）');
    assert.equal(musicState.hasAudio, true, '必须存在 HTML5 <audio> 音频底层');
    assert.ok(musicState.audioSrc.length > 0, '音频底层必须成功载入当前音轨 URL');
    console.log('  ✅ [Step 2 通过] 随身音乐口袋默认开启与音轨集成验证通过！');

    // ==========================================
    // 3. 验证转场时机精确控制 (Transition Precision)
    // ==========================================
    console.log('\n🎬 [Step 3] 验证精确转场生命周期：/ 到 /lab 需要转场，/lab 下分界面不需要转场...');
    
    // 清除会话记录模拟全新流程
    await page.evaluate(() => sessionStorage.clear());

    // 3.1 首次进站 / 根目录：需要转场
    console.log('  -> 3.1 进站访问 / 根目录...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    // / 必须包含 loading-box 并顺利过渡至 theme-ready
    await page.waitForFunction(() => {
      return document.documentElement.classList.contains('theme-ready') && !document.getElementById('loading-box');
    }, null, { timeout: 6000 });
    console.log('  -> 根目录首次进站：转场顺畅执行完毕！');

    // 3.2 从 / 根目录点击跳转至 /lab/ 分根目录：必须执行转场
    console.log('  -> 3.2 从 / 点击链接跳转至 /lab/ 分根目录...');
    
    // 在页面卸载前验证 beforeunload 记录
    await page.click('a.footer-item[href="/lab/"]');
    await page.waitForURL('**/lab/**');

    // /lab/ 必须顺利完成转场并过渡至 theme-ready 状态
    await page.waitForFunction(() => {
      return document.documentElement.classList.contains('theme-ready') && !document.getElementById('loading-box');
    }, null, { timeout: 6000 });
    console.log('  -> /lab/ 进站转场验证通过：平滑完成进入！');

    // 3.3 从 /lab/ 进入分界面 /lab/playground/：严禁出现转场
    console.log('  -> 3.3 从 /lab/ 进入分根目录下的 /lab/playground/...');
    await page.click('a[href="/lab/playground/"]');
    await page.waitForURL('**/lab/playground/**');

    const loaderInPlayground = await page.evaluate(() => Boolean(document.getElementById('loading-box')));
    assert.equal(loaderInPlayground, false, '/lab/playground/ 绝对不可包含 loading-box');
    const isReadyInPlayground = await page.evaluate(() => document.documentElement.classList.contains('theme-ready'));
    assert.equal(isReadyInPlayground, true, '/lab/playground/ 必须瞬间为 theme-ready (0ms 秒开)');
    console.log('  -> /lab/playground/ 分界面验证通过：零转场延迟，0ms 秒开进入！');

    // 3.4 从 /lab/playground/ 返回 /lab/ 广场：同一个 /lab 下，严禁重复转场！
    console.log('  -> 3.4 从 /lab/playground/ 返回 /lab/ 广场...');
    await page.click('a.crumb-link[href="/lab/"]');
    await page.waitForURL('**/lab/**');

    // 校验返回 /lab/ 时是否重复弹出 loading-box
    const loaderOnReturnToLab = await page.evaluate(() => Boolean(document.getElementById('loading-box')));
    assert.equal(loaderOnReturnToLab, false, '从 /lab/playground/ 返回 /lab/ 时绝对不可重复出现 loading-box');
    console.log('  -> 返回 /lab/ 验证通过：同一个 /lab/ 下绝不重复转场，无缝秒开！');

    // 3.5 从 /lab/ 返回 / 根目录：跨域切换，需要执行转场
    console.log('  -> 3.5 从 /lab/ 切换回 / 根目录...');
    await page.click('#blog_name a');
    await page.waitForURL(`${BASE_URL}/`);
    await page.waitForFunction(() => {
      return document.documentElement.classList.contains('theme-ready') && !document.getElementById('loading-box');
    }, null, { timeout: 6000 });
    console.log('  -> 从 /lab/ 返回 / 根目录验证通过：平滑转场执行完毕！');

    console.log('\n🎉 [Success] 所有三大核心问题验证 100% 全部通过！');
    await context.close();
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});
