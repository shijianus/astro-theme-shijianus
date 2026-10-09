import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://hexo.anheyu.com/', { waitUntil: 'networkidle', timeout: 35000 });
  await page.waitForTimeout(2000);

  const lightData = await page.evaluate(() => {
    const sticky = document.querySelector('.sticky_layout');
    const canvases = Array.from(document.querySelectorAll('canvas')).map(c => ({
      id: c.id,
      className: c.className,
      style: c.getAttribute('style'),
      zIndex: window.getComputedStyle(c).zIndex,
      position: window.getComputedStyle(c).position
    }));
    const cards = sticky ? Array.from(sticky.children).map(c => ({
      tag: c.tagName,
      id: c.id,
      className: c.className,
      bg: window.getComputedStyle(c).backgroundColor,
      filter: window.getComputedStyle(c).backdropFilter || window.getComputedStyle(c).webkitBackdropFilter,
      border: window.getComputedStyle(c).border
    })) : [];
    return {
      stickyBg: sticky ? window.getComputedStyle(sticky).backgroundColor : null,
      cards,
      canvases
    };
  });
  console.log('Anzhiyu Light:', JSON.stringify(lightData, null, 2));

  // Toggle dark
  await page.evaluate(() => {
    // Check darkmode switch
    const darkBtn = document.querySelector('#darkmode') || document.querySelector('.mode-btn');
    if (darkBtn) darkBtn.click();
    else document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(2000);

  const darkData = await page.evaluate(() => {
    const sticky = document.querySelector('.sticky_layout');
    const canvases = Array.from(document.querySelectorAll('canvas')).map(c => ({
      id: c.id,
      className: c.className,
      style: c.getAttribute('style'),
      zIndex: window.getComputedStyle(c).zIndex,
      position: window.getComputedStyle(c).position
    }));
    const cards = sticky ? Array.from(sticky.children).map(c => ({
      tag: c.tagName,
      id: c.id,
      className: c.className,
      bg: window.getComputedStyle(c).backgroundColor,
      filter: window.getComputedStyle(c).backdropFilter || window.getComputedStyle(c).webkitBackdropFilter,
      border: window.getComputedStyle(c).border
    })) : [];
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      stickyBg: sticky ? window.getComputedStyle(sticky).backgroundColor : null,
      cards,
      canvases
    };
  });
  console.log('Anzhiyu Dark:', JSON.stringify(darkData, null, 2));

  await page.screenshot({ path: 'scratch/anzhiyu-dark.png' });
  const sticky = await page.$('.sticky_layout');
  if (sticky) {
    await sticky.screenshot({ path: 'scratch/anzhiyu-sticky-dark.png' });
  }

  await browser.close();
}

main().catch(console.error);
