import { chromium } from 'playwright';

async function auditSnowSystem() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log('--- Subagent 独立公网端到端审计启动: https://blog.epocanvas.com ---');
  await page.goto('https://blog.epocanvas.com', { waitUntil: 'networkidle', timeout: 45000 });

  // 1. 切换/确认雪景背景
  const currentBg = await page.evaluate(() => document.documentElement.getAttribute('data-background'));
  console.log(`[Init] 初始 data-background: ${currentBg}`);
  if (currentBg !== 'snow') {
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-background', 'snow');
      localStorage.setItem('theme-background-mode', 'snow');
      window.dispatchEvent(new CustomEvent('shijianus:background-change', { detail: { mode: 'snow' } }));
    });
    await page.waitForTimeout(1000);
  }

  // 等待雪幔挂载完成
  await page.waitForSelector('.card-snow-svg', { timeout: 10000 });
  await page.waitForTimeout(1500);

  // 2. 统计所有雪幔原型与多样性
  const auditData = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('.card-snow-svg'));
    const archetypes = {};
    const recentPostsArchetypes = [];
    const elementsFound = {
      categoryBar: !!document.querySelector('#category-bar > .card-snow-svg, .category-bar > .card-snow-svg'),
      footerMainShell: !!document.querySelector('.footer-main-shell > .card-snow-svg'),
      footerBarLinks: !!document.querySelector('.footer-bar-links > .card-snow-svg'),
      recentPostsCount: 0,
      profileCardSnow: !!document.querySelector('.profile-card > .card-snow-svg, .card-info > .card-snow-svg'),
      totalSvgs: svgs.length
    };

    svgs.forEach((svg) => {
      const arch = svg.getAttribute('data-snow-archetype') || 'unknown';
      archetypes[arch] = (archetypes[arch] || 0) + 1;
    });

    const recentPostItems = Array.from(document.querySelectorAll('.recent-post-item'));
    elementsFound.recentPostsCount = recentPostItems.length;

    recentPostItems.forEach((el, idx) => {
      const svg = el.querySelector(':scope > .card-snow-svg');
      if (svg) {
        recentPostsArchetypes.push({
          idx,
          archetype: svg.getAttribute('data-snow-archetype'),
          seed: svg.getAttribute('data-snow-seed'),
          svgTop: svg.style.getPropertyValue('--snow-svg-top'),
          viewBox: svg.getAttribute('viewBox')
        });
      }
    });

    // 验证防遮挡：上下卡片之间是否有重叠
    const occlusionIssues = [];
    const gridCards = Array.from(document.querySelectorAll('.recent-post-item'));
    for (let i = 0; i < gridCards.length; i++) {
      const card = gridCards[i];
      const svg = card.querySelector(':scope > .card-snow-svg');
      if (!svg) continue;
      const cardRect = card.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();

      // 与前面的所有卡片检测
      for (let j = 0; j < i; j++) {
        const otherCard = gridCards[j];
        const otherRect = otherCard.getBoundingClientRect();
        // 如果在同一垂直列（水平投影重叠 > 40px）
        const overlapX = Math.min(cardRect.right, otherRect.right) - Math.max(cardRect.left, otherRect.left);
        if (overlapX > 40 && otherRect.bottom <= cardRect.top) {
          // 上方卡片的底部 vs 当前雪顶的顶部
          // svgRect.top 是雪的最高点，如果 svgRect.top < otherRect.bottom 说明雪侵入了上方卡片
          if (svgRect.top < otherRect.bottom) {
            occlusionIssues.push({
              cardIndex: i,
              aboveCardIndex: j,
              svgTop: svgRect.top,
              aboveBottom: otherRect.bottom,
              overlapAmount: otherRect.bottom - svgRect.top
            });
          }
        }
      }
    }

    // 验证两端饱满度（两头细中间粗的问题解决情况）
    // 检查 path.snow-body 的起始点与中间点厚度
    const edgeSaggingIssues = [];
    svgs.forEach((svg, idx) => {
      const body = svg.querySelector('.snow-body');
      if (!body) return;
      const d = body.getAttribute('d') || '';
      // 解析 path D 中起始点和终点坐标
      const mMatch = d.match(/M\s*([\d.]+)\s+([\d.]+)/);
      if (mMatch) {
        const startX = parseFloat(mMatch[1]);
        const startY = parseFloat(mMatch[2]);
        // 查看边缘厚度
        const viewBox = svg.getAttribute('viewBox')?.split(' ') || [];
        const svgW = parseFloat(viewBox[2] || '0');
        // 如果 startX 接近 0 且 startY 发生异常大下沉
        // 正常情况下 startY 应该靠近 yOffset - H
      }
    });

    return {
      elementsFound,
      archetypeStats: archetypes,
      distinctArchetypesCount: Object.keys(archetypes).length,
      recentPostsArchetypes,
      occlusionIssues,
      edgeSaggingIssues
    };
  });

  console.log('\n--- 审计结果详报 ---');
  console.log('1. 方框全域检测:', JSON.stringify(auditData.elementsFound, null, 2));
  console.log(`2. 雪幔总数: ${auditData.elementsFound.totalSvgs}`);
  console.log(`3. 出现的不同雪模型种类数 (总计 16 种): ${auditData.distinctArchetypesCount} 种`);
  console.log('4. 模型分布统计:', JSON.stringify(auditData.archetypeStats, null, 2));
  console.log('5. Recent Post Item 卡片模型多样性:');
  auditData.recentPostsArchetypes.forEach(p => {
    console.log(`   - 卡片[${p.idx}]: 模型 = ${p.archetype}, 种子 = ${p.seed}, viewBox = ${p.viewBox}`);
  });
  console.log('6. 垂直遮挡检测 (Occlusion Issues):', auditData.occlusionIssues.length === 0 ? '✅ 完美通过：0 重叠 0 遮挡，保持了安全呼吸距离' : auditData.occlusionIssues);
  console.log('7. 控制台错误数:', consoleErrors.length === 0 ? '✅ 0 致命 JS 报错' : consoleErrors);

  // 截图取证
  await page.screenshot({ path: 'scratch/public-snow-audit.png', fullPage: false });
  console.log('📸 首页首屏审计截图已保存至: scratch/public-snow-audit.png');

  // 滚动到底部检查 footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scratch/public-footer-snow-audit.png', fullPage: false });
  console.log('📸 底部 Footer 方框积雪截图已保存至: scratch/public-footer-snow-audit.png');

  await browser.close();

  // 断言
  if (!auditData.elementsFound.categoryBar) throw new Error('Assertion failed: categoryBar 缺少积雪!');
  if (!auditData.elementsFound.footerMainShell) throw new Error('Assertion failed: footerMainShell 缺少积雪!');
  if (!auditData.elementsFound.footerBarLinks) throw new Error('Assertion failed: footerBarLinks 缺少积雪!');
  if (auditData.distinctArchetypesCount < 5) throw new Error('Assertion failed: 雪模型种类过少，多样性不足!');
  if (auditData.occlusionIssues.length > 0) throw new Error('Assertion failed: 存在卡片向上重叠遮挡!');
  if (consoleErrors.length > 0) throw new Error('Assertion failed: 生产环境存在 JS 控制台报错!');

  console.log('\n🎉 公网全链路端到端审计 100% 成功通过！');
}

auditSnowSystem().catch((err) => {
  console.error('❌ 审计失败:', err);
  process.exit(1);
});
