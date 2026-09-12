import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('verification-screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runHighTierAudit() {
  console.log('🚀 开始对生产环境进行真实 high 档位与视觉深度端到端审计...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  let liveAiResponse = null;
  let liveAiRequestPayload = null;

  // 监听所有网络请求与响应
  page.on('request', (req) => {
    if (req.url().includes('/api/ai-summary') && req.method() === 'POST') {
      try {
        liveAiRequestPayload = JSON.parse(req.postData() || '{}');
        console.log('[Network] 捕获前端向 /api/ai-summary 发出的请求 Payload:');
        console.log('  - title:', liveAiRequestPayload.title);
        console.log('  - mode:', liveAiRequestPayload.mode);
        console.log('  - 正文总长度:', liveAiRequestPayload.content?.length);
      } catch {}
    }
  });

  page.on('response', async (res) => {
    if (res.url().includes('/api/ai-summary') && res.request().method() === 'POST') {
      try {
        liveAiResponse = await res.json();
        console.log('[Network] 捕获 /api/ai-summary 响应体 Payload:');
        console.log('  - ok:', liveAiResponse.ok);
        console.log('  - level (关键指标):', liveAiResponse.level);
        console.log('  - model:', liveAiResponse.model);
        console.log('  - summary 长度:', liveAiResponse.summary?.length);
        console.log('  - summary 预览:', liveAiResponse.summary?.slice(0, 100) + '...');
      } catch (err) {
        console.log('[Network Error] 解析响应失败:', err?.message);
      }
    }
  });

  const targetUrl = 'https://blog.epocanvas.com/posts/readable-geek-interfaces/';
  console.log(`[Playwright] 访问线上生产文章: ${targetUrl}`);
  const navResponse = await page.goto(targetUrl, {
    waitUntil: 'networkidle',
    timeout: 45000,
  });

  console.log(`[Playwright] 页面状态码: ${navResponse?.status()}`);

  // 验证 .shijianus-ai-summary 元素
  const aiPanel = page.locator('.shijianus-ai-summary');
  await aiPanel.waitFor({ state: 'visible', timeout: 15000 });
  await aiPanel.scrollIntoViewIfNeeded();
  console.log('[Playwright] .shijianus-ai-summary 已滚动进入视口居中');

  // 等待打字效果
  await page.waitForTimeout(3000);

  // 1. 截图生产端视觉效果
  const screenshotPath = path.join(outDir, 'live-high-tier-ai-summary.png');
  await aiPanel.screenshot({ path: screenshotPath });
  console.log(`[Visual] 生产端视觉截图已保存: ${screenshotPath}`);

  // 2. 验证前端输出框内容
  const outputText = await page.locator('.shijianus-ai-summary [data-ai-output]').textContent();
  console.log(`[DOM] 当前摘要输出字符数: ${outputText?.trim().length}`);
  console.log(`[DOM] 当前摘要内容: ${outputText?.trim()}`);

  // 3. 触发真实点击：切换至 InstanceAI 模式进行实时高档位推演
  console.log('\n[Playwright] 点击切换模式按钮 (切换至 InstanceAI 实时推演)...');
  const switchBtn = page.locator('[data-ai-switch-mode]');
  await switchBtn.click();
  await page.waitForTimeout(800);

  const modeLabel = await page.locator('[data-ai-mode-label]').textContent();
  console.log(`[DOM] 当前模式标签: ${modeLabel}`);

  if (modeLabel?.includes('InstanceAI')) {
    console.log('[Playwright] 已切至 InstanceAI，等待思考链与高档位模型推演...');
    // 等待接口响应
    await page.waitForTimeout(6000);

    const instanceOutput = await page.locator('.shijianus-ai-summary [data-ai-output]').textContent();
    console.log(`[DOM] InstanceAI 生成结果长度: ${instanceOutput?.trim().length}`);
    console.log(`[DOM] InstanceAI 生成结果: ${instanceOutput?.trim().slice(0, 120)}...`);

    const instanceScreenshotPath = path.join(outDir, 'live-high-tier-instance-ai.png');
    await aiPanel.screenshot({ path: instanceScreenshotPath });
    console.log(`[Visual] InstanceAI 视觉截图已保存: ${instanceScreenshotPath}`);
  }

  // 4. 测试点击 💡 核心论点
  console.log('\n[Playwright] 点击 💡 核心论点 按钮...');
  const pointBtn = page.locator('.shijianus-ai-summary__action[data-ai-action="point"]');
  await pointBtn.click();
  await page.waitForTimeout(4000);

  const pointOutput = await page.locator('.shijianus-ai-summary [data-ai-output]').textContent();
  console.log(`[DOM] 核心论点解答: ${pointOutput?.trim().slice(0, 100)}...`);

  // 5. 验证后端网络真实 level
  // 直接通过 POST 请求验证生产端 Functions 的真实响应
  console.log('\n[Live API] 向生产环境真实 /api/ai-summary 发送直接验证请求...');
  const apiTestResponse = await page.request.post('https://blog.epocanvas.com/api/ai-summary', {
    data: {
      slug: 'readable-geek-interfaces',
      title: '极客感界面为什么更需要可读性',
      summary: '技术气质不是靠发光边框堆出来的，真正让界面成立的是信息层级和阅读节奏。',
      content: '测试高档位全量知识库传递：' + '极客感界面的核心是信息可读性与工程秩序。'.repeat(50),
      mode: 'instance',
    },
  });

  console.log(`[Live API] 响应 HTTP 状态码: ${apiTestResponse.status()}`);
  const liveJson = await apiTestResponse.json();
  console.log('[Live API] 响应详情:', {
    ok: liveJson.ok,
    level: liveJson.level,
    model: liveJson.model,
    summaryLength: liveJson.summary?.length,
  });

  if (liveJson.level !== 'high') {
    console.warn(`⚠️ 警告: 预期 level 为 high，当前返回 ${liveJson.level}`);
  } else {
    console.log('🎉 生产端真实 level 经校验 100% 确认为 high 档位！');
  }

  await browser.close();
  console.log('\n✅ 生产端 Playwright 视觉与实际调用审计圆满完成！');
}

runHighTierAudit().catch((err) => {
  console.error('❌ 审计过程发生错误:', err);
  process.exit(1);
});
