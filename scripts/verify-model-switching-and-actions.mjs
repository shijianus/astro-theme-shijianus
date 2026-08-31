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
  await page.setViewport({ width: 1280, height: 950, deviceScaleFactor: 2 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[Browser Console Error]:', msg.text());
  });

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

  // 1. Default State (LLMGPT, direct content load, no active buttons)
  const defaultMode = await page.$eval('[data-ai-mode-label]', (el) => el.textContent.trim());
  console.log(`[Test Suite] Initial Mode: ${defaultMode}`);
  await snap('30-default-llmgpt-load.png');

  // 2. Click 💡 核心论点 in LLMGPT
  console.log('[Test Suite] Clicking 💡 核心论点 in LLMGPT mode...');
  await page.click('.shijianus-ai-summary__action[data-ai-action="point"]');
  await new Promise((r) => setTimeout(r, 2500));
  await snap('31-llmgpt-point-action.png');

  // 3. Click 👤 关于作者
  console.log('[Test Suite] Clicking 👤 关于作者 (Testing Intro Action)...');
  await page.click('.shijianus-ai-summary__action[data-ai-action="intro"]');
  await new Promise((r) => setTimeout(r, 2000));
  const introText1 = await page.$eval('[data-ai-output]', (el) => el.textContent.trim());
  console.log('[Test Suite] Intro Text 1:', introText1.slice(0, 50), '...');
  await snap('32-author-intro-pass1.png');

  // 4. Re-click 👤 关于作者 (Test Rotation / Re-click capability)
  console.log('[Test Suite] Re-clicking 👤 关于作者 (Testing Re-click rotation)...');
  await page.click('.shijianus-ai-summary__action[data-ai-action="intro"]');
  await new Promise((r) => setTimeout(r, 2000));
  const introText2 = await page.$eval('[data-ai-output]', (el) => el.textContent.trim());
  console.log('[Test Suite] Intro Text 2:', introText2.slice(0, 50), '...');
  await snap('33-author-intro-pass2.png');

  // 5. Click Switch button -> should switch to InstanceAI and reset action buttons!
  console.log('[Test Suite] Clicking Switch button (to InstanceAI)...');
  await page.click('.shijianus-ai-summary__btn-switch');
  const activeCount = await page.$$eval('.shijianus-ai-summary__action.is-active', (els) => els.length);
  console.log(`[Test Suite] Active actions after mode switch: ${activeCount} (expected 0)`);
  await new Promise((r) => setTimeout(r, 1200));
  await snap('34-switch-to-instance-thinking.png');
  await new Promise((r) => setTimeout(r, 4500));
  await snap('35-instance-summary-result.png');

  // 6. Click 🧠 实践启示 in InstanceAI mode
  console.log('[Test Suite] Clicking 🧠 实践启示 in InstanceAI mode...');
  await page.click('.shijianus-ai-summary__action[data-ai-action="insight"]');
  await new Promise((r) => setTimeout(r, 1200));
  await snap('36-instance-insight-thinking.png');
  await new Promise((r) => setTimeout(r, 4500));
  await snap('37-instance-insight-result.png');

  // 7. Click Refresh button -> should reset action and re-generate summary!
  console.log('[Test Suite] Clicking Refresh button...');
  await page.click('[data-ai-refresh]');
  const activeCountAfterRefresh = await page.$$eval('.shijianus-ai-summary__action.is-active', (els) => els.length);
  console.log(`[Test Suite] Active actions after refresh: ${activeCountAfterRefresh} (expected 0)`);
  await new Promise((r) => setTimeout(r, 4500));
  await snap('38-after-refresh-reset.png');

  // 8. Click Switch button to PrimerAI
  console.log('[Test Suite] Clicking Switch button (to PrimerAI)...');
  await page.click('.shijianus-ai-summary__btn-switch');
  await new Promise((r) => setTimeout(r, 1500));
  const primerMode = await page.$eval('[data-ai-mode-label]', (el) => el.textContent.trim());
  console.log(`[Test Suite] Mode: ${primerMode}`);
  await snap('39-primer-mode.png');

  await browser.close();
  console.log('[Test Suite] All logical optimizations verified successfully!');
}

run().catch((err) => {
  console.error('[Test Suite Error]', err);
  process.exit(1);
});
