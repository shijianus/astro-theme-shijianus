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

  console.log('[Test] Navigating to http://localhost:4322/posts/readable-geek-interfaces/...');
  await page.goto('http://localhost:4322/posts/readable-geek-interfaces/', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  // Scroll down slightly so AI summary panel enters viewport
  await page.evaluate(() => {
    const el = document.querySelector('.shijianus-ai-summary');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });

  // Wait for typing to settle
  await new Promise((r) => setTimeout(r, 2500));

  // 1. Screenshot Light Mode
  const aiSummaryEl = await page.$('.shijianus-ai-summary');
  if (aiSummaryEl) {
    await aiSummaryEl.screenshot({ path: path.join(outDir, '01-ai-summary-light.png') });
    console.log('[Test] Captured 01-ai-summary-light.png');
  }

  // Full page screenshot light
  await page.screenshot({ path: path.join(outDir, '02-post-page-light.png') });
  console.log('[Test] Captured 02-post-page-light.png');

  // 2. Click 👤 关于作者
  console.log('[Test] Clicking 👤 关于作者...');
  const introBtn = await page.$('.shijianus-ai-summary__action[data-ai-action="intro"]');
  if (introBtn) {
    await introBtn.click();
    await new Promise((r) => setTimeout(r, 2000));
    if (aiSummaryEl) {
      await aiSummaryEl.screenshot({ path: path.join(outDir, '03-ai-summary-intro.png') });
      console.log('[Test] Captured 03-ai-summary-intro.png');
    }
  }

  // 3. Click 📚 推荐相关
  console.log('[Test] Clicking 📚 推荐相关...');
  const relatedBtn = await page.$('.shijianus-ai-summary__action[data-ai-action="related"]');
  if (relatedBtn) {
    await relatedBtn.click();
    await new Promise((r) => setTimeout(r, 1500));
    if (aiSummaryEl) {
      await aiSummaryEl.screenshot({ path: path.join(outDir, '04-ai-summary-related.png') });
      console.log('[Test] Captured 04-ai-summary-related.png');
    }
  }

  // 4. Test Mode Switcher
  console.log('[Test] Testing Mode Switcher...');
  const switchBtn = await page.$('[data-ai-switch-mode]');
  if (switchBtn) {
    await switchBtn.click(); // to LLMGPT
    await new Promise((r) => setTimeout(r, 1500));
    if (aiSummaryEl) {
      await aiSummaryEl.screenshot({ path: path.join(outDir, '05-ai-summary-mode-llmgpt.png') });
      console.log('[Test] Captured 05-ai-summary-mode-llmgpt.png');
    }
  }

  // 5. Test Dark Mode
  console.log('[Test] Testing Dark Mode...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await new Promise((r) => setTimeout(r, 800));

  if (aiSummaryEl) {
    await aiSummaryEl.screenshot({ path: path.join(outDir, '06-ai-summary-dark.png') });
    console.log('[Test] Captured 06-ai-summary-dark.png');
  }

  await page.screenshot({ path: path.join(outDir, '07-post-page-dark.png') });
  console.log('[Test] Captured 07-post-page-dark.png');

  await browser.close();
  console.log('[Test] Verification completed successfully!');
}

run().catch((err) => {
  console.error('[Test Error]', err);
  process.exit(1);
});
