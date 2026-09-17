import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/mobile_audit';
const BASE_URL = 'https://blog.epocanvas.com';

async function targetedAudit() {
  console.log('🚀 Starting Targeted Evidence Collection for Mobile Audit...');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  // Test Case 1: Mobile Hamburger Menu Click & Panel
  console.log('\n--- Case 1: Hamburger Menu (#toggle-menu) Interaction ---');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'load', timeout: 35000 });
  await page.waitForTimeout(2000); // Allow hydration

  const toggleLink = page.locator('#toggle-menu a.site-page');
  const toggleVisible = await toggleLink.isVisible();
  console.log('#toggle-menu a.site-page visible:', toggleVisible);

  let panelAppeared = false;
  if (toggleVisible) {
    await toggleLink.click();
    await page.waitForTimeout(600);
    panelAppeared = await page.locator('.site-mobile-panel').isVisible();
    console.log('.site-mobile-panel appeared after click:', panelAppeared);
    await page.screenshot({ path: path.join(outDir, 'evidence_01_hamburger_panel.png') });
  }

  // Test Case 2: Center Console on Mobile
  console.log('\n--- Case 2: Center Console on Mobile ---');
  const consoleBtn = page.locator('#center-console-button-astro, #nav [data-action="console"], .shijianus-dashboard-icon button').first();
  const consoleVisible = await consoleBtn.isVisible();
  console.log('Console button visible:', consoleVisible);
  if (consoleVisible) {
    await consoleBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'evidence_02_console_modal.png') });
    
    const consoleMetrics = await page.evaluate(() => {
      const consoleEl = document.getElementById('console');
      const cardGroup = document.querySelector('.console-card-group');
      const btnGroup = document.querySelector('.button-group');
      const activityCard = document.querySelector('.console-card.activity');
      const closeBtn = document.querySelector('.console-close, #console .close-btn');

      const cgRect = cardGroup ? cardGroup.getBoundingClientRect() : null;
      const bgRect = btnGroup ? btnGroup.getBoundingClientRect() : null;
      const acRect = activityCard ? activityCard.getBoundingClientRect() : null;
      const cbRect = closeBtn ? closeBtn.getBoundingClientRect() : null;

      return {
        isShown: consoleEl ? consoleEl.classList.contains('show') : false,
        cardGroupRect: cgRect,
        btnGroupRect: bgRect,
        activityRect: acRect,
        closeBtnRect: cbRect,
        isCloseBtnVisible: cbRect ? cbRect.width > 0 && cbRect.height > 0 : false,
        btnGroupBottom: bgRect ? window.innerHeight - bgRect.bottom : null,
        activityBottom: acRect ? acRect.bottom : null
      };
    });
    console.log('Console metrics:', JSON.stringify(consoleMetrics, null, 2));

    // Close console
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
  }

  // Test Case 3: Post Detail - #rightside Vertical Collapse Analysis
  console.log('\n--- Case 3: #rightside Vertical Collapse in Post Detail ---');
  await page.goto(`${BASE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'load', timeout: 35000 });
  await page.waitForTimeout(2500);

  const rightsideAnalysis = await page.evaluate(() => {
    const rs = document.getElementById('rightside');
    const rsConfigHide = document.getElementById('rightside-config-hide');
    const rsConfigShow = document.getElementById('rightside-config-show');

    const getBtnInfo = (id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        id,
        height: rect.height,
        width: rect.width,
        computedHeight: style.height,
        minHeight: style.minHeight,
        maxHeight: style.maxHeight,
        flex: style.flex,
        boxSizing: style.boxSizing,
        display: style.display,
        overflow: style.overflow
      };
    };

    return {
      rightsideRect: rs ? rs.getBoundingClientRect() : null,
      rightsideStyle: rs ? {
        height: window.getComputedStyle(rs).height,
        maxHeight: window.getComputedStyle(rs).maxHeight,
        overflow: window.getComputedStyle(rs).overflow,
        display: window.getComputedStyle(rs).display
      } : null,
      rsConfigHideStyle: rsConfigHide ? {
        height: rsConfigHide.getBoundingClientRect().height,
        display: window.getComputedStyle(rsConfigHide).display,
        transform: window.getComputedStyle(rsConfigHide).transform
      } : null,
      rsConfigShowStyle: rsConfigShow ? {
        height: rsConfigShow.getBoundingClientRect().height,
        display: window.getComputedStyle(rsConfigShow).display
      } : null,
      buttons: [
        getBtnInfo('readmode'),
        getBtnInfo('mobile-toc-button'),
        getBtnInfo('to_comment'),
        getBtnInfo('translate'),
        getBtnInfo('rightside-config'),
        getBtnInfo('darkmode'),
        getBtnInfo('hide-rightside-btn'),
        getBtnInfo('go-up')
      ]
    };
  });
  console.log('Rightside Button Details:', JSON.stringify(rightsideAnalysis, null, 2));
  await page.screenshot({ path: path.join(outDir, 'evidence_03_rightside_zoom.png') });

  // Test Case 4: Reward Modal in Post Detail
  console.log('\n--- Case 4: Reward Modal in Post Detail ---');
  const rewardBtn = page.locator('.post-reward button.reward-button').first();
  if (await rewardBtn.isVisible()) {
    await rewardBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await rewardBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'evidence_04_reward_modal.png') });

    const rewardModalDetails = await page.evaluate(() => {
      const modal = document.querySelector('.reward-modal, #reward-modal, .theme-reward-dialog');
      const dialog = document.querySelector('.reward-modal-container, .reward-dialog-card, [role="dialog"]');
      const closeBtn = document.querySelector('.reward-modal-close, [data-action="close-reward"]');
      const qrcode = document.querySelector('.reward-qrcode, .reward-qr-img, img[src*="wechat"], img[src*="alipay"]');
      
      return {
        modalFound: !!modal,
        dialogRect: dialog ? dialog.getBoundingClientRect() : null,
        closeBtnRect: closeBtn ? closeBtn.getBoundingClientRect() : null,
        qrcodeFound: !!qrcode,
        qrcodeRect: qrcode ? qrcode.getBoundingClientRect() : null,
        winWidth: window.innerWidth,
        winHeight: window.innerHeight
      };
    });
    console.log('Reward Modal Details:', JSON.stringify(rewardModalDetails, null, 2));

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
  }

  // Test Case 5: TOC Interaction in Post Detail
  console.log('\n--- Case 5: Mobile TOC interaction in Post Detail ---');
  const tocBtn = page.locator('#mobile-toc-button');
  if (await tocBtn.isVisible()) {
    await tocBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'evidence_05_toc_clicked.png') });
    
    const tocDetails = await page.evaluate(() => {
      const cardToc = document.getElementById('card-toc');
      const tocSlider = document.querySelector('.toc-slider, #mobile-toc, .mobile-toc-wrapper');
      return {
        cardTocRect: cardToc ? cardToc.getBoundingClientRect() : null,
        cardTocDisplay: cardToc ? window.getComputedStyle(cardToc).display : 'none',
        cardTocVisibility: cardToc ? window.getComputedStyle(cardToc).visibility : 'none',
        cardTocTransform: cardToc ? window.getComputedStyle(cardToc).transform : 'none',
        tocSliderFound: !!tocSlider
      };
    });
    console.log('TOC details after click:', JSON.stringify(tocDetails, null, 2));
  }

  // Test Case 6: Support Page Mobile Layout (/support/)
  console.log('\n--- Case 6: Support Page Mobile Layout (/support/) ---');
  await page.goto(`${BASE_URL}/support/`, { waitUntil: 'load', timeout: 35000 });
  await page.waitForTimeout(2000);

  const supportDetails = await page.evaluate(() => {
    const currencyButtons = Array.from(document.querySelectorAll('.lg\\:col-span-7 .flex.items-center.gap-1.p-1 button, [data-currency-btn]')).map(b => ({
      text: b.innerText.trim(),
      rect: b.getBoundingClientRect()
    }));

    const presetButtons = Array.from(document.querySelectorAll('.grid.grid-cols-3 button, [data-tier-btn]')).map(b => ({
      text: b.innerText.trim().replace(/\n+/g, ' '),
      rect: b.getBoundingClientRect()
    }));

    const customInput = document.querySelector('input#custom-amount, input[type="number"]');
    const stripeBox = document.querySelector('.stripe-card, #stripe-checkout-btn, [data-stripe-container]');

    return {
      currencyButtons,
      presetButtons,
      customInputRect: customInput ? customInput.getBoundingClientRect() : null,
      stripeBoxRect: stripeBox ? stripeBox.getBoundingClientRect() : null
    };
  });
  console.log('Support page details:', JSON.stringify(supportDetails, null, 2));
  await page.screenshot({ path: path.join(outDir, 'evidence_06_support_top.png') });

  await browser.close();
  console.log('\n✅ Targeted Evidence Collection Completed!');
}

targetedAudit().catch(console.error);
