import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const REPORT_DIR = path.resolve('reports');
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

async function runAudit() {
  console.log("================================================================================");
  console.log("❄️ [THIRD-PARTY AUDIT] OBJECTIVE VISUAL & PHYSICAL E2E SNOW AUDIT");
  console.log("Target Production Site: https://blog.epocanvas.com/");
  console.log("Target Post:           https://blog.epocanvas.com/posts/markdown-syntax-mastery/");
  console.log("Execution Time:        " + new Date().toISOString());
  console.log("================================================================================\n");

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 ThirdPartySnowAuditor/1.0'
  });

  const page = await context.newPage();

  // Abort video media streams to prevent waiting timeouts on third-party players
  await page.route('**/*.mp4', route => route.abort());
  await page.route('**/*.webm', route => route.abort());

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore innocuous aborted video requests from route.abort() and third-party embeds
      if (
        text.includes('net::ERR_FAILED') ||
        text.includes('player.bilibili.com') ||
        text.includes('bili-user-fingerprint') ||
        text.includes('favicon.ico')
      ) return;
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    const msg = err.message || String(err);
    if (
      msg.includes('player.bilibili.com') ||
      msg.includes('bili-user-fingerprint')
    ) return;
    pageErrors.push(msg);
  });

  const auditLog = {
    metadata: {
      site: 'https://blog.epocanvas.com/',
      post: 'https://blog.epocanvas.com/posts/markdown-syntax-mastery/',
      timestamp: new Date().toISOString()
    },
    section1_boundary_caps: null,
    section2_natural_undulation: null,
    section3_adjacent_gaps: null,
    section4_static_lockdown: null,
    section5_console_health: null,
    overall_verdict: null
  };

  try {
    // =========================================================================
    // SECTION 1: HOMEPAGE AUDIT (BOUNDARY CAPS, NATURAL RELIEF, GAP PRESERVATION)
    // =========================================================================
    console.log(">>> [1/4] AUDITING HOMEPAGE: .recent-post-item, .categoryItem, .card-widget...");
    const homeRes = await page.goto('https://blog.epocanvas.com/', { waitUntil: 'commit', timeout: 30000 });
    console.log(`[Homepage HTTP Status]: ${homeRes?.status()}`);

    await page.waitForSelector('body', { state: 'attached', timeout: 15000 });
    await page.locator('#loading-box').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('.card-snow-svg', { state: 'attached', timeout: 15000 }).catch(async () => {
      await page.evaluate(() => window.scrollBy(0, 200));
    });
    await page.waitForTimeout(2000);

    // Deep evaluation of all snow-bearing elements on homepage
    const homepageElementsData = await page.evaluate(() => {
      function parseCoordsFromPath(d) {
        if (!d) return [];
        const regex = /([MLQCZ])\s*([-\d.,\s]+)?/gi;
        let match;
        const cmds = [];
        while ((match = regex.exec(d)) !== null) {
          const type = match[1];
          const numStr = match[2] || '';
          const numbers = numStr.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
          cmds.push({ type, numbers });
        }
        return cmds;
      }

      const targets = [
        ...Array.from(document.querySelectorAll('.recent-post-item')).map((el, i) => ({ type: 'recent-post-item', el, index: i })),
        ...Array.from(document.querySelectorAll('.categoryItem')).map((el, i) => ({ type: 'categoryItem', el, index: i })),
        ...Array.from(document.querySelectorAll('.todayCard, .today-card')).map((el, i) => ({ type: 'todayCard', el, index: i })),
        ...Array.from(document.querySelectorAll('#aside-content .card-widget')).map((el, i) => ({ type: 'aside-card-widget', el, index: i }))
      ];

      return targets.map(item => {
        const el = item.el;
        const rect = el.getBoundingClientRect();
        const svg = el.querySelector(':scope > .card-snow-svg, .card-snow-svg');
        const body = svg ? svg.querySelector('.snow-body') : null;
        const solidBase = svg ? svg.querySelector('.snow-solid-base') : null;

        const bodyD = body ? body.getAttribute('d') || '' : '';
        const baseD = solidBase ? solidBase.getAttribute('d') || '' : '';
        const archetype = el.getAttribute('data-snow-archetype') || svg?.getAttribute('data-snow-archetype') || 'unknown';

        const cmds = parseCoordsFromPath(bodyD);

        // Find Left start and Right connector
        let leftTop = null;
        let rightBot = null;
        let rightTop = null;
        let leftBot = null;
        let hasCubicLeft = false;
        let hasCubicRight = false;

        const W = Math.round(rect.width);

        if (cmds.length > 0 && cmds[0].type === 'M' && cmds[0].numbers.length >= 2) {
          leftTop = { x: cmds[0].numbers[0], y: cmds[0].numbers[1] };
        }

        let hasConvexRight = false;
        let hasConvexLeft = false;

        for (let i = 0; i < cmds.length; i++) {
          const cmd = cmds[i];
          if (cmd.type === 'C' && cmd.numbers.length === 6) {
            // Right connector: C W y1 W y2 xBot yBot
            if (Math.abs(cmd.numbers[0] - W) <= 4 || Math.abs(cmd.numbers[2] - W) <= 4) {
              hasCubicRight = true;
              hasConvexRight = true;
              rightBot = { x: cmd.numbers[4], y: cmd.numbers[5] };
              const prev = cmds[i - 1];
              if (prev && prev.numbers.length >= 2) {
                rightTop = { x: prev.numbers[prev.numbers.length - 2], y: prev.numbers[prev.numbers.length - 1] };
              }
            }
            // Left connector: C 0.0 y1 0.0 y2 xTop yTop
            if (Math.abs(cmd.numbers[0]) <= 2 && Math.abs(cmd.numbers[2]) <= 2) {
              hasCubicLeft = true;
              hasConvexLeft = true;
              const prev = cmds[i - 1];
              if (prev && prev.numbers.length >= 2) {
                leftBot = { x: prev.numbers[prev.numbers.length - 2], y: prev.numbers[prev.numbers.length - 1] };
              }
            }
          }
        }

        // Also recognize organic convex bulbous dome connectors (sequence of L waypoints with convex curvature)
        if (!hasConvexRight) {
          const rightWaypoints = [];
          for (let i = 1; i < cmds.length - 1; i++) {
            if (cmds[i].type === 'L' && cmds[i].numbers.length >= 2) {
              const x = cmds[i].numbers[0];
              if (x >= W - 10) {
                rightWaypoints.push({ x: cmds[i].numbers[0], y: cmds[i].numbers[1] });
              }
            } else if (cmds[i].type === 'Q' && rightWaypoints.length > 0) {
              break;
            }
          }
          if (rightWaypoints.length >= 3) {
            rightTop = { x: rightWaypoints[0].x, y: rightWaypoints[0].y };
            rightBot = { x: rightWaypoints[rightWaypoints.length - 1].x, y: rightWaypoints[rightWaypoints.length - 1].y };
            hasConvexRight = true;
          }
        }

        if (!hasConvexLeft) {
          const leftWaypoints = [];
          for (let i = cmds.length - 1; i >= 0; i--) {
            if (cmds[i].type === 'L' && cmds[i].numbers.length >= 2) {
              const x = cmds[i].numbers[0];
              if (x <= 10) {
                leftWaypoints.push({ x: cmds[i].numbers[0], y: cmds[i].numbers[1] });
              }
            } else if (cmds[i].type === 'Q') {
              break;
            }
          }
          if (leftWaypoints.length >= 3) {
            leftBot = { x: leftWaypoints[leftWaypoints.length - 1].x, y: leftWaypoints[leftWaypoints.length - 1].y };
            leftTop = { x: leftWaypoints[0].x, y: leftWaypoints[0].y };
            hasConvexLeft = true;
          }
        }

        // Measure corner thickness
        let leftThickness = (leftBot && leftTop) ? Math.round(Math.abs(leftBot.y - leftTop.y) * 10) / 10 : null;
        let rightThickness = (rightBot && rightTop) ? Math.round(Math.abs(rightBot.y - rightTop.y) * 10) / 10 : null;

        // Check for linear flat cuts
        const hasFlatSliceRight = new RegExp(`L\\s*${W}\\.?[0-9]*\\s+[0-9.]+\\s+L\\s*${W}`).test(bodyD);
        const hasFlatSliceLeft = /L\s*0\.?0?\s+[0-9.]+\s+L\s*0/.test(bodyD);

        // Compute top profile undulation via SVG path points
        let dropRelief = 0;
        let avgSlope = 0;
        if (body && body.getTotalLength) {
          const totalLen = body.getTotalLength();
          const topSamples = [];
          for (let s = 0; s <= 40; s++) {
            const pt = body.getPointAtLength((s / 40) * (totalLen * 0.48));
            topSamples.push(pt.y);
          }
          const minY = Math.min(...topSamples);
          const maxY = Math.max(...topSamples);
          dropRelief = Math.round((maxY - minY) * 10) / 10;

          let dySum = 0;
          for (let k = 1; k < topSamples.length; k++) {
            dySum += Math.abs(topSamples[k] - topSamples[k - 1]);
          }
          avgSlope = Math.round((dySum / (topSamples.length - 1)) * 100) / 100;
        }

        const comp = window.getComputedStyle(el);

        return {
          type: item.type,
          index: item.index,
          archetype,
          width: W,
          height: Math.round(rect.height),
          borderTopColor: comp.borderTopColor,
          borderTopWidth: comp.borderTopWidth,
          hasSvg: !!svg,
          hasCubicLeft,
          hasCubicRight,
          hasConvexLeft,
          hasConvexRight,
          hasFlatSliceLeft,
          hasFlatSliceRight,
          leftThickness,
          rightThickness,
          leftTop,
          rightTop,
          dropRelief,
          avgSlope
        };
      });
    });

    console.log(`Analyzed ${homepageElementsData.length} snow-bearing components on homepage.`);

    // Filter by type for granular logging
    const recentPosts = homepageElementsData.filter(d => d.type === 'recent-post-item');
    const categoryItems = homepageElementsData.filter(d => d.type === 'categoryItem');
    const asideWidgets = homepageElementsData.filter(d => d.type === 'aside-card-widget');

    console.log(`\n=== 1.1 [Zero Boundary Flat Slicing / Corner Caps Audit on .recent-post-item] ===`);
    let postBoundaryPassed = true;
    for (const p of recentPosts) {
      console.log(`Card #${p.index} [Archetype: ${p.archetype}, W: ${p.width}px]:`);
      console.log(`  - Left Corner Cap Thickness:  ${p.leftThickness}px (Convex Cap: ${p.hasConvexLeft ? '✅' : '❌'}, Flat Slice: ${p.hasFlatSliceLeft ? '❌' : '✅ 0%'})`);
      console.log(`  - Right Corner Cap Thickness: ${p.rightThickness}px (Convex Cap: ${p.hasConvexRight ? '✅' : '❌'}, Flat Slice: ${p.hasFlatSliceRight ? '❌' : '✅ 0%'})`);
      console.log(`  - Natural Drop Relief:        ${p.dropRelief}px (Avg Slope: ${p.avgSlope})`);

      if (!p.hasConvexLeft || !p.hasConvexRight || p.hasFlatSliceLeft || p.hasFlatSliceRight) {
        postBoundaryPassed = false;
      }
      // Corner thickness should be substantial (~6px - 16px)
      if (p.leftThickness && (p.leftThickness < 4.0 || p.leftThickness > 24.0)) {
        console.log(`    ⚠️ Warning: Left corner thickness ${p.leftThickness}px outside natural range!`);
      }
    }

    console.log(`\n=== 1.2 [Boundary Audit on Other Boxes: .categoryItem & .card-widget] ===`);
    let otherBoxesPassed = true;
    for (const b of [...categoryItems, ...asideWidgets]) {
      console.log(`Box [${b.type} #${b.index}, W: ${b.width}px]: Left: ${b.leftThickness}px (Cubic: ${b.hasCubicLeft}), Right: ${b.rightThickness}px (Cubic: ${b.hasCubicRight}), Relief: ${b.dropRelief}px`);
      if (b.hasFlatSliceLeft || b.hasFlatSliceRight) {
        otherBoxesPassed = false;
      }
    }

    auditLog.section1_boundary_caps = {
      recentPosts,
      categoryItems,
      asideWidgets,
      postBoundaryPassed,
      otherBoxesPassed,
      allPassed: postBoundaryPassed && otherBoxesPassed
    };

    // -------------------------------------------------------------------------
    // SECTION 2: NATURAL UNDULATION & DIVERSITY AUDIT
    // -------------------------------------------------------------------------
    console.log(`\n=== 2. [Natural Undulation & Zero Tabletop Flatness Audit] ===`);
    const archetypesSet = new Set(recentPosts.map(p => p.archetype));
    console.log(`- Unique Archetypes across .recent-post-item: ${archetypesSet.size} (${Array.from(archetypesSet).join(', ')})`);

    const minRelief = Math.min(...recentPosts.map(p => p.dropRelief));
    const maxRelief = Math.max(...recentPosts.map(p => p.dropRelief));
    const avgRelief = Math.round((recentPosts.reduce((acc, p) => acc + p.dropRelief, 0) / recentPosts.length) * 10) / 10;

    console.log(`- Min Surface Relief: ${minRelief}px`);
    console.log(`- Max Surface Relief: ${maxRelief}px`);
    console.log(`- Avg Surface Relief: ${avgRelief}px`);

    const zeroTabletopPassed = minRelief >= 5.0 && archetypesSet.size >= 5;
    console.log(`- Tabletop Flatness Verdict: ${zeroTabletopPassed ? '✅ 100% PASSED (ORGANIC LIVING RELIEF)' : '❌ FAILED'}`);

    auditLog.section2_natural_undulation = {
      uniqueArchetypesCount: archetypesSet.size,
      archetypesList: Array.from(archetypesSet),
      minRelief,
      maxRelief,
      avgRelief,
      zeroTabletopPassed
    };

    // -------------------------------------------------------------------------
    // CAPTURE HIGH RESOLUTION CLOSE-UP EVIDENCE SCREENSHOTS
    // -------------------------------------------------------------------------
    console.log("\n>>> Capturing High-Resolution Close-Up Evidence Screenshots...");
    const firstPostCard = page.locator('.recent-post-item').first();
    await firstPostCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const firstBox = await firstPostCard.boundingBox();
    if (firstBox) {
      // 1. Left Corner Cap Macro Zoom (Light Mode)
      await page.screenshot({
        path: path.join(REPORT_DIR, 'snow-audit-crop-card0-corner-left.png'),
        clip: {
          x: Math.max(0, firstBox.x - 8),
          y: Math.max(0, firstBox.y - 12),
          width: 140,
          height: 85
        }
      });
      console.log(`[Evidence Saved]: snow-audit-crop-card0-corner-left.png`);

      // 2. Right Corner Cap Macro Zoom (Light Mode)
      await page.screenshot({
        path: path.join(REPORT_DIR, 'snow-audit-crop-card0-corner-right.png'),
        clip: {
          x: Math.max(0, firstBox.x + firstBox.width - 132),
          y: Math.max(0, firstBox.y - 12),
          width: 140,
          height: 85
        }
      });
      console.log(`[Evidence Saved]: snow-audit-crop-card0-corner-right.png`);

      // 3. Full Card Top Snow Mantle Panoramic (Light Mode)
      await page.screenshot({
        path: path.join(REPORT_DIR, 'snow-audit-crop-card0-full-banner.png'),
        clip: {
          x: Math.max(0, firstBox.x - 8),
          y: Math.max(0, firstBox.y - 12),
          width: firstBox.width + 16,
          height: 110
        }
      });
      console.log(`[Evidence Saved]: snow-audit-crop-card0-full-banner.png`);

      // 4. Dark Mode Verification (Checking dark cover image & border light leak)
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      });
      await page.waitForTimeout(400);

      await page.screenshot({
        path: path.join(REPORT_DIR, 'snow-audit-crop-card0-dark-banner.png'),
        clip: {
          x: Math.max(0, firstBox.x - 8),
          y: Math.max(0, firstBox.y - 12),
          width: firstBox.width + 16,
          height: 110
        }
      });
      console.log(`[Evidence Saved]: snow-audit-crop-card0-dark-banner.png`);

      // Restore Light Mode
      await page.evaluate(() => {
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.classList.remove('dark');
      });
      await page.waitForTimeout(300);
    }

    // -------------------------------------------------------------------------
    // SECTION 3: HORIZONTAL ADJACENT GAP PRESERVATION AUDIT
    // -------------------------------------------------------------------------
    console.log(`\n=== 3. [Horizontal Adjacent Gap Preservation Audit] ===`);
    const gapPairs = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.recent-post-item'));
      const pairs = [];

      for (let i = 0; i < cards.length; i++) {
        for (let j = 0; j < cards.length; j++) {
          if (i === j) continue;
          const rA = cards[i].getBoundingClientRect();
          const rB = cards[j].getBoundingClientRect();

          const vOverlap = Math.max(0, Math.min(rA.bottom, rB.bottom) - Math.max(rA.top, rB.top));
          if (vOverlap > rA.height * 0.5 && rA.right < rB.left) {
            const cardGap = rB.left - rA.right;
            if (cardGap > 4 && cardGap < 60) {
              const svgA = cards[i].querySelector(':scope > .card-snow-svg');
              const svgB = cards[j].querySelector(':scope > .card-snow-svg');
              const sARect = svgA ? svgA.getBoundingClientRect() : null;
              const sBRect = svgB ? svgB.getBoundingClientRect() : null;

              const snowGap = (sARect && sBRect) ? (sBRect.left - sARect.right) : cardGap;

              pairs.push({
                cardA: i,
                cardB: j,
                cardGap: Math.round(cardGap * 10) / 10,
                snowGap: Math.round(snowGap * 10) / 10,
                collision: snowGap <= 0,
                cardAWidth: Math.round(rA.width),
                svgAWidth: sARect ? Math.round(sARect.width) : 0
              });
            }
          }
        }
      }
      return pairs;
    });

    console.log(`Measured ${gapPairs.length} horizontally adjacent card pairs in the responsive grid:`);
    let gapPassed = true;
    for (const g of gapPairs) {
      console.log(`  Pair [Card #${g.cardA} -> Card #${g.cardB}]: Card CSS Gap = ${g.cardGap}px, Snow SVG Gap = ${g.snowGap}px (Card Width: ${g.cardAWidth}px, SVG Width: ${g.svgAWidth}px)`);
      if (g.collision || g.snowGap <= 0) {
        console.log(`    ❌ Collision or Clumping detected!`);
        gapPassed = false;
      }
    }
    console.log(`- Horizontal Gap Preservation Verdict: ${gapPassed ? '✅ 100% PRESERVED' : '❌ FAILED'}`);

    auditLog.section3_adjacent_gaps = {
      gapPairs,
      gapPassed
    };

    // -------------------------------------------------------------------------
    // SECTION 4: FOOTER & ARTICLE STATIC LOCKDOWN REGRESSION
    // -------------------------------------------------------------------------
    console.log(`\n=== 4. [Footer & Static Containers Lockdown Regression Audit] ===`);
    // Scroll to footer on homepage
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight || 4000);
    });
    await page.waitForTimeout(1000);

    const footerSelectors = ['.site-footer', '#footer-wrap', '.footer-main-shell', '#footer-bar'];
    const footerResults = [];

    for (const sel of footerSelectors) {
      const el = await page.$(sel);
      if (!el) continue;

      const preHover = await el.evaluate(node => {
        const svg = node.querySelector(':scope > .card-snow-svg, .card-snow-svg');
        const style = svg ? window.getComputedStyle(svg) : null;
        const nodeStyle = window.getComputedStyle(node);
        return {
          svgExists: !!svg,
          svgTransform: style ? style.transform : 'none',
          nodeTransform: nodeStyle.transform,
          nodeTransition: nodeStyle.transition
        };
      });

      await el.hover({ force: true }).catch(() => {});
      await page.waitForTimeout(300);

      const duringHover = await el.evaluate(node => {
        const svg = node.querySelector(':scope > .card-snow-svg, .card-snow-svg');
        const style = svg ? window.getComputedStyle(svg) : null;
        const nodeStyle = window.getComputedStyle(node);
        const flakes = document.querySelectorAll('.snow-detached-flake');
        return {
          svgTransform: style ? style.transform : 'none',
          nodeTransform: nodeStyle.transform,
          flakesCount: flakes.length
        };
      });

      await page.mouse.move(0, 0);
      await page.waitForTimeout(300);

      const isStatic =
        (duringHover.svgTransform === 'none' || duringHover.svgTransform === 'matrix(1, 0, 0, 1, 0, 0)') &&
        (duringHover.nodeTransform === 'none' || duringHover.nodeTransform === 'matrix(1, 0, 0, 1, 0, 0)') &&
        (preHover.nodeTransform === 'none' || preHover.nodeTransform === 'matrix(1, 0, 0, 1, 0, 0)') &&
        !preHover.nodeTransition.includes('transform') &&
        duringHover.flakesCount === 0;

      console.log(`  [Footer]: ${sel.padEnd(20)} -> SVG: ${preHover.svgExists}, Node Transform (Pre/Hover): ${preHover.nodeTransform} / ${duringHover.nodeTransform}, Flakes: ${duringHover.flakesCount} -> ${isStatic ? '✅ STATIC' : '❌ MOVEMENT'}`);

      footerResults.push({
        selector: sel,
        svgExists: preHover.svgExists,
        nodeTransformPre: preHover.nodeTransform,
        nodeTransformHover: duringHover.nodeTransform,
        svgTransformHover: duringHover.svgTransform,
        isStatic
      });
    }

    // Now visit article page
    console.log("\n>>> Navigating to Article Page: https://blog.epocanvas.com/posts/markdown-syntax-mastery/ ...");
    const postRes = await page.goto('https://blog.epocanvas.com/posts/markdown-syntax-mastery/', {
      waitUntil: 'commit',
      timeout: 35000
    });
    console.log(`[Post HTTP Status]: ${postRes?.status()}`);

    await page.waitForSelector('body', { state: 'attached', timeout: 15000 });
    await page.locator('#loading-box').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('.card-snow-svg', { state: 'attached', timeout: 15000 }).catch(async () => {
      await page.evaluate(() => window.scrollBy(0, 300));
    });
    await page.waitForTimeout(2000);
    // Smooth scroll down to activate lazy widgets and comments
    await page.evaluate(async () => {
      const step = 600;
      const maxH = document.body.scrollHeight || 4000;
      for (let y = 0; y < maxH; y += step) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);

    const articleStaticSelectors = [
      '#post',
      '#card-toc',
      '#post-comment',
      '.post-copyright',
      '.shijianus-ai-summary',
      '.markdown-alert'
    ];

    const articleResults = [];
    for (const sel of articleStaticSelectors) {
      const el = await page.$(sel);
      if (!el) {
        console.log(`  [Article]: ${sel.padEnd(25)} -> (Not present on this page)`);
        continue;
      }

      await el.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(200);

      const box = await el.boundingBox();
      if (!box || box.width === 0 || box.height === 0) continue;

      await page.mouse.move(box.x + Math.min(box.width / 2, 250), box.y + Math.min(box.height / 2, 40));
      await page.waitForTimeout(300);

      const during = await el.evaluate(node => {
        const svg = node.querySelector(':scope > .card-snow-svg, .card-snow-svg');
        const style = svg ? window.getComputedStyle(svg) : null;
        const flakes = document.querySelectorAll('.snow-detached-flake');
        return {
          svgExists: !!svg,
          transform: style ? style.transform : 'none',
          flakesCount: flakes.length
        };
      });

      await page.mouse.move(0, 0);
      await page.waitForTimeout(200);

      const isStatic = (during.transform === 'none' || during.transform === 'matrix(1, 0, 0, 1, 0, 0)') && during.flakesCount === 0;
      console.log(`  [Article]: ${sel.padEnd(25)} -> SVG: ${during.svgExists}, Hover Transform: ${during.transform}, Flakes: ${during.flakesCount} -> ${isStatic ? '✅ STATIC' : '❌ MOVEMENT'}`);

      articleResults.push({
        selector: sel,
        svgExists: during.svgExists,
        isStatic
      });
    }

    const allStaticPassed = footerResults.every(r => r.isStatic) && articleResults.every(r => r.isStatic);
    console.log(`- Static Lockdown Regression Verdict: ${allStaticPassed ? '✅ 100% STRICTLY STATIC' : '❌ FAILED'}`);

    auditLog.section4_static_lockdown = {
      footer: footerResults,
      article: articleResults,
      allStaticPassed
    };

    // -------------------------------------------------------------------------
    // SECTION 5: CONSOLE ERRORS & HYDRATION HEALTH AUDIT
    // -------------------------------------------------------------------------
    console.log(`\n=== 5. [Console Fatal Errors & React Hydration Audit] ===`);
    console.log(`- Total Filtered Fatal Console Errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log(`  Fatal Errors:`, consoleErrors);
    }
    console.log(`- Total Filtered Page Runtime Errors:  ${pageErrors.length}`);
    if (pageErrors.length > 0) {
      console.log(`  Page Errors:`, pageErrors);
    }

    const consoleHealthPassed = consoleErrors.length === 0 && pageErrors.length === 0;
    console.log(`- Console Health Verdict: ${consoleHealthPassed ? '✅ 100% ZERO ERRORS' : '❌ FAILED'}`);

    auditLog.section5_console_health = {
      consoleErrorsCount: consoleErrors.length,
      pageErrorsCount: pageErrors.length,
      consoleErrors,
      pageErrors,
      consoleHealthPassed
    };

    // -------------------------------------------------------------------------
    // FINAL COMPREHENSIVE VERDICT
    // -------------------------------------------------------------------------
    const finalPassed = postBoundaryPassed && otherBoxesPassed && zeroTabletopPassed && gapPassed && allStaticPassed && consoleHealthPassed;

    auditLog.overall_verdict = {
      boundary_caps_passed: postBoundaryPassed && otherBoxesPassed,
      natural_undulation_passed: zeroTabletopPassed,
      adjacent_gap_passed: gapPassed,
      static_lockdown_passed: allStaticPassed,
      console_health_passed: consoleHealthPassed,
      finalPassed,
      readyForDelivery: finalPassed
    };

    console.log("\n================================================================================");
    console.log("🏆 FINAL OBJECTIVE AUDITOR VERDICT REPORT:");
    console.log(`  1. Zero Boundary Slicing & Convex Cubic Caps: ${postBoundaryPassed && otherBoxesPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  2. Natural Undulation & Zero Tabletop Flatness:  ${zeroTabletopPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  3. Horizontal Adjacent Gap Preservation:       ${gapPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  4. Footer & Static Containers Lockdown:        ${allStaticPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  5. Console Zero Fatal Errors & React Hydration:${consoleHealthPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log("--------------------------------------------------------------------------------");
    console.log(`  >>> OVERALL AUDIT VERDICT: ${finalPassed ? '✅ 100% ALL CHECKS PASSED - PRODUCTION READY' : '❌ FAILED'}`);
    console.log("================================================================================");

  } finally {
    await browser.close();
  }

  const resultPath = path.join(REPORT_DIR, 'snow-boundary-perfection-audit.json');
  fs.writeFileSync(resultPath, JSON.stringify(auditLog, null, 2), 'utf-8');
  console.log(`\n[Detailed JSON Report Saved]: ${resultPath}`);
  return auditLog;
}

runAudit().catch(err => {
  console.error("FATAL AUDITOR EXECUTION ERROR:", err);
  process.exit(1);
});
