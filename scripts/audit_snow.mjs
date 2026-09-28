import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const outDir = '/root/.gemini/antigravity-cli/brain/f64378c7-22c5-4206-87c8-77f436fed44c/scratch';

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  console.log('Navigating to home page...');
  await page.goto('https://blog.epocanvas.com');
  
  // Wait for the snow to render
  await page.waitForTimeout(5000);

  // Take screenshot of home page
  await page.screenshot({ path: path.join(outDir, 'home.png'), fullPage: true });

  console.log('Evaluating snow elements on home page...');
  const homeSnowInfo = await page.evaluate(() => {
    const data = {};
    
    const svgs = Array.from(document.querySelectorAll('svg'));
    const snowSvgs = svgs.filter(svg => svg.classList.contains('snow-overlay') || svg.hasAttribute('data-snow'));
    
    // Check .recent-post-item
    const postItems = Array.from(document.querySelectorAll('.recent-post-item'));
    data.postItemsCount = postItems.length;
    data.postItemPaths = postItems.map(item => {
      const el = item.querySelector('.snow-overlay, svg');
      return el ? el.outerHTML : null;
    });

    data.categoryBar = document.querySelector('.category-bar')?.innerHTML;
    data.footerMainShell = document.querySelector('.footer-main-shell')?.innerHTML;

    return data;
  });

  console.log('Navigating to article page...');
  await page.goto('https://blog.epocanvas.com/posts/markdown-syntax-mastery/');
  await page.waitForTimeout(5000);

  await page.screenshot({ path: path.join(outDir, 'article.png'), fullPage: true });

  const articleSnowInfo = await page.evaluate(() => {
    const data = {};
    data.markdownAlert = document.querySelector('.markdown-alert')?.innerHTML;
    data.articleCallout = document.querySelector('.article-callout')?.innerHTML;
    data.codeBlockShell = document.querySelector('.code-block-shell')?.innerHTML;
    data.highlight = document.querySelector('figure.highlight')?.innerHTML;
    data.articleTableWrap = document.querySelector('.article-table-wrap')?.innerHTML;
    return data;
  });

  console.log(JSON.stringify({
    errors,
    homeSnowInfo: {
      postItemsCount: homeSnowInfo.postItemsCount,
      hasPaths: homeSnowInfo.postItemPaths.filter(x => x).length,
      pathsSample: homeSnowInfo.postItemPaths.filter(x => x).slice(0, 2)
    }
  }, null, 2));

  await browser.close();
})();
