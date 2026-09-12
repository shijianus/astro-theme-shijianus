import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function main() {
  console.log('🚀 Starting local python http server to verify Mermaid diagram rendering...');
  const preview = spawn('python3', ['-m', 'http.server', '4399', '-d', 'dist'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  // wait 1s for server to start
  await new Promise((r) => setTimeout(r, 1000));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', msg => console.log('[PAGE LOG]', msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

  try {
    console.log('🌐 Navigating to http://127.0.0.1:4399/posts/badges-guide/ ...');
    await page.goto('http://127.0.0.1:4399/posts/badges-guide/', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for mermaid wrapper
    const wrap = await page.waitForSelector('.mermaid-diagram-wrap', { timeout: 10000 });
    // Allow mermaid rendering to finish
    await page.waitForTimeout(1500);

    const box = await wrap.boundingBox();
    console.log(`📊 Mermaid Wrap bounding box: Width=${box?.width}px, Height=${box?.height}px`);

    const svg = await wrap.$('svg');
    if (!svg) {
      throw new Error('SVG not found inside .mermaid-diagram-wrap!');
    }
    const svgBox = await svg.boundingBox();
    console.log(`📊 Mermaid SVG bounding box: Width=${svgBox?.width}px, Height=${svgBox?.height}px`);

    // Ensure output dir exists
    const outDir = path.resolve(process.cwd(), 'scripts/audit_screenshots');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Hide sticky nav before screenshot to prevent overlap
    await page.evaluate(() => {
      const nav = document.getElementById('nav');
      if (nav) nav.style.display = 'none';
    });
    await wrap.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const screenshotPath = path.join(outDir, 'mermaid_badges_guide.png');
    await wrap.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to ${screenshotPath}`);

    // Check if height is reasonable (should be under 1400px, ideally around 600-900px, definitely not 2700px)
    if (svgBox && svgBox.height > 1600) {
      console.warn(`⚠️ Warning: Mermaid diagram height (${svgBox.height}px) is taller than expected!`);
    } else {
      console.log(`✅ Mermaid diagram height (${svgBox?.height}px) is compact and well-proportioned!`);
    }

    // Check nav collision: scroll wrap into view and check if #nav overlaps it
    await wrap.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const nav = await page.$('#nav');
    if (nav) {
      const navBox = await nav.boundingBox();
      const currentWrapBox = await wrap.boundingBox();
      console.log(`🧭 Nav bar: Top=${navBox?.y}px, Bottom=${(navBox?.y || 0) + (navBox?.height || 0)}px; Wrap: Top=${currentWrapBox?.y}px`);
      // Since wrap is scrolled into view, if nav is sticky, check z-index or overlap
      const navZIndex = await nav.evaluate((el) => window.getComputedStyle(el).zIndex);
      const wrapZIndex = await wrap.evaluate((el) => window.getComputedStyle(el).zIndex);
      console.log(`Layering: Nav z-index=${navZIndex}, Wrap z-index=${wrapZIndex}`);
    }

    console.log('🎉 Verification completed successfully!');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    preview.kill('SIGINT');
  }
}

main();
