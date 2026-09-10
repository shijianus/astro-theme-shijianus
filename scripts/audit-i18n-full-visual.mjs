/**
 * Full Visual i18n Audit Script — v2
 * Tests all 6 locales across key pages for real layout issues.
 * False-positive exclusions:
 *   - .aside-title-icon--text spans (text icons, not SVG) — intentional design
 *   - Hidden elements (sidebar hidden on mobile) — correct behavior
 *   - body.scrollWidth when overflow-x:hidden is set (use documentElement.scrollWidth)
 *   - NAV scrollWidth from absolutely-positioned submenus (≤20px tolerated)
 *   - web_bg and closed theme-account-drawer
 */
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const LIVE_FLAG = process.argv.includes('--live');
const SCREENSHOTS = process.argv.includes('--screenshots');
const BASE_URL = LIVE_FLAG ? 'https://blog.epocanvas.com' : null;

const LOCALES = ['zh-CN', 'en', 'de', 'fr', 'es', 'zh-Hant'];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 390, height: 844 },
];

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/categories/', name: 'categories' },
  { path: '/archives/', name: 'archives' },
];
let POST_PATH = null;

const screenshotDir = path.join(ROOT, 'scripts/i18n-screenshots');
if (SCREENSHOTS) fs.mkdirSync(screenshotDir, { recursive: true });

function createStaticServer(distDir, port) {
  return new Promise((resolve) => {
    const mime = {
      '.html': 'text/html', '.js': 'application/javascript',
      '.css': 'text/css', '.json': 'application/json',
      '.png': 'image/png', '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
      '.woff2': 'font/woff2', '.woff': 'font/woff',
      '.ttf': 'font/ttf', '.webp': 'image/webp',
    };
    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      const filePath = path.join(distDir, urlPath);
      const ext = path.extname(filePath);
      const contentType = mime[ext] || 'application/octet-stream';
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const htmlPath = filePath + '.html';
        if (fs.existsSync(htmlPath)) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          fs.createReadStream(htmlPath).pipe(res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('Not found');
        }
      }
    });
    server.listen(port, () => resolve(server));
  });
}

async function switchLocale(page, locale) {
  if (locale === 'zh-CN') return;
  await page.evaluate((loc) => {
    const rt = window.__SHIJIANUS_LOCALE_RUNTIME__;
    if (rt && rt.applyLocaleVariant) rt.applyLocaleVariant(loc, { manual: true });
  }, locale);
  await page.waitForTimeout(700);
}

