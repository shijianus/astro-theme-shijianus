import { spawn } from 'child_process';
import { chromium } from 'playwright';

async function runVerification() {
  console.log('🚀 Starting Astro Dev Server for Comment History Verification...');
  const port = '4349';
  const devProc = spawn('npx', ['astro', 'dev', '--port', port, '--host', '127.0.0.1'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  let output = '';
  let serverReady = false;

  devProc.stdout.on('data', (d) => {
    const text = d.toString();
    output += text;
    if (text.includes('http://') || text.includes('Local:')) {
      serverReady = true;
    }
  });
  devProc.stderr.on('data', (d) => { output += d.toString(); });

  const maxWait = 35000;
  const start = Date.now();
  while (!serverReady && Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, 400));
  }

  if (!serverReady) {
    devProc.kill('SIGTERM');
    throw new Error('Dev server failed to start within timeout. Output:\n' + output);
  }

  console.log(`✅ Dev server is ready on http://127.0.0.1:${port}`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('\n--- PHASE 1: Setting up mock account and comment in localStorage ---');
    await page.goto(`http://127.0.0.1:${port}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      const user = {
        id: 'visitor-test-123',
        name: '测试用户Alice',
        email: 'alice@example.com',
        website: 'https://example.com',
        avatar: '',
        role: 'reader',
        showLocation: true,
      };
      localStorage.setItem('shijianus-comment-account', JSON.stringify(user));
      localStorage.setItem('shijianus-comment-identity', JSON.stringify(user));

      // Add a test comment under local storage thread
      const testComments = [
        {
          id: 'comm-abc-1',
          authorId: 'visitor-test-123',
          name: '测试用户Alice',
          email: 'alice@example.com',
          message: '这是来自测试用户的精彩评论！',
          createdAt: new Date().toISOString(),
          likes: ['u1', 'u2'],
          status: 'published',
          slug: 'content-formats-and-markup-mastery',
          postType: 'comment',
        },
        {
          id: 'comm-abc-2',
          authorId: 'visitor-test-123',
          name: '测试用户Alice',
          email: 'alice@example.com',
          message: '测试一条极速能量打气！',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          likes: [],
          status: 'published',
          slug: 'content-formats-and-markup-mastery',
          postType: 'boost',
        }
      ];
      localStorage.setItem('shijianus-comments:content-formats-and-markup-mastery', JSON.stringify(testComments));
    });

    // Reload page to reflect account state
    await page.reload({ waitUntil: 'networkidle' });

    console.log('\n--- PHASE 2: Open Account Drawer and Inspect Comment History ---');
    // Open notifications drawer directly via custom event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications', { detail: { tab: 'notifications' } }));
    });

    await page.waitForTimeout(800);

    // Switch to personal tab
    const personalTabBtn = page.locator('.account-partition-btn').nth(1);
    if (await personalTabBtn.isVisible()) {
      await personalTabBtn.click();
      await page.waitForTimeout(400);
    }

    // Check if .account-my-comments-list is rendered
    const commentsList = page.locator('.account-my-comments-list');
    await commentsList.waitFor({ state: 'visible', timeout: 5000 });
    console.log('   ✅ .account-my-comments-list is visible');

    const commentItems = page.locator('.account-my-comment-item');
    const count = await commentItems.count();
    console.log(`   ✅ Found ${count} comment item(s)`);
    if (count === 0) throw new Error('Expected at least 1 comment item in list');

    // Inspect each item content
    for (let i = 0; i < count; i++) {
      const item = commentItems.nth(i);
      const postSpan = item.locator('.account-my-comment-post');
      const postText = await postSpan.innerText();
      const itemHref = await item.getAttribute('href');
      const msgText = await item.locator('.account-my-comment-msg').innerText();

      console.log(`\n   [Comment Item #${i + 1}]`);
      console.log(`      Post Title Text: "${postText}"`);
      console.log(`      Target Href: "${itemHref}"`);
      console.log(`      Message: "${msgText}"`);

      // STRICT CHECKS
      if (postText.includes('item.postSlug ?') || postText.includes('${t(') || postText.includes('undefined')) {
        throw new Error(`CRITICAL BUG: Unescaped JavaScript or error text in comment item #${i + 1}: ${postText}`);
      }
      if (!itemHref || !itemHref.includes('/posts/')) {
        throw new Error(`Invalid href for comment item #${i + 1}: ${itemHref}`);
      }
      if (itemHref.includes('//posts') || itemHref.includes('/posts/posts/')) {
        throw new Error(`Malformed double-path href: ${itemHref}`);
      }
    }

    // Check boost badge
    const boostBadge = page.locator('.account-my-comment-badge-boost');
    if (await boostBadge.isVisible()) {
      console.log('   ✅ Boost badge correctly rendered: ' + (await boostBadge.innerText()));
    }

    console.log('\n--- PHASE 3: Testing English Locale (Comment History) ---');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:locale-change', { detail: { locale: 'en' } }));
    });
    await page.waitForTimeout(400);

    const firstPostSpanEn = commentItems.first().locator('.account-my-comment-post');
    const firstPostTextEn = await firstPostSpanEn.innerText();
    console.log('   First item post text in EN:', firstPostTextEn);

    if (firstPostTextEn.includes('item.postSlug ?') || firstPostTextEn.includes('${t(')) {
      throw new Error(`CRITICAL BUG: Unescaped JavaScript in EN locale: ${firstPostTextEn}`);
    }

    // Save Screenshot
    await page.screenshot({ path: 'scratch/comment-history-verification.png', fullPage: false });
    console.log('   📸 Screenshot saved to scratch/comment-history-verification.png');

    console.log('\n=============================================');
    console.log('🎉 ALL COMMENT HISTORY VERIFICATION TESTS PASSED!');
    console.log('=============================================\n');

  } finally {
    if (browser) await browser.close();
    try {
      devProc.kill('SIGKILL');
    } catch {}
    setTimeout(() => process.exit(0), 500);
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
