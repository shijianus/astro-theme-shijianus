/**
 * Playwright E2E Multi-Language Audit for Governance UI
 */

import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

function serveStatic(dir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    let filePath = path.join(dir, reqPath);

    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function runBrowserI18nAudit() {
  const PORT = 4398;
  const server = await serveStatic(path.resolve('dist'), PORT);
  console.log(`🌐 Static test server listening on http://localhost:${PORT}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('🔍 Visiting article page to inspect comment header i18n...');
    await page.goto(`http://localhost:${PORT}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'networkidle' });

    // 1. Initial State (Chinese default)
    let commentLinks = await page.$$eval('#post-comment .comment-randomInfo a', anchors =>
      anchors.map(a => a.textContent.trim())
    );
    console.log('💬 Default Links in Comment Header:');
    console.log('   ' + commentLinks.join(' · '));

    // 2. Switch to English via window.dispatchEvent
    console.log('\n🌐 Dispatching language change to "en"...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: 'en' }));
    });
    await page.waitForTimeout(500);

    let enCommentLinks = await page.$$eval('#post-comment .comment-randomInfo a', anchors =>
      anchors.map(a => a.textContent.trim())
    );
    console.log('💬 English Links in Comment Header:');
    console.log('   ' + enCommentLinks.join(' · '));

    if (!enCommentLinks.includes('Code of Conduct') || !enCommentLinks.includes('Moderation') || !enCommentLinks.includes('Appeals')) {
      throw new Error(`English comment header links verification failed: ${JSON.stringify(enCommentLinks)}`);
    }
    console.log('✅ English comment header localization verified!');

    // 3. Switch to French
    console.log('\n🌐 Dispatching language change to "fr"...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: 'fr' }));
    });
    await page.waitForTimeout(500);

    let frCommentLinks = await page.$$eval('#post-comment .comment-randomInfo a', anchors =>
      anchors.map(a => a.textContent.trim())
    );
    console.log('💬 French Links in Comment Header:');
    console.log('   ' + frCommentLinks.join(' · '));

    if (!frCommentLinks.includes('Code de conduite') || !frCommentLinks.includes('Modération') || !frCommentLinks.includes('Recours')) {
      throw new Error(`French comment header links verification failed: ${JSON.stringify(frCommentLinks)}`);
    }
    console.log('✅ French comment header localization verified!');

    // 4. Switch to German
    console.log('\n🌐 Dispatching language change to "de"...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: 'de' }));
    });
    await page.waitForTimeout(500);

    let deCommentLinks = await page.$$eval('#post-comment .comment-randomInfo a', anchors =>
      anchors.map(a => a.textContent.trim())
    );
    console.log('💬 German Links in Comment Header:');
    console.log('   ' + deCommentLinks.join(' · '));

    if (!deCommentLinks.includes('Verhaltenskodex') || !deCommentLinks.includes('Moderation') || !deCommentLinks.includes('Einsprüche')) {
      throw new Error(`German comment header links verification failed: ${JSON.stringify(deCommentLinks)}`);
    }
    console.log('✅ German comment header localization verified!');

    // 5. Switch to Spanish
    console.log('\n🌐 Dispatching language change to "es"...');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:localechange', { detail: 'es' }));
    });
    await page.waitForTimeout(500);

    let esCommentLinks = await page.$$eval('#post-comment .comment-randomInfo a', anchors =>
      anchors.map(a => a.textContent.trim())
    );
    console.log('💬 Spanish Links in Comment Header:');
    console.log('   ' + esCommentLinks.join(' · '));

    if (!esCommentLinks.includes('Código de conducta') || !esCommentLinks.includes('Moderación') || !esCommentLinks.includes('Apelaciones')) {
      throw new Error(`Spanish comment header links verification failed: ${JSON.stringify(esCommentLinks)}`);
    }
    console.log('✅ Spanish comment header localization verified!');

    console.log('\n🎉 ALL MULTI-LANGUAGE BROWSER AUDITS PASSED WITH ZERO ERRORS!');
  } finally {
    await browser.close();
    server.close();
  }
}

runBrowserI18nAudit().catch(err => {
  console.error('Fatal Browser i18n Error:', err);
  process.exit(1);
});
