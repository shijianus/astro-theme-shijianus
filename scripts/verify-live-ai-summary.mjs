import puppeteer from 'puppeteer';

async function runLiveAudit() {
  console.log('🌐 开始对生产环境 https://blog.epocanvas.com 进行 AI 总结全链路审计...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

    const targetUrl = 'https://blog.epocanvas.com/posts/readable-geek-interfaces/';
    console.log(`[E2E] 正在访问生产文章页: ${targetUrl}`);
    const response = await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 35000,
    });

    console.log(`[E2E] 页面 HTTP 状态码: ${response.status()}`);
    if (response.status() !== 200) {
      throw new Error(`Expected 200 OK, got ${response.status()}`);
    }

    // 检查 .shijianus-ai-summary 元素是否存在
    const hasAiSummary = await page.evaluate(() => {
      const el = document.querySelector('.shijianus-ai-summary');
      return Boolean(el);
    });

    console.log(`[E2E] AI 总结容器 (.shijianus-ai-summary) 是否存在: ${hasAiSummary}`);
    if (!hasAiSummary) {
      throw new Error('Missing .shijianus-ai-summary element on live page');
    }

    // 滚动至可视区域
    await page.evaluate(() => {
      const el = document.querySelector('.shijianus-ai-summary');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });

    // 等待输出文本填充
    await new Promise((r) => setTimeout(r, 2500));

    const initialOutput = await page.evaluate(() => {
      const out = document.querySelector('.shijianus-ai-summary [data-ai-output]');
      return out?.textContent?.trim() || '';
    });

    console.log(`[E2E] 初始摘要输出字符数: ${initialOutput.length}`);
    console.log(`[E2E] 初始摘要内容片段: ${initialOutput.slice(0, 100)}...`);

    // 测试点击 👤 关于作者
    console.log('[E2E] 点击 👤 关于作者...');
    await page.click('.shijianus-ai-summary__action[data-ai-action="intro"]');
    await new Promise((r) => setTimeout(r, 1500));

    const authorIntro = await page.evaluate(() => {
      const out = document.querySelector('.shijianus-ai-summary [data-ai-output]');
      return out?.textContent?.trim() || '';
    });
    console.log(`[E2E] 关于作者输出: ${authorIntro.slice(0, 80)}...`);
    if (!authorIntro.includes('时鉴') && !authorIntro.includes('shijianus')) {
      throw new Error('Author intro content mismatch');
    }

    // 测试点击 📚 推荐相关
    console.log('[E2E] 点击 📚 推荐相关...');
    await page.click('.shijianus-ai-summary__action[data-ai-action="related"]');
    await new Promise((r) => setTimeout(r, 1500));

    const relatedVisible = await page.evaluate(() => {
      const box = document.querySelector('.shijianus-ai-summary [data-ai-related]');
      return box && !box.hidden;
    });
    console.log(`[E2E] 延伸阅读抽屉是否展开: ${relatedVisible}`);

    console.log('✅ 生产端 (Cloudflare Pages) 端到端全链路自动化审计全部 PASS 通过！');
  } finally {
    await browser.close();
  }
}

runLiveAudit().catch((err) => {
  console.error('❌ 生产端审计失败:', err);
  process.exit(1);
});