async function auditPage(page, url, locale, viewport, issues) {
  const label = `${locale}@${viewport.name}`;
  try {
    await page.goto(url, { waitUntil: LIVE_FLAG ? 'load' : 'networkidle', timeout: LIVE_FLAG ? 45000 : 30000 });
    await page.waitForTimeout(800);
    await switchLocale(page, locale);
    await page.waitForTimeout(800);

    // 1. Nav overflow — allow up to 20px from absolute submenus
    const navCheck = await page.evaluate(() => {
      const nav = document.getElementById('nav');
      if (!nav) return null;
      return { scrollWidth: nav.scrollWidth, clientWidth: nav.clientWidth };
    });
    if (navCheck && navCheck.scrollWidth > navCheck.clientWidth + 20) {
      issues.push(`[NAV-OVERFLOW] nav scrollW=${navCheck.scrollWidth} > clientW=${navCheck.clientWidth} (>${navCheck.clientWidth + 20})`);
    }

    // 2. Icon visibility — ONLY flag real SVG icons that are truly invisible
    //    Skip: elements with display:none parent (hidden sidebars on mobile)
    //    Skip: .aside-title-icon--text spans (text icons are by design)
    const iconCheck = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('.item-headline').forEach(hl => {
        // Skip if the headline or its parent is hidden (e.g. sidebar hidden on mobile)
        const hlRect = hl.getBoundingClientRect();
        if (hlRect.width === 0 && hlRect.height === 0) return; // Parent is hidden

        const icon = hl.querySelector('svg');
        const textIcon = hl.querySelector('.aside-title-icon--text');
        const spanText = hl.querySelector('span:not(.aside-title-icon, .aside-title-icon--text)');
        
        // If it has a text icon, skip this check — text icons are intentional
        if (textIcon) return;
        
        if (!icon) {
          // No SVG and no text icon — this is a real missing icon
          results.push({ text: spanText?.textContent?.trim().slice(0,30), issue: 'NO SVG or text-icon found' });
          return;
        }
        
        const rect = icon.getBoundingClientRect();
        const style = window.getComputedStyle(icon);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) {
          results.push({ text: spanText?.textContent?.trim().slice(0,30), issue: 'CSS-hidden' });
        } else if (rect.width < 2 || rect.height < 2) {
          // Check if parent is visible — if not, skip
          const parentStyle = window.getComputedStyle(hl.parentElement || hl);
          if (parentStyle.display !== 'none') {
            results.push({ text: spanText?.textContent?.trim().slice(0,30), issue: `tiny ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}` });
          }
        }
      });
      return results;
    });
    for (const ic of iconCheck) {
      issues.push(`[ICON-INVISIBLE] icon near "${ic.text}" — ${ic.issue}`);
    }

    // 3. Category card link height consistency
    const catCheck = await page.evaluate(() => {
      const list = document.querySelector('.card-categories .card-category-list');
      if (!list) return null;
      const items = Array.from(list.querySelectorAll('.card-category-list-item'));
      const heights = items.map(item => {
        const link = item.querySelector('.card-category-list-link');
        return link ? Math.round(link.getBoundingClientRect().height) : 0;
      }).filter(h => h > 0);
      if (!heights.length) return null;
      const maxH = Math.max(...heights), minH = Math.min(...heights);
      const overflows = items.filter(item => {
        const link = item.querySelector('.card-category-list-link');
        const cg = item.querySelector('.card-category-list-count-group');
        if (!link || !cg) return false;
        const lr = link.getBoundingClientRect();
        const cr = cg.getBoundingClientRect();
        return cr.width > lr.width + 4;
      }).length;
      return { maxH, minH, variance: maxH - minH, overflows, count: heights.length };
    });
    if (catCheck) {
      if (catCheck.variance > 18) {
        issues.push(`[CAT-HEIGHT-VARIANCE] category items variance=${catCheck.variance}px (${catCheck.minH}–${catCheck.maxH}px)`);
      }
      if (catCheck.overflows > 0) {
        issues.push(`[CAT-COUNT-OVERFLOW] ${catCheck.overflows} count-groups overflow`);
      }
    }

    // 4. Horizontal scroll — use documentElement.scrollWidth (respects overflow:hidden on body)
    const hScroll = await page.evaluate(() => ({
      docScrollW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 4
    }));
    if (hScroll.overflow) {
      issues.push(`[H-SCROLL] html scrollW=${hScroll.docScrollW} > winW=${hScroll.winW}`);
    }

    // 5. Headline icon-text vertical alignment (visible elements only)
    const alignCheck = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('.item-headline').forEach(hl => {
        const icon = hl.querySelector('svg, .aside-title-icon--text');
        const text = hl.querySelector('span:not(.aside-title-icon, .aside-title-icon--text)');
        if (!icon || !text) return;
        const ir = icon.getBoundingClientRect();
        const tr = text.getBoundingClientRect();
        if (ir.width < 2 || tr.width < 2) return; // skip hidden
        const iconCY = ir.top + ir.height / 2;
        const textCY = tr.top + tr.height / 2;
        const diff = Math.abs(iconCY - textCY);
        if (diff > 8) {
          results.push({ text: text.textContent?.trim().slice(0,25), diff: Math.round(diff) });
        }
      });
      return results;
    });
    for (const al of alignCheck) {
      issues.push(`[HEADLINE-MISALIGN] "${al.text}" icon/text diff=${al.diff}px`);
    }

    // 6. Category page tag-cloud overlap
    if (url.includes('/categories')) {
      const tagCheck = await page.evaluate(() => {
        const container = document.getElementById('tag-page-tags');
        if (!container) return null;
        const tags = Array.from(container.querySelectorAll('a'));
        if (!tags.length) return null;
        let overlaps = 0;
        const rects = tags.map(t => t.getBoundingClientRect());
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            const a = rects[i], b = rects[j];
            const xOverlap = a.left < b.right && a.right > b.left;
            const yOverlap = a.top < b.bottom && a.bottom > b.top;
            if (xOverlap && yOverlap) overlaps++;
          }
        }
        return { count: tags.length, overlaps };
      });
      if (tagCheck && tagCheck.overlaps > 0) {
        issues.push(`[TAG-CLOUD-OVERLAP] ${tagCheck.overlaps} tag overlaps`);
      }
    }

    // 7. Mobile: fixed elements x-overflow (skip intentional off-screen ones)
    if (viewport.name === 'mobile') {
      const fixedOverflow = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('*').forEach(el => {
          const s = window.getComputedStyle(el);
          if (s.position !== 'fixed' || s.display === 'none') return;
          // Skip known intentional off-screen elements
          if (el.id === 'web_bg') return; // Decorative tilted background
          const clsList = Array.from(el.classList).join(' ');
          if (clsList.includes('theme-account-drawer')) return; // Closed sliding drawer
          const r = el.getBoundingClientRect();
          if (r.right > window.innerWidth + 4) {
            results.push({ id: el.id || clsList.slice(0,30), right: Math.round(r.right), winW: window.innerWidth });
          }
        });
        return results;
      });
      for (const fe of fixedOverflow) {
        issues.push(`[MOBILE-FIXED-OVERFLOW] ${fe.id} right=${fe.right} > winW=${fe.winW}`);
      }
    }

    // 8. Screenshot
    if (SCREENSHOTS) {
      const pageName = url.replace(/https?:\/\/[^/]+/, '').replace(/[^a-z0-9]/gi, '_').slice(0,30) || 'home';
      const ssPath = path.join(screenshotDir, `${pageName}_${locale}_${viewport.name}.png`);
      await page.screenshot({ path: ssPath, fullPage: false });
    }

  } catch (err) {
    issues.push(`[ERROR] ${err.message}`);
  }
}

