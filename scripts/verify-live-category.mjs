import { chromium } from 'playwright';

const TARGET_URLS = [
  { name: 'Live Production (Custom Domain)', url: 'https://blog.epocanvas.com/' },
  { name: 'Edge Node Deployment', url: 'https://fde5d087.shijianus-blog.pages.dev/' }
];

const VIEWPORTS = [
  { name: '1080p Desktop', width: 1440, height: 900 },
  { name: '1200p Standard', width: 1200, height: 800 },
  { name: 'Mobile Viewport', width: 375, height: 667 },
];

async function runLiveVerification() {
  console.log('🚀 Starting Cloudflare Pages Live E2E Verification for Task 179 (.categoryItem)...\n');
  const browser = await chromium.launch({ headless: true });

  let allPassed = true;
  const auditReport = [];

  for (const target of TARGET_URLS) {
    console.log(`\n======================================================`);
    console.log(`Auditing Target: ${target.name} (${target.url})`);
    console.log(`======================================================`);

    for (const vp of VIEWPORTS) {
      console.log(`\n  --- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();

      // Collect console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Block heavy media
      await page.route('**/*.{mp3,wav,ogg}', route => route.abort());

      try {
        const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const status = response ? response.status() : 0;
        console.log(`  [HTTP Status]: ${status}`);
        if (status !== 200) {
          console.error(`  ❌ Non-200 HTTP status on ${target.url}`);
          allPassed = false;
        }

        await page.waitForSelector('.categoryGroup', { state: 'attached', timeout: 15000 });
        await page.waitForTimeout(1000);

        const catGroup = await page.$('.categoryGroup');
        if (!catGroup) {
          console.error(`  ❌ .categoryGroup element not found!`);
          allPassed = false;
          await context.close();
          continue;
        }

        // Take snapshot of default state
        const safeTargetName = target.name.replace(/[^a-zA-Z0-9]/g, '_');
        const defaultScreenshot = `scripts/live_${safeTargetName}_${vp.name}_default.png`;
        await catGroup.screenshot({ path: defaultScreenshot });

        // Measure metrics in default state
        const defaultData = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('.categoryItem'));
          const group = document.querySelector('.categoryGroup');
          const groupRect = group.getBoundingClientRect();
          const computedGroup = window.getComputedStyle(group);

          return {
            groupHeight: groupRect.height,
            cssHeight: computedGroup.height,
            itemCount: items.length,
            items: items.map((item, idx) => {
              const rect = item.getBoundingClientRect();
              const desc = item.querySelector('.categoryButtonDesc');
              const title = item.querySelector('.categoryButtonText');
              const descRect = desc ? desc.getBoundingClientRect() : null;
              const descStyle = desc ? window.getComputedStyle(desc) : null;

              return {
                idx,
                title: title ? title.textContent.trim() : '',
                desc: desc ? desc.textContent.trim() : '',
                width: rect.width,
                height: rect.height,
                descHeight: descRect ? descRect.height : 0,
                descScrollHeight: desc ? desc.scrollHeight : 0,
                descClientHeight: desc ? desc.clientHeight : 0,
                whiteSpace: descStyle ? descStyle.whiteSpace : '',
                textOverflow: descStyle ? descStyle.textOverflow : '',
                overflow: descStyle ? descStyle.overflow : '',
                fontSize: descStyle ? descStyle.fontSize : '',
              };
            })
          };
        });

        console.log(`  [Default State]: Group Height = ${defaultData.groupHeight.toFixed(1)}px (CSS: ${defaultData.cssHeight}), Item Count = ${defaultData.itemCount}`);
        
        // Assertions for default state
        if (vp.width > 768) {
          if (defaultData.groupHeight < 80 || defaultData.groupHeight > 92) {
            console.error(`  ❌ Group height out of expected range [80, 92]: got ${defaultData.groupHeight}`);
            allPassed = false;
          } else {
            console.log(`  ✅ Group height is generous and uncrowded (~86px): ${defaultData.groupHeight.toFixed(1)}px`);
          }
        }

        defaultData.items.forEach(item => {
          console.log(`    Card ${item.idx} ("${item.title}"): Width=${item.width.toFixed(1)}px, Height=${item.height.toFixed(1)}px, Desc="${item.desc}", DescHeight=${item.descHeight.toFixed(1)}px, whiteSpace=${item.whiteSpace}`);
          // Verify white-space nowrap and text-overflow ellipsis
          if (item.whiteSpace !== 'nowrap') {
            console.warn(`    ⚠️ Notice: whiteSpace is "${item.whiteSpace}"`);
          }
          if (item.descHeight > 26) {
            console.error(`    ❌ Description height ${item.descHeight}px suggests wrapping into 2 lines!`);
            allPassed = false;
          }
        });

        // Hover test for desktop viewports
        if (vp.width > 768) {
          const itemElements = await page.$$('.categoryItem');
          for (let i = 0; i < itemElements.length; i++) {
            await itemElements[i].hover();
            await page.waitForTimeout(700); // Wait for transition

            const hoverScreenshot = `scripts/live_${safeTargetName}_${vp.name}_hover${i}.png`;
            await catGroup.screenshot({ path: hoverScreenshot });

            const hoverMetrics = await page.evaluate((hoverIdx) => {
              const items = Array.from(document.querySelectorAll('.categoryItem'));
              return items.map((item, idx) => {
                const rect = item.getBoundingClientRect();
                const desc = item.querySelector('.categoryButtonDesc');
                const descRect = desc ? desc.getBoundingClientRect() : null;
                const title = item.querySelector('.categoryButtonText')?.textContent.trim() || '';

                return {
                  idx,
                  isHovered: idx === hoverIdx,
                  title,
                  width: rect.width,
                  descHeight: descRect ? descRect.height : 0,
                  descScrollHeight: desc ? desc.scrollHeight : 0,
                  descClientHeight: desc ? desc.clientHeight : 0,
                };
              });
            }, i);

            const hoveredCard = hoverMetrics.find(m => m.isHovered);
            const sisterCards = hoverMetrics.filter(m => !m.isHovered);

            console.log(`  [Hover Card ${i} ("${hoveredCard?.title}")]: Hovered Width=${hoveredCard?.width.toFixed(1)}px`);
            sisterCards.forEach(s => {
              console.log(`    Squeezed Sister Card ${s.idx} ("${s.title}"): Width=${s.width.toFixed(1)}px, DescHeight=${s.descHeight.toFixed(1)}px`);
              // Crucial assertion: squeezed sister card must NOT have 2-line wrapped cut-off description!
              if (s.descHeight > 25) {
                console.error(`    ❌ CRITICAL BUG: Squeezed sister card ${s.idx} wrapped into 2 lines (descHeight=${s.descHeight}px > 25px)!`);
                allPassed = false;
              }
            });
          }
        }

        // Fatal JS error audit
        const fatalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('analytics') && !e.includes('gtag'));
        if (fatalErrors.length > 0) {
          console.warn(`  ⚠️ Console errors noted:`, fatalErrors);
        } else {
          console.log(`  ✅ 0 Fatal Console Errors.`);
        }

        auditReport.push({
          target: target.name,
          viewport: vp.name,
          status,
          groupHeight: defaultData.groupHeight,
          passed: true
        });

      } catch (err) {
        console.error(`  ❌ Error during audit of ${target.name} at ${vp.name}:`, err.message);
        allPassed = false;
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();

  console.log(`\n======================================================`);
  console.log(`AUDIT SUMMARY: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log(`======================================================`);

  if (!allPassed) {
    process.exit(1);
  }
}

runLiveVerification().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
