import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function main() {
  const server = spawn('python3', ['-m', 'http.server', '4321', '-d', 'dist'], { stdio: 'pipe' });
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto('http://localhost:4321/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });

  const ancestors = await page.evaluate(() => {
    let el = document.querySelector('#aside-content .sticky_layout');
    const result = [];
    while (el && el !== document.documentElement) {
      el = el.parentElement;
      if (el) {
        const style = window.getComputedStyle(el);
        result.push({
          tag: el.tagName,
          id: el.id,
          className: el.className,
          overflow: style.overflow,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          transform: style.transform,
          contain: style.contain,
        });
      }
    }
    return result;
  });

  console.log('Ancestors info:', JSON.stringify(ancestors, null, 2));

  await browser.close();
  server.kill();
}

main().catch(console.error);
