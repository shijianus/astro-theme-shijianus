import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = '/root/.gemini/antigravity-cli/brain/edc1f694-f968-412f-9511-5e7d9f84c826';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });

  // 1. Scroll directly to "1. 混合阶梯语法（推荐 1~6 层骨干 + 无限列表深层衍生）"
  console.log('Testing 1: Scroll to 1. 混合阶梯语法 with depth=all');
  await page.evaluate(() => {
    const el = document.getElementById('1-混合阶梯语法推荐-16-层骨干--无限列表深层衍生');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(400);

  const resAll = await page.evaluate(() => {
    const active = document.querySelector('#card-toc .toc-link.active');
    const isVisible = active ? getComputedStyle(active.closest('.toc-item')).display !== 'none' : false;
    return {
      activeText: active ? active.textContent.trim() : null,
      href: active ? active.getAttribute('href') : null,
      isVisible
    };
  });
  console.log('Result at 混合阶梯语法 (depth=all):', resAll);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'toc-step-1-all-depth.png') });

  // 2. Test depth=3 fallback
  console.log('Testing 2: Switch depth to 3 (至3级)');
  await page.evaluate(() => {
    const cardToc = document.getElementById('card-toc');
    if (cardToc) {
      cardToc.setAttribute('data-depth-filter', '3');
      window.dispatchEvent(new CustomEvent('shijianus:toc-depth-changed', { detail: '3' }));
    }
  });
  await page.waitForTimeout(300);
  const resDepth3 = await page.evaluate(() => {
    const active = document.querySelector('#card-toc .toc-link.active');
    const isVisible = active ? getComputedStyle(active.closest('.toc-item')).display !== 'none' : false;
    return {
      activeText: active ? active.textContent.trim() : null,
      href: active ? active.getAttribute('href') : null,
      isVisible
    };
  });
  console.log('Result at 混合阶梯语法 (depth=3):', resDepth3);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'toc-step-2-depth-3.png') });

  // 3. Test depth=1 fallback
  console.log('Testing 3: Switch depth to 1 (1级)');
  await page.evaluate(() => {
    const cardToc = document.getElementById('card-toc');
    if (cardToc) {
      cardToc.setAttribute('data-depth-filter', '1');
      window.dispatchEvent(new CustomEvent('shijianus:toc-depth-changed', { detail: '1' }));
    }
  });
  await page.waitForTimeout(300);
  const resDepth1 = await page.evaluate(() => {
    const active = document.querySelector('#card-toc .toc-link.active');
    const isVisible = active ? getComputedStyle(active.closest('.toc-item')).display !== 'none' : false;
    return {
      activeText: active ? active.textContent.trim() : null,
      href: active ? active.getAttribute('href') : null,
      isVisible
    };
  });
  console.log('Result at 混合阶梯语法 (depth=1):', resDepth1);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'toc-step-3-depth-1.png') });

  // 4. Continuous scroll check across 10 sample positions in the article
  console.log('Testing 4: Continuous scroll across full article checking for 100% active alignment...');
  const scrollSteps = [500, 1500, 3000, 5000, 8000, 12000, 16000, 20000, 25000, 30000];
  let allPassed = true;

  for (const pos of scrollSteps) {
    await page.evaluate((y) => window.scrollTo(0, y), pos);
    await page.waitForTimeout(150);

    const check = await page.evaluate(() => {
      const activeLinks = Array.from(document.querySelectorAll('#card-toc .toc-link.active'));
      const visibleActiveLinks = activeLinks.filter(l => getComputedStyle(l.closest('.toc-item')).display !== 'none');
      return {
        activeCount: activeLinks.length,
        visibleActiveCount: visibleActiveLinks.length,
        activeText: visibleActiveLinks[0] ? visibleActiveLinks[0].textContent.trim() : null
      };
    });

    if (check.visibleActiveCount !== 1) {
      console.error(`FAILED at scrollY=${pos}: visibleActiveCount=${check.visibleActiveCount}`);
      allPassed = false;
    } else {
      console.log(`scrollY=${pos} OK -> Active: "${check.activeText}"`);
    }
  }

  console.log('All Continuous Scroll Positions Validated:', allPassed);

  await browser.close();
}

run().catch(console.error);
