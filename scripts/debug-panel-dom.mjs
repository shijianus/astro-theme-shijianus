import { chromium } from 'playwright';

async function debug() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4322/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });

  // 滚动到 post-copyright
  const copyrightEl = page.locator('.post-copyright').first();
  await copyrightEl.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // 点击二维码
  const qrShareBtn = page.locator('[data-share-platform="wechat"]').first();
  await qrShareBtn.click();
  await page.waitForTimeout(500);

  const debugInfo = await page.evaluate(() => {
    const wechatPanel = document.querySelector('#post-tools-panel-wechat');
    const backdrop = document.querySelector('[data-panel-backdrop]');
    const cs = window.getComputedStyle(wechatPanel);
    const rect = wechatPanel.getBoundingClientRect();
    return {
      hidden: wechatPanel.hidden,
      className: wechatPanel.className,
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      zIndex: cs.zIndex,
      position: cs.position,
      top: cs.top,
      left: cs.left,
      transform: cs.transform,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      backdrop: {
        hidden: backdrop?.hidden,
        className: backdrop?.className,
        zIndex: window.getComputedStyle(backdrop).zIndex,
        visibility: window.getComputedStyle(backdrop).visibility,
        opacity: window.getComputedStyle(backdrop).opacity,
      }
    };
  });

  console.log('Wechat panel debug info:', JSON.stringify(debugInfo, null, 2));
  await browser.close();
}

debug();
