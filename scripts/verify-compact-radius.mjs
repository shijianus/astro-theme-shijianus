import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Serve dist directory
const distDir = path.resolve('dist');

function getContentType(filePath) {
  const ext = path.extname(filePath);
  switch (ext) {
    case '.html': return 'text/html';
    case '.css': return 'text/css';
    case '.js': return 'application/javascript';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(distDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, '404.html');
  }
  if (fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(4321, async () => {
  console.log('Static server listening on http://localhost:4321');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Check article page with relatedPosts
  await page.goto('http://localhost:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });

  const postAudit = await page.evaluate(() => {
    const related = document.querySelector('.relatedPosts');
    const relatedList = document.querySelector('.relatedPosts-list');
    const relatedItems = Array.from(document.querySelectorAll('.relatedPosts-item'));
    const asideCards = Array.from(document.querySelectorAll('#aside-content .card-widget'));
    const flipContent = document.querySelector('#flip-content');
    const promoWidget = document.querySelector('.promo-widget');
    const cardCat = document.querySelector('.card-categories');
    const cardCatLinks = Array.from(document.querySelectorAll('.card-category-list-link'));
    const postNav = document.querySelector('.postNav');
    const postNavCards = Array.from(document.querySelectorAll('.postNav-card'));

    const getRadius = (el) => el ? window.getComputedStyle(el).borderRadius : 'N/A';
    const getHeight = (el) => el ? window.getComputedStyle(el).height : 'N/A';
    const getGap = (el) => el ? window.getComputedStyle(el).gap : 'N/A';
    const getPadding = (el) => el ? window.getComputedStyle(el).padding : 'N/A';

    return {
      related: {
        found: !!related,
        borderRadius: getRadius(related),
        padding: getPadding(related),
        gap: getGap(related),
      },
      relatedList: {
        found: !!relatedList,
        gap: getGap(relatedList),
        gridCols: relatedList ? window.getComputedStyle(relatedList).gridTemplateColumns : 'N/A',
      },
      relatedItems: relatedItems.map((item, idx) => ({
        index: idx + 1,
        borderRadius: getRadius(item),
        height: getHeight(item),
        boxShadow: window.getComputedStyle(item).boxShadow,
        badgeRadius: getRadius(item.querySelector('.relatedPosts-item__index')),
        dateRadius: getRadius(item.querySelector('.date')),
        titleLineClamp: item.querySelector('.title') ? window.getComputedStyle(item.querySelector('.title')).webkitLineClamp : 'N/A'
      })),
      asideCards: asideCards.map(c => ({
        id: c.id || c.className,
        borderRadius: getRadius(c)
      })),
      flipContent: {
        found: !!flipContent,
        borderRadius: getRadius(flipContent),
        promoWidgetRadius: getRadius(promoWidget),
      },
      cardCategories: {
        found: !!cardCat,
        cardRadius: getRadius(cardCat),
        linkRadius: cardCatLinks.map(l => getRadius(l))[0] || 'N/A'
      },
      postNav: {
        found: !!postNav,
        borderRadius: getRadius(postNav),
        cardRadius: postNavCards.map(c => getRadius(c))[0] || 'N/A',
        cardHeight: postNavCards.map(c => getHeight(c))[0] || 'N/A'
      }
    };
  });

  console.log('=== POST PAGE AUDIT (DESKTOP 1440x900) ===');
  console.log(JSON.stringify(postAudit, null, 2));

  // Assertions for Desktop
  if (postAudit.related.found) {
    const itemRadiusNum = parseInt(postAudit.relatedItems[0].borderRadius);
    const itemHeightNum = parseInt(postAudit.relatedItems[0].height);
    console.log(`\nASSERTION: relatedPosts item border-radius = ${itemRadiusNum}px (Expected <= 8px): ${itemRadiusNum <= 8 ? 'PASS' : 'FAIL'}`);
    console.log(`ASSERTION: relatedPosts item height = ${itemHeightNum}px (Expected <= 165px): ${itemHeightNum <= 165 ? 'PASS' : 'FAIL'}`);
    console.log(`ASSERTION: relatedPosts list gap = ${postAudit.relatedList.gap} (Expected <= 8px): ${parseInt(postAudit.relatedList.gap) <= 8 ? 'PASS' : 'FAIL'}`);
  }

  // Check Tablet view
  await page.setViewportSize({ width: 850, height: 900 });
  await page.waitForTimeout(300);
  const tabletAudit = await page.evaluate(() => {
    const item = document.querySelector('.relatedPosts-item');
    const list = document.querySelector('.relatedPosts-list');
    return {
      itemRadius: item ? window.getComputedStyle(item).borderRadius : 'N/A',
      itemHeight: item ? window.getComputedStyle(item).height : 'N/A',
      gridCols: list ? window.getComputedStyle(list).gridTemplateColumns : 'N/A',
      gap: list ? window.getComputedStyle(list).gap : 'N/A'
    };
  });
  console.log('\n=== TABLET (850px) AUDIT ===', JSON.stringify(tabletAudit, null, 2));

  // Check Mobile view
  await page.setViewportSize({ width: 400, height: 800 });
  await page.waitForTimeout(300);
  const mobileAudit = await page.evaluate(() => {
    const item = document.querySelector('.relatedPosts-item');
    const list = document.querySelector('.relatedPosts-list');
    return {
      itemRadius: item ? window.getComputedStyle(item).borderRadius : 'N/A',
      itemHeight: item ? window.getComputedStyle(item).height : 'N/A',
      gridCols: list ? window.getComputedStyle(list).gridTemplateColumns : 'N/A',
      gap: list ? window.getComputedStyle(list).gap : 'N/A'
    };
  });
  console.log('\n=== MOBILE (400px) AUDIT ===', JSON.stringify(mobileAudit, null, 2));

  // Screenshots for inspection
  await page.setViewportSize({ width: 1440, height: 900 });
  const relatedEl = await page.$('.relatedPosts');
  if (relatedEl) {
    await relatedEl.screenshot({ path: 'scratch/related-posts-desktop.png' });
    console.log('Saved screenshot: scratch/related-posts-desktop.png');
  }

  const asideEl = await page.$('#aside-content');
  if (asideEl) {
    await asideEl.screenshot({ path: 'scratch/aside-content-desktop.png' });
    console.log('Saved screenshot: scratch/aside-content-desktop.png');
  }

  await browser.close();
  server.close();
  console.log('\nAll tests completed successfully!');
});
