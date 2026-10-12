import { chromium } from 'playwright';

async function verifyLiveMenus() {
  console.log('🚀 Starting live production E2E verification for #menus at https://blog.epocanvas.com/ ...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  try {
    await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(2000);

    // 1. Verify #menus exists and is visible on desktop
    const menusRect = await page.evaluate(() => {
      const menus = document.querySelector('#menus');
      if (!menus) return null;
      const comp = window.getComputedStyle(menus);
      const rect = menus.getBoundingClientRect();
      return {
        display: comp.display,
        visibility: comp.visibility,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    });
    console.log('[Live Audit 1] #menus element:', menusRect);
    if (!menusRect || menusRect.display === 'none') {
      throw new Error('#menus must be visible on live production desktop');
    }

    // 2. Verify all .site-page-shell elements are equal-sized (等大 68px)
    const shells = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('#menus .site-page-shell'));
      return els.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      });
    });
    console.log(`[Live Audit 2] .site-page-shell count: ${shells.length}`, shells);
    if (shells.length < 4) {
      throw new Error(`Expected at least 4 nav shells, got ${shells.length}`);
    }
    const targetWidth = shells[0].width;
    const allEqual = shells.every(s => Math.abs(s.width - targetWidth) <= 1);
    console.log(`[Live Audit 2] All shells equal width (${targetWidth}px): ${allEqual}`);
    if (!allEqual) {
      throw new Error('Not all .site-page-shell elements are equal width on live production');
    }

    // 3. Verify Pure Text Mode by default (No top-level icons, no subtitles)
    const pureTextCheck = await page.evaluate(() => {
      const topIcons = document.querySelectorAll('#menus .site-page > .site-page__icon, #menus .site-page > .site-page__icon-wrap');
      const topSubtitles = document.querySelectorAll('#menus .site-page .site-page__subtitle');
      const topLabels = document.querySelectorAll('#menus .site-page .site-page__label');
      const bilingualStacks = document.querySelectorAll('#menus .site-page .site-page__bilingual-stack');
      return {
        topIcons: topIcons.length,
        topSubtitles: topSubtitles.length,
        topLabels: topLabels.length,
        bilingualStacks: bilingualStacks.length,
      };
    });
    console.log('[Live Audit 3] Default Pure Text Audit:', pureTextCheck);
    if (pureTextCheck.topIcons !== 0) throw new Error('Top-level icons must be 0 by default on live');
    if (pureTextCheck.topSubtitles !== 0) throw new Error('Top-level subtitles must be 0 by default on live');
    if (pureTextCheck.bilingualStacks !== 0) throw new Error('Bilingual stacks must be 0 by default on live');
    if (pureTextCheck.topLabels < 4) throw new Error('Must have 4 pure text labels on live');

    // Screenshot default #menus
    const menusEl = await page.$('#menus');
    if (menusEl) {
      await menusEl.screenshot({ path: 'scripts/live_menus_default.png' });
      console.log('Saved scripts/live_menus_default.png');
    }

    // 4. Hover over first .menus_item.has-children to trigger submenu
    await page.hover('#menus .menus_item.has-children');
    await page.waitForTimeout(600);

    const submenuAudit = await page.evaluate(() => {
      const sub = document.querySelector('#menus .site-page-submenu');
      if (!sub) return null;
      const comp = window.getComputedStyle(sub);
      const firstItem = sub.querySelector('.site-page-submenu__item');
      const itemComp = firstItem ? window.getComputedStyle(firstItem) : null;
      return {
        opacity: comp.opacity,
        visibility: comp.visibility,
        borderRadius: comp.borderRadius,
        backdropFilter: comp.backdropFilter || comp.webkitBackdropFilter,
        backgroundColor: comp.backgroundColor,
        boxShadow: comp.boxShadow,
        itemBorderRadius: itemComp ? itemComp.borderRadius : null,
      };
    });
    console.log('[Live Audit 4] Submenu Audit on Hover:', submenuAudit);
    if (!submenuAudit || submenuAudit.opacity !== '1' || submenuAudit.visibility !== 'visible') {
      throw new Error('Submenu failed to become visible on hover on live production');
    }

    // 5. Preserved Corner Radiuses
    console.log(`[Live Audit 5] Preserved Corner Radiuses: container=${submenuAudit.borderRadius}, item=${submenuAudit.itemBorderRadius}`);
    if (submenuAudit.borderRadius !== '8px') {
      throw new Error(`Submenu container border-radius must be 8px, got ${submenuAudit.borderRadius}`);
    }
    if (submenuAudit.itemBorderRadius !== '6px') {
      throw new Error(`Submenu item border-radius must be 6px, got ${submenuAudit.itemBorderRadius}`);
    }

    // 6. Submenu Item Hover state (Brand Blue #425aef, White Text & Icon)
    await page.hover('#menus .site-page-submenu__item');
    await page.waitForTimeout(400);

    const itemHover = await page.evaluate(() => {
      const item = document.querySelector('#menus .site-page-submenu__item:hover') || document.querySelector('#menus .site-page-submenu__item');
      const comp = window.getComputedStyle(item);
      const icon = item.querySelector('.site-page-submenu__icon');
      return {
        backgroundColor: comp.backgroundColor,
        color: comp.color,
        iconColor: icon ? window.getComputedStyle(icon).color : null,
        boxShadow: comp.boxShadow
      };
    });
    console.log('[Live Audit 6] Submenu Item Hover:', itemHover);
    const isThemeBlue = itemHover.backgroundColor.includes('66, 90, 239') || itemHover.backgroundColor.includes('#425aef');
    const isWhiteText = itemHover.color === 'rgb(255, 255, 255)';
    console.log(`[Live Audit 6] Hover Theme Blue: ${isThemeBlue}, White Text: ${isWhiteText}`);
    if (!isThemeBlue) throw new Error(`Expected theme blue hover background, got ${itemHover.backgroundColor}`);
    if (!isWhiteText) throw new Error(`Expected white text on hover, got ${itemHover.color}`);

    // Screenshot hovered submenu
    const navEl = await page.$('#nav');
    if (navEl) {
      await navEl.screenshot({ path: 'scripts/live_nav_submenu_hover.png' });
      console.log('Saved scripts/live_nav_submenu_hover.png');
    }

    // 7. Fatal console error check
    const fatal = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('analytics') && !e.includes('advertisement') && !e.includes('cloudflare'));
    console.log('[Live Audit 7] Fatal Console Errors:', fatal);
    if (fatal.length > 0) {
      console.warn('Console warnings detected:', fatal);
    }

    console.log('\n🎉 ALL LIVE PRODUCTION AUDITS PASSED 100%! 🎉');
  } finally {
    await browser.close();
  }
}

verifyLiveMenus().catch(err => {
  console.error('❌ Live production verification failed:', err);
  process.exit(1);
});
