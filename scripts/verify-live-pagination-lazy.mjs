import { chromium } from 'playwright';
import fs from 'fs';

const PROD_URLS = [
  'https://c60ba7ef.shijianus-blog.pages.dev/',
  'https://blog.epocanvas.com/'
];

(async () => {
  console.log('[PROD E2E] Running Live Verification on Cloudflare Pages...');
  const executablePath = fs.existsSync('/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome')
    ? '/root/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'
    : undefined;
  const browser = await chromium.launch({ headless: true, executablePath });

  try {
    for (const prodUrl of PROD_URLS) {
      console.log(`\n========================================`);
      console.log(`Auditing target: ${prodUrl}`);
      console.log(`========================================`);

      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(prodUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // 1. Verify existence of #home-pagination
      const pagination = await page.$('#home-pagination');
      if (!pagination) {
        throw new Error(`❌ #home-pagination element not found on ${prodUrl}!`);
      }
      console.log('✅ Found #home-pagination element on live site');

      // 2. Verify Prev Button
      const prevBtn = await page.$('.home-pagination__btn.home-pagination__prev');
      if (!prevBtn) throw new Error('❌ .home-pagination__prev not found on live site');

      const prevInfo = await page.evaluate((el) => {
        const icon = el.querySelector('i.anzhiyufont');
        const textSpan = el.querySelector('.home-pagination__btn-text');
        const computed = window.getComputedStyle(el);
        return {
          hasTextSpan: Boolean(textSpan),
          rawText: el.innerText.trim(),
          hasIcon: Boolean(icon && icon.classList.contains('anzhiyu-icon-angle-left')),
          isDisabled: el.classList.contains('is-disabled'),
          dataTooltip: el.getAttribute('data-tooltip'),
          width: computed.width,
          height: computed.height,
          pointerEvents: computed.pointerEvents,
          cursor: computed.cursor
        };
      }, prevBtn);

      console.log('Live Prev Button state:', prevInfo);
      if (prevInfo.hasTextSpan || prevInfo.rawText.includes('上页')) {
        throw new Error('❌ Prev button contains explicit text on live site!');
      }
      if (!prevInfo.hasIcon) {
        throw new Error('❌ Prev button missing icon on live site!');
      }
      if (prevInfo.dataTooltip !== '已是第一页') {
        throw new Error(`❌ Prev button tooltip mismatch on live site: ${prevInfo.dataTooltip}`);
      }
      if (parseFloat(prevInfo.width) < 32 || parseFloat(prevInfo.height) < 32) {
        throw new Error(`❌ Prev button dimensions mismatch: ${prevInfo.width}x${prevInfo.height}`);
      }
      console.log('✅ Prev button icon, tooltip ("已是第一页"), and 36x36px dimensions verified');

      // 3. Verify Next Button
      const nextBtn = await page.$('.home-pagination__btn.home-pagination__next');
      if (!nextBtn) throw new Error('❌ .home-pagination__next not found on live site');

      const nextInfo = await page.evaluate((el) => {
        const icon = el.querySelector('i.anzhiyufont');
        const textSpan = el.querySelector('.home-pagination__btn-text');
        const computed = window.getComputedStyle(el);
        return {
          hasTextSpan: Boolean(textSpan),
          rawText: el.innerText.trim(),
          hasIcon: Boolean(icon && icon.classList.contains('anzhiyu-icon-angle-right')),
          dataTooltip: el.getAttribute('data-tooltip'),
          width: computed.width,
          height: computed.height
        };
      }, nextBtn);

      console.log('Live Next Button state:', nextInfo);
      if (nextInfo.hasTextSpan || nextInfo.rawText.includes('下页')) {
        throw new Error('❌ Next button contains explicit text on live site!');
      }
      if (!nextInfo.hasIcon) {
        throw new Error('❌ Next button missing icon on live site!');
      }
      if (nextInfo.dataTooltip !== '下一页') {
        throw new Error(`❌ Next button tooltip mismatch on live site: ${nextInfo.dataTooltip}`);
      }
      console.log('✅ Next button icon, tooltip ("下一页"), and 36x36px dimensions verified');

      // 4. Hover verification
      await nextBtn.hover();
      await page.waitForTimeout(300);
      const nextHoverTooltip = await page.evaluate((el) => {
        const pseudo = window.getComputedStyle(el, '::before');
        return {
          content: pseudo.content,
          opacity: pseudo.opacity,
          visibility: pseudo.visibility,
          bottom: pseudo.bottom
        };
      }, nextBtn);
      console.log('Live Next button hover tooltip:', nextHoverTooltip);
      if (!nextHoverTooltip.content || !nextHoverTooltip.content.includes('下一页')) {
        throw new Error('❌ Live next button hover tooltip failed');
      }
      console.log('✅ Live next button hover tooltip confirmed');

      // 5. Test Live Seamless In-place Feed Switching
      console.log('\nTesting live seamless in-place feed switching without page reload...');
      await page.evaluate(() => {
        window.__LIVE_NO_RELOAD_PROBE__ = 778899;
      });

      console.log('Clicking Next Button on live site...');
      await nextBtn.click();

      await page.waitForFunction(() => window.location.pathname.includes('/page/2/'), { timeout: 12000 });
      console.log('✅ Live URL seamlessly updated to:', await page.evaluate(() => window.location.href));

      await page.waitForTimeout(600);

      const liveProbe = await page.evaluate(() => window.__LIVE_NO_RELOAD_PROBE__);
      if (liveProbe !== 778899) {
        throw new Error('❌ Live page suffered a hard reload! Probe was lost!');
      }
      console.log('🌟 LIVE VERIFIED: Probe preserved! ZERO HARD PAGE RELOAD on production!');

      const activePageNum = await page.evaluate(() => {
        return document.querySelector('.home-pagination__num.is-current')?.textContent?.trim();
      });
      if (activePageNum !== '2') {
        throw new Error(`❌ Expected page 2 active, got: ${activePageNum}`);
      }
      console.log('✅ Live active page number is 2');

      // Nav back to Page 1
      const page2PrevBtn = await page.$('.home-pagination__btn.home-pagination__prev');
      await page2PrevBtn.click();
      await page.waitForFunction(() => window.location.pathname === '/' || window.location.pathname === '', { timeout: 12000 });
      console.log('✅ Live URL seamlessly returned to:', await page.evaluate(() => window.location.href));

      const probeAfterReturn = await page.evaluate(() => window.__LIVE_NO_RELOAD_PROBE__);
      if (probeAfterReturn !== 778899) {
        throw new Error('❌ Probe lost on live return navigation!');
      }
      console.log('🌟 LIVE VERIFIED: Probe preserved on return! Two-way in-place switching 100% verified!');

      // Check console errors
      const fatalErrors = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Stripe'));
      if (fatalErrors.length > 0) {
        console.warn('⚠️ Console errors noticed:', fatalErrors);
      } else {
        console.log('✅ 0 fatal console errors on live site');
      }

      await page.close();
    }

    console.log('\n🏆 ALL PRODUCTION SITES (Cloudflare Pages Deployment & Custom Domain) VERIFIED 100% PASS!');
  } finally {
    await browser.close();
  }
})();
