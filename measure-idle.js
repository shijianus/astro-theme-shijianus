import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:4321', { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 1080, height: 800 });

  console.log('Testing AT TOP (animation should be running)...');
  await page.tracing.start({ path: 'trace-top.json' });
  await new Promise(r => setTimeout(r, 5000));
  await page.tracing.stop();
  
  const traceTop = JSON.parse(fs.readFileSync('trace-top.json'));
  const rafTop = traceTop.traceEvents.filter(e => e.name === 'FireAnimationFrame').length;
  console.log(`RAF calls at top (5s): ${rafTop}`);

  console.log('Scrolling down...');
  await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'auto' }));
  await new Promise(r => setTimeout(r, 1000)); // wait for scroll
  
  console.log('Testing SCROLLED DOWN (animation should be stopped)...');
  await page.tracing.start({ path: 'trace-bottom.json' });
  await new Promise(r => setTimeout(r, 5000));
  await page.tracing.stop();

  const traceBottom = JSON.parse(fs.readFileSync('trace-bottom.json'));
  const rafBottom = traceBottom.traceEvents.filter(e => e.name === 'FireAnimationFrame').length;
  console.log(`RAF calls scrolled down (5s): ${rafBottom}`);

  await browser.close();
  console.log('Done.');
})();
