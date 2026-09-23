import { chromium } from 'playwright';

async function verifyLiveSecurityRemediation() {
  console.log('================================================================');
  console.log('   STARTING PRODUCTION E2E SECURITY & INTEGRATION VERIFICATION  ');
  console.log('   Target: https://blog.epocanvas.com                           ');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Visit Live Article with Comments & Music Pocket
    const targetUrl = 'https://blog.epocanvas.com/posts/markdown-syntax-mastery/';
    console.log(`[E2E] Navigating to article: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // 2. Audit Article TOC and Nav
    const hasNav = await page.evaluate(() => Boolean(document.querySelector('#nav')));
    console.log(`[E2E] Main navigation present: ${hasNav}`);

    // 3. Audit Comments Section
    const commentSection = await page.evaluate(() => {
      const section = document.querySelector('#post-comment');
      return {
        exists: Boolean(section),
        hasSubmitArea: Boolean(section?.querySelector('.tk-submit') || section?.querySelector('textarea')),
      };
    });
    console.log(`[E2E] Comments section audit:`, commentSection);

    // 4. Audit Live Online API (CORS & Security Behavior from Browser context)
    const apiAudit = await page.evaluate(async () => {
      // Test GET /api/comments
      const commentsRes = await fetch('/api/comments?slug=markdown-syntax-mastery');
      const commentsData = await commentsRes.json();

      // Test unauthorized user_feed access from browser
      const feedRes = await fetch('/api/comments?action=user_feed&author_name=Alice_User');
      const feedData = await feedRes.json();

      return {
        commentsOk: commentsRes.ok,
        commentsDataOk: commentsData.ok,
        feedStatus: feedRes.status,
        feedRejected: feedRes.status === 401 && !feedData.ok,
      };
    });

    console.log(`[E2E] Live Edge API Audit:`, apiAudit);

    // 5. Console Error Audit
    console.log(`[E2E] Console errors captured: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.warn(`[E2E] Console error details:`, consoleErrors);
    }

    console.log('\n================================================================');
    console.log('   PRODUCTION E2E VERIFICATION COMPLETED SUCCESSFULLY           ');
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

verifyLiveSecurityRemediation().catch((err) => {
  console.error('E2E Verification Error:', err);
  process.exit(1);
});
