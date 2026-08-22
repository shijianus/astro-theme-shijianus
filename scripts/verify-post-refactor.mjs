import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to post page...');
  await page.goto('http://localhost:4321/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 0. Test outdated notice on hello-world post
  const page2 = await context.newPage();
  await page2.goto('http://localhost:4321/posts/hello-world/', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(1200);
  await page2.screenshot({ path: 'scripts/verify_post_outdate_notice.png' });
  await page2.close();
  console.log('Saved verify_post_outdate_notice.png');

  // 1. Top view of post
  await page.screenshot({ path: 'scripts/verify_post_top.png' });
  console.log('Saved verify_post_top.png');

  // 2. Click AI Intro button
  const introBtn = page.locator('.post-ai-description .ai-btn-item[data-action="intro"]');
  if (await introBtn.count() > 0) {
    await introBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'scripts/verify_post_ai_intro.png' });
    console.log('Saved verify_post_ai_intro.png');
  }

  // 3. Click AI Recommend button
  const recommendBtn = page.locator('.post-ai-description .ai-btn-item[data-action="recommend"]');
  if (await recommendBtn.count() > 0) {
    await recommendBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'scripts/verify_post_ai_recommend.png' });
    console.log('Saved verify_post_ai_recommend.png');
  }

  // 4. Scroll to middle to check sticky TOC
  await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'scripts/verify_post_mid_toc.png' });
  console.log('Saved verify_post_mid_toc.png');

  // 5. Scroll to bottom area (Copyright, Tags, Pagination, Related, Comments)
  await page.evaluate(() => {
    const copyright = document.querySelector('.post-copyright');
    if (copyright) copyright.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'scripts/verify_post_copyright.png' });
  console.log('Saved verify_post_copyright.png');

  // 6. Test Click Reward button in copyright
  const rewardTrigger = page.locator('[data-reward-trigger]');
  if (await rewardTrigger.count() > 0) {
    await rewardTrigger.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'scripts/verify_post_reward_popover.png' });
    console.log('Saved verify_post_reward_popover.png');
  }

  // 7. Test Click Copy link to verify Snackbar
  const copyBtn = page.locator('#post-share-url');
  if (await copyBtn.count() > 0) {
    await copyBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'scripts/verify_post_snackbar.png' });
    console.log('Saved verify_post_snackbar.png');
  }

  // 8. Scroll to bottom for Pagination, RelatedPosts and Floating Next
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight - 1000, behavior: 'instant' }));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'scripts/verify_post_bottom_pagination.png' });
  console.log('Saved verify_post_bottom_pagination.png');

  // 9. Test Dark Mode
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/verify_post_dark_bottom.png' });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/verify_post_dark_top.png' });
  console.log('Saved verify_post_dark_*.png');

  // 10. Test Read Mode
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'light';
    document.body.classList.add('read-mode');
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scripts/verify_post_readmode.png' });
  console.log('Saved verify_post_readmode.png');

  console.log('All verifications completed successfully!');
  await browser.close();
}

main().catch(console.error);
