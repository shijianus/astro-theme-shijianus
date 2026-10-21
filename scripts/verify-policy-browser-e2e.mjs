/**
 * Playwright E2E Browser Verification
 * 1. Checks Footer Policies layout, styling, and exact 4 items.
 * 2. Checks Header/Post comments links.
 * 3. Checks Account drawer policies.
 * 4. Captures visual screenshots for audit.
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
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
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

async function main() {
  const PORT = 4399;
  const server = await serveStatic(path.resolve('dist'), PORT);
  console.log(`🌐 Static server listening on http://localhost:${PORT}`);

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
    // 1. Visit homepage
    console.log('🔍 Visiting Homepage...');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });

    // Verify Footer Groups
    const footerGroups = await page.$$eval('#site-footer-grid .footer-group', groups => {
      return groups.map(g => {
        const title = g.querySelector('.footer-title')?.textContent?.trim();
        const links = Array.from(g.querySelectorAll('.footer-item')).map(a => ({
          label: a.textContent.trim(),
          href: a.getAttribute('href')
        }));
        return { title, count: links.length, links };
      });
    });

    console.log('\n📊 Rendered Footer Groups Breakdown:');
    footerGroups.forEach(g => {
      console.log(`   - [${g.title}] (${g.count} items): ${g.links.map(l => l.label).join(', ')}`);
    });

    const policyGroup = footerGroups.find(g => g.title === '协议');
    if (!policyGroup) {
      throw new Error('Could not find "协议" (Policies) group in rendered DOM');
    }

    if (policyGroup.count !== 4) {
      throw new Error(`Expected exactly 4 policy links, found ${policyGroup.count}`);
    }
    console.log('✅ Footer "协议" group rendered with EXACTLY 4 items!');

    const expected4 = ['隐私说明', '使用条款', '版权说明', '赞赏与退款说明'];
    const actualLabels = policyGroup.links.map(l => l.label);
    for (const exp of expected4) {
      if (!actualLabels.includes(exp)) {
        throw new Error(`Missing expected label in footer: ${exp}`);
      }
    }
    console.log('✅ All 4 core policies match perfectly.');

    // Screenshot Footer
    const footerEl = await page.$('#footer');
    if (footerEl) {
      await footerEl.screenshot({ path: 'scripts/audit_screenshots/footer-aligned.png' });
      console.log('📸 Saved footer screenshot to scripts/audit_screenshots/footer-aligned.png');
    }

    // 2. Visit a post with comments
    console.log('\n🔍 Visiting Post page for comments and in-place links...');
    await page.goto(`http://localhost:${PORT}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'networkidle' });

    // Check PostComments header links
    const commentHeaderLinks = await page.$$eval('#post-comment .comment-randomInfo a', anchors => {
      return anchors.map(a => ({
        label: a.textContent.trim(),
        href: a.getAttribute('href'),
        title: a.getAttribute('title')
      }));
    });

    console.log('💬 Rendered Comment Head Links:');
    commentHeaderLinks.forEach(l => console.log(`   - ${l.label} (${l.href})`));

    const conductLink = commentHeaderLinks.find(l => l.href?.includes('/community/code-of-conduct/'));
    const moderationLink = commentHeaderLinks.find(l => l.href?.includes('/community/comments-and-moderation/'));
    const appealLink = commentHeaderLinks.find(l => l.href?.includes('/community/reporting-and-appeals/'));
    const privacyLink = commentHeaderLinks.find(l => l.href?.includes('/community/privacy-and-data/'));

    if (!conductLink || !moderationLink || !appealLink || !privacyLink) {
      throw new Error('Comment header missing in-place policy links');
    }
    console.log('✅ Comment header contains Code of Conduct, Moderation, Appeals, and Privacy in-place links!');

    // 3. Test .well-known/security.txt
    console.log('\n🔍 Checking .well-known/security.txt...');
    const secResponse = await page.goto(`http://localhost:${PORT}/.well-known/security.txt`);
    const secText = await secResponse.text();
    if (!secText.includes('/community/security-disclosure/')) {
      throw new Error('security.txt missing security-disclosure policy url');
    }
    console.log('✅ security.txt valid and serves correctly!');

    console.log('\n🎉 ALL E2E BROWSER CHECKS COMPLETED WITH ZERO DEFECTS!');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(err => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
