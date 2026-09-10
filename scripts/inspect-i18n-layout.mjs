import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4321/posts/content-formats-and-markup-mastery/';
const OUTPUT_DIR = './scratch/i18n-inspection';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const VIEWPORTS = {
  mobile: { width: 390, height: 844 }, // iPhone 12/13/14
  mobileSmall: { width: 375, height: 667 }, // iPhone SE
  desktop: { width: 1280, height: 900 }
};

const LANGUAGES = ['zh-CN', 'en', 'de', 'es', 'fr'];

async function inspectLayout() {
  const browser = await chromium.launch({ headless: true });
  const report = {};

  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    report[vpName] = {};
    for (const lang of LANGUAGES) {
      console.log(`\nInspecting [${vpName}] - Language: ${lang}`);
      const context = await browser.newContext({ viewport: vp });
      const page = await context.newPage();

      await page.addInitScript((l) => {
        localStorage.setItem('shijianus-locale-variant', l);
      }, lang);

      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);

      // Check for horizontal overflow
      const pageOverflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        };
      });

      // Scroll to comment section
      await page.evaluate(() => {
        const c = document.getElementById('post-comment');
        if (c) c.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(600);

      // Inspect Comment Header / Tabs (Interactive modes)
      const tabMetrics = await page.evaluate(() => {
        const tabsContainer = document.querySelector('.tk-tabs');
        if (!tabsContainer) return null;
        const tabs = Array.from(document.querySelectorAll('.tk-tab-btn')).map(el => {
          const rect = el.getBoundingClientRect();
          return {
            text: el.textContent.trim(),
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            fontSize: window.getComputedStyle(el).fontSize,
            whiteSpace: window.getComputedStyle(el).whiteSpace
          };
        });
        const containerRect = tabsContainer.getBoundingClientRect();
        // Check if tabs wrapped (i.e. different top offsets)
        const isWrapped = tabs.length > 1 && Math.abs(tabs[0].top - tabs[tabs.length - 1].top) > 5;
        return {
          containerWidth: containerRect.width,
          containerHeight: containerRect.height,
          isWrapped,
          tabs
        };
      });

      // Inspect Sort and Action buttons in Comment Header
      const headerActions = await page.evaluate(() => {
        const header = document.querySelector('.comment-head');
        if (!header) return null;
        const rect = header.getBoundingClientRect();
        const sortBtns = Array.from(header.querySelectorAll('.tk-sort-btn, .tk-anon-btn, .comment-privacy-tip')).map(el => ({
          tag: el.className,
          text: el.textContent.trim(),
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height
        }));
        return {
          width: rect.width,
          height: rect.height,
          sortBtns
        };
      });

      // Inspect Toolbar
      const toolbarMetrics = await page.evaluate(() => {
        const tb = document.querySelector('.tk-markdown-toolbar');
        if (!tb) return null;
        const rect = tb.getBoundingClientRect();
        const btns = Array.from(tb.querySelectorAll('button, select, .tk-tb-select-wrap')).map(el => ({
          className: el.className,
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
          top: el.getBoundingClientRect().top
        }));
        const isWrapped = btns.length > 1 && Math.abs(btns[0].top - btns[btns.length - 1].top) > 5;
        return {
          width: rect.width,
          height: rect.height,
          isWrapped,
          btnCount: btns.length
        };
      });

      // Open Image Upload Modal and inspect Tabs & Footer Buttons
      let imageModalMetrics = null;
      const imgBtn = await page.$('.tk-tb-image');
      if (imgBtn) {
        await imgBtn.click();
        await page.waitForTimeout(300);
        imageModalMetrics = await page.evaluate(() => {
          const modal = document.querySelector('.tk-tool-modal');
          if (!modal) return null;
          const modalRect = modal.getBoundingClientRect();
          const tabBtns = Array.from(modal.querySelectorAll('.tk-modal-tab-btn')).map(el => {
            const r = el.getBoundingClientRect();
            return {
              text: el.textContent.trim(),
              width: r.width,
              height: r.height,
              top: r.top,
              fontSize: window.getComputedStyle(el).fontSize
            };
          });
          const tabsWrapped = tabBtns.length > 1 && Math.abs(tabBtns[0].top - tabBtns[tabBtns.length - 1].top) > 5;
          const confirmBtn = modal.querySelector('.tk-modal-btn-confirm');
          const cancelBtn = modal.querySelector('.tk-modal-btn-cancel');
          const footerBtns = [confirmBtn, cancelBtn].filter(Boolean).map(el => ({
            text: el.textContent.trim(),
            width: el.getBoundingClientRect().width,
            height: el.getBoundingClientRect().height,
            top: el.getBoundingClientRect().top
          }));
          const footerWrapped = footerBtns.length > 1 && Math.abs(footerBtns[0].top - footerBtns[footerBtns.length - 1].top) > 5;
          return {
            modalWidth: modalRect.width,
            modalHeight: modalRect.height,
            tabsWrapped,
            tabBtns,
            footerWrapped,
            footerBtns
          };
        });

        // Take screenshot of image modal for comparison
        await page.screenshot({ path: path.join(OUTPUT_DIR, `${vpName}-${lang}-image-modal.png`) });

        // Close modal
        const closeBtn = await page.$('.tk-modal-close-btn') || await page.$('.tk-modal-btn-cancel');
        if (closeBtn) await closeBtn.click();
        await page.waitForTimeout(200);
      }

      // Open Table Modal and inspect
      let tableModalMetrics = null;
      const optBtn = await page.$('.tk-tb-btn-options');
      if (optBtn) {
        await optBtn.click();
        await page.waitForTimeout(200);
        const optionsItems = await page.$$('.tk-options-dropdown .tk-dropdown-item');
        if (optionsItems.length > 1) {
          await optionsItems[1].click(); // Table
          await page.waitForTimeout(300);
          tableModalMetrics = await page.evaluate(() => {
            const modal = document.querySelector('.tk-tool-modal');
            if (!modal) return null;
            const modalRect = modal.getBoundingClientRect();
            const confirmBtn = modal.querySelector('.tk-modal-btn-confirm');
            const cancelBtn = modal.querySelector('.tk-modal-btn-cancel');
            const footerBtns = [confirmBtn, cancelBtn].filter(Boolean).map(el => ({
              text: el.textContent.trim(),
              width: el.getBoundingClientRect().width,
              height: el.getBoundingClientRect().height,
              top: el.getBoundingClientRect().top
            }));
            const footerWrapped = footerBtns.length > 1 && Math.abs(footerBtns[0].top - footerBtns[footerBtns.length - 1].top) > 5;
            return {
              modalWidth: modalRect.width,
              footerWrapped,
              footerBtns
            };
          });
          await page.screenshot({ path: path.join(OUTPUT_DIR, `${vpName}-${lang}-table-modal.png`) });
          const cancelBtn = await page.$('.tk-modal-btn-cancel');
          if (cancelBtn) await cancelBtn.click();
          await page.waitForTimeout(200);
        }
      }

      // Take overall comment section screenshot
      const commentEl = await page.$('#post-comment');
      if (commentEl) {
        await commentEl.screenshot({ path: path.join(OUTPUT_DIR, `${vpName}-${lang}-comment-section.png`) });
      }

      report[vpName][lang] = {
        pageOverflow,
        tabMetrics,
        headerActions,
        toolbarMetrics,
        imageModalMetrics,
        tableModalMetrics
      };

      await context.close();
    }
  }

  await browser.close();
  fs.writeFileSync('./scratch/i18n-inspection-report.json', JSON.stringify(report, null, 2));
  console.log('\nReport generated at ./scratch/i18n-inspection-report.json');
}

inspectLayout().catch(console.error);
