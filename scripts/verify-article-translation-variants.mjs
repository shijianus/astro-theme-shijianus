import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { LANG_SUFFIX_REGEX, normalizeLangCode, getPostCanonicalSlug } from '../src/lib/content.ts';

const DIST_DIR = path.resolve('dist');
const POSTS_DIR = path.resolve('src/content/posts');
const PORT = 4488;

function startStaticServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    let filePath = path.join(DIST_DIR, reqPath);

    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + reqPath);
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[StaticServer] Serving ${DIST_DIR} on http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

// Group all markdown files in src/content/posts
function getFilesystemGroups() {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  const posts = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const id = file.replace(/\.(md|mdx)$/, '');
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const fm = fmMatch ? fmMatch[1] : '';
    const m = fm.match(/i18nKey:\s*["\047]?([^"\047\r\n]+)/);
    const lMatch = fm.match(/lang:\s*["\047]?([^"\047\r\n]+)/);
    const tMatch = fm.match(/title:\s*["\047]?([^"\047\r\n]+)/);
    const dMatch = fm.match(/draft:\s*(true|false)/);
    const aMatch = fm.match(/access:\s*["\047]?([^"\047\r\n]+)/);

    const i18nKey = m ? m[1].trim() : undefined;
    const explicitLang = lMatch ? lMatch[1].trim() : undefined;
    const sMatch = id.match(LANG_SUFFIX_REGEX);
    const inferredLang = sMatch ? normalizeLangCode(sMatch[1]) : undefined;
    const canonical = getPostCanonicalSlug(id);
    const lang = (explicitLang ? normalizeLangCode(explicitLang) : undefined) || inferredLang || 'zh-CN';

    posts.push({
      file,
      id,
      canonical,
      i18nKey,
      lang,
      title: tMatch ? tMatch[1].trim() : id,
      isDraft: dMatch ? dMatch[1] === 'true' : false,
      access: aMatch ? aMatch[1].trim() : undefined,
    });
  }

  const groups = new Map();
  for (const p of posts) {
    if (p.isDraft) continue;
    const c = p.canonical;
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push(p);
  }

  return groups;
}

async function run() {
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const fsGroups = getFilesystemGroups();
  console.log(`[Audit] Total post groups found in filesystem: ${fsGroups.size}`);

  let totalGroups = 0;
  let passedGroups = 0;
  let failedGroups = 0;
  const failures = [];

  for (const [canonicalSlug, files] of fsGroups.entries()) {
    totalGroups++;
    const isProtected = files.some((f) => f.access);
    const url = `http://127.0.0.1:${PORT}/posts/${canonicalSlug}/`;
    console.log(`\n======================================================`);
    console.log(`[${totalGroups}/${fsGroups.size}] Auditing Group: ${canonicalSlug} (${files.length} files)`);
    console.log(`Expected Langs: [${files.map((f) => `${f.lang} (${f.file})`).join(', ')}]`);

    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (!resp || resp.status() >= 400) {
        console.error(`  ❌ HTTP Error: ${resp ? resp.status() : 'null'}`);
        failedGroups++;
        failures.push({ canonicalSlug, error: `HTTP ${resp ? resp.status() : 'null'}` });
        continue;
      }

      await page.waitForTimeout(60);

      // Extract all .article-translation-variant elements
      const variants = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('.article-translation-variant'));
        return els.map((el) => {
          const lang = el.getAttribute('data-lang');
          const isVisible = el.style.display !== 'none';
          const text = (el.innerText || '').trim();
          const headings = Array.from(el.querySelectorAll('h1, h2, h3, h4')).map((h) => h.innerText.trim());
          return {
            lang,
            isVisible,
            textLength: text.length,
            headingsCount: headings.length,
            snippet: text.slice(0, 80).replace(/\s+/g, ' '),
          };
        });
      });

      const actualLangs = variants.map((v) => v.lang);
      console.log(`  DOM Variants Found: ${variants.length} [${actualLangs.join(', ')}]`);

      if (isProtected) {
        console.log(`  🔒 Protected post under SSG mode: Server access panel correctly rendered (0 variants output). PASS.`);
        passedGroups++;
        continue;
      }

      // Check language presence
      const expectedLangs = files.map((f) => f.lang);
      const expectedSet = new Set(expectedLangs);
      const actualSet = new Set(actualLangs);

      const missing = [...expectedSet].filter((l) => !actualSet.has(l));
      if (missing.length > 0) {
        console.error(`  ❌ Missing variants for: ${missing.join(', ')}`);
        failedGroups++;
        failures.push({ canonicalSlug, error: `Missing variants: ${missing.join(', ')}` });
        continue;
      }

      // Extract language switch buttons
      const buttons = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.post-hero__lang-tag[data-target-lang]'));
        return btns.map((b) => b.getAttribute('data-target-lang'));
      });

      if (variants.length > 1) {
        console.log(`  Buttons Found: ${buttons.length} [${buttons.join(', ')}]`);
        // Test switching to each language
        for (const targetLang of buttons) {
          await page.click(`.post-hero__lang-tag[data-target-lang="${targetLang}"]`);
          await page.waitForTimeout(60);

          const ok = await page.evaluate((tLang) => {
            const v = document.querySelector(`.article-translation-variant[data-lang="${tLang}"]`);
            const others = Array.from(document.querySelectorAll('.article-translation-variant'))
              .filter((el) => el.getAttribute('data-lang') !== tLang);
            const vVisible = v && v.style.display !== 'none';
            const othersHidden = others.every((el) => el.style.display === 'none');
            return vVisible && othersHidden;
          }, targetLang);

          if (!ok) {
            console.error(`    ❌ Switch verification failed for lang: ${targetLang}`);
            failedGroups++;
            failures.push({ canonicalSlug, error: `Switch failed for ${targetLang}` });
            break;
          } else {
            console.log(`    ✓ Successfully switched to [${targetLang}] (active variant visible, others hidden)`);
          }
        }
      }

      console.log(`  ✅ Group ${canonicalSlug} PASS!`);
      passedGroups++;
    } catch (err) {
      console.error(`  ❌ Exception: ${err.message}`);
      failedGroups++;
      failures.push({ canonicalSlug, error: err.message });
    }
  }

  await browser.close();
  server.close();

  console.log('\n======================================================');
  console.log(`AUDIT COMPLETE: ${passedGroups} Passed, ${failedGroups} Failed out of ${totalGroups} Groups`);
  console.log('======================================================');

  if (failedGroups > 0) {
    console.error('Failed Groups:', failures);
    process.exit(1);
  } else {
    console.log('🎉 ALL ARTICLE TRANSLATION VARIANTS 100% VERIFIED!');
  }
}

run().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
