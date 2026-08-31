import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('verification-screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function waitForAiText(page, minLength = 20, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const text = await page.$eval('[data-ai-output]', (el) => el.textContent.trim());
    if (!text.startsWith('正在调用') && !text.startsWith('正在通过') && text.length >= minLength) {
      // Wait a bit for typing animation to complete
      await new Promise((r) => setTimeout(r, 1800));
      return text;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950, deviceScaleFactor: 2 });

  console.log('[Test Suite] Navigating to http://localhost:4321/posts/readable-geek-interfaces/...');
  await page.goto('http://localhost:4321/posts/readable-geek-interfaces/', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  // Scroll to AI Summary
  await page.evaluate(() => {
    const el = document.querySelector('.shijianus-ai-summary');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });

  await new Promise((r) => setTimeout(r, 2000));

  const snap = async (name) => {
    const el = await page.$('.shijianus-ai-summary');
    if (el) {
      await el.screenshot({ path: path.join(outDir, name) });
      console.log(`[Test Suite] Saved ${name}`);
    }
  };

  // 1. Idle state
  await snap('20-new-style-idle.png');

  // 2. 💡 核心论点
  console.log('[Test Suite] Testing 💡 核心论点...');
  const pointBtn = await page.$('.shijianus-ai-summary__action[data-ai-action="point"]');
  if (pointBtn) {
    await pointBtn.click();
    await new Promise((r) => setTimeout(r, 1000));
    await snap('21-thinking-state.png');
    await waitForAiText(page);
    await snap('22-point-response.png');
  }

  // 3. 🎯 适用读者
  console.log('[Test Suite] Testing 🎯 适用读者...');
  const audienceBtn = await page.$('.shijianus-ai-summary__action[data-ai-action="audience"]');
  if (audienceBtn) {
    await audienceBtn.click();
    await waitForAiText(page);
    await snap('23-audience-response.png');
  }

  // 4. 🧠 实践启示
  console.log('[Test Suite] Testing 🧠 实践启示...');
  const insightBtn = await page.$('.shijianus-ai-summary__action[data-ai-action="insight"]');
  if (insightBtn) {
    await insightBtn.click();
    await waitForAiText(page);
    await snap('25-insight-response.png');
  }

  // 5. 👤 关于作者
  console.log('[Test Suite] Testing 👤 关于作者...');
  const introBtn = await page.$('.shijianus-ai-summary__action[data-ai-action="intro"]');
  if (introBtn) {
    await introBtn.click();
    await new Promise((r) => setTimeout(r, 2000));
    await snap('26-author-intro-response.png');
  }

  // 6. 📚 推荐相关
  console.log('[Test Suite] Testing 📚 推荐相关...');
  const relatedBtn = await page.$('.shijianus-ai-summary__action[data-ai-action="related"]');
  if (relatedBtn) {
    await relatedBtn.click();
    await waitForAiText(page);
    await snap('27-related-drawer-response.png');
  }

  // 7. Dark Mode View
  console.log('[Test Suite] Testing Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await new Promise((r) => setTimeout(r, 800));
  await snap('28-dark-mode-complete.png');

  await browser.close();
  console.log('[Test Suite] All test scenarios finished successfully!');
}

run().catch((err) => {
  console.error('[Test Suite Error]', err);
  process.exit(1);
});
