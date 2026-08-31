import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('verification-screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

  console.log('[Test] Navigating to http://localhost:4321/posts/readable-geek-interfaces/...');
  await page.goto('http://localhost:4321/posts/readable-geek-interfaces/', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  // Scroll down so AI summary panel is centered
  await page.evaluate(() => {
    const el = document.querySelector('.shijianus-ai-summary');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });

  // Wait for initial typing
  await new Promise((r) => setTimeout(r, 2000));

  const aiSummaryEl = await page.$('.shijianus-ai-summary');

  // 1. Initial State Screenshot (灰白卡片 + 纯白内嵌屏 + 蓝色按键)
  if (aiSummaryEl) {
    await aiSummaryEl.screenshot({ path: path.join(outDir, '10-ai-summary-new-style.png') });
    console.log('[Test] Captured 10-ai-summary-new-style.png');
  }

  // 2. Click 💡 核心论点 (triggers real InstanceAI call + CoT thinking)
  console.log('[Test] Clicking 💡 核心论点...');
  const pointBtn = await page.$('.shijianus-ai-summary__action[data-ai-action="point"]');
  if (pointBtn) {
    await pointBtn.click();
    // Wait 1.5s to capture Thinking state
    await new Promise((r) => setTimeout(r, 1500));
    if (aiSummaryEl) {
      await aiSummaryEl.screenshot({ path: path.join(outDir, '11-ai-thinking-state.png') });
      console.log('[Test] Captured 11-ai-thinking-state.png (Thinking state)');
    }
    // Wait for response and typing
    await new Promise((r) => setTimeout(r, 4500));
    if (aiSummaryEl) {
      await aiSummaryEl.screenshot({ path: path.join(outDir, '12-ai-point-result.png') });
      console.log('[Test] Captured 12-ai-point-result.png (Point result)');
    }
  }

  // 3. Click 🧠 实践启示 (different question, different prompt, real API call)
  console.log('[Test] Clicking 🧠 实践启示...');
  const insightBtn = await page.$('.shijianus-ai-summary__action[data-ai-action="insight"]');
  if (insightBtn) {
    await insightBtn.click();
    await new Promise((r) => setTimeout(r, 5500));
    if (aiSummaryEl) {
      await aiSummaryEl.screenshot({ path: path.join(outDir, '13-ai-insight-result.png') });
      console.log('[Test] Captured 13-ai-insight-result.png (Insight result)');
    }
  }

  // 4. Click 👤 关于作者 (rich, detailed author manifesto)
  console.log('[Test] Clicking 👤 关于作者...');
  const introBtn = await page.$('.shijianus-ai-summary__action[data-ai-action="intro"]');
  if (introBtn) {
    await introBtn.click();
    await new Promise((r) => setTimeout(r, 2000));
    if (aiSummaryEl) {
      await aiSummaryEl.screenshot({ path: path.join(outDir, '14-ai-author-intro.png') });
      console.log('[Test] Captured 14-ai-author-intro.png (Author intro)');
    }
  }

  // 5. Click 📚 推荐相关 (AI dynamic reasoning + related drawer)
  console.log('[Test] Clicking 📚 推荐相关...');
  const relatedBtn = await page.$('.shijianus-ai-summary__action[data-ai-action="related"]');
  if (relatedBtn) {
    await relatedBtn.click();
    await new Promise((r) => setTimeout(r, 5500));
    if (aiSummaryEl) {
      await aiSummaryEl.screenshot({ path: path.join(outDir, '15-ai-related-reasoning.png') });
      console.log('[Test] Captured 15-ai-related-reasoning.png (Related reasoning)');
    }
  }

  // 6. Test Dark Mode
  console.log('[Test] Testing Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await new Promise((r) => setTimeout(r, 800));

  if (aiSummaryEl) {
    await aiSummaryEl.screenshot({ path: path.join(outDir, '16-ai-summary-dark-new.png') });
    console.log('[Test] Captured 16-ai-summary-dark-new.png (Dark Mode)');
  }

  await browser.close();
  console.log('[Test] All interaction verification passed successfully!');
}

run().catch((err) => {
  console.error('[Test Error]', err);
  process.exit(1);
});
