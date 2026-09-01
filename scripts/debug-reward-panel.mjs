import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await page.goto('http://localhost:4322/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });

  // 滚动并点击打赏按钮
  const rewardBtn = page.locator('.post-reward-button').first();
  await rewardBtn.scrollIntoViewIfNeeded();
  await rewardBtn.click({ force: true });
  await page.waitForTimeout(600);

  const panelData = await page.evaluate(() => {
    const rewardPanel = document.querySelector('#post-tools-panel-reward');
    if (!rewardPanel) return { error: 'No reward panel found' };
    
    const regions = Array.from(rewardPanel.querySelectorAll('[data-reward-region-panel]')).map(r => ({
      id: r.dataset.rewardRegionPanel,
      hidden: r.hidden,
      display: window.getComputedStyle(r).display,
      channels: Array.from(r.querySelectorAll('[data-reward-channel-card]')).map(c => ({
        id: c.dataset.rewardChannelId,
        hidden: c.hidden,
        display: window.getComputedStyle(c).display,
        visibility: window.getComputedStyle(c).visibility,
      }))
    }));

    return {
      panelDisplay: window.getComputedStyle(rewardPanel).display,
      panelVisibility: window.getComputedStyle(rewardPanel).visibility,
      panelRect: rewardPanel.getBoundingClientRect(),
      regions,
    };
  });

  console.log('Reward panel debug data:', JSON.stringify(panelData, null, 2));
  await browser.close();
}

debug();
