import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function main() {
  console.log('Starting static server on dist folder...');
  const server = spawn('python3', ['-m', 'http.server', '4321', '-d', 'dist'], {
    stdio: 'pipe'
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log('Launching browser for Node 2 verification...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const targetUrl = 'http://localhost:4321/posts/anzhiyu-markdown-showcase/';
  console.log('Navigating to', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // 1. Capture unified layout
  await page.screenshot({ path: 'scripts/verify_node2_layout.png', fullPage: false });

  // 2. Scroll down a bit and capture mid
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/verify_node2_scroll.png', fullPage: false });

  // 3. Toggle read mode
  await page.evaluate(() => {
    document.body.classList.add('read-mode');
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/verify_node2_readmode.png', fullPage: false });

  // 4. Dark mode + Read mode
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/verify_node2_readmode_dark.png', fullPage: false });

  console.log('Node 2 verification screenshots captured successfully!');
  await browser.close();
  server.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
