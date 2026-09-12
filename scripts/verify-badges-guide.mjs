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

    // Wait for client scripts to render Mermaid diagrams and enhancements
    await page.waitForTimeout(1500);

    const audit = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      const titleText = h1 ? h1.textContent.trim() : '';

      const tags = Array.from(document.querySelectorAll('.post-hero__tag-name')).map(el => el.textContent.trim());
      const heroCover = document.querySelector('.post-hero__image')?.getAttribute('src');

      // Check sections
      const sections = Array.from(document.querySelectorAll('.article-body h1, .article-body h2, .article-body h3')).map(el => el.textContent.trim());

      // Check badges No.1 to No.16
      const badgeHeadings = sections.filter(s => s.startsWith('No.'));

      // Check TOC links
      const tocLinks = Array.from(document.querySelectorAll('#card-toc .toc-link')).map(el => el.textContent.trim());

      // Check callout elements enhanced by client script (.admonition)
      const callouts = document.querySelectorAll('.admonition, .article-callout, .tk-callout, blockquote');

      // Check article body
      const bodyText = document.querySelector('.article-body')?.textContent || '';

      // Check forbidden words (zero tolerance)
      const hasForbiddenWord = /linuxdo/i.test(bodyText);

      // Check core ladder titles
      const titles = [
        '新兴用户',
        '初始用户',
        '基本用户',
        '贡献者',
        '思辨学者',
        '活跃用户',
        '常青极客',
        '先驱',
        '年度用户',
        '墨海宗师',
        '社区管理员',
        '站长',
      ];
      const titlesPresent = titles.every(t => bodyText.includes(t));

      // Check LV vs TL logic
      const hasLVGateRule = bodyText.includes('准入门槛') || bodyText.includes('最低等级');
      const hasTLWeightRule = bodyText.includes('排名权重') || bodyText.includes('权威度');
      const hasWaterfallRule = bodyText.includes('瀑布') || bodyText.includes('严禁越级');
      const hasMaxTLCapRule = bodyText.includes('Max TL Cap') || bodyText.includes('最高信任等级上限');

      // Check avatar distinction
      const hasSquareAvatarRule = bodyText.includes('微圆角方形头像') && bodyText.includes('金色皇冠');
      const hasCircularAvatarRule = bodyText.includes('标准高精度圆形头像');

      // Check Webmaster TL 100 vs Admin TL 91~99
      const hasTL100 = bodyText.includes('TL.100') || bodyText.includes('TL: 100');
      const hasTLAdmin = bodyText.includes('91') && bodyText.includes('99');

      // Check Mermaid wrap
      const mermaidWrap = document.querySelector('.mermaid-diagram-wrap, .mermaid, pre.mermaid');
      const mermaidExists = Boolean(mermaidWrap);

      return {
        titleText,
        heroCover,
        tags,
        totalHeadings: sections.length,
        badgeHeadings,
        tocCount: tocLinks.length,
        calloutsCount: callouts.length,
        hasForbiddenWord,
        titlesPresent,
        hasLVGateRule,
        hasTLWeightRule,
        hasWaterfallRule,
        hasMaxTLCapRule,
        hasSquareAvatarRule,
        hasCircularAvatarRule,
        hasTL100,
        hasTLAdmin,
        mermaidExists,
      };
    });

    console.log('=== BADGES GUIDE AUDIT RESULTS ===');
    console.log('Title:', audit.titleText);
    console.log('Cover:', audit.heroCover);
    console.log('Tags:', audit.tags);
    console.log('Badges found:', audit.badgeHeadings.length, audit.badgeHeadings);
    console.log('TOC links count:', audit.tocCount);
    console.log('Callouts/Blockquotes count:', audit.calloutsCount);
    console.log('Audit checks:', {
      hasForbiddenWord: audit.hasForbiddenWord,
      titlesPresent: audit.titlesPresent,
      hasLVGateRule: audit.hasLVGateRule,
      hasTLWeightRule: audit.hasTLWeightRule,
      hasWaterfallRule: audit.hasWaterfallRule,
      hasMaxTLCapRule: audit.hasMaxTLCapRule,
      hasSquareAvatarRule: audit.hasSquareAvatarRule,
      hasCircularAvatarRule: audit.hasCircularAvatarRule,
      hasTL100: audit.hasTL100,
      hasTLAdmin: audit.hasTLAdmin,
      mermaidExists: audit.mermaidExists,
    });

    if (audit.hasForbiddenWord) {
      throw new Error('FATAL: Forbidden word detected in badges guide!');
    }

    if (!audit.titlesPresent) {
      throw new Error('Not all 11 ladder titles + Admin + 站长 were found in article body!');
    }

    if (!audit.hasLVGateRule || !audit.hasTLWeightRule) {
      throw new Error('LV content gate vs TL ranking weight dual-track rule missing!');
    }

    if (!audit.hasWaterfallRule || !audit.hasMaxTLCapRule) {
      throw new Error('Waterfall prerequisite chain and Max TL Cap rules missing!');
    }

    if (!audit.hasSquareAvatarRule || !audit.hasCircularAvatarRule) {
      throw new Error('Avatar distinction (Webmaster square vs Admin/Readers circle) missing!');
    }

    if (!audit.hasTL100 || !audit.hasTLAdmin) {
      throw new Error('Webmaster TL.100 and Admin TL.91~99 distinction missing!');
    }

    if (audit.badgeHeadings.length < 15) {
      throw new Error(`Expected at least 15 badges, but found ${audit.badgeHeadings.length}`);
    }

    console.log('✅ ALL CHECKS PASSED WITH FLYING COLORS!');
    await browser.close();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err);
    server.close();
    process.exit(1);
  }
});
