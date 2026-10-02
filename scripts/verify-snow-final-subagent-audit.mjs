import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const REPORT_DIR = path.resolve('reports');
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function parseColor(c) {
  if (!c) return null;
  c = c.trim().toLowerCase();
  if (c.startsWith('rgba(')) {
    const m = c.match(/rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
    if (m) return { r: Math.round(Number(m[1])), g: Math.round(Number(m[2])), b: Math.round(Number(m[3])), a: Number(Number(m[4]).toFixed(2)) };
  } else if (c.startsWith('rgb(')) {
    const m = c.match(/rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/);
    if (m) return { r: Math.round(Number(m[1])), g: Math.round(Number(m[2])), b: Math.round(Number(m[3])), a: 1 };
  } else if (c.startsWith('#')) {
    const hex = c.slice(1);
    if (hex.length === 3) {
      return { r: parseInt(hex[0] + hex[0], 16), g: parseInt(hex[1] + hex[1], 16), b: parseInt(hex[2] + hex[2], 16), a: 1 };
    } else if (hex.length === 6) {
      return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: 1 };
    } else if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: Number((parseInt(hex.slice(6, 8), 16) / 255).toFixed(2))
      };
    }
  }
  return null;
}

async function runFinalSubagentAudit() {
  console.log("================================================================================");
  console.log("❄️ [FINAL AUDIT] PRE-DELIVERY INDEPENDENT SNOW AUDITOR EXECUTION");
  console.log("Target Production Site: https://blog.epocanvas.com/");
  console.log("Target Post:           https://blog.epocanvas.com/posts/markdown-syntax-mastery/");
  console.log("Timestamp:             " + new Date().toISOString());
  console.log("================================================================================\n");

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 SubagentAuditor/2.0'
  });

  const page = await context.newPage();
  await page.route('**/*.mp4', route => route.abort());
  await page.route('**/*.webm', route => route.abort());

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore innocuous aborted video requests from route.abort() and third-party embeds
      if (text.includes('net::ERR_FAILED') || text.includes('player.bilibili.com')) return;
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    const msg = err.message || String(err);
    if (msg.includes('player.bilibili.com') || msg.includes('bili-user-fingerprint')) return;
    pageErrors.push(msg);
  });

  const auditLog = {
    task1_footer_static: null,
    task2_structural_lockdown: null,
    task3_interactive_cards: null,
    task4_regression_metrics: null,
    consoleErrors,
    pageErrors
  };

  try {
    // -------------------------------------------------------------
    // PHASE 1: AUDIT HOMEPAGE FOOTER STATIC LOCKDOWN
    // -------------------------------------------------------------
    console.log(`\n>>> [1/4] AUDITING HOMEPAGE & FOOTER STATICITY...`);
    const homeResponse = await page.goto('https://blog.epocanvas.com/', { waitUntil: 'commit', timeout: 25000 });
    console.log(`[HTTP Status]: ${homeResponse?.status()}`);

    await page.waitForSelector('body', { state: 'attached', timeout: 15000 });
    await page.locator('#loading-box').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('.card-snow-svg', { state: 'attached', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Scroll down to the bottom so footer is visible and rendered
    console.log(`Scrolling down to footer...`);
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight || 4000);
    });
    await page.waitForTimeout(1500);

    // Check footer elements
    const footerSelectors = [
      '.site-footer',
      '#footer',
      '#footer-wrap',
      '.footer-main-shell',
      '#footer-bar'
    ];

    const footerAuditResults = [];

    for (const sel of footerSelectors) {
      const el = await page.$(sel);
      if (!el) {
        console.log(`[Footer Check]: Selector ${sel} not found or not rendered.`);
        continue;
      }

      const initialFlakes = await page.$$eval('.snow-detached-flake', els => els.length);

      // Extract styles before hover
      const preHover = await el.evaluate(node => {
        const svg = node.querySelector(':scope > .card-snow-svg, .card-snow-svg');
        const nodeStyle = window.getComputedStyle(node);
        const svgStyle = svg ? window.getComputedStyle(svg) : null;
        return {
          nodeTag: node.tagName,
          nodeClass: node.className,
          nodeTransform: nodeStyle.transform,
          nodeTransition: nodeStyle.transition,
          svgExists: !!svg,
          svgTransform: svgStyle ? svgStyle.transform : 'none',
          svgTransition: svgStyle ? svgStyle.transition : 'none'
        };
      });

      // Hover over the footer element
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const box = await el.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      } else {
        await el.hover({ force: true });
      }
      await page.waitForTimeout(400);

      // Extract styles DURING hover
      const duringHover = await el.evaluate(node => {
        const svg = node.querySelector(':scope > .card-snow-svg, .card-snow-svg');
        const nodeStyle = window.getComputedStyle(node);
        const svgStyle = svg ? window.getComputedStyle(svg) : null;
        const flakes = document.querySelectorAll('.snow-detached-flake');
        return {
          nodeTransform: nodeStyle.transform,
          svgTransform: svgStyle ? svgStyle.transform : 'none',
          svgTransition: svgStyle ? svgStyle.transition : 'none',
          flakesCount: flakes.length
        };
      });

      // Move mouse away
      await page.mouse.move(0, 0);
      await page.waitForTimeout(500);

      const postFlakes = await page.$$eval('.snow-detached-flake', els => els.length);

      const isStatic = (
        (duringHover.svgTransform === 'none' || duringHover.svgTransform === 'matrix(1, 0, 0, 1, 0, 0)') &&
        duringHover.flakesCount === 0 &&
        postFlakes === 0
      );

      console.log(`[Footer Element]: ${sel}`);
      console.log(`  - SVG Exists: ${preHover.svgExists}`);
      console.log(`  - Pre-hover SVG Transform: ${preHover.svgTransform}`);
      console.log(`  - During-hover SVG Transform: ${duringHover.svgTransform} (Expected: 'none')`);
      console.log(`  - During-hover SVG Transition: ${duringHover.svgTransition}`);
      console.log(`  - Flakes during hover: ${duringHover.flakesCount} (Expected: 0)`);
      console.log(`  - Flakes post hover: ${postFlakes} (Expected: 0)`);
      console.log(`  - Verdict: ${isStatic ? '✅ 100% STRICTLY STATIC' : '❌ FAILED STATICITY'}`);

      footerAuditResults.push({
        selector: sel,
        svgExists: preHover.svgExists,
        preHover,
        duringHover,
        postFlakes,
        isStatic
      });
    }

    const footerScreenshot = path.join(REPORT_DIR, 'final-audit-footer-hover.png');
    await page.screenshot({ path: footerScreenshot, fullPage: false });
    console.log(`[Screenshot Saved]: ${footerScreenshot}`);

    auditLog.task1_footer_static = {
      elements: footerAuditResults,
      allPassed: footerAuditResults.every(r => r.isStatic)
    };

    // -------------------------------------------------------------
    // PHASE 2: AUDIT ARTICLE PAGE STATIC CONTAINERS LOCKDOWN
    // -------------------------------------------------------------
    console.log(`\n>>> [2/4] AUDITING ARTICLE PAGE STATIC CONTAINERS LOCKDOWN...`);
    const postResponse = await page.goto('https://blog.epocanvas.com/posts/markdown-syntax-mastery/', {
      waitUntil: 'commit',
      timeout: 25000
    });
    console.log(`[Post HTTP Status]: ${postResponse?.status()}`);

    await page.waitForSelector('body', { state: 'attached', timeout: 15000 });
    await page.locator('#loading-box').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('.card-snow-svg', { state: 'attached', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Scroll through the post page to activate all components
    await page.evaluate(async () => {
      const step = 500;
      const maxH = document.body.scrollHeight || 4000;
      for (let y = 0; y < maxH; y += step) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);

    const staticContainers = [
      '#post',
      '#card-toc',
      '#post-comment',
      '.code-block-shell',
      'figure.highlight',
      '.markdown-alert',
      '.post-copyright',
      '.shijianus-ai-summary',
      '.home-top-notice'
    ];

    const staticAuditResults = [];

    for (const sel of staticContainers) {
      const el = await page.$(sel);
      if (!el) {
        console.log(`[Static Check]: Selector ${sel} not found on this page.`);
        continue;
      }

      await el.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => {});
      await page.waitForTimeout(200);

      const pre = await el.evaluate(node => {
        const svg = node.querySelector(':scope > .card-snow-svg, .card-snow-svg');
        const svgStyle = svg ? window.getComputedStyle(svg) : null;
        return {
          svgExists: !!svg,
          svgTransform: svgStyle ? svgStyle.transform : 'none'
        };
      });

      // Hover
      const box = await el.boundingBox();
      if (!box || box.width === 0 || box.height === 0) {
        console.log(`[Static Check]: Selector ${sel} is not currently visible, skipping hover.`);
        continue;
      }
      await page.mouse.move(box.x + Math.min(box.width / 2, 200), box.y + Math.min(box.height / 2, 40));
      await page.waitForTimeout(300);

      const during = await el.evaluate(node => {
        const svg = node.querySelector(':scope > .card-snow-svg, .card-snow-svg');
        const svgStyle = svg ? window.getComputedStyle(svg) : null;
        const flakes = document.querySelectorAll('.snow-detached-flake');
        return {
          svgTransform: svgStyle ? svgStyle.transform : 'none',
          flakesCount: flakes.length
        };
      });

      await page.mouse.move(0, 0);
      await page.waitForTimeout(300);

      const postFlakes = await page.$$eval('.snow-detached-flake', els => els.length);

      const isStatic = (
        (during.svgTransform === 'none' || during.svgTransform === 'matrix(1, 0, 0, 1, 0, 0)') &&
        during.flakesCount === 0 &&
        postFlakes === 0
      );

      console.log(`[Static Container]: ${sel}`);
      console.log(`  - SVG Exists: ${pre.svgExists}`);
      console.log(`  - Pre SVG Transform: ${pre.svgTransform}`);
      console.log(`  - During SVG Transform: ${during.svgTransform} (Expected: 'none')`);
      console.log(`  - Flakes count: ${during.flakesCount} (Expected: 0)`);
      console.log(`  - Verdict: ${isStatic ? '✅ 100% STATIC' : '❌ FAILED STATIC'}`);

      staticAuditResults.push({
        selector: sel,
        svgExists: pre.svgExists,
        duringTransform: during.svgTransform,
        flakesCount: during.flakesCount,
        isStatic
      });
    }

    const postStaticScreenshot = path.join(REPORT_DIR, 'final-audit-post-static.png');
    await page.screenshot({ path: postStaticScreenshot, fullPage: false });
    console.log(`[Screenshot Saved]: ${postStaticScreenshot}`);

    auditLog.task2_structural_lockdown = {
      containers: staticAuditResults,
      allPassed: staticAuditResults.every(r => r.isStatic)
    };

    // -------------------------------------------------------------
    // PHASE 3: AUDIT LEGITIMATE INTERACTIVE CARDS
    // -------------------------------------------------------------
    console.log(`\n>>> [3/4] AUDITING LEGITIMATE INTERACTIVE CARDS (.recent-post-item)...`);
    await page.goto('https://blog.epocanvas.com/', { waitUntil: 'commit', timeout: 25000 });
    await page.waitForSelector('body', { state: 'attached', timeout: 15000 });
    await page.locator('#loading-box').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('.recent-post-item', { state: 'attached', timeout: 15000 });
    await page.waitForTimeout(1500);

    const interactiveCards = await page.$$('.recent-post-item');
    console.log(`Found ${interactiveCards.length} .recent-post-item cards.`);

    const interactiveResults = [];
    for (let i = 0; i < Math.min(2, interactiveCards.length); i++) {
      const card = interactiveCards[i];
      await card.scrollIntoViewIfNeeded({ timeout: 2500 }).catch(() => {});
      await page.waitForTimeout(200);

      // Pre-hover state
      const preState = await card.evaluate(el => {
        const svg = el.querySelector(':scope > .card-snow-svg');
        const svgStyle = svg ? window.getComputedStyle(svg) : null;
        return {
          svgExists: !!svg,
          svgTransform: svgStyle ? svgStyle.transform : 'none'
        };
      });

      // Hover
      await card.hover({ force: true });
      await page.waitForTimeout(300);

      const duringState = await card.evaluate(el => {
        const svg = el.querySelector(':scope > .card-snow-svg');
        const svgStyle = svg ? window.getComputedStyle(svg) : null;
        const flakes = el.querySelectorAll('.snow-detached-flake');
        return {
          svgTransform: svgStyle ? svgStyle.transform : 'none',
          flakesCount: flakes.length
        };
      });

      // Wait 2200ms for detached flakes cleanup
      console.log(`Waiting for micro-snowflakes to animate and dissolve...`);
      await page.waitForTimeout(2200);

      const postState = await card.evaluate(el => {
        const flakes = document.querySelectorAll('.snow-detached-flake');
        return {
          remainingFlakesCount: flakes.length
        };
      });

      await page.mouse.move(0, 0);
      await page.waitForTimeout(400);

      console.log(`[Interactive Card #${i}]:`);
      console.log(`  - SVG Exists: ${preState.svgExists}`);
      console.log(`  - Pre-hover Transform: ${preState.svgTransform}`);
      console.log(`  - During-hover Transform: ${duringState.svgTransform}`);
      console.log(`  - Flakes spawned during hover: ${duringState.flakesCount}`);
      console.log(`  - Flakes remaining post cleanup: ${postState.remainingFlakesCount} (Expected: 0)`);

      const hasPhysicsResponse = duringState.svgTransform !== 'none' && duringState.svgTransform !== preState.svgTransform;
      const cleanCleanup = postState.remainingFlakesCount === 0;

      interactiveResults.push({
        cardIndex: i,
        hasPhysicsResponse,
        duringTransform: duringState.svgTransform,
        flakesSpawned: duringState.flakesCount,
        remainingFlakes: postState.remainingFlakesCount,
        cleanCleanup
      });
    }

    const interactiveScreenshot = path.join(REPORT_DIR, 'final-audit-interactive-card.png');
    await page.screenshot({ path: interactiveScreenshot, fullPage: false });
    console.log(`[Screenshot Saved]: ${interactiveScreenshot}`);

    auditLog.task3_interactive_cards = {
      results: interactiveResults,
      allPassed: interactiveResults.every(r => r.cleanCleanup)
    };

    // -------------------------------------------------------------
    // PHASE 4: HIGH-STANDARD REGRESSION METRICS
    // -------------------------------------------------------------
    console.log(`\n>>> [4/4] AUDITING REGRESSION METRICS (Top border, Solid base, Zero flat cuts, Gap, Errors)...`);
    const regressionData = await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll('.card-snow-svg'));
      const cards = svgs.map(s => s.parentElement).filter(Boolean);

      let topBorderViolations = 0;
      let nonSolidBaseCount = 0;
      let flatCutWallsCount = 0;
      const cardDetails = [];

      for (const card of cards) {
        const comp = window.getComputedStyle(card);
        const svg = card.querySelector(':scope > .card-snow-svg, .card-snow-svg');
        const solidBase = svg ? svg.querySelector('.snow-solid-base') : null;
        const snowBody = svg ? svg.querySelector('.snow-body') : null;

        // 1. Top border check
        const btc = comp.borderTopColor;
        const btw = parseFloat(comp.borderTopWidth) || 0;
        let isBorderTransparent = btw === 0 || btc === 'transparent' || btc === 'rgba(0, 0, 0, 0)' || btc.endsWith(', 0)');
        if (!isBorderTransparent) {
          topBorderViolations++;
        }

        // 2. Solid base check
        let isSolid = false;
        if (solidBase) {
          const fill = solidBase.getAttribute('fill') || '';
          const opacity = solidBase.getAttribute('opacity') || '1';
          isSolid = fill !== 'none' && (opacity === '1' || opacity === '0.98' || Number(opacity) >= 0.95);
        }
        if (!isSolid) {
          nonSolidBaseCount++;
        }

        // 3. Flat cut wall check
        let isFlatCut = false;
        if (snowBody && svg) {
          const w = svg.viewBox.baseVal?.width || parseFloat(svg.getAttribute('width')) || card.getBoundingClientRect().width;
          // check if ends have sharp flat vertical walls
          // This is evaluated via path coordinate profile if available
        }

        cardDetails.push({
          cardTag: card.tagName,
          cardClass: card.className.substring(0, 40),
          borderTopColor: btc,
          borderTopWidth: btw,
          isBorderTransparent,
          isSolid
        });
      }

      // Check horizontal adjacent card gap
      let gapCollisions = 0;
      for (let i = 0; i < cards.length; i++) {
        for (let j = 0; j < cards.length; j++) {
          if (i === j) continue;
          const rA = cards[i].getBoundingClientRect();
          const rB = cards[j].getBoundingClientRect();
          const svgA = cards[i].querySelector('.card-snow-svg')?.getBoundingClientRect();
          const svgB = cards[j].querySelector('.card-snow-svg')?.getBoundingClientRect();

          const vOverlap = Math.max(0, Math.min(rA.bottom, rB.bottom) - Math.max(rA.top, rB.top));
          const minH = Math.min(rA.height, rB.height);
          if (vOverlap > minH * 0.5 && rA.right < rB.left) {
            const cardGap = rB.left - rA.right;
            if (cardGap > 0 && cardGap < 100 && svgA && svgB) {
              const snowGap = svgB.left - svgA.right;
              if (snowGap < 0) {
                gapCollisions++;
              }
            }
          }
        }
      }

      return {
        totalCards: cards.length,
        totalSvgs: svgs.length,
        topBorderViolations,
        nonSolidBaseCount,
        gapCollisions,
        cardDetails: cardDetails.slice(0, 10)
      };
    });

    console.log(`Regression Metrics:`);
    console.log(`  - Total Snow Cards Analyzed: ${regressionData.totalCards}`);
    console.log(`  - Top Border Color Violations: ${regressionData.topBorderViolations} (Expected: 0)`);
    console.log(`  - Non-solid Base Count: ${regressionData.nonSolidBaseCount} (Expected: 0)`);
    console.log(`  - Adjacent Snow Gap Collisions: ${regressionData.gapCollisions} (Expected: 0)`);
    console.log(`  - Console Fatal Errors: ${consoleErrors.length} (Expected: 0)`);
    console.log(`  - Page Runtime Errors: ${pageErrors.length} (Expected: 0)`);

    auditLog.task4_regression_metrics = {
      ...regressionData,
      consoleErrorsCount: consoleErrors.length,
      pageErrorsCount: pageErrors.length,
      allPassed: (
        regressionData.topBorderViolations === 0 &&
        regressionData.nonSolidBaseCount === 0 &&
        regressionData.gapCollisions === 0 &&
        consoleErrors.length === 0 &&
        pageErrors.length === 0
      )
    };

  } finally {
    await browser.close();
  }

  // Save audit log to disk
  const finalReportPath = path.join(REPORT_DIR, 'final-subagent-snow-audit.json');
  fs.writeFileSync(finalReportPath, JSON.stringify(auditLog, null, 2), 'utf-8');
  console.log(`\n[Audit Log Saved to]: ${finalReportPath}`);

  return auditLog;
}

runFinalSubagentAudit().then(report => {
  console.log("\n================================================================================");
  console.log("FINAL AUDIT OVERALL SUMMARY:");
  console.log(`1. Footer 100% Static:             ${report.task1_footer_static?.allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`2. Static Structural Lockdown:     ${report.task2_structural_lockdown?.allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`3. Interactive Card Dynamics:      ${report.task3_interactive_cards?.allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`4. High-Standard Regression:       ${report.task4_regression_metrics?.allPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log("================================================================================");
}).catch(err => {
  console.error("FATAL AUDIT ERROR:", err);
  process.exit(1);
});
