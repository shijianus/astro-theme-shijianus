import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  console.log('Navigating to https://hexo.anheyu.com/posts/340b.html...');
  await page.goto('https://hexo.anheyu.com/posts/340b.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Take full and section screenshots
  await page.screenshot({ path: 'scripts/hexo_full_page.png', fullPage: true });
  await page.screenshot({ path: 'scripts/hexo_top.png' });

  // Extract DOM elements & styles
  const info = await page.evaluate(() => {
    const post = document.querySelector('#post');
    const aside = document.querySelector('#aside-content');
    const contentInner = document.querySelector('#content-inner');
    const ai = document.querySelector('.post-ai-description') || document.querySelector('.post-ai');
    const copyright = document.querySelector('.post-copyright');
    const postTools = document.querySelector('.post-tools-right') || document.querySelector('.post-tools');
    const pagination = document.querySelector('.pagination-post') || document.querySelector('#pagination') || document.querySelector('.pagination-info');
    const related = document.querySelector('.relatedPosts');
    const outdate = document.querySelector('.post-outdate-notice');
    const universe = document.querySelector('#universe');
    const webBg = document.querySelector('#web_bg');
    const snackbar = document.querySelector('.snackbar-container') || document.querySelector('#snackbar-container');

    return {
      postOuterHtml: post ? post.outerHTML : null,
      asideOuterHtml: aside ? aside.outerHTML : null,
      contentInnerOuterHtml: contentInner ? contentInner.outerHTML : null,
      aiHtml: ai ? ai.outerHTML : null,
      copyrightHtml: copyright ? copyright.outerHTML : null,
      postToolsHtml: postTools ? postTools.outerHTML : null,
      paginationHtml: pagination ? pagination.outerHTML : null,
      relatedHtml: related ? related.outerHTML : null,
      outdateHtml: outdate ? outdate.outerHTML : null,
      snackbarHtml: snackbar ? snackbar.outerHTML : null,
      universeHtml: universe ? universe.outerHTML : null,
      postStyle: post ? {
        background: getComputedStyle(post).background,
        backgroundColor: getComputedStyle(post).backgroundColor,
        backdropFilter: getComputedStyle(post).backdropFilter,
        boxShadow: getComputedStyle(post).boxShadow,
        border: getComputedStyle(post).border,
        borderRadius: getComputedStyle(post).borderRadius,
        padding: getComputedStyle(post).padding,
      } : null,
      webBgStyle: webBg ? {
        background: getComputedStyle(webBg).background,
        backgroundColor: getComputedStyle(webBg).backgroundColor,
      } : null
    };
  });

  fs.writeFileSync('scripts/hexo_full_info.json', JSON.stringify(info, null, 2));
  if (info.postOuterHtml) fs.writeFileSync('scripts/hexo_post_full.html', info.postOuterHtml);
  if (info.asideOuterHtml) fs.writeFileSync('scripts/hexo_aside_full.html', info.asideOuterHtml);

  // Scroll to AI section
  await page.evaluate(() => {
    const el = document.querySelector('.post-ai-description') || document.querySelector('#article-container');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/hexo_ai_section.png' });

  // Scroll to copyright / bottom
  await page.evaluate(() => {
    const el = document.querySelector('.post-copyright');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/hexo_copyright_section.png' });

  // Scroll to related & pagination
  await page.evaluate(() => {
    const el = document.querySelector('.relatedPosts') || document.querySelector('.pagination-post');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/hexo_bottom_section.png' });

  console.log('Extraction complete!');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
