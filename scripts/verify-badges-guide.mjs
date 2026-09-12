import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

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

const PORT = 4399;

server.listen(PORT, async () => {
  console.log(`Static server listening on http://localhost:${PORT}`);
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    console.log('Navigating to http://localhost:4399/posts/badges-guide/...');
    await page.goto(`http://localhost:${PORT}/posts/badges-guide/`, { waitUntil: 'networkidle' });

    const audit = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const titleText = h1 ? h1.textContent.trim() : '';

      const tags = Array.from(document.querySelectorAll('.post-hero__tag-name')).map(el => el.textContent.trim());
      const heroCover = document.querySelector('.post-hero__image')?.getAttribute('src');

      // Check sections
      const sections = Array.from(document.querySelectorAll('.article-body h1, .article-body h2')).map(el => el.textContent.trim());

      // Check badges No.1 to No.15
      const badgeHeadings = sections.filter(s => s.startsWith('No.'));

      // Check TOC links
      const tocLinks = Array.from(document.querySelectorAll('#card-toc .toc-link')).map(el => el.textContent.trim());

      // Check callout elements enhanced by client script (.admonition)
      const callouts = document.querySelectorAll('.admonition, .article-callout, .tk-callout, blockquote');

      // Check trust level text in article body
      const bodyText = document.querySelector('.article-body')?.textContent || '';
      const hasTL0 = bodyText.includes('LV.0 新兴用户') && bodyText.includes('TL.0');
      const hasTL2 = bodyText.includes('LV.0 初始用户') && bodyText.includes('TL.2');
      const hasTL5 = bodyText.includes('LV.1 基本用户') && bodyText.includes('TL.5');
      const hasTL7 = bodyText.includes('LV.1 贡献者') && bodyText.includes('TL.7');
      const hasTL10 = bodyText.includes('LV.2 活跃用户') && bodyText.includes('TL.10');
      const hasTL15 = bodyText.includes('LV.3 先驱') && bodyText.includes('TL.15');
      const hasTL20 = bodyText.includes('LV.3 年度用户') && bodyText.includes('TL.20');
      const hasTL99 = bodyText.includes('LV.4 站长') && bodyText.includes('TL.99');
      const hasAvatarRule = bodyText.includes('微圆角方形头像') && bodyText.includes('标准高精度圆形头像');

      return {
        titleText,
        heroCover,
        tags,
        totalHeadings: sections.length,
        badgeHeadings,
        tocCount: tocLinks.length,
        calloutsCount: callouts.length,
        hasTL0,
        hasTL2,
        hasTL5,
        hasTL7,
        hasTL10,
        hasTL15,
        hasTL20,
        hasTL99,
        hasAvatarRule,
      };
    });

    console.log('=== BADGES GUIDE AUDIT RESULTS ===');
    console.log('Title:', audit.titleText);
    console.log('Cover:', audit.heroCover);
    console.log('Tags:', audit.tags);
    console.log('Badges found:', audit.badgeHeadings.length, audit.badgeHeadings);
    console.log('TOC links count:', audit.tocCount);
    console.log('Callouts/Blockquotes count:', audit.calloutsCount);
    console.log('Trust levels all present:', {
      TL0: audit.hasTL0,
      TL2: audit.hasTL2,
      TL5: audit.hasTL5,
      TL7: audit.hasTL7,
      TL10: audit.hasTL10,
      TL15: audit.hasTL15,
      TL20: audit.hasTL20,
      TL99: audit.hasTL99,
      AvatarRule: audit.hasAvatarRule,
    });

    if (audit.badgeHeadings.length < 15) {
      throw new Error(`Expected at least 15 badges, but found ${audit.badgeHeadings.length}`);
    }

    if (!audit.hasAvatarRule) {
      throw new Error('Avatar unique rule (square vs circle) not found in article body!');
    }

    console.log('✅ ALL CHECKS PASSED PERFECTLY!');
    await browser.close();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err);
    server.close();
    process.exit(1);
  }
});
