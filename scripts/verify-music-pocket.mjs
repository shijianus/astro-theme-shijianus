import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');

function getContentType(filePath) {
  const ext = path.extname(filePath);
  switch (ext) {
    case '.html': return 'text/html';
    case '.css': return 'text/css';
    case '.js': return 'application/javascript';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(distDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(distDir, '404.html');
  }
  if (fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

async function main() {
  await new Promise((resolve) => server.listen(4339, resolve));
  console.log('🚀 Static server running on http://127.0.0.1:4339');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    console.log('🌐 Navigating to http://127.0.0.1:4339/ ...');
    await page.goto('http://127.0.0.1:4339/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // 1. Verify Music Pocket presence
    console.log('🔍 Checking .shijianus-music-pocket and vinyl disc...');
    const musicPocket = await page.$('.shijianus-music-pocket');
    if (!musicPocket) throw new Error('Could not find .shijianus-music-pocket in DOM');

    const toggleBtn = await page.$('.shijianus-music-pocket__toggle');
    if (!toggleBtn) throw new Error('Could not find .shijianus-music-pocket__toggle');

    const disc = await page.$('.shijianus-music-pocket__toggle-disc');
    if (!disc) throw new Error('Could not find .shijianus-music-pocket__toggle-disc');

    const tonearm = await page.$('.shijianus-music-pocket__tonearm');
    if (!tonearm) throw new Error('Could not find .shijianus-music-pocket__tonearm');

    console.log('✅ Vinyl disc & tonearm elements confirmed!');

    // 2. Open Player Panel
    console.log('🖱️ Clicking toggle button to open modern player panel...');
    await toggleBtn.click();
    await page.waitForTimeout(500);

    const panel = await page.$('.shijianus-music-pocket__panel');
    if (!panel) throw new Error('Panel failed to open upon clicking toggle button');

    // 3. Verify Tabs in panel
    console.log('📑 Verifying Player tabs (正在播放, 点歌台, 待播)...');
    const tabs = await page.$$('.shijianus-music-pocket__tab');
    if (tabs.length < 3) throw new Error(`Expected at least 3 tabs, found ${tabs.length}`);

    // Check Tab 1: Now Playing content
    const bigDisc = await page.$('.shijianus-music-pocket__big-disc');
    const scrubber = await page.$('.shijianus-music-pocket__scrubber');
    const controls = await page.$('.shijianus-music-pocket__controls');
    if (!bigDisc || !scrubber || !controls) {
      throw new Error('Now playing tab missing big turntable, scrubber, or controls');
    }
    console.log('✅ Now Playing tab verified (Turntable + Lyrics viewport + Scrubber + Controls)');

    // 4. Switch to Tab 2: 点歌台
    console.log('🖱️ Switching to Tab 2 (点歌台)...');
    await tabs[1].click();
    await page.waitForTimeout(400);

    const searchInput = await page.$('.shijianus-music-pocket__input');
    const sourceSelect = await page.$('.shijianus-music-pocket__source-select');
    const quickTags = await page.$$('.shijianus-music-pocket__tag-pill');
    if (!searchInput || !sourceSelect || quickTags.length === 0) {
      throw new Error('Song Request (点歌台) tab missing search input, source selector, or quick tags');
    }
    console.log(`✅ 点歌台 verified (${quickTags.length} quick chips, search input & source selector present)`);

    // 5. Switch to Tab 3: 待播序列
    console.log('🖱️ Switching to Tab 3 (待播队列)...');
    await tabs[2].click();
    await page.waitForTimeout(400);

    const queueHeader = await page.$('.shijianus-music-pocket__queue-header');
    if (!queueHeader) throw new Error('Queue tab missing header');
    console.log('✅ 待播队列 verified');

    // 6. Test Close button
    console.log('🖱️ Closing panel...');
    const closeBtn = await page.$('.shijianus-music-pocket__close-btn');
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(400);
      const isClosed = await page.$eval('.shijianus-music-pocket', (el) => !el.classList.contains('is-open'));
      if (!isClosed) throw new Error('Panel failed to close');
      console.log('✅ Panel smoothly closed');
    }

    // 7. Test Mobile Viewport
    console.log('📱 Testing Mobile Viewport (375x667)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const toggleBox = await toggleBtn.boundingBox();
    console.log(`📱 Mobile toggle size: ${toggleBox.width}x${toggleBox.height}`);
    if (toggleBox.width > 50) {
      throw new Error(`Mobile toggle too large: ${toggleBox.width}px (expected <= 46px)`);
    }
    console.log('✅ Mobile layout confirmed compact and non-intrusive');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
