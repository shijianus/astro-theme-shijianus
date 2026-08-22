import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function main() {
  const server = spawn('python3', ['-m', 'http.server', '4321', '-d', 'dist'], { stdio: 'pipe' });
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto('http://localhost:4321/posts/anzhiyu-markdown-showcase/', { waitUntil: 'networkidle' });

  const layoutInfo = await page.evaluate(() => {
    const layout = document.querySelector('#content-inner.layout');
    const main = document.querySelector('.page-main');
    const aside = document.querySelector('.page-aside');
    const asideSticky = document.querySelector('.page-aside__sticky');
    const asideContent = document.querySelector('#aside-content');
    const stickyLayout = document.querySelector('#aside-content .sticky_layout');

    return {
      layout: {
        height: layout?.offsetHeight,
        computedDisplay: layout ? window.getComputedStyle(layout).display : null,
        computedAlignItems: layout ? window.getComputedStyle(layout).alignItems : null,
      },
      main: {
        height: main?.offsetHeight,
      },
      aside: {
        height: aside?.offsetHeight,
        computedHeight: aside ? window.getComputedStyle(aside).height : null,
        computedAlignSelf: aside ? window.getComputedStyle(aside).alignSelf : null,
      },
      asideSticky: {
        height: asideSticky?.offsetHeight,
        computedHeight: asideSticky ? window.getComputedStyle(asideSticky).height : null,
      },
      asideContent: {
        height: asideContent?.offsetHeight,
        computedHeight: asideContent ? window.getComputedStyle(asideContent).height : null,
      },
      stickyLayout: {
        height: stickyLayout?.offsetHeight,
        computedPosition: stickyLayout ? window.getComputedStyle(stickyLayout).position : null,
        computedTop: stickyLayout ? window.getComputedStyle(stickyLayout).top : null,
        computedTransform: stickyLayout ? window.getComputedStyle(stickyLayout).transform : null,
      }
    };
  });

  console.log('Layout Info:', JSON.stringify(layoutInfo, null, 2));

  await page.evaluate(() => window.scrollBy(0, 3500));
  await page.waitForTimeout(500);

  const scrolledInfo = await page.evaluate(() => {
    const stickyLayout = document.querySelector('#aside-content .sticky_layout');
    return {
      stickyLayoutRect: stickyLayout?.getBoundingClientRect(),
      computedTransform: stickyLayout ? window.getComputedStyle(stickyLayout).transform : null,
      stickyState: stickyLayout?.dataset.stickyState,
      bodyScrollY: window.scrollY
    };
  });

  console.log('Scrolled Info:', JSON.stringify(scrolledInfo, null, 2));

  await browser.close();
  server.kill();
}

main().catch(console.error);
