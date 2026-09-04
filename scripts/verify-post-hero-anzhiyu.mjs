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

const PORT = 5792;

server.listen(PORT, async () => {
  console.log(`[E2E] Verifying post-hero, cover, animated waves and cards on http://localhost:${PORT}...`);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    // 1. Verify Home Page Post Cards have guaranteed images
    console.log('[Test 1] Checking homepage cards for guaranteed <img> elements...');
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForTimeout(500);

    const cards = await page.$$('.recent-post-item');
    console.log(`Found ${cards.length} cards on home feed.`);
    for (let i = 0; i < cards.length; i++) {
      const img = await cards[i].$('img');
      if (!img) {
        throw new Error(`Card at index ${i} is missing an <img> element!`);
      }
      const src = await img.getAttribute('src');
      if (!src) {
        throw new Error(`Card at index ${i} has an empty src attribute!`);
      }
    }
    console.log('✓ All post cards have valid <img> elements with cover or default fallback.');

    // 2. Verify Post Page Hero Layout and Dimensions
    console.log('[Test 2] Checking post-hero dimensions and layout on /posts/readable-geek-interfaces/...');
    await page.goto(`http://localhost:${PORT}/posts/readable-geek-interfaces/`);
    await page.waitForTimeout(500);

    const heroMetrics = await page.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const cover = document.querySelector('.post-hero__cover');
      const inner = document.querySelector('.post-hero__inner');
      const titleBlock = document.querySelector('.post-hero__title-block');
      const lede = document.querySelector('.post-hero__lede');
      const waves = document.querySelector('.post-hero__waves');
      const waveUseElements = document.querySelectorAll('.post-hero__waves-group use');

      const heroRect = hero?.getBoundingClientRect();
      const coverRect = cover?.getBoundingClientRect();
      const innerRect = inner?.getBoundingClientRect();
      const titleRect = titleBlock?.getBoundingClientRect();
      const ledeRect = lede?.getBoundingClientRect();

      const waveUseAnimations = Array.from(waveUseElements).map((el) => {
        const computed = window.getComputedStyle(el);
        return {
          animationName: computed.animationName,
          animationPlayState: computed.animationPlayState,
          animationDuration: computed.animationDuration,
        };
      });

      return {
        heroHeight: heroRect?.height,
        heroWidth: heroRect?.width,
        coverHeight: coverRect?.height,
        coverWidth: coverRect?.width,
        innerWidth: innerRect?.width,
        titleWidth: titleRect?.width,
        ledeWidth: ledeRect?.width,
        wavesPresent: Boolean(waves),
        waveCount: waveUseElements.length,
        waveUseAnimations,
      };
    });

    console.log('Hero Metrics:', heroMetrics);

    // Assertions
    if (!heroMetrics.heroHeight || heroMetrics.heroHeight < 360 || heroMetrics.heroHeight > 480) {
      throw new Error(`Invalid post-hero height: ${heroMetrics.heroHeight}px (expected 360px~480px consistent)`);
    }

    if (!heroMetrics.coverHeight || Math.abs(heroMetrics.coverHeight - heroMetrics.heroHeight) > 5) {
      throw new Error(`post-hero__cover is not matching hero height: cover=${heroMetrics.coverHeight}, hero=${heroMetrics.heroHeight}`);
    }

    if (!heroMetrics.innerWidth || heroMetrics.innerWidth < 1000) {
      throw new Error(`post-hero__inner width is too constrained: ${heroMetrics.innerWidth}px`);
    }

    if (!heroMetrics.titleWidth || heroMetrics.titleWidth < 800) {
      throw new Error(`post-hero__title-block width is too constrained: ${heroMetrics.titleWidth}px`);
    }

    if (!heroMetrics.wavesPresent || heroMetrics.waveCount !== 4) {
      throw new Error(`post-hero__waves SVG wave elements not found or count is ${heroMetrics.waveCount}`);
    }

    for (const anim of heroMetrics.waveUseAnimations) {
      if (!anim.animationName || anim.animationName === 'none') {
        throw new Error(`Wave animation is disabled or 'none'! ${JSON.stringify(anim)}`);
      }
    }
    console.log('✓ Post hero dimensions, wide inner layout, and active water wave animations verified successfully!');

    // 3. Take screenshot for review
    const screenshotDir = path.resolve(__dirname, 'audit_screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotDir, 'post-hero-desktop.png') });

    // 4. Test Mobile viewport
    console.log('[Test 3] Checking mobile viewport layout...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const mobileMetrics = await page.evaluate(() => {
      const hero = document.querySelector('.post-hero');
      const inner = document.querySelector('.post-hero__inner');
      return {
        heroHeight: hero?.getBoundingClientRect().height,
        innerWidth: inner?.getBoundingClientRect().width,
      };
    });
    console.log('Mobile Hero Metrics:', mobileMetrics);
    if (!mobileMetrics.heroHeight || mobileMetrics.heroHeight < 300 || mobileMetrics.heroHeight > 380) {
      throw new Error(`Invalid mobile post-hero height: ${mobileMetrics.heroHeight}px`);
    }
    await page.screenshot({ path: path.join(screenshotDir, 'post-hero-mobile.png') });
    console.log('✓ Mobile post hero layout verified successfully!');

    console.log('\n[ALL POST-HERO E2E TESTS PASSED!]');
  } catch (err) {
    console.error('[E2E FAILED]', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
