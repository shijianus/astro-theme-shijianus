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

const PORT = 5798;

server.listen(PORT, async () => {
  console.log(`[E2E] Verifying post-hero layout, title centering and version/meta positioning above waves on http://localhost:${PORT}...`);
  const browser = await chromium.launch({ headless: true });

  try {
    const testCases = [
      '/posts/anzhiyu-markdown-showcase/',
      '/posts/readable-geek-interfaces/',
      '/posts/content-formats-and-markup-mastery/',
    ];

    // 1. Desktop Test (1440x900)
    console.log('\n--- 1. Testing Desktop Layout (1440x900) ---');
    const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    for (const slug of testCases) {
      console.log(`[Desktop] Checking ${slug}...`);
      await desktopPage.goto(`http://localhost:${PORT}${slug}`);
      await desktopPage.waitForTimeout(300);

      const metrics = await desktopPage.evaluate(() => {
        const hero = document.querySelector('.post-hero');
        const inner = document.querySelector('.post-hero__inner');
        const titleBlock = document.querySelector('.post-hero__title-block');
        const meta = document.querySelector('.post-hero__meta-grid');
        const waves = document.querySelector('.post-hero__waves');

        const hBox = hero ? hero.getBoundingClientRect() : null;
        const iBox = inner ? inner.getBoundingClientRect() : null;
        const tbBox = titleBlock ? titleBlock.getBoundingClientRect() : null;
        const mBox = meta ? meta.getBoundingClientRect() : null;
        const wBox = waves ? waves.getBoundingClientRect() : null;

        const heroCenterY = hBox ? hBox.top + hBox.height / 2 : 0;
        const titleCenterY = tbBox ? tbBox.top + tbBox.height / 2 : 0;
        const centerOffset = titleCenterY - heroCenterY;

        return {
          heroHeight: hBox?.height,
          titleBlockHeight: tbBox?.height,
          spaceAboveTitleBlock: tbBox && hBox ? tbBox.top - hBox.top : null,
          spaceBelowTitleBlock: tbBox && hBox ? hBox.bottom - tbBox.bottom : null,
          centerOffset,
          metaDistAboveWaves: mBox && wBox ? wBox.top - mBox.bottom : null,
          metaOverlapWithWaves: mBox && wBox ? mBox.bottom > wBox.top : null,
        };
      });

      console.log(`[Desktop] Metrics for ${slug}:`, metrics);

      if (metrics.metaOverlapWithWaves) {
        throw new Error(`[Desktop] Expected meta/version to be ABOVE waves, but overlapped on ${slug}!`);
      }
      if (metrics.metaDistAboveWaves < 10) {
        throw new Error(`[Desktop] Expected meta/version distance above waves >= 10px, got ${metrics.metaDistAboveWaves}px on ${slug}`);
      }
      if (Math.abs(metrics.centerOffset) > 40) {
        throw new Error(`[Desktop] Expected titleBlock to be centered (offset <= 40px), got ${metrics.centerOffset}px on ${slug}`);
      }
      console.log(`[Desktop] ✓ ${slug} passed: Title centered, meta safely above waves (+${metrics.metaDistAboveWaves?.toFixed(1)}px).`);
    }

    // 2. Mobile Test (390x844)
    console.log('\n--- 2. Testing Mobile Layout (390x844) ---');
    const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });

    for (const slug of testCases) {
      console.log(`[Mobile] Checking ${slug}...`);
      await mobilePage.goto(`http://localhost:${PORT}${slug}`);
      await mobilePage.waitForTimeout(300);

      const metrics = await mobilePage.evaluate(() => {
        const hero = document.querySelector('.post-hero');
        const titleBlock = document.querySelector('.post-hero__title-block');
        const meta = document.querySelector('.post-hero__meta-grid');
        const waves = document.querySelector('.post-hero__waves');

        const hBox = hero ? hero.getBoundingClientRect() : null;
        const tbBox = titleBlock ? titleBlock.getBoundingClientRect() : null;
        const mBox = meta ? meta.getBoundingClientRect() : null;
        const wBox = waves ? waves.getBoundingClientRect() : null;

        return {
          heroHeight: hBox?.height,
          titleBlockHeight: tbBox?.height,
          metaDistAboveWaves: mBox && wBox ? wBox.top - mBox.bottom : null,
          metaOverlapWithWaves: mBox && wBox ? mBox.bottom > wBox.top : null,
        };
      });

      console.log(`[Mobile] Metrics for ${slug}:`, metrics);

      if (metrics.metaOverlapWithWaves) {
        throw new Error(`[Mobile] Expected meta/version to be ABOVE waves, but overlapped on ${slug}!`);
      }
      if (metrics.metaDistAboveWaves < 15) {
        throw new Error(`[Mobile] Expected mobile meta distance above waves >= 15px, got ${metrics.metaDistAboveWaves}px on ${slug}`);
      }
      console.log(`[Mobile] ✓ ${slug} passed: Mobile hero dynamically expanded, meta safely above waves (+${metrics.metaDistAboveWaves?.toFixed(1)}px).`);
    }

    console.log('\n🎉 ALL PostHero layout assertions PASSED successfully!');
  } catch (err) {
    console.error('[E2E Error]', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
});
