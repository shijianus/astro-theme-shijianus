import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { join } from 'path';

async function verify() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Load the CSS we just wrote
  const css = readFileSync('src/styles/final-pass.css', 'utf8');

  const html = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <style>
        body { background: #000; margin: 0; padding: 50px; }
        ${css}
        /* Mocking some variables and layout context */
        :root {
          --white: #fff;
          --font-color: #fff;
        }
        .categoryGroup { width: 400px; display: flex; gap: 12px; }
        .categoryItem { flex: 1; min-width: 0; }
        .categoryButton { display: flex; align-items: center; padding: 15px 13px; background: #1a1a1a; text-decoration: none; border-radius: 12px; }
      </style>
    </head>
    <body data-type="home">
      <div class="categoryGroup">
        <div class="categoryItem" id="normal">
          <a class="categoryButton" href="#">
            <span class="categoryButtonCopy">
              <span class="categoryButtonText">学习笔记</span>
              <span class="categoryDivider"></span>
              <span class="categoryButtonDesc">课程、实验与思考</span>
            </span>
          </a>
        </div>
      </div>

      <div class="categoryGroup" style="width: 200px; margin-top: 50px;">
        <div class="categoryItem" id="compressed">
          <a class="categoryButton" href="#">
            <span class="categoryButtonCopy">
              <span class="categoryButtonText">学习笔记</span>
              <span class="categoryDivider"></span>
              <span class="categoryButtonDesc">这是一个非常长的描述文本，旨在测试在宽度极度压缩的情况下是否能够正确折行并截断到两行。</span>
            </span>
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);

  console.log('--- Verification Started ---');

  // 1. Alignment Verification
  const alignmentResult = await page.evaluate(() => {
    const copy = document.querySelector('#normal .categoryButtonCopy');
    const text = document.querySelector('#normal .categoryButtonText');
    const divider = document.querySelector('#normal .categoryDivider');
    const desc = document.querySelector('#normal .categoryButtonDesc');

    const tRect = text.getBoundingClientRect();
    const dRect = divider.getBoundingClientRect();
    const sRect = desc.getBoundingClientRect();

    const tMid = tRect.top + tRect.height / 2;
    const dMid = dRect.top + dRect.height / 2;
    const sMid = sRect.top + sRect.height / 2;

    const diffTD = Math.abs(tMid - dMid);
    const diffDS = Math.abs(dMid - sMid);

    return {
      tMid, dMid, sMid,
      diffTD, diffDS,
      isAligned: diffTD < 1 && diffDS < 1
    };
  });

  console.log('Alignment Check:', alignmentResult);
  if (!alignmentResult.isAligned) {
    console.error('FAILED: Vertical alignment error > 1px');
  } else {
    console.log('PASSED: Vertical alignment is perfect.');
  }

  // 2. Truncation Verification
  const truncationResult = await page.evaluate(() => {
    const desc = document.querySelector('#compressed .categoryButtonDesc');
    const style = window.getComputedStyle(desc);
    const lineHeight = parseFloat(style.lineHeight);
    const height = desc.offsetHeight;
    const lineCount = Math.round(height / lineHeight);

    return {
      height,
      lineHeight,
      lineCount,
      isTruncated: lineCount <= 2
    };
  });

  console.log('Truncation Check:', truncationResult);
  if (!truncationResult.isTruncated) {
    console.error('FAILED: Description should be max 2 lines.');
  } else {
    console.log('PASSED: Truncation is correct (<= 2 lines).');
  }

  // Take a screenshot for visual confirmation
  await page.screenshot({ path: 'category-ui-verify.png' });
  console.log('Screenshot saved as category-ui-verify.png');

  await browser.close();

  if (alignmentResult.isAligned && truncationResult.isTruncated) {
    console.log('--- All tests passed! ---');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
