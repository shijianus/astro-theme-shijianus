import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function main() {
  const server = spawn('python3', ['-m', 'http.server', '4321', '-d', 'dist'], { stdio: 'pipe' });
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto('http://localhost:4321/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });

  const tocInfo = await page.evaluate(() => {
    const card = document.querySelector('#card-toc');
    const content = document.querySelector('#card-toc .toc-content');
    const list = document.querySelector('#card-toc .toc-list');
    const firstLink = document.querySelector('#card-toc .toc-link');
    const text = document.querySelector('#card-toc .toc-text');

    return {
      cardRect: card?.getBoundingClientRect(),
      contentRect: content?.getBoundingClientRect(),
      listRect: list?.getBoundingClientRect(),
      firstLinkRect: firstLink?.getBoundingClientRect(),
      firstLinkText: firstLink?.innerText,
      firstLinkComputed: firstLink ? {
        color: window.getComputedStyle(firstLink).color,
        background: window.getComputedStyle(firstLink).backgroundColor,
        fontSize: window.getComputedStyle(firstLink).fontSize,
        height: window.getComputedStyle(firstLink).height,
        display: window.getComputedStyle(firstLink).display,
        visibility: window.getComputedStyle(firstLink).visibility,
        opacity: window.getComputedStyle(firstLink).opacity,
      } : null,
      textComputed: text ? {
        color: window.getComputedStyle(text).color,
        display: window.getComputedStyle(text).display,
        visibility: window.getComputedStyle(text).visibility,
        opacity: window.getComputedStyle(text).opacity,
      } : null,
      contentComputed: content ? {
        height: window.getComputedStyle(content).height,
        maxHeight: window.getComputedStyle(content).maxHeight,
        overflow: window.getComputedStyle(content).overflow,
      } : null
    };
  });

  console.log('TOC Debug info:', JSON.stringify(tocInfo, null, 2));

  await browser.close();
  server.kill();
}

main().catch(console.error);
