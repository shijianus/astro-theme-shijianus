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
      return {
        webBgExists: !!webBg,
        webBgColor: cs.backgroundColor,
        webBgImage: cs.backgroundImage,
        webBgTop: cs.top,
        webBgLeft: cs.left,
        webBgWidth: cs.width,
        webBgHeight: cs.height,
        universePresent: !!universe,
        beforeImage: csBefore.backgroundImage,
        afterImage: csAfter.backgroundImage,
      };
    });

    console.log('Light Mode Background Audit:', lightAudit);

    if (!lightAudit.webBgExists) {
      throw new Error('FAIL: #web_bg container is missing!');
    }
    if (lightAudit.webBgImage && lightAudit.webBgImage !== 'none') {
      throw new Error(`FAIL: Light mode #web_bg has background-image gradients: ${lightAudit.webBgImage}`);
    }
    if (lightAudit.universePresent) {
      throw new Error('FAIL: #universe canvas element still exists in DOM (should be completely eliminated)!');
    }
    if (lightAudit.beforeImage !== 'none' || lightAudit.afterImage !== 'none') {
      throw new Error('FAIL: Pseudo-elements still render images/gradients!');
    }
    if (lightAudit.webBgColor !== 'rgb(247, 249, 254)') {
      throw new Error(`FAIL: Light mode color is not #f7f9fe: ${lightAudit.webBgColor}`);
    }
    console.log('✅ Light mode pure solid background verified: 100% pure #f7f9fe without canvas or pseudo clutter');

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
    if (darkAudit.webBgColor !== 'rgb(13, 13, 20)') {
      throw new Error(`FAIL: Dark mode color is not #0d0d14: ${darkAudit.webBgColor}`);
    }
    console.log('✅ Dark mode pure solid background verified: 100% pure #0d0d14 without gradient noise');

    // 3. Audit Article Post Page (both light and dark)
    console.log('\n--- 3. Auditing Article Post Page ---');
    await page.goto('http://127.0.0.1:4321/posts/hello-world/', { waitUntil: 'networkidle' });

    const postAudit = await page.evaluate(() => {
      const webBg = document.getElementById('web_bg');
      const postContent = document.querySelector('.article-body.post-content') || document.querySelector('#article-container');
      const postComment = document.getElementById('post-comment');
      const universe = document.getElementById('universe');
      const csWebBg = window.getComputedStyle(webBg);
      return {
        webBgColor: csWebBg.backgroundColor,
        webBgImage: csWebBg.backgroundImage,
        postContentExists: !!postContent,
        postCommentExists: !!postComment,
        universePresent: !!universe,
      };
    });
    console.log('Post Page Audit:', postAudit);

    if (postAudit.webBgImage && postAudit.webBgImage !== 'none') {
      throw new Error(`FAIL: Post page #web_bg has gradients: ${postAudit.webBgImage}`);
    }
    if (postAudit.universePresent) {
      throw new Error('FAIL: Universe element found on post page!');
    }
    console.log('✅ Post page pure solid background passed!');

    // 4. Audit Dark Mode on Post Page
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'dark';
    });
    await page.waitForTimeout(300);

    const postDarkAudit = await page.evaluate(() => {
      const webBg = document.getElementById('web_bg');
      const csWebBg = window.getComputedStyle(webBg);
      return {
        webBgColor: csWebBg.backgroundColor,
        webBgImage: csWebBg.backgroundImage,
      };
    });
    console.log('Post Page Dark Audit:', postDarkAudit);

    if (postDarkAudit.webBgImage && postDarkAudit.webBgImage !== 'none') {
      throw new Error(`FAIL: Post page dark #web_bg has gradients: ${postDarkAudit.webBgImage}`);
    }
    if (postDarkAudit.webBgColor !== 'rgb(13, 13, 20)') {
      throw new Error(`FAIL: Post page dark mode color mismatch: ${postDarkAudit.webBgColor}`);
    }
    console.log('✅ Post page dark mode pure solid background passed!');

    // 5. Test Background Button Click Response (ThemeDock)
    console.log('\n--- 5. Auditing Background Toggle Interaction ---');
    const bgBtn = await page.$('#background-mode');
    if (bgBtn) {
      await bgBtn.click();
      await page.waitForTimeout(300);
      const toastText = await page.evaluate(() => {
        const toast = document.querySelector('.anzhiyu-snackbar, .snackbar-item, .theme-toast, #snackbar');
        return toast ? toast.textContent : null;
      });
      console.log('Toast emitted upon clicking #background-mode:', toastText);
    }

    // 6. Test Deprecated LocalStorage Key Sanitization
    console.log('\n--- 6. Auditing Obsolete LocalStorage Cleaning ---');
    await page.evaluate(() => {
      localStorage.setItem('shijianus-background', 'starfield');
      localStorage.setItem('shijianus-background-source', 'manual');
    });
    await page.reload({ waitUntil: 'networkidle' });

    const sanitizedData = await page.evaluate(() => {
      return {
        storedBg: localStorage.getItem('shijianus-background'),
        datasetBg: document.documentElement.dataset.background,
      };
    });
    console.log('Sanitized Data Result:', sanitizedData);
    if (sanitizedData.storedBg === 'starfield' || sanitizedData.datasetBg === 'starfield') {
      throw new Error('FAIL: Obsolete "starfield" background key was not sanitized!');
    }
    console.log('✅ Obsolete background dirty cache sanitized successfully to:', sanitizedData.datasetBg);

    await browser.close();
    console.log('\n🎉 ALL BACKGROUND TESTS PASSED! Clean solid baseline established and verified.');
  } finally {
    cleanup();
  }
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
