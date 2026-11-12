import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function createStaticServer() {
  return http.createServer((req, res) => {
    const rawUrl = req.url || '/';
    let reqPath = decodeURIComponent(rawUrl.split('?')[0]);

    // Mock /api/comments endpoint for static audit server
    if (reqPath === '/api/comments') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, comments: [] }));
      return;
    }

    if (reqPath.endsWith('/')) reqPath += 'index.html';
    else if (!path.extname(reqPath)) reqPath += '/index.html';

    const filePath = path.join(distDir, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
}

const PORT = 5799;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runAudit() {
  const server = createStaticServer();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`[Hexo Parity & Full Blog Audit] Static server listening on ${BASE_URL}...`);

  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' });
    const page = await context.newPage();

    // =========================================================================
    // TEST 1: Hexo Native Tag Plugins + Cover Dominant Color + Comment Barrage
    // =========================================================================
    console.log('[1/4] Navigating to /posts/anzhiyu-markdown-showcase/...');
    await page.goto(`${BASE_URL}/posts/anzhiyu-markdown-showcase/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(800);

    const showcaseAudit = await page.evaluate(() => {
      const hero = document.querySelector('[data-post-hero]');
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      const article = document.querySelector('#article-container');

      // Check for any unparsed {% ... %} outside of code/pre
      const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (node.parentElement?.closest('pre, code')) return NodeFilter.FILTER_REJECT;
          return /\{%\s*\w+/.test(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      const leakedTags = [];
      while (walker.nextNode()) {
        leakedTags.push(walker.currentNode.nodeValue.trim());
      }

      return {
        dominantColor: hero?.getAttribute('data-dominant-color') || '',
        dominantCssVar: hero ? hero.style.getPropertyValue('--post-hero-dominant-color').trim() : '',
        dominantRgbVar: hero ? hero.style.getPropertyValue('--post-hero-dominant-rgb').trim() : '',
        metaThemeColor: metaTheme?.getAttribute('content') || '',
        hexoTags: {
          note: Boolean(article?.querySelector('[data-hexo-tag="note"]')),
          folding: Boolean(article?.querySelector('[data-hexo-tag="folding"]')),
          tabs: Boolean(article?.querySelector('[data-hexo-tag="tabs"]')),
          timeline: Boolean(article?.querySelector('[data-hexo-tag="timeline"]')),
          label: Boolean(article?.querySelector('[data-hexo-tag="label"]')),
          u: Boolean(article?.querySelector('[data-hexo-tag="u"]')),
          emp: Boolean(article?.querySelector('[data-hexo-tag="emp"]')),
          wavy: Boolean(article?.querySelector('[data-hexo-tag="wavy"]')),
          kbd: Boolean(article?.querySelector('[data-hexo-tag="kbd"]')),
          psw: Boolean(article?.querySelector('[data-hexo-tag="psw"]')),
          hideInline: Boolean(article?.querySelector('[data-hexo-tag="hideInline"]')),
          checkbox: article?.querySelectorAll('[data-hexo-tag="checkbox"]').length || 0,
          btn: Boolean(article?.querySelector('[data-hexo-tag="btn"]')),
          link: Boolean(article?.querySelector('[data-hexo-tag="link"]')),
        },
        leakedTags,
      };
    });

    console.log('[1/4] Showcase & Hexo Tag Audit:', JSON.stringify(showcaseAudit, null, 2));

    if (!/^#[0-9a-f]{6}$/i.test(showcaseAudit.dominantColor)) {
      throw new Error(`Expected valid hex data-dominant-color on post-hero, got: "${showcaseAudit.dominantColor}"`);
    }
    if (!showcaseAudit.dominantCssVar || !showcaseAudit.dominantRgbVar) {
      throw new Error('Expected --post-hero-dominant-color and --post-hero-dominant-rgb to be populated!');
    }
    if (showcaseAudit.metaThemeColor !== showcaseAudit.dominantColor) {
      throw new Error(`Expected meta[name="theme-color"] (${showcaseAudit.metaThemeColor}) to match dominantColor (${showcaseAudit.dominantColor})`);
    }
    if (showcaseAudit.leakedTags.length > 0) {
      throw new Error(`Found leaked unparsed Hexo tags in article body: ${JSON.stringify(showcaseAudit.leakedTags)}`);
    }
    for (const [k, v] of Object.entries(showcaseAudit.hexoTags)) {
      if (!v) {
        throw new Error(`Hexo tag "${k}" failed to compile/render in anzhiyu-markdown-showcase!`);
      }
    }

    // Test interactive Hexo tags: hideInline, psw, tabs
    await page.click('[data-hexo-tag="hideInline"] .hide-button');
    await page.click('psw[data-hexo-tag="psw"]');
    await page.click('[data-hexo-tag="tabs"] .article-tabs__button:nth-child(2)');

    const interactiveHexoState = await page.evaluate(() => {
      const hideInline = document.querySelector('[data-hexo-tag="hideInline"]');
      const hideContent = hideInline?.querySelector('.hide-content');
      const psw = document.querySelector('psw[data-hexo-tag="psw"]');
      const secondTabPanel = document.querySelector('[data-hexo-tag="tabs"] .article-tabs__panel:nth-child(2)');
      return {
        hideInlineOpen: hideInline?.classList.contains('open'),
        hideContentDisplay: hideContent ? window.getComputedStyle(hideContent).display : 'none',
        pswVisible: psw?.classList.contains('is-visible'),
        secondTabActive: secondTabPanel?.classList.contains('is-active'),
      };
    });

    console.log('[1/4] Interactive Hexo Tags State:', interactiveHexoState);
    if (!interactiveHexoState.hideInlineOpen || interactiveHexoState.hideContentDisplay === 'none') {
      throw new Error('Hexo hideInline failed to open on click!');
    }
    if (!interactiveHexoState.pswVisible) {
      throw new Error('Hexo psw spoiler failed to reveal on click!');
    }
    if (!interactiveHexoState.secondTabActive) {
      throw new Error('Hexo tabs failed to switch panel on click!');
    }

    // =========================================================================
    // TEST 2: Comment Barrage (热评悬浮弹幕) & Right-Click Menu / Scroll Avoidance
    // =========================================================================
    console.log('[2/4] Verifying Comment Barrage & Right-Click Menu Toggle...');
    const barrageAudit = await page.evaluate(() => {
      const barrageDom = document.getElementById('comment-barrage');
      if (!barrageDom || !window.anzhiyu || typeof window.anzhiyu.setCommentBarrageList !== 'function') {
        return { mounted: false };
      }

      // Feed real-shaped comment list to verify barrage card rendering
      window.anzhiyu.setCommentBarrageList([
        {
          id: 101,
          author: 'shijianus',
          role: 'admin',
          avatar: '/media/shijianus/avatar.jpg',
          message: '欢迎体验安知鱼原生风格热评弹幕组件！```ts\nconst a = 1;\n```',
        },
      ]);

      const item = barrageDom.querySelector('.comment-barrage-item');
      const titleEl = item?.querySelector('.barrageTitle');
      const contentEl = item?.querySelector('.barrageContent');

      // Toggle off via switchCommentBarrage
      const afterOff = window.anzhiyu.switchCommentBarrage(false);
      const storageAfterOff = window.localStorage.getItem('commentBarrageSwitch');
      const menuTextAfterOff = document.querySelector('.menu-commentBarrage-text')?.textContent?.trim();

      // Toggle back on
      const afterOn = window.anzhiyu.switchCommentBarrage(true);
      const storageAfterOn = window.localStorage.getItem('commentBarrageSwitch');
      const menuTextAfterOn = document.querySelector('.menu-commentBarrage-text')?.textContent?.trim();

      return {
        mounted: true,
        hasItem: Boolean(item),
        isBloggerBadge: Boolean(titleEl?.classList.contains('barrageBloggerTitle')),
        badgeText: titleEl?.textContent?.trim(),
        contentText: contentEl?.textContent?.trim(),
        afterOff,
        storageAfterOff,
        menuTextAfterOff,
        afterOn,
        storageAfterOn,
        menuTextAfterOn,
      };
    });

    console.log('[2/4] Comment Barrage Audit:', barrageAudit);
    if (!barrageAudit.mounted || !barrageAudit.hasItem) {
      throw new Error('Comment Barrage failed to mount or pop item!');
    }
    if (!barrageAudit.isBloggerBadge || barrageAudit.badgeText !== '博主') {
      throw new Error(`Expected blogger badge '博主', got: "${barrageAudit.badgeText}"`);
    }
    if (!barrageAudit.contentText?.includes('【代码】')) {
      throw new Error(`Expected code block in barrage to be sanitized to 【代码】, got: "${barrageAudit.contentText}"`);
    }
    if (barrageAudit.afterOff !== false || barrageAudit.storageAfterOff !== 'false' || barrageAudit.menuTextAfterOff !== '显示热评') {
      throw new Error('Comment Barrage toggle OFF state mismatch!');
    }
    if (barrageAudit.afterOn !== true || barrageAudit.storageAfterOn !== 'true' || barrageAudit.menuTextAfterOn !== '关闭热评') {
      throw new Error('Comment Barrage toggle ON state mismatch!');
    }

    // Scroll to #post-comment and verify barrage auto-hides
    await page.evaluate(() => {
      document.getElementById('post-comment')?.scrollIntoView({ behavior: 'instant', block: 'center' });
      window.dispatchEvent(new Event('scroll'));
    });
    await page.waitForTimeout(600);
    const barrageAtCommentState = await page.evaluate(() => {
      const dom = document.getElementById('comment-barrage');
      if (!dom) return null;
      const style = window.getComputedStyle(dom);
      return {
        intersectingAttr: dom.getAttribute('data-comment-intersecting'),
        opacity: style.opacity,
        visibility: style.visibility,
      };
    });
    console.log('[2/4] Barrage state at #post-comment:', barrageAtCommentState);
    if (
      !barrageAtCommentState ||
      barrageAtCommentState.intersectingAttr !== 'true' ||
      Number(barrageAtCommentState.opacity) > 0.05 ||
      barrageAtCommentState.visibility !== 'hidden'
    ) {
      throw new Error(`Expected #comment-barrage to auto-hide when #post-comment is in viewport, got: ${JSON.stringify(barrageAtCommentState)}`);
    }

    // =========================================================================
    // TEST 3: Pure-Color Hero & Master Formats (/posts/content-formats-and-markup-mastery/)
    // =========================================================================
    console.log('[3/4] Checking /posts/content-formats-and-markup-mastery/...');
    await page.goto(`${BASE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1000);

    const masteryAudit = await page.evaluate(() => {
      const hero = document.querySelector('[data-post-hero]');
      return {
        isPureColor: hero?.classList.contains('is-pure-color'),
        dominantColor: hero?.getAttribute('data-dominant-color'),
        katexCount: document.querySelectorAll('.katex').length,
        admonitionCount: document.querySelectorAll('.admonition, .admonition-details').length,
        dropdownCount: document.querySelectorAll('.article-dropdown-switcher').length,
        unitConverterCount: document.querySelectorAll('.unit-converter-card').length,
        mindmapCount: document.querySelectorAll('.mindmap-wrapper').length,
        encryptedBoxCount: document.querySelectorAll('.article-encrypted-box').length,
      };
    });

    console.log('[3/4] Content Formats Mastery Audit:', masteryAudit);
    if (!masteryAudit.isPureColor || masteryAudit.dominantColor !== '#425aef') {
      throw new Error(`Expected pure-color hero with #425aef, got: ${JSON.stringify(masteryAudit)}`);
    }
    if (
      masteryAudit.katexCount === 0 ||
      masteryAudit.admonitionCount < 10 ||
      masteryAudit.dropdownCount === 0 ||
      masteryAudit.mindmapCount === 0 ||
      masteryAudit.encryptedBoxCount === 0
    ) {
      throw new Error(`Mastery features missing: ${JSON.stringify(masteryAudit)}`);
    }

    // =========================================================================
    // TEST 4: Mermaid 11 & Code Block Mac Enhancer (/posts/markdown-syntax-mastery/)
    // =========================================================================
    console.log('[4/4] Checking /posts/markdown-syntax-mastery/...');
    await page.goto(`${BASE_URL}/posts/markdown-syntax-mastery/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1200);

    const syntaxAudit = await page.evaluate(() => {
      const uncheckedTasks = document.querySelectorAll('.article-body input[type="checkbox"]:not(:checked)');
      return {
        mermaidSvgCount: document.querySelectorAll('.mermaid-diagram-wrap svg').length,
        codeMacHeaderCount: document.querySelectorAll('.code-block-header, .mac-code-header, pre[data-code-enhanced="true"]').length,
        uncheckedTaskCount: uncheckedTasks.length,
      };
    });

    console.log('[4/4] Markdown Syntax Mastery Audit:', syntaxAudit);
    if (syntaxAudit.mermaidSvgCount === 0) {
      throw new Error('Expected Mermaid 11 diagrams to render SVG elements!');
    }
    if (syntaxAudit.uncheckedTaskCount !== 0) {
      throw new Error(`Expected all task list items in markdown-syntax-mastery.md to be checked, found ${syntaxAudit.uncheckedTaskCount} unchecked!`);
    }

    console.log('✅ ALL 4 FULL-LINK E2E BROWSER AUDITS PASSED 100%!');
  } finally {
    await browser.close();
    server.close();
  }
}

runAudit().catch((err) => {
  console.error('❌ Audit Failed:', err);
  process.exit(1);
});
