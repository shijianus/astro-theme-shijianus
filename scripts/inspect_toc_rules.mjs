import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function main() {
  const server = spawn('python3', ['-m', 'http.server', '4321', '-d', 'dist'], { stdio: 'pipe' });
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto('http://localhost:4321/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });

  const rules = await page.evaluate(() => {
    const el = document.querySelector('#card-toc .toc-text');
    const matched = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && el.matches(rule.selectorText)) {
            if (rule.style.color || rule.style.cssText.includes('color')) {
              matched.push({ selector: rule.selectorText, cssText: rule.style.cssText, href: sheet.href });
            }
          }
        }
      } catch (e) {}
    }
    return matched;
  });

  console.log('Matched rules on .toc-text:', JSON.stringify(rules, null, 2));

  await browser.close();
  server.kill();
}

main().catch(console.error);
