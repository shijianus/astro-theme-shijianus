import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function verifyLive() {
  console.log('🌐 Starting live production E2E verification on https://blog.epocanvas.com/posts/badges-guide/ ...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('🔴 LIVE ERROR:', msg.text());
      errors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('🔴 LIVE PAGEERROR:', err.message);
    errors.push(err.message);
  });

  try {
    const res = await page.goto('https://blog.epocanvas.com/posts/badges-guide/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log(`📡 HTTP Status: ${res.status()}`);
    if (res.status() !== 200) {
      throw new Error(`Expected 200 OK, got ${res.status()}`);
    }

    // Wait for mermaid wrapper
    const wrap = await page.waitForSelector('.mermaid-diagram-wrap', { timeout: 15000 });
    console.log('✅ Found .mermaid-diagram-wrap on live production site!');

    await page.waitForTimeout(2000);
    const svg = await wrap.$('svg');
    if (!svg) {
      throw new Error('SVG not found in live production .mermaid-diagram-wrap!');
    }
    const svgBox = await svg.boundingBox();
    console.log(`📊 Live SVG bounding box: Width=${svgBox?.width}px, Height=${svgBox?.height}px`);

    // Hide sticky nav before screenshot
    await page.evaluate(() => {
      const nav = document.getElementById('nav');
      if (nav) nav.style.display = 'none';
    });
    await wrap.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const outDir = path.resolve(process.cwd(), 'scripts/audit_screenshots');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const screenshotPath = path.join(outDir, 'live_mermaid_badges_guide.png');
    await wrap.screenshot({ path: screenshotPath });
    console.log(`📸 Live screenshot saved to: ${screenshotPath}`);

    // Verify key titles exist in article body
    const content = await page.content();
    const hasPioneer = content.includes('先驱');
    const hasInkMaster = content.includes('墨海宗师');
    const hasGenesisScribe = content.includes('创世墨客');
    const hasFrontrunner = content.includes('领跑者');
    const has35Limit = content.includes('35');

    console.log(`Titles in content: 先驱=${hasPioneer}, 墨海宗师=${hasInkMaster}, 创世墨客=${hasGenesisScribe}, 领跑者=${hasFrontrunner}, 35分封顶=${has35Limit}`);

    if (hasPioneer && hasInkMaster && hasGenesisScribe && hasFrontrunner && has35Limit) {
      console.log('🎉 Live production E2E verification passed 100%!');
    } else {
      throw new Error('Some expected title content was missing in live HTML!');
    }
  } catch (err) {
    console.error('❌ Live verification failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

verifyLive();
