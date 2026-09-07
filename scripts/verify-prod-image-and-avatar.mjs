import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const PROD_URL = 'https://blog.epocanvas.com';
const POST_PATH = '/posts/content-formats-and-markup-mastery/';
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'scratch/prod-screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runProdVerification() {
  console.log('====================================================');
  console.log('🚀 Starting Live Production E2E Verification on Cloudflare Pages');
  console.log(`Target: ${PROD_URL}`);
  console.log('====================================================\n');

  // Test 1: Production API image upload directly
  console.log('--- Test Suite 1: Production API /api/upload-image ---');
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(pngBase64, 'base64');
  const blob = new Blob([buffer], { type: 'image/png' });
  const formData = new FormData();
  formData.append('file', blob, 'e2e_prod_test.png');

  const uploadRes = await fetch(`${PROD_URL}/api/upload-image`, {
    method: 'POST',
    body: formData,
  });

  assert(uploadRes.status === 200, `API returned status 200 (received ${uploadRes.status})`);
  const uploadJson = await uploadRes.json();
  assert(uploadJson.ok === true, 'Upload API returned ok === true');
  assert(uploadJson.code === 200, 'Upload API returned code === 200');
  assert(typeof uploadJson.url === 'string' && uploadJson.url.startsWith('https://img.epocanvas.com/file/'), `Telegram image URL generated: ${uploadJson.url}`);
  assert(uploadJson.type === 'image/png', 'Upload API returned correct MIME image/png');
  console.log(`  ✓ Live Telegram CDN URL successfully generated: ${uploadJson.url}`);

  // Test 2: Playwright Browser Test on Production
  console.log('\n--- Test Suite 2: Browser E2E on Production Post Page ---');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  console.log(`Navigating to ${PROD_URL}${POST_PATH}...`);
  await page.goto(`${PROD_URL}${POST_PATH}`, { waitUntil: 'networkidle', timeout: 30000 });

  assert(consoleErrors.length === 0, `No console errors on load (errors: ${consoleErrors.join('; ')})`);

  // Scroll down to ensure client:visible triggers hydration of #post-comment
  console.log('Scrolling down to #post-comment...');
  await page.waitForSelector('#post-comment', { state: 'attached', timeout: 15000 });
  await page.$eval('#post-comment', (el) => el.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(1000);

  // Find image button in toolbar (.tk-tb-image)
  const imageBtn = await page.waitForSelector('.tk-tb-image', { timeout: 10000 });
  assert(imageBtn !== null, 'Comment toolbar image button (.tk-tb-image) is present and visible');

  // Click image button to open modal
  await imageBtn.click();
  const modalOverlay = await page.waitForSelector('.tk-tool-modal-overlay', { timeout: 5000 });
  assert(modalOverlay !== null, 'Image upload & insertion modal overlay is rendered');

  // Verify modal title and 3 tabs
  const modalTitle = await page.$eval('.tk-tool-modal-title', (el) => el.textContent.trim());
  assert(modalTitle.includes('插入图片'), `Modal title contains '插入图片' (got: ${modalTitle})`);

  const tabs = await page.$$('.tk-modal-tab-btn');
  assert(tabs.length === 3, `Modal has 3 tabs (got: ${tabs.length})`);

  // Check Local Upload dropzone in Tab 1
  const dropzone = await page.$('.tk-image-dropzone');
  assert(dropzone !== null, 'Local upload dropzone is present in tab 1');

  // Switch to Tab 2: Clipboard & Drag guide
  await tabs[1].click();
  await page.waitForTimeout(300);

  const guideCards = await page.$$('.tk-guide-grid .tk-guide-card');
  assert(guideCards.length === 3, `Guide grid displays 3 guide cards (got ${guideCards.length})`);
  const kbdText = await page.$eval('.tk-guide-kbd', (el) => el.textContent.trim());
  assert(kbdText.includes('Ctrl') || kbdText.includes('Cmd'), `Guide displays shortcut kbd (got: ${kbdText})`);

  // Switch to Tab 3: External URL insertion
  await tabs[2].click();
  await page.waitForTimeout(300);

  const urlInput = await page.$('.tk-image-url-tab-pane input[type="url"]');
  assert(urlInput !== null, 'External URL input is present in tab 3');

  // Fill in external image URL and confirm insertion
  const testImgUrl = uploadJson.url;
  await urlInput.fill(testImgUrl);
  await page.waitForTimeout(300);

  const confirmBtn = await page.$('.tk-modal-btn-confirm');
  assert(confirmBtn !== null, 'Confirm insertion button is present');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_prod_image_modal.png') });
  console.log('  📸 Screenshot captured: 01_prod_image_modal.png');

  await confirmBtn.click();
  await page.waitForTimeout(500);

  // Check if comment textarea contains markdown image
  const textareaContent = await page.$eval('.el-textarea__inner', (el) => el.value);
  assert(textareaContent.includes(`![图片](${testImgUrl})`), `Textarea contains markdown image syntax: ${textareaContent}`);

  // Test 3: Account Drawer and Avatar Customization on Production
  console.log('\n--- Test Suite 3: Account Drawer & Avatar Customization ---');
  
  // Set mock user session in localStorage and open account drawer
  await page.evaluate(() => {
    const epomailIdentity = {
      name: 'E2E测试读者',
      email: 'test@epocanvas.com',
      avatar: 'https://mail.epocanvas.com/avatars/default.png',
      epomailAvatar: 'https://mail.epocanvas.com/avatars/default.png',
      website: 'https://blog.epocanvas.com',
      role: 'reader',
      provider: 'epomail',
      token: 'e2e_mock_token_123',
    };
    window.localStorage.setItem('shijianus-comment-account', JSON.stringify(epomailIdentity));
    window.localStorage.setItem('shijianus-auth-token', 'e2e_mock_token_123');
    window.dispatchEvent(new CustomEvent('shijianus:comment-account-change', { detail: epomailIdentity }));
    window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
  });
  await page.waitForTimeout(600);

  const accountOverlay = await page.waitForSelector('.theme-account-overlay.show', { timeout: 5000 });
  assert(accountOverlay !== null, 'Account overlay opened successfully');

  // Verify avatar card block
  const avatarBlock = await page.waitForSelector('.account-avatar-card-block', { timeout: 5000 });
  assert(avatarBlock !== null, 'Avatar settings block (.account-avatar-card-block) is rendered');

  const avatarStatusBadge = await page.$eval('.account-avatar-status-badge', (el) => el.textContent.trim());
  assert(avatarStatusBadge.includes('Epomail 官方头像'), `Status badge indicates official Epomail avatar (got: ${avatarStatusBadge})`);

  const uploadAvatarBtn = await page.$('.account-avatar-action-btn');
  assert(uploadAvatarBtn !== null, 'Upload new avatar button is present');

  const avatarUrlInput = await page.$('input[placeholder*="https://img.epocanvas.com/file/"]');
  assert(avatarUrlInput !== null, 'Custom avatar URL input is present');

  // Simulate updating to a custom avatar URL
  const customAvatarUrl = 'https://img.epocanvas.com/file/custom_avatar_sample.png';
  await avatarUrlInput.fill(customAvatarUrl);
  await page.waitForTimeout(300);

  const updatedBadge = await page.$eval('.account-avatar-status-badge', (el) => el.textContent.trim());
  assert(updatedBadge.includes('自定义专属头像'), `Status badge dynamically changes to custom avatar (got: ${updatedBadge})`);

  // Verify restore button appears
  const restoreBtn = await page.$('.account-avatar-action-btn.is-restore');
  assert(restoreBtn !== null, 'Restore Epomail avatar button appears when avatar is customized');

  // Click restore button
  await restoreBtn.click();
  await page.waitForTimeout(300);

  const restoredBadge = await page.$eval('.account-avatar-status-badge', (el) => el.textContent.trim());
  assert(restoredBadge.includes('Epomail 官方头像'), `Restored status badge shows official Epomail avatar again (got: ${restoredBadge})`);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_prod_account_avatar.png') });
  console.log('  📸 Screenshot captured: 02_prod_account_avatar.png');

  // Close account drawer
  const closeBtn = await page.$('.theme-account-drawer__close');
  if (closeBtn) {
    await closeBtn.click();
  }

  await browser.close();

  console.log('\n====================================================');
  console.log(`🎉 Live Production Verification Completed: ${passedTests}/${totalTests} Passed! (100% PASS)`);
  console.log('====================================================\n');
}

runProdVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
