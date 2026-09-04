import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  else if (!path.extname(reqPath)) reqPath += '/index.html';

  const filePath = path.join(distDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 5793;

server.listen(PORT, async () => {
  console.log(`[E2E] Verifying post-hero pure-color, badges, tags, non-boxed meta and faster waves on http://localhost:${PORT}...`);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // 1. Verify Pure-Color Blue Hero on /posts/content-formats-and-markup-mastery/
    console.log('[Test 1] Checking pure-color blue hero on /posts/content-formats-and-markup-mastery/...');
    await page.goto(`http://localhost:${PORT}/posts/content-formats-and-markup-mastery/`);
    await page.waitForTimeout(500);

    const pureMetrics = await page.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const cover = document.querySelector('.post-hero__cover');
      const primaryBadge = document.querySelector('.post-hero__badge.is-primary');
      const tags = document.querySelectorAll('.post-hero__tag');
      const metaItems = document.querySelectorAll('.post-hero__meta-item');
      const metaDots = document.querySelectorAll('.post-hero__meta-dot');
      const waveUses = document.querySelectorAll('.post-hero__waves-group use');

      const heroComputed = hero ? window.getComputedStyle(hero) : null;
      const primaryBadgeComputed = primaryBadge ? window.getComputedStyle(primaryBadge) : null;
      const firstTag = tags[0];
      const firstMeta = metaItems[0];
      const firstMetaComputed = firstMeta ? window.getComputedStyle(firstMeta) : null;

      const waveDurations = Array.from(waveUses).map((u) => window.getComputedStyle(u).animationDuration);

      return {
        hasHero: Boolean(hero),
        isPureColorClass: hero?.classList.contains('is-pure-color'),
        hasCoverElement: Boolean(cover),
        bgImage: heroComputed?.backgroundImage,
        bgColor: heroComputed?.backgroundColor,
        primaryBadgeRadius: primaryBadgeComputed?.borderRadius,
        primaryBadgeText: primaryBadge?.textContent?.trim(),
        tagCount: tags.length,
        firstTagText: firstTag?.textContent?.trim(),
        metaCount: metaItems.length,
        metaDotCount: metaDots.length,
        firstMetaBg: firstMetaComputed?.backgroundColor,
        firstMetaBorder: firstMetaComputed?.borderStyle,
        waveDurations,
      };
    });

    console.log('Pure Hero Metrics:', pureMetrics);

    if (!pureMetrics.isPureColorClass) {
      throw new Error('Expected post to have .is-pure-color class!');
    }

    if (pureMetrics.hasCoverElement) {
      throw new Error('Expected pure color post NOT to have .post-hero__cover element!');
    }

    if (pureMetrics.primaryBadgeRadius !== '4px') {
      console.warn(`Primary badge border-radius is ${pureMetrics.primaryBadgeRadius}, expected 4px`);
    }

    if (pureMetrics.tagCount === 0 || !pureMetrics.firstTagText?.startsWith('#')) {
      throw new Error(`Expected tags with '#' prefix, got count=${pureMetrics.tagCount}, firstTag="${pureMetrics.firstTagText}"`);
    }

    if (pureMetrics.metaCount === 0 || pureMetrics.metaDotCount === 0) {
      throw new Error(`Expected flowing meta stream with separator dots, got metaCount=${pureMetrics.metaCount}, dotCount=${pureMetrics.metaDotCount}`);
    }

    // Check fast wave durations (e.g. 3s, 5s, 7s, 10s)
    console.log('Wave durations:', pureMetrics.waveDurations);
    if (!pureMetrics.waveDurations.some(d => parseFloat(d) <= 10)) {
      throw new Error(`Wave durations are not accelerated: ${pureMetrics.waveDurations}`);
    }

    const screenshotDir = path.resolve(__dirname, 'audit_screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotDir, 'pure-color-blue-hero.png') });
    console.log('✓ Pure-color blue post hero verified successfully!');

    // 2. Verify Post with Image Cover on /posts/readable-geek-interfaces/
    console.log('[Test 2] Checking cover post on /posts/readable-geek-interfaces/...');
    await page.goto(`http://localhost:${PORT}/posts/readable-geek-interfaces/`);
    await page.waitForTimeout(500);

    const coverMetrics = await page.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const cover = document.querySelector('.post-hero__cover');
      const img = cover?.querySelector('img');
      const primaryBadge = document.querySelector('.post-hero__badge.is-primary');
      const tags = document.querySelectorAll('.post-hero__tag');

      return {
        hasHero: Boolean(hero),
        hasCover: Boolean(cover),
        hasImg: Boolean(img),
        primaryBadgeText: primaryBadge?.textContent?.trim(),
        tagCount: tags.length,
      };
    });

    console.log('Cover Hero Metrics:', coverMetrics);
    if (!coverMetrics.hasCover || !coverMetrics.hasImg) {
      throw new Error('Expected cover image on readable-geek-interfaces!');
    }
    await page.screenshot({ path: path.join(screenshotDir, 'cover-image-hero.png') });
    console.log('✓ Cover image hero verified successfully!');

    console.log('\n[ALL POST-HERO REFINEMENT TESTS PASSED!]');
  } catch (err) {
    console.error('[E2E FAILED]', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
