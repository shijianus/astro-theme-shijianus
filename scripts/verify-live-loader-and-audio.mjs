import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const PROD_URL = 'https://blog.epocanvas.com';

async function verifyLive() {
  console.log(`🌐 [Live Verification] 对生产域名 ${PROD_URL} 进行加载过场与音频提示验收...`);

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // 1. 验证生产环境 /lab/ 首次过场与子页面无重复过场
    console.log('\n🎬 [Step 1] 测试线上 /lab/ 首次加载过场与详情页无过场...');
    await page.goto(`${PROD_URL}/lab/`, { waitUntil: 'domcontentloaded' });

    // 等待加载过场平滑完成
    await page.waitForFunction(() => {
      return document.documentElement.classList.contains('theme-ready') && !document.getElementById('loading-box');
    }, null, { timeout: 6000 });
    console.log('  -> 线上 /lab/ 首次进站：过场顺畅完成，#loading-box 自动清理！');

    // 验证 sessionStorage 标记已写入
    const seenFlag = await page.evaluate(() => sessionStorage.getItem('shijianus-loader-seen'));
    assert.equal(seenFlag, 'true', '线上 sessionStorage 必须写入 shijianus-loader-seen=true');

    // 跳转至详情页 /lab/star-trails-simulator/
    console.log('  -> 从线上 /lab/ 跳转至详情页...');
    await page.click('a[href="/lab/star-trails-simulator/"]');
    await page.waitForURL('**/lab/star-trails-simulator/**');
    const hasLoaderInDetail = await page.evaluate(() => Boolean(document.getElementById('loading-box')));
    assert.equal(hasLoaderInDetail, false, '线上详情页严禁出现 loading-box');
    console.log('  -> 线上详情页验证通过：零 loading-box，秒开进入！');

    // 从详情页返回 /lab/
    console.log('  -> 从详情页返回 /lab/ 广场...');
    await page.click('.crumb-back');
    await page.waitForURL('**/lab/**');
    const hasLoaderOnReturn = await page.evaluate(() => Boolean(document.getElementById('loading-box')));
    assert.equal(hasLoaderOnReturn, false, '返回 /lab/ 时严禁再次展示 loading-box');
    console.log('  -> 线上返回 /lab/ 验证通过：零二次过场，无缝秒开！');

    // 2. 验证生产环境音频加载失败提示
    console.log('\n🎵 [Step 2] 测试线上音频加载失败提示会话级控制...');
    // 在 /lab/ 下触发 audio error
    const toastInLab = await page.evaluate(() => {
      const audio = document.querySelector('audio');
      if (audio) {
        audio.dispatchEvent(new Event('error'));
      }
      const bar = document.getElementById('global-activity-bar');
      const msg = document.getElementById('global-activity-message')?.innerText || '';
      return bar?.classList.contains('show') && msg.includes('音频');
    });
    assert.equal(toastInLab, false, '线上 /lab/ 分界面严禁弹出音频错误提示');
    console.log('  -> 线上 /lab/ 验证通过：零音频弹窗打扰！');

    // 跳转至根目录 /
    console.log('  -> 跳转至线上根目录 /...');
    await page.goto(`${PROD_URL}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => sessionStorage.removeItem('shijianus_audio_error_toast_shown'));

    console.log('  -> 首次在根目录触发 audio error...');
    await page.evaluate(() => {
      const audio = document.querySelector('audio');
      if (audio) {
        audio.dispatchEvent(new Event('error'));
      }
    });
    await page.waitForTimeout(400);

    const isLocked = await page.evaluate(() => {
      return sessionStorage.getItem('shijianus_audio_error_toast_shown') === 'true';
    });
    assert.equal(isLocked, true, '线上根目录初次触发后必须锁定');
    console.log('  -> 线上根目录初次触发成功，并已在会话中锁定！');

    console.log('  -> 再次在根目录触发 audio error (验证拦截)...');
    const intercepted = await page.evaluate(() => {
      const audio = document.querySelector('audio');
      let called = false;
      const origSnackbar = window.snackbarShow;
      window.snackbarShow = (...args) => {
        called = true;
        if (typeof origSnackbar === 'function') origSnackbar(...args);
      };
      if (audio) {
        audio.dispatchEvent(new Event('error'));
      }
      return !called;
    });
    assert.equal(intercepted, true, '同会话内二次触发必须被完全拦截');
    console.log('  -> 线上二次触发拦截验证通过：绝对不重复弹出！');

    console.log('\n🎉 [Live Verification] 线上生产环境验收全量 100% 通过！');
    await context.close();
  } finally {
    await browser.close();
  }
}

verifyLive().catch((err) => {
  console.error('❌ [Live Verification] 线上验收失败:', err);
  process.exit(1);
});
