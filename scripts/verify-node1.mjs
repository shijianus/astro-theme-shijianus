import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function main() {
  const server = spawn('python3', ['-m', 'http.server', '4321', '-d', 'dist'], { stdio: 'pipe' });
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  const targetUrl = 'http://localhost:4321/posts/anzhiyu-markdown-showcase/';
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // 1. Top layout
  await page.screenshot({ path: 'scripts/verify_node1_top.png', fullPage: false });

  // 2. Scroll mid 1 (TOC active heading at 1100px)
  await page.evaluate(() => window.scrollBy(0, 1100));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/verify_node1_mid.png', fullPage: false });

  // 3. Scroll deep into post (e.g. 3500px) to see TOC active item change and progress bar update
  await page.evaluate(() => window.scrollBy(0, 2400));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/verify_node1_deep_scroll.png', fullPage: false });

  // 4. Scroll to bottom
  await page.evaluate(() => {
    const el = document.querySelector('.post-copyright') || document.querySelector('.relatedPosts');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/verify_node1_bottom.png', fullPage: false });

  await browser.close();
  server.kill();
  console.log('Verification screenshots complete!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
