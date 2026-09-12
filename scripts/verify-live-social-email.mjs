import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URLS = [
  'https://cc110299.shijianus-blog.pages.dev',
  'https://blog.epocanvas.com',
];

async function runLiveSocialEmailVerification() {
  console.log('🌐 Starting Production Playwright E2E Verification for Social Email...');

  const screenshotDir = path.resolve(process.cwd(), 'scripts/audit_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  let allPassed = true;

  for (const targetUrl of TARGET_URLS) {
    console.log(`\n======================================================`);
    console.log(`🚀 Auditing Production Target: ${targetUrl}`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const hostName = new URL(targetUrl).hostname;

    try {
      const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log(`Status Code: ${response?.status()}`);

      if (response?.status() !== 200) {
        throw new Error(`Unexpected status code: ${response?.status()}`);
      }

      // Wait for sidebar and author card to render
      await page.waitForSelector('.card-info-social-icons', { timeout: 10000 });

      // Inspect the email social icon
      const emailIcon = page.locator('.card-info-social-icons .social-icon').first();
      const href = await emailIcon.getAttribute('href');
      const title = await emailIcon.getAttribute('title');

      console.log(`[${hostName}] Social Email Icon - href: "${href}"`);
      console.log(`[${hostName}] Social Email Icon - title: "${title}"`);

      if (href !== 'mailto:shijianus@epocanvas.com') {
        console.error(`❌ FAILED: Expected href="mailto:shijianus@epocanvas.com", got "${href}"`);
        allPassed = false;
      } else {
        console.log(`✅ PASSED: href matches mailto:shijianus@epocanvas.com`);
      }

      if (title !== 'Email: shijianus@epocanvas.com') {
        console.error(`❌ FAILED: Expected title="Email: shijianus@epocanvas.com", got "${title}"`);
        allPassed = false;
      } else {
        console.log(`✅ PASSED: title matches Email: shijianus@epocanvas.com`);
      }

      // Check footer email deal_link
      const footerMailLink = page.locator('#footer_deal a[href*="mailto:"]').first();
      if (await footerMailLink.count() > 0) {
        const footerHref = await footerMailLink.getAttribute('href');
        console.log(`[${hostName}] Footer Deal Mail Link - href: "${footerHref}"`);
        if (footerHref === 'mailto:shijianus@epocanvas.com') {
          console.log(`✅ PASSED: Footer mailto link is updated.`);
        } else {
          console.warn(`⚠️ Footer mailto link: ${footerHref}`);
        }
      }

      // Take screenshot
      const shotPath = path.join(screenshotDir, `live-social-email-${hostName}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log(`📸 Screenshot saved: ${shotPath}`);

      if (consoleErrors.length > 0) {
        console.log(`⚠️ Console errors encountered (${consoleErrors.length}):`, consoleErrors.slice(0, 3));
      } else {
        console.log(`✅ 0 console errors detected.`);
      }

    } catch (err) {
      console.error(`❌ Error during audit of ${targetUrl}:`, err);
      allPassed = false;
    } finally {
      await context.close();
    }
  }

  await browser.close();

  if (allPassed) {
    console.log('\n🎉 ALL PRODUCTION LIVE AUDITS PASSED SUCCESSFULLY!');
  } else {
    console.error('\n❌ SOME PRODUCTION AUDITS FAILED.');
    process.exit(1);
  }
}

runLiveSocialEmailVerification();
