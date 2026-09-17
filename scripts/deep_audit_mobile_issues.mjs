import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = '/home/shijian/projects/shijianus-blog/scripts/audit_screenshots/mobile_audit';
const BASE_URL = 'https://blog.epocanvas.com';

async function deepAudit() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  // 1. Inspect #rightside CSS and collapse cause
  console.log('--- 1. Inspecting #rightside CSS Collapse ---');
  await page.goto(`${BASE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(2500);

  const rightsideDetails = await page.evaluate(() => {
    const rs = document.getElementById('rightside');
    const rsConfig = document.getElementById('rightside-config-hide');
    const rsShow = document.getElementById('rightside-config-show');
    const goUp = document.getElementById('go-up');
    const mobileToc = document.getElementById('mobile-toc-button');
    
    return {
      rsStyle: rs ? {
        position: window.getComputedStyle(rs).position,
        bottom: window.getComputedStyle(rs).bottom,
        right: window.getComputedStyle(rs).right,
        height: rs.offsetHeight,
        maxHeight: window.getComputedStyle(rs).maxHeight,
        overflow: window.getComputedStyle(rs).overflow,
        display: window.getComputedStyle(rs).display,
        flexDirection: window.getComputedStyle(rs).flexDirection
      } : null,
      rsConfigStyle: rsConfig ? {
        height: rsConfig.offsetHeight,
        display: window.getComputedStyle(rsConfig).display,
        transform: window.getComputedStyle(rsConfig).transform
      } : null,
      rsShowStyle: rsShow ? {
        height: rsShow.offsetHeight,
        display: window.getComputedStyle(rsShow).display,
        flexDirection: window.getComputedStyle(rsShow).flexDirection
      } : null,
      goUpMetrics: goUp ? {
        offsetWidth: goUp.offsetWidth,
        offsetHeight: goUp.offsetHeight,
        computedHeight: window.getComputedStyle(goUp).height,
        flex: window.getComputedStyle(goUp).flex,
        rect: goUp.getBoundingClientRect()
      } : null,
      mobileTocMetrics: mobileToc ? {
        offsetWidth: mobileToc.offsetWidth,
        offsetHeight: mobileToc.offsetHeight,
        computedHeight: window.getComputedStyle(mobileToc).height,
        rect: mobileToc.getBoundingClientRect()
      } : null
    };
  });
  console.log('Rightside Breakdown:', JSON.stringify(rightsideDetails, null, 2));
  await page.screenshot({ path: path.join(outDir, 'deep_01_rightside_collapsed.png') });

  // 2. Click mobile-toc-button and see what happens
  console.log('--- 2. Testing mobile-toc-button Click ---');
  const tocBtn = page.locator('#mobile-toc-button');
  if (await tocBtn.isVisible()) {
    await tocBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'deep_02_toc_clicked.png') });
    
    const tocState = await page.evaluate(() => {
      const cardToc = document.getElementById('card-toc');
      const mobileTocDiv = document.querySelector('.mobile-toc, #mobile-toc');
      return {
        cardTocVisible: cardToc ? window.getComputedStyle(cardToc).display !== 'none' : false,
        cardTocRect: cardToc ? cardToc.getBoundingClientRect() : null,
        mobileTocDivFound: !!mobileTocDiv,
        mobileTocDivDisplay: mobileTocDiv ? window.getComputedStyle(mobileTocDiv).display : null
      };
    });
    console.log('TOC state after click:', tocState);
  }

  // 3. Inspect Console Modal (#console)
  console.log('--- 3. Testing Console Modal on Mobile ---');
  const consoleBtn = page.locator('#center-console-button-astro, button.icon-button:has-text("")').first();
  if (await consoleBtn.isVisible()) {
    await consoleBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'deep_03_console_open.png') });

    const consoleModalMetrics = await page.evaluate(() => {
      const consoleEl = document.getElementById('console');
      const cardGroup = document.querySelector('.console-card-group');
      const btnGroup = document.querySelector('#console .button-group, .button-group');
      const activityCard = document.querySelector('.console-card.activity');
      const historyCard = document.querySelector('.console-card.history');
      const shortcuts = document.querySelector('.console-shortcuts');
      const closeBtn = document.querySelector('.console-close, #console .close-btn');

      return {
        consoleShown: consoleEl ? consoleEl.classList.contains('show') : false,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        cardGroupRect: cardGroup ? cardGroup.getBoundingClientRect() : null,
        btnGroupRect: btnGroup ? btnGroup.getBoundingClientRect() : null,
        activityRect: activityCard ? activityCard.getBoundingClientRect() : null,
        historyRect: historyCard ? historyCard.getBoundingClientRect() : null,
        shortcutsRect: shortcuts ? shortcuts.getBoundingClientRect() : null,
        closeBtnRect: closeBtn ? closeBtn.getBoundingClientRect() : null,
        isCloseBtnVisible: closeBtn ? window.getComputedStyle(closeBtn).display !== 'none' : false
      };
    });
    console.log('Console Modal Metrics:', JSON.stringify(consoleModalMetrics, null, 2));

    // Close console
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);
  }

  // 4. Inspect Reward Modal on Article
  console.log('--- 4. Testing Reward Modal on Article ---');
  const rewardBtn = page.locator('.post-reward button.reward-button').first();
  if (await rewardBtn.isVisible()) {
    await rewardBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await rewardBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'deep_04_reward_modal_opened.png') });

    const rewardMetrics = await page.evaluate(() => {
      const modal = document.querySelector('.reward-modal, #reward-modal, [data-reward-modal]');
      const container = document.querySelector('.reward-modal-content, .reward-modal-container, .reward-dialog-card, .reward-main');
      const tabs = Array.from(document.querySelectorAll('[data-reward-tab], .reward-tab-item, .reward-type-btn, .reward-mode-tab')).map(t => ({
        text: t.innerText.trim(),
        rect: t.getBoundingClientRect()
      }));
      const closeBtn = document.querySelector('.reward-modal-close, [data-action="close-reward"]');

      return {
        modalFound: !!modal,
        containerRect: container ? container.getBoundingClientRect() : null,
        tabs,
        closeBtnRect: closeBtn ? closeBtn.getBoundingClientRect() : null,
        viewport: { width: window.innerWidth, height: window.innerHeight }
      };
    });
    console.log('Reward Modal Metrics:', JSON.stringify(rewardMetrics, null, 2));

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
  }

  // 5. Inspect Account Drawer
  console.log('--- 5. Testing Account Drawer on Mobile ---');
  const avatarBtn = page.locator('#nav .site-page[href="/account/"], #nav a[href*="account"]').first();
  if (await avatarBtn.isVisible()) {
    await avatarBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'deep_05_account_drawer.png') });

    const accountDrawerInfo = await page.evaluate(() => {
      const drawer = document.querySelector('.theme-account-drawer');
      const overlay = document.querySelector('.theme-account-overlay');
      return {
        drawerClass: drawer ? drawer.className : '',
        drawerRect: drawer ? drawer.getBoundingClientRect() : null,
        overlayClass: overlay ? overlay.className : '',
        overlayDisplay: overlay ? window.getComputedStyle(overlay).display : null,
        currentUrl: window.location.href
      };
    });
    console.log('Account Drawer Info:', JSON.stringify(accountDrawerInfo, null, 2));
  }

  // 6. Inspect Aside Content on Mobile Articles
  console.log('--- 6. Inspecting #aside-content Placement on Mobile ---');
  const asideMetrics = await page.evaluate(() => {
    const aside = document.getElementById('aside-content');
    const authorCard = document.querySelector('.card-info');
    const tocCard = document.getElementById('card-toc');
    const recentCard = document.querySelector('.card-recent-post');
    
    return {
      asideRect: aside ? aside.getBoundingClientRect() : null,
      asideComputedDisplay: aside ? window.getComputedStyle(aside).display : 'none',
      authorCardRect: authorCard ? authorCard.getBoundingClientRect() : null,
      authorCardDisplay: authorCard ? window.getComputedStyle(authorCard).display : 'none',
      tocCardRect: tocCard ? tocCard.getBoundingClientRect() : null,
      tocCardDisplay: tocCard ? window.getComputedStyle(tocCard).display : 'none',
      recentCardRect: recentCard ? recentCard.getBoundingClientRect() : null,
      recentCardDisplay: recentCard ? window.getComputedStyle(recentCard).display : 'none'
    };
  });
  console.log('Aside Content Placement on Mobile:', JSON.stringify(asideMetrics, null, 2));

  // 7. Inspect Comments and Input Box Keyboard/Touch usability
  console.log('--- 7. Inspecting Comments Usability on Mobile ---');
  await page.evaluate(() => {
    const comment = document.getElementById('post-comment');
    if (comment) comment.scrollIntoView();
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, 'deep_07_comment_section.png') });

  const commentDetails = await page.evaluate(() => {
    const commentSec = document.getElementById('post-comment');
    const textarea = commentSec ? commentSec.querySelector('textarea') : null;
    const sendBtn = commentSec ? commentSec.querySelector('button[type="submit"], .tk-send, .comment-submit-btn') : null;
    const modeTabs = commentSec ? Array.from(commentSec.querySelectorAll('button')).filter(b => b.innerText.includes('评论') || b.innerText.includes('Boost') || b.innerText.includes('表情')).map(b => ({
      text: b.innerText.trim(),
      rect: b.getBoundingClientRect()
    })) : [];

    return {
      textareaRect: textarea ? textarea.getBoundingClientRect() : null,
      textareaStyle: textarea ? {
        fontSize: window.getComputedStyle(textarea).fontSize,
        padding: window.getComputedStyle(textarea).padding,
        height: textarea.offsetHeight
      } : null,
      sendBtnRect: sendBtn ? sendBtn.getBoundingClientRect() : null,
      modeTabs
    };
  });
  console.log('Comment Usability Details:', JSON.stringify(commentDetails, null, 2));

  await browser.close();
}

deepAudit().catch(console.error);
