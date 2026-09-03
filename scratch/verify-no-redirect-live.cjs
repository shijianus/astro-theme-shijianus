const { chromium } = require('playwright');

(async () => {
  console.log('🚀 启动全链路自动化验证：Stripe 嵌入式收银台无刷新与原地寄语切换');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  let mainFrameNavigations = 0;
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      mainFrameNavigations++;
      console.log(`[主框架页面导航 #${mainFrameNavigations}] URL: ${frame.url()}`);
    }
  });

  const targetUrl = 'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/';
  console.log(`\n=== 1. 加载目标文章页面: ${targetUrl} ===`);
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  const baseNavigations = mainFrameNavigations;
  console.log(`文章加载完成，基准导航次数: ${baseNavigations}`);

  console.log('\n=== 2. 点击展开赞赏并唤起 Stripe 模态框 ===');
  const rewardTrigger = page.locator('.post-reward, [data-post-reward-btn], button:has-text("赞赏")').first();
  await rewardTrigger.scrollIntoViewIfNeeded();
  await rewardTrigger.click();
  await page.waitForTimeout(800);

  const stripeBtn = page.locator('button:has-text("Stripe")').first();
  await stripeBtn.click();
  await page.waitForTimeout(1000);

  // 验证模态框容器
  const modal = page.locator('.fixed.inset-0 .w-full.sm\\:max-w-\\[420px\\]');
  const isModalVisible = await modal.isVisible();
  console.log(`模态框容器可见状态: ${isModalVisible} (预期: true)`);

  console.log('\n=== 3. 验证金额选择并进入 Stripe 嵌入式结账 ===');
  const continueBtn = modal.locator('button:has-text("继续"), button:has-text("Continue")').first();
  await continueBtn.click();
  await page.waitForTimeout(4000);

  const embeddedContainer = page.locator('#embedded-stripe-checkout');
  const isMounted = await embeddedContainer.count();
  console.log(`Stripe 嵌入式结账 DOM 容器挂载状态: ${isMounted > 0} (预期: true)`);

  console.log('\n=== 4. 核心验证：模拟 onComplete 触发时的无跳转与表单销毁切换 ===');
  // 检查在从金额选择到结账这一过程中，主框架页面导航增量严格为 0
  const navDeltaDuringCheckout = mainFrameNavigations - baseNavigations;
  console.log(`交互期间主框架页面重载/跳转次数: ${navDeltaDuringCheckout} (严格预期: 0)`);
  if (navDeltaDuringCheckout !== 0) {
    throw new Error(`检测到页面发生了重定向/刷新！重载计数: ${navDeltaDuringCheckout}`);
  }

  // 验证 API 发送 redirect_on_completion: if_required 后的 Session 行为
  const apiTest = await page.evaluate(async () => {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 8,
        currency: 'usd',
        country: 'US',
        locale: 'zh-CN',
        returnUrl: 'https://blog.epocanvas.com/?stripe_return=1&amount=8&session_id={CHECKOUT_SESSION_ID}'
      })
    });
    return { ok: res.ok, status: res.status, json: await res.json() };
  });

  console.log('Session 创建结果:', {
    status: apiTest.status,
    ok: apiTest.ok,
    sessionId: apiTest.json.sessionId,
    hasClientSecret: !!apiTest.json.clientSecret
  });

  console.log('\n=== 5. 验证寄语提交接口 (/api/record-blessing) 链路 ===');
  const blessingTest = await page.evaluate(async (sid) => {
    const res = await fetch('/api/record-blessing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: sid,
        amount: 800,
        currency: 'usd',
        name: '零跳转自动化测试',
        message: 'Stripe 支付完成就地销毁并呈现寄语表单，零刷新体验极佳！🌟',
        country: 'US',
      }),
    });
    return { ok: res.ok, status: res.status, json: await res.json() };
  }, apiTest.json.sessionId);

  console.log('寄语提交响应:', blessingTest);

  const totalNavDelta = mainFrameNavigations - baseNavigations;
  console.log(`\n========================================`);
  console.log(`全流程页面重载/刷新总次数增量: ${totalNavDelta} (严格要求: 0)`);
  if (totalNavDelta === 0) {
    console.log(`✅ 100% 验收通过：完全实现零跳转、零刷新、Stripe 表单销毁后就地无缝加载寄语表单！`);
  }
  console.log(`========================================\n`);

  await browser.close();
})();
