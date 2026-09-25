import { chromium } from 'playwright';

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { name: '1080p', width: 1440, height: 900 },
    { name: '1366p', width: 1366, height: 768 },
    { name: '1280p', width: 1280, height: 800 },
    { name: '1200p', width: 1200, height: 800 },
    { name: '1024p', width: 1024, height: 768 },
    { name: 'mobile', width: 375, height: 667 },
  ];

  let allPassed = true;

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`Auditing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    // Block unnecessary external assets to load super fast
    await page.route('**/*.{mp3,wav,ogg}', route => route.abort());

    try {
      await page.goto('http://127.0.0.1:4321/', { waitUntil: 'load', timeout: 15000 });
      await page.waitForSelector('.categoryGroup', { state: 'attached', timeout: 10000 });
      await page.waitForTimeout(600);

      const catGroup = await page.$('.categoryGroup');
      if (!catGroup) {
        console.error(`Error: .categoryGroup not found at ${vp.name}`);
        allPassed = false;
        await context.close();
        continue;
      }

      // Capture default unhovered screenshot
      await catGroup.screenshot({ path: `scripts/audit_${vp.name}_default.png` });

      // Test default state metrics
      const defaultData = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.categoryItem'));
        const group = document.querySelector('.categoryGroup');
        const groupRect = group.getBoundingClientRect();

        return {
          groupHeight: groupRect.height,
          items: items.map((item, idx) => {
            const rect = item.getBoundingClientRect();
            const desc = item.querySelector('.categoryButtonDesc');
            const title = item.querySelector('.categoryButtonText');
            const descRect = desc ? desc.getBoundingClientRect() : null;
            const descStyle = desc ? window.getComputedStyle(desc) : null;
            const content = item.querySelector('.categoryItem-content');
            const contentRect = content ? content.getBoundingClientRect() : null;

            return {
              idx,
              title: title ? title.textContent.trim() : '',
              desc: desc ? desc.textContent.trim() : '',
              width: rect.width,
              height: rect.height,
              contentHeight: contentRect ? contentRect.height : 0,
              descHeight: descRect ? descRect.height : 0,
              descScrollHeight: desc ? desc.scrollHeight : 0,
              descClientHeight: desc ? desc.clientHeight : 0,
              whiteSpace: descStyle ? descStyle.whiteSpace : '',
              overflow: descStyle ? descStyle.overflow : '',
              textOverflow: descStyle ? descStyle.textOverflow : '',
              fontSize: descStyle ? descStyle.fontSize : '',
            };
          }),
        };
      });

      console.log(`[Default State] Group Height: ${defaultData.groupHeight}px`);
      defaultData.items.forEach((item) => {
        console.log(`  Card ${item.idx} ("${item.title}"): Width=${item.width.toFixed(1)}px, Height=${item.height.toFixed(1)}px, Desc="${item.desc}", FontSize=${item.fontSize}, WhiteSpace=${item.whiteSpace}`);
      });

      // Hover test across items
      if (vp.width > 768) {
        const itemElements = await page.$$('.categoryItem');
        for (let i = 0; i < itemElements.length; i++) {
          await itemElements[i].hover();
          await page.waitForTimeout(600);

          await catGroup.screenshot({ path: `scripts/audit_${vp.name}_hover${i}.png` });

          const hoverMetrics = await page.evaluate((hoverIdx) => {
            const items = Array.from(document.querySelectorAll('.categoryItem'));
            return items.map((item, idx) => {
              const rect = item.getBoundingClientRect();
              const desc = item.querySelector('.categoryButtonDesc');
              const descRect = desc ? desc.getBoundingClientRect() : null;
              const title = item.querySelector('.categoryButtonText')?.textContent.trim() || '';

              // Check if text is clipped halfway vertically
              const isCutHalfway = desc ? (desc.scrollHeight > desc.clientHeight + 4 && desc.clientHeight > 20) : false;

              return {
                idx,
                title,
                isHovered: idx === hoverIdx,
                width: rect.width,
                height: rect.height,
                descHeight: descRect ? descRect.height : 0,
                descScrollHeight: desc ? desc.scrollHeight : 0,
                descClientHeight: desc ? desc.clientHeight : 0,
                isCutHalfway,
              };
            });
          }, i);

          const hoveredCard = hoverMetrics.find((m) => m.isHovered);
          const unhoveredCards = hoverMetrics.filter((m) => !m.isHovered);

          console.log(`  [Hover Card ${i}] Hovered Width: ${hoveredCard.width.toFixed(1)}px, Unhovered Widths: ${unhoveredCards.map((c) => c.width.toFixed(1)).join('px, ')}px`);

          const anyCut = hoverMetrics.some((m) => m.isCutHalfway);
          if (anyCut) {
            console.error(`  FAIL: Card at ${vp.name} hover ${i} has text cut in half!`);
            allPassed = false;
          } else {
            console.log(`  PASS: Zero text clipping/half-swallowed issues on hover ${i}.`);
          }
        }
      }
    } catch (e) {
      console.error(`Error at viewport ${vp.name}:`, e.message);
      allPassed = false;
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('\n========================================');
  console.log('FINAL AUDIT RESULT: ' + (allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'));
  console.log('========================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
