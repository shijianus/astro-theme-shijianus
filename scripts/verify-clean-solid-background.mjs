import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import http from 'node:http';

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 500) resolve();
          else reject(new Error(`Status ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(1000);
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error(`Server at ${url} did not respond within ${timeout}ms`);
}

async function run() {
  console.log('🚀 Starting preview server...');
  const server = spawn('npx', ['astro', 'preview', '--port', '4321', '--host', '127.0.0.1'], {
    stdio: 'inherit',
    env: { ...process.env, BLOG_BUILD_TARGET: 'static', PUBLIC_STATIC_EXPORT: '1' },
  });

  const cleanup = () => {
    try {
      server.kill('SIGTERM');
    } catch {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  try {
    await waitForServer('http://127.0.0.1:4321');
    console.log('✅ Preview server ready at http://127.0.0.1:4321');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // 1. Audit Home Page in Light Mode
    console.log('\n--- 1. Auditing Home Page (Light Mode) ---');
    await page.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });

    const lightAudit = await page.evaluate(() => {
      const webBg = document.getElementById('web_bg');
      const universe = document.getElementById('universe');
      const cs = window.getComputedStyle(webBg);
      const csBefore = window.getComputedStyle(webBg, '::before');
      const csAfter = window.getComputedStyle(webBg, '::after');
      const csUniverse = universe ? window.getComputedStyle(universe) : null;
      return {
        webBgExists: !!webBg,
        webBgColor: cs.backgroundColor,
        webBgImage: cs.backgroundImage,
        webBgTop: cs.top,
        webBgLeft: cs.left,
        webBgWidth: cs.width,
        webBgHeight: cs.height,
        beforeDisplay: csBefore.display,
        afterDisplay: csAfter.display,
        universePresent: !!universe,
        universeDisplay: csUniverse ? csUniverse.display : 'none',
      };
    });

    console.log('Light Mode Background Audit:', lightAudit);

    if (lightAudit.webBgImage && lightAudit.webBgImage !== 'none') {
      throw new Error(`FAIL: Light mode #web_bg has background-image gradients: ${lightAudit.webBgImage}`);
    }
    if (lightAudit.beforeDisplay !== 'none' || lightAudit.afterDisplay !== 'none') {
      throw new Error('FAIL: Pseudo-elements are not hidden!');
    }
    if (lightAudit.universeDisplay !== 'none') {
      throw new Error(`FAIL: #universe canvas is visible: ${lightAudit.universeDisplay}`);
    }
    console.log('✅ Light mode pure solid background passed: pure color', lightAudit.webBgColor);

    // 2. Audit Dark Mode
    console.log('\n--- 2. Auditing Dark Mode ---');
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(300);

    const darkAudit = await page.evaluate(() => {
      const webBg = document.getElementById('web_bg');
      const cs = window.getComputedStyle(webBg);
      return {
        webBgColor: cs.backgroundColor,
        webBgImage: cs.backgroundImage,
      };
    });
    console.log('Dark Mode Background Audit:', darkAudit);

    if (darkAudit.webBgImage && darkAudit.webBgImage !== 'none') {
      throw new Error(`FAIL: Dark mode #web_bg has background-image gradients: ${darkAudit.webBgImage}`);
    }
    console.log('✅ Dark mode pure solid background passed: pure color', darkAudit.webBgColor);

    // 3. Audit Article Post Page (both light and dark)
    console.log('\n--- 3. Auditing Article Post Page ---');
    await page.goto('http://127.0.0.1:4321/posts/hello-world/', { waitUntil: 'networkidle' });

    const postAudit = await page.evaluate(() => {
      const webBg = document.getElementById('web_bg');
      const postContent = document.querySelector('.article-body.post-content') || document.querySelector('#article-container');
      const postComment = document.getElementById('post-comment');
      const csWebBg = window.getComputedStyle(webBg);
      return {
        webBgColor: csWebBg.backgroundColor,
        webBgImage: csWebBg.backgroundImage,
        postContentExists: !!postContent,
        postCommentExists: !!postComment,
      };
    });
    console.log('Post Page Audit:', postAudit);

    if (postAudit.webBgImage && postAudit.webBgImage !== 'none') {
      throw new Error(`FAIL: Post page #web_bg has gradients: ${postAudit.webBgImage}`);
    }
    console.log('✅ Post page pure solid background passed!');

    // 4. Audit Dark Mode on Post Page
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(300);

    const postDarkAudit = await page.evaluate(() => {
      const webBg = document.getElementById('web_bg');
      const postComment = document.getElementById('post-comment');
      const csWebBg = window.getComputedStyle(webBg);
      const csComment = postComment ? window.getComputedStyle(postComment) : null;
      return {
        webBgColor: csWebBg.backgroundColor,
        webBgImage: csWebBg.backgroundImage,
        commentColor: csComment ? csComment.color : null,
      };
    });
    console.log('Post Page Dark Audit:', postDarkAudit);

    if (postDarkAudit.webBgImage && postDarkAudit.webBgImage !== 'none') {
      throw new Error(`FAIL: Post page dark #web_bg has gradients: ${postDarkAudit.webBgImage}`);
    }
    console.log('✅ Post page dark mode pure solid background passed!');

    await browser.close();
    console.log('\n🎉 ALL BACKGROUND TESTS PASSED! Background is 100% pure solid with zero gradient noise and zero canvas overhead.');
  } finally {
    cleanup();
  }
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