async function main() {
  console.log(`\n🌍 Full i18n Visual Audit v2 — ${LIVE_FLAG ? 'LIVE' : 'LOCAL'}`);
  console.log(`=`.repeat(60));

  let server = null;
  let baseUrl = BASE_URL;

  if (!LIVE_FLAG) {
    const distDir = path.join(ROOT, 'dist');
    if (!fs.existsSync(distDir)) {
      console.error('❌ dist/ not found. Run: npm run build'); process.exit(1);
    }
    const port = 4444;
    server = await createStaticServer(distDir, port);
    baseUrl = `http://localhost:${port}`;
    console.log(`📦 Serving dist/ on ${baseUrl}`);
    const postsDir = path.join(distDir, 'posts');
    if (fs.existsSync(postsDir)) {
      const slugDirs = fs.readdirSync(postsDir).filter(d =>
        fs.statSync(path.join(postsDir, d)).isDirectory() &&
        fs.existsSync(path.join(postsDir, d, 'index.html'))
      );
      if (slugDirs.length) {
        POST_PATH = `/posts/${slugDirs[0]}/`;
        PAGES.push({ path: POST_PATH, name: 'post' });
        console.log(`📝 Post sample: ${POST_PATH}`);
      }
    }
  } else {
    POST_PATH = '/posts/content-formats-and-markup-mastery/';
    PAGES.push({ path: POST_PATH, name: 'post' });
  }

  const browser = await chromium.launch({ headless: true });
  const allIssues = [];

  for (const viewport of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await ctx.newPage();
    for (const pageInfo of PAGES) {
      for (const locale of LOCALES) {
        const url = `${baseUrl}${pageInfo.path}`;
        const key = `${pageInfo.name}/${locale}/${viewport.name}`;
        const pageIssues = [];
        process.stdout.write(`  ${key}... `);
        await auditPage(page, url, locale, viewport, pageIssues);
        if (!pageIssues.length) {
          process.stdout.write(`✅\n`);
        } else {
          process.stdout.write(`❌ (${pageIssues.length})\n`);
          for (const issue of pageIssues) console.log(`    ↳ ${issue}`);
          allIssues.push(...pageIssues.map(i => `[${key}] ${i}`));
        }
      }
    }
    await ctx.close();
  }

  await browser.close();
  if (server) server.close();

  console.log(`\n${'='.repeat(60)}`);
  if (!allIssues.length) {
    console.log(`✅ AUDIT RESULT: 0 ISSUES FOUND`);
  } else {
    console.log(`❌ AUDIT RESULT: ${allIssues.length} ISSUES\n`);
    const cats = {};
    for (const issue of allIssues) {
      const cat = issue.match(/\[([A-Z_-]+)\]/g)?.[1]?.slice(1,-1) || 'OTHER';
      cats[cat] = (cats[cat] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(cats).sort((a,b) => b[1]-a[1])) {
      console.log(`  ${cat}: ${count}×`);
    }
  }
  return allIssues.length;
}

main().then(n => process.exit(n > 0 ? 1 : 0)).catch(err => { console.error(err); process.exit(1); });
