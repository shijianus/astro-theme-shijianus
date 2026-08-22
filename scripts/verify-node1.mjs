import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function main() {
  console.log('Starting static server on dist folder...');
  const server = spawn('python3', ['-m', 'http.server', '4321', '-d', 'dist'], {
    stdio: 'pipe'
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log('Launching browser for Node 1 verification...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  const targetUrl = 'http://localhost:4321/posts/anzhiyu-markdown-showcase/';
  console.log('Navigating to', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // 1. Top layout
  await page.screenshot({ path: 'scripts/verify_node1_top.png', fullPage: false });

  // 2. Scroll mid (TOC active & sticky)
  await page.evaluate(() => window.scrollBy(0, 1100));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/verify_node1_mid.png', fullPage: false });

  // 3. Scroll to bottom
  await page.evaluate(() => {
    const el = document.querySelector('.post-copyright') || document.querySelector('.relatedPosts');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/verify_node1_bottom.png', fullPage: false });

  // 4. Read mode in light theme
  await page.evaluate(() => {
    document.body.classList.add('read-mode');
    document.documentElement.dataset.theme = 'light';
    window.scrollTo(0, 400);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/verify_node1_readmode_light.png', fullPage: false });

  // 5. Read mode in dark theme
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/verify_node1_readmode_dark.png', fullPage: false });

  console.log('All Node 1 screenshots captured successfully!');
  await browser.close();
  server.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
