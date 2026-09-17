import { chromium } from 'playwright';

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const candidates = [
    {
      id: 'opt1_inset0',
      desc: 'inset: 0 (100% width/height), rotate -1deg and +0.8deg',
      css: `
        .topGroup__stack-back {
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          top: 0 !important;
          left: 0 !important;
        }
        .topGroup__stack-back--one {
          transform: rotate(-1deg) !important;
          opacity: 0.44 !important;
        }
        .topGroup__stack-back--two {
          transform: rotate(0.8deg) !important;
          opacity: 0.68 !important;
        }
      `
    },
    {
      id: 'opt2_inset_neg6',
      desc: 'inset: -6px (wraps 6px beyond cards), rotate -1.2deg and +0.9deg',
      css: `
        .topGroup__stack-back {
          top: -6px !important;
          left: -6px !important;
          right: -6px !important;
          bottom: -6px !important;
          width: calc(100% + 12px) !important;
          height: calc(100% + 12px) !important;
        }
        .topGroup__stack-back--one {
          transform: rotate(-1.2deg) !important;
          opacity: 0.44 !important;
        }
        .topGroup__stack-back--two {
          transform: rotate(0.9deg) !important;
          opacity: 0.68 !important;
        }
      `
    },
    {
      id: 'opt3_inset_neg8',
      desc: 'inset: -8px (wraps 8px beyond cards), rotate -1.2deg and +0.9deg',
      css: `
        .topGroup__stack-back {
          top: -8px !important;
          left: -8px !important;
          right: -8px !important;
          bottom: -8px !important;
          width: calc(100% + 16px) !important;
          height: calc(100% + 16px) !important;
        }
        .topGroup__stack-back--one {
          transform: rotate(-1.2deg) !important;
          opacity: 0.44 !important;
        }
        .topGroup__stack-back--two {
          transform: rotate(0.9deg) !important;
          opacity: 0.68 !important;
        }
      `
    },
    {
      id: 'opt4_coordinated_grid',
      desc: 'Harmonized grid: inset: -6px stack-back, card height 170px (equal 8px row/col gaps), max-height none',
      css: `
        .topGroup__stack-back {
          top: -6px !important;
          left: -6px !important;
          right: -6px !important;
          bottom: -6px !important;
          width: calc(100% + 12px) !important;
          height: calc(100% + 12px) !important;
        }
        .topGroup__stack-back--one {
          transform: rotate(-1.2deg) !important;
          opacity: 0.44 !important;
        }
        .topGroup__stack-back--two {
          transform: rotate(0.9deg) !important;
          opacity: 0.68 !important;
        }
        body[data-type='home'] .topGroup .recent-post-item {
          height: calc((100% - 0.5rem) / 2) !important;
          max-height: none !important;
        }
      `
    }
  ];

  for (const cand of candidates) {
    console.log(`Testing ${cand.id}: ${cand.desc}`);
    await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: cand.css });
    await page.waitForTimeout(300);

    const topGroupHandle = await page.$('.topGroup');

    // Default screenshot (todayCard visible)
    if (topGroupHandle) {
      await topGroupHandle.screenshot({ path: `scripts/cand_${cand.id}_default.png` });
    }

    // Toggle todayCard
    const toggleLabel = await page.$('label[for="today-card-toggle"]');
    if (toggleLabel) {
      await toggleLabel.click();
      await page.waitForTimeout(400);

      const metrics = await page.evaluate(() => {
        const tg = document.querySelector('.topGroup');
        const b1 = document.querySelector('.topGroup__stack-back--one');
        const b2 = document.querySelector('.topGroup__stack-back--two');
        const items = Array.from(document.querySelectorAll('.topGroup .recent-post-item'));

        const tgRect = tg.getBoundingClientRect();
        const b1Rect = b1.getBoundingClientRect();
        const b2Rect = b2.getBoundingClientRect();

        const itemMetrics = items.map((el, i) => {
          const r = el.getBoundingClientRect();
          return {
            index: i,
            top: r.top - tgRect.top,
            left: r.left - tgRect.left,
            bottom: r.bottom - tgRect.top,
            right: r.right - tgRect.left,
            width: r.width,
            height: r.height,
            isContainedInB1: (
              r.top >= b1Rect.top &&
              r.bottom <= b1Rect.bottom &&
              r.left >= b1Rect.left &&
              r.right <= b1Rect.right
            )
          };
        });

        return {
          tg: { width: tgRect.width, height: tgRect.height },
          b1: {
            top: b1Rect.top - tgRect.top,
            left: b1Rect.left - tgRect.left,
            bottom: b1Rect.bottom - tgRect.top,
            right: b1Rect.right - tgRect.left,
            width: b1Rect.width,
            height: b1Rect.height
          },
          b2: {
            top: b2Rect.top - tgRect.top,
            left: b2Rect.left - tgRect.left,
            bottom: b2Rect.bottom - tgRect.top,
            right: b2Rect.right - tgRect.left
          },
          items: itemMetrics
        };
      });

      console.log(`Metrics for ${cand.id}:`, JSON.stringify(metrics, null, 2));

      if (topGroupHandle) {
        await topGroupHandle.screenshot({ path: `scripts/cand_${cand.id}_toggled.png` });
      }
    }
  }

  await browser.close();
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
