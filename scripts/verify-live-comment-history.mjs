import { chromium } from 'playwright';

async function runLiveVerification() {
  const targetUrl = process.env.TARGET_URL || 'https://f794093f.shijianus-blog.pages.dev/posts/content-formats-and-markup-mastery/';
  console.log(`🌐 Starting Live E2E Verification on: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    console.log('\n--- 1. Navigating to Target URL ---');
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 35000 });

    console.log('\n--- 2. Injecting Test Identity & Footprint into LocalStorage ---');
    await page.evaluate(() => {
      const user = {
        id: 'visitor-live-audit',
        name: '审计访客',
        email: 'audit@epocanvas.com',
        website: 'https://blog.epocanvas.com',
        avatar: '',
        role: 'reader',
        showLocation: true,
      };
      localStorage.setItem('shijianus-comment-account', JSON.stringify(user));
      localStorage.setItem('shijianus-comment-identity', JSON.stringify(user));

      const testComments = [
        {
          id: 'comm-live-1',
          authorId: 'visitor-live-audit',
          name: '审计访客',
          email: 'audit@epocanvas.com',
          message: '线上端到端自动化审计：测试评论足迹正常渲染。',
          createdAt: new Date().toISOString(),
          likes: ['u1'],
          status: 'published',
          slug: 'content-formats-and-markup-mastery',
          postType: 'comment',
        },
        {
          id: 'comm-live-2',
          authorId: 'visitor-live-audit',
          name: '审计访客',
          email: 'audit@epocanvas.com',
          message: '线上端到端打气！',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          likes: [],
          status: 'published',
          slug: 'content-formats-and-markup-mastery',
          postType: 'boost',
        }
      ];
      localStorage.setItem('shijianus-comments:content-formats-and-markup-mastery', JSON.stringify(testComments));
    });

    // Reload page to activate injected identity
    await page.reload({ waitUntil: 'networkidle' });

    console.log('\n--- 3. Opening Account Drawer on Deployment ---');
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications', { detail: { tab: 'notifications' } }));
    });

    const drawer = page.locator('.theme-account-drawer');
    await drawer.waitFor({ state: 'visible', timeout: 5000 });
    console.log('   ✅ .theme-account-drawer is opened and visible');

    await page.waitForTimeout(600);

    // Switch to personal tab (个人互动与足迹)
    const personalTabBtn = page.locator('.account-partition-btn').nth(1);
    if (await personalTabBtn.isVisible()) {
      await personalTabBtn.click();
      await page.waitForTimeout(400);
    }

    console.log('\n--- 4. Inspecting .account-my-comments-list on Deployment ---');
    const commentsList = page.locator('.account-my-comments-list');
    await commentsList.waitFor({ state: 'visible', timeout: 8000 });
    console.log('   ✅ .account-my-comments-list is rendered and visible');

    const items = page.locator('.account-my-comment-item');
    const itemCount = await items.count();
    console.log(`   ✅ Total comment items rendered: ${itemCount}`);
    if (itemCount === 0) throw new Error('Expected at least 1 comment item on deployment');

    for (let i = 0; i < itemCount; i++) {
      const item = items.nth(i);
      const postSpan = item.locator('.account-my-comment-post');
      const postText = await postSpan.innerText();
      const href = await item.getAttribute('href');
      const msg = await item.locator('.account-my-comment-msg').innerText();

      console.log(`\n   [Deployment Item #${i + 1}]`);
      console.log(`      Post Title Text: "${postText}"`);
      console.log(`      Target Href: "${href}"`);
      console.log(`      Message: "${msg}"`);

      // STRICT VALIDATION AGAINST GARBLED / UNESCAPED CODE
      if (postText.includes('item.postSlug ?') || postText.includes('${t(') || postText.includes('undefined')) {
        throw new Error(`CRITICAL FAILURE: Raw code / garbled text detected in comment post title: ${postText}`);
      }
      if (!href || !href.includes('/posts/content-formats-and-markup-mastery/')) {
        throw new Error(`Invalid href on deployment: ${href}`);
      }
      if (href.includes('//posts') || href.includes('/posts/posts/')) {
        throw new Error(`Double path detected in href: ${href}`);
      }
    }

    // Capture screenshot
    await page.screenshot({ path: 'scratch/live-comment-history-verified.png', fullPage: false });
    console.log('\n📸 Live Screenshot successfully saved to scratch/live-comment-history-verified.png');

    console.log('\n======================================================');
    console.log('🎉 CLOUDFLARE PAGES LIVE DEPLOYMENT VERIFICATION 100% PASSED!');
    console.log('======================================================\n');
  } finally {
    await browser.close();
    setTimeout(() => process.exit(0), 500);
  }
}

runLiveVerification().catch((err) => {
  console.error('❌ Live Verification failed:', err);
  process.exit(1);
});
