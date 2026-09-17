import { chromium } from 'playwright';

async function testVisual() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // We test two approaches for wrapping:
  // Approach A: Inset negative on stack-back (-6px)
  // Approach B: Inset 0 on stack-back, but padding: 6px inside topGroup (so cards sit comfortably inside the tray)
  // Approach C: Subtle offset stack that truly wraps: top: -4px, left: -4px, bottom: -6px, right: -6px

  const variants = [
    {
      name: 'variantA_inset_neg6',
      css: `
        .topGroup__stack-back {
          position: absolute !important;
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
    },
    {
      name: 'variantB_tray_padding',
      css: `
        .topGroup__stack-back {
          position: absolute !important;
          inset: 0 !important;
          width: 100% !important;
          height: 100% !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
        }
        .topGroup__stack-back--one {
          transform: rotate(-1deg) !important;
          opacity: 0.44 !important;
        }
        .topGroup__stack-back--two {
          transform: rotate(0.8deg) !important;
          opacity: 0.68 !important;
        }
        body[data-type='home'] .topGroup {
          padding: 6px !important;
          box-sizing: border-box !important;
        }
        body[data-type='home'] .topGroup .todayCard {
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
        body[data-type='home'] .topGroup .recent-post-item {
          width: calc((100% - 1rem) / 3) !important;
          height: calc((100% - 0.5rem) / 2) !important;
          max-height: none !important;
        }
      `
    },
    {
      name: 'variantC_asymmetric_wrap',
      css: `
        .topGroup__stack-back {
          position: absolute !important;
          border-radius: 24px !important;
        }
        .topGroup__stack-back--one {
          top: -4px !important;
          left: -4px !important;
          width: calc(100% + 8px) !important;
          height: calc(100% + 10px) !important;
          opacity: 0.44 !important;
          transform: rotate(-1.2deg) !important;
        }
        .topGroup__stack-back--two {
          top: -2px !important;
          left: -2px !important;
          width: calc(100% + 6px) !important;
          height: calc(100% + 6px) !important;
          opacity: 0.68 !important;
          transform: rotate(0.9deg) !important;
        }
        body[data-type='home'] .topGroup .recent-post-item {
          height: calc((100% - 0.5rem) / 2) !important;
          max-height: none !important;
        }
      `
    }
  ];

  for (const v of variants) {
    await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: v.css });
    await page.waitForTimeout(300);

    const swiper = await page.$('.swiper_container_card');
    if (swiper) {
      await swiper.screenshot({ path: `scripts/${v.name}_default.png` });
    }

    const toggle = await page.$('label[for="today-card-toggle"]');
    if (toggle) {
      await toggle.click();
      await page.waitForTimeout(400);
      if (swiper) {
        await swiper.screenshot({ path: `scripts/${v.name}_toggled.png` });
      }
    }
  }

  await browser.close();
}

testVisual().catch(console.error);
