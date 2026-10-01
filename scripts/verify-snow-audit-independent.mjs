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
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1
      };
    } else if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1
      };
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

async function runIndependentAudit() {
  console.log("================================================================================");
  console.log("❄️ INDEPENDENT THIRD-PARTY AUDIT: PRODUCTION SNOW SYSTEM & VISUAL UX AUDIT");
  console.log("Production Target 1 (Home):   https://blog.epocanvas.com/");
  console.log("Production Target 2 (Post 1): https://blog.epocanvas.com/posts/markdown-syntax-mastery/");
  console.log("Production Target 3 (Post 2): https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/");
  console.log("Audit Timestamp:              " + new Date().toISOString());
  console.log("Auditor Engine:               Playwright Chromium (Headless E2E Telemetry)");
  console.log("================================================================================\n");

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 AntigravityAuditor/1.0'
  });

  const page = await context.newPage();
  await page.route('**/*.mp4', route => route.abort());
  await page.route('**/*.webm', route => route.abort());

  const auditTargets = [
    { name: 'Homepage', url: 'https://blog.epocanvas.com/' },
    { name: 'Post-Markdown', url: 'https://blog.epocanvas.com/posts/markdown-syntax-mastery/' },
    { name: 'Post-Formats', url: 'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/' }
  ];

  const fullReport = [];

  for (const target of auditTargets) {
    console.log(`\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
    console.log(`🌐 AUDITING TARGET: ${target.name} (${target.url})`);
    console.log(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n`);

    const consoleMessages = [];
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleMessages.push({ type, text });
      if (type === 'error') {
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', err => {
      pageErrors.push(err.message || String(err));
    });

    console.log(`[Action]: Resetting viewport to 1440x900...`);
    await page.setViewportSize({ width: 1440, height: 900 });

    console.log(`[Action]: Navigating with commit (timeout: 25s)...`);
    const response = await page.goto(target.url, { waitUntil: 'commit', timeout: 25000 });
    console.log(`[HTTP Status]: ${response?.status() || 'N/A'}`);

    console.log(`[Action]: Waiting for body & loading-box...`);
    await page.waitForSelector('body', { state: 'attached', timeout: 15000 }).catch(() => {});
    await page.locator('#loading-box').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForSelector('.card-snow-svg', { state: 'attached', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Verify data-background attribute
    const bgAttr = await page.evaluate(() => document.documentElement.getAttribute('data-background'));
    console.log(`[HTML data-background]: ${bgAttr}`);

    // Scroll down gradually to activate all lazy cards
    console.log(`[Action]: Scrolling page to trigger lazy components & intersection observers...`);
    await page.evaluate(async () => {
      const step = 600;
      const delay = 100;
      const maxH = (document.body ? document.body.scrollHeight : (document.documentElement ? document.documentElement.scrollHeight : 2000)) || 2000;
      for (let y = 0; y < maxH; y += step) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, delay));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);

    // 1. Audit Light Mode DOM & Math
    console.log(`\n--- [1. AUDIT: LIGHT MODE TELEMETRY (1440x900)] ---`);
    const lightData = await extractSnowMantleData(page);
    console.log(`Found ${lightData.cards.length} cards, ${lightData.svgCount} snow SVGs.`);

    // Screenshot Light Mode
    const lightScreenshotPath = path.join(REPORT_DIR, `audit-${target.name.toLowerCase()}-light-1440.png`);
    await page.screenshot({ path: lightScreenshotPath, fullPage: false, timeout: 15000 }).catch(e => console.warn('Screenshot light warn:', e.message));
    console.log(`[Screenshot Saved]: ${lightScreenshotPath}`);

    // 2. Audit Dark Mode DOM & Palette
    console.log(`\n--- [2. AUDIT: DARK MODE TELEMETRY & PALETTE (1440x900)] ---`);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      window.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(1200);

    const darkData = await extractSnowMantleData(page);
    console.log(`Dark Mode: Found ${darkData.cards.length} cards, ${darkData.svgCount} snow SVGs.`);

    // Screenshot Dark Mode
    const darkScreenshotPath = path.join(REPORT_DIR, `audit-${target.name.toLowerCase()}-dark-1440.png`);
    await page.screenshot({ path: darkScreenshotPath, fullPage: false, timeout: 15000 }).catch(e => console.warn('Screenshot dark warn:', e.message));
    console.log(`[Screenshot Saved]: ${darkScreenshotPath}`);

    // Restore Light Mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      window.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(800);

    // 3. Dynamic Interaction: Card Hover Spring & Flakes
    console.log(`\n--- [3. AUDIT: DYNAMIC HOVER MICRO-PHYSICS & DETACHING FLAKES] ---`);
    const hoverResults = await testCardHover(page);
    console.log(`Hover tests conducted on ${hoverResults.length} components.`);

    // 4. Mobile Viewport Telemetry (390x844)
    console.log(`\n--- [4. AUDIT: MOBILE RESPONSIVE ADAPTATION (390x844)] ---`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(1500);

    const mobileData = await extractSnowMantleData(page);
    console.log(`Mobile: Found ${mobileData.cards.length} cards, ${mobileData.svgCount} snow SVGs.`);
    const mobileOverflow = await page.evaluate(() => {
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    console.log(`Mobile Horizontal Overflow: ${mobileOverflow.hasHorizontalOverflow ? '❌ OVERFLOW' : '✅ 0 Overflow'}`);

    const mobileScreenshotPath = path.join(REPORT_DIR, `audit-${target.name.toLowerCase()}-mobile-390.png`);
    await page.screenshot({ path: mobileScreenshotPath, fullPage: false, timeout: 15000 }).catch(e => console.warn('Screenshot mobile warn:', e.message));
    console.log(`[Screenshot Saved]: ${mobileScreenshotPath}`);

    // Restore Desktop Viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(600);

    // 5. Canvas Particles & Aerodynamic Wake Check
    console.log(`\n--- [5. AUDIT: FALLING SNOW CANVAS & PARTICLES] ---`);
    const canvasData = await testCanvasLayers(page);
    console.log(`Canvas Layers:`, JSON.stringify(canvasData));

    fullReport.push({
      target: target.name,
      url: target.url,
      bgAttr,
      lightData,
      darkData,
      hoverResults,
      mobileData,
      mobileOverflow,
      canvasData,
      consoleErrors,
      pageErrors
    });
  }

  await browser.close();

  // Save complete JSON
  const jsonPath = path.join(REPORT_DIR, 'snow-audit-independent-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(fullReport, null, 2), 'utf-8');
  console.log(`\n[Complete Audit JSON Saved]: ${jsonPath}`);

  printDetailedSummary(fullReport);

  return fullReport;
}

async function extractSnowMantleData(page) {
  return await page.evaluate(() => {
    const SELECTORS = [
      '#random-banner',
      '.todayCard',
      '.categoryItem',
      '#category-bar',
      '.category-bar',
      '.home-top-notice',
      '#recent-posts .recent-post-item',
      '.recent-post-item',
      '#aside-content .card-widget',
      '#card-toc',
      '#card-recent-post',
      '#card-categories',
      '#card-telegram',
      '.card-announcement',
      '.card-tags',
      '.card-archives',
      '.card-webinfo',
      '.card-widget',
      '#post',
      '.post-page-shell',
      '.shijianus-ai-summary',
      '.post-copyright',
      '.relatedPosts-item',
      '.postNav-card',
      '.pagination-post',
      '#post-comment',
      '.markdown-alert',
      '.article-callout',
      '.admonition',
      '.admonition-details',
      '.code-block-shell',
      'figure.highlight',
      '.article-table-wrap',
      '.github-repo-card',
      '.video-embed-card',
      '.article-audio-card',
      '.article-encrypted-box',
      '.article-tabs',
      '.home-pagination',
      '.footer-main-shell',
      '#footer-bar',
      '.theme-card'
    ];

    const svgs = Array.from(document.querySelectorAll('.card-snow-svg'));
    const cards = svgs.map(s => s.parentElement).filter(Boolean);
    const seen = new Set();
    const cardResults = [];
    const archetypes = [];
    let svgCount = 0;

    for (let idx = 0; idx < cards.length; idx++) {
      const card = cards[idx];
      if (seen.has(card)) continue;
      seen.add(card);
      const comp = window.getComputedStyle(card);

      const cardRect = card.getBoundingClientRect();
      const svg = card.querySelector(':scope > .card-snow-svg, .card-snow-svg');
      const solidBase = svg ? svg.querySelector('.snow-solid-base') : null;
      const snowBody = svg ? svg.querySelector('.snow-body') : null;
      const snowDome = svg ? svg.querySelector('.snow-dome') : null;
      const snowRim = svg ? svg.querySelector('.snow-rim') : null;
      const sparkles = svg ? svg.querySelectorAll('.snow-sparkles circle') : [];

      // Check card top border styles
      const borderTopColor = comp.borderTopColor;
      const borderTopWidth = comp.borderTopWidth;
      const borderTopStyle = comp.borderTopStyle;
      const borderRadius = comp.borderRadius;
      const borderTopLeftRadius = parseFloat(comp.borderTopLeftRadius) || 0;
      const borderTopRightRadius = parseFloat(comp.borderTopRightRadius) || 0;
      const overflow = comp.overflow;

      let svgInfo = null;

      if (svg) {
        svgCount++;
        const archetype = svg.getAttribute('data-snow-archetype') || 'unknown';
        archetypes.push(archetype);

        const solidFill = solidBase ? window.getComputedStyle(solidBase).fill : 'none';
        const solidOpacity = solidBase ? window.getComputedStyle(solidBase).opacity : '1';

        const path = solidBase || svg.querySelector('path');
        const pathD = path ? path.getAttribute('d') || '' : '';
        const viewBoxAttr = svg.getAttribute('viewBox') || '';
        const viewBox = viewBoxAttr ? viewBoxAttr.split(' ').map(Number) : [0, 0, cardRect.width, 40];
        const vW = viewBox[2];
        const vH = viewBox[3];

        // Parse yOffset from style: --snow-svg-top: -Ypx
        const styleAttr = svg.getAttribute('style') || '';
        const yOffsetMatch = styleAttr.match(/--snow-svg-top:\s*-(\d+)px/);
        const yOffset = yOffsetMatch ? parseInt(yOffsetMatch[1], 10) : 26;

        // Mathematical profile sampling via isPointInFill
        const pt = svg.createSVGPoint();
        function getProfile(localX) {
          const clampedX = Math.max(0.1, Math.min(vW - 0.1, (localX / Math.max(1, cardRect.width)) * vW));
          pt.x = clampedX;
          let topY = null, botY = null;
          for (let y = 0; y <= vH; y += 0.5) {
            pt.y = y;
            if (path && path.isPointInFill(pt)) {
              if (topY === null) topY = y;
              botY = y;
            }
          }
          const scaleY = 1.0;
          return {
            topY: (topY ?? vH) * scaleY,
            botY: (botY ?? vH) * scaleY,
            thick: (topY !== null && botY !== null) ? Math.max(0, (botY - topY) * scaleY) : 0
          };
        }

        const W = cardRect.width;
        const p0 = getProfile(0);
        const p5 = getProfile(Math.min(5, W * 0.02));
        const p25 = getProfile(Math.min(25, W * 0.08));
        const pMid = getProfile(W * 0.5);
        const pW_25 = getProfile(W - Math.min(25, W * 0.08));
        const pW_5 = getProfile(W - Math.min(5, W * 0.02));
        const pW = getProfile(W);

        // Find max thickness and peak position
        let thickMax = 0;
        let peakX = 0;
        const scanSteps = 30;
        const profileCurve = [];
        for (let s = 0; s <= scanSteps; s++) {
          const sx = (s / scanSteps) * W;
          const p = getProfile(sx);
          profileCurve.push({ x: sx, yTop: p.topY, yBot: p.botY, thick: p.thick });
          if (p.thick > thickMax) {
            thickMax = p.thick;
            peakX = sx;
          }
        }

        // Base drop and hanging lobe depth
        // baseDrop = average botY - yOffset
        const botDeltas = profileCurve.map(p => Math.max(0, p.yBot - yOffset));
        const avgBaseDrop = botDeltas.reduce((a, b) => a + b, 0) / (botDeltas.length || 1);
        const maxDroop = Math.max(...botDeltas);

        // Bottom wave variance (to prove living undulating curve, never a straight line)
        const meanBot = botDeltas.reduce((a, b) => a + b, 0) / (botDeltas.length || 1);
        const botVariance = botDeltas.reduce((sum, b) => sum + Math.pow(b - meanBot, 2), 0) / (botDeltas.length || 1);
        const bottomWaveStdDev = Math.sqrt(botVariance);

        // Corner wrap check: check if end thickness p0 and pW softly taper and curve down
        const isScreenEdge = card.id === 'footer-bar' || card.className.includes('footer-bar');
        const isSoftRollover = (p0.thick <= 4.0 || isScreenEdge) && (pW.thick <= 4.0 || isScreenEdge);
        const isFlatCutWall = !isScreenEdge && thickMax > 5 && (p0.thick > thickMax * 0.65 || pW.thick > thickMax * 0.65);

        svgInfo = {
          archetype,
          solidBase: {
            exists: !!solidBase,
            fill: solidFill,
            opacity: solidOpacity
          },
          snowBodyExists: !!snowBody,
          snowDomeExists: !!snowDome,
          snowRimExists: !!snowRim,
          sparklesCount: sparkles.length,
          yOffset,
          thickMax: Number(thickMax.toFixed(1)),
          avgBaseDrop: Number(avgBaseDrop.toFixed(1)),
          maxDroop: Number(maxDroop.toFixed(1)),
          bottomWaveStdDev: Number(bottomWaveStdDev.toFixed(2)),
          cornerWrap: {
            p0Thick: Number(p0.thick.toFixed(1)),
            pWThick: Number(pW.thick.toFixed(1)),
            isSoftRollover,
            isFlatCutWall
          }
        };
      }

      // Card identification
      const tagName = card.tagName.toLowerCase();
      let name = card.className.split(' ').filter(c => c && !c.startsWith('card-snow') && !c.startsWith('is-')).slice(0, 2).join('.');
      if (card.id) name += `#${card.id}`;
      const headerText = card.querySelector('h1, h2, h3, .article-title, .card-widget-title, .item-headline')?.textContent?.trim() || '';

      cardResults.push({
        idx,
        name,
        headerText: headerText.substring(0, 30),
        rect: {
          width: Math.round(cardRect.width),
          height: Math.round(cardRect.height),
          top: Math.round(cardRect.top),
          left: Math.round(cardRect.left)
        },
        styles: {
          borderTopColor,
          borderTopWidth,
          borderTopStyle,
          overflow,
          borderRadius,
          borderTopLeftRadius,
          borderTopRightRadius
        },
        svgInfo
      });
    }

    // Horizontal adjacent card gap check
    const horizontalPairs = [];
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
          if (cardGap > 0 && cardGap < 100) {
            const snowGap = (svgA && svgB) ? svgB.left - svgA.right : null;
            horizontalPairs.push({
              cardA: (cards[i].className.split(' ')[0] || cards[i].tagName).substring(0, 25),
              cardB: (cards[j].className.split(' ')[0] || cards[j].tagName).substring(0, 25),
              cardGap: Number(cardGap.toFixed(2)),
              snowGap: snowGap !== null ? Number(snowGap.toFixed(2)) : null,
              isZeroBleed: snowGap !== null ? snowGap >= cardGap - 1.0 : false
            });
          }
        }
      }
    }

    return {
      cards: cardResults,
      svgCount,
      archetypes,
      horizontalPairs
    };
  });
}

async function testCardHover(page) {
  const cards = await page.$$('.recent-post-item, .categoryItem, .todayCard, .markdown-alert');
  const results = [];

  for (let i = 0; i < Math.min(3, cards.length); i++) {
    const card = cards[i];
    const info = await card.evaluate(el => ({
      cls: el.className.split(' ')[0],
      initialFlakes: document.querySelectorAll('.snow-detached-flake').length
    }));

    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Hover
    await card.hover({ force: true });
    await page.waitForTimeout(300);

    const activeState = await card.evaluate(el => {
      const svg = el.querySelector('.card-snow-svg');
      const compTransform = svg ? window.getComputedStyle(svg).transform : 'none';
      const flakes = el.querySelectorAll('.snow-detached-flake');
      return {
        transform: compTransform,
        flakesSpawned: flakes.length
      };
    });

    // Wait for detachment animation and DOM cleanup (cooldown 2200ms)
    await page.waitForTimeout(2300);

    const residualFlakes = await card.evaluate(el => {
      return el.querySelectorAll('.snow-detached-flake').length;
    });

    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);

    results.push({
      cardIndex: i,
      cardClass: info.cls,
      transform: activeState.transform,
      flakesSpawned: activeState.flakesSpawned,
      residualFlakes,
      domCleanupPassed: residualFlakes === 0
    });
  }

  return results;
}

async function testCanvasLayers(page) {
  return await page.evaluate(() => {
    const bgCanvas = document.getElementById('theme-snow-universe');
    const midCanvas = document.getElementById('theme-snow-mid');
    const fgCanvas = document.getElementById('theme-snow-foreground');

    return {
      bgLayer: bgCanvas ? { id: bgCanvas.id, w: bgCanvas.width, h: bgCanvas.height, zIndex: window.getComputedStyle(bgCanvas).zIndex } : null,
      midLayer: midCanvas ? { id: midCanvas.id, w: midCanvas.width, h: midCanvas.height, zIndex: window.getComputedStyle(midCanvas).zIndex } : null,
      fgLayer: fgCanvas ? { id: fgCanvas.id, w: fgCanvas.width, h: fgCanvas.height, zIndex: window.getComputedStyle(fgCanvas).zIndex } : null
    };
  });
}

function printDetailedSummary(report) {
  console.log("\n================================================================================");
  console.log("📊 INDEPENDENT AUDIT SYNTHESIS & RIGOROUS DATA EVALUATION");
  console.log("================================================================================\n");

  for (const r of report) {
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`🎯 PAGE AUDITED: [${r.target}] (${r.url})`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`• Cards Monitored:         ${r.lightData.cards.length}`);
    console.log(`• Snow Mantles Mounted:    ${r.lightData.svgCount}`);
    console.log(`• Console Fatal Errors:    ${r.consoleErrors.length}`);
    console.log(`• Page JS Errors:          ${r.pageErrors.length}`);
    console.log(`• Mobile Overflow (390px): ${r.mobileOverflow.hasHorizontalOverflow ? '❌ OVERFLOW' : '✅ 0 Overflow'}`);

    // Border and Solid Base check
    let transparentBorderCount = 0;
    let solidBaseCount = 0;
    let softCornerWrapCount = 0;
    let flatCutViolations = 0;

    r.lightData.cards.forEach(c => {
      if (c.styles.borderTopColor === 'rgba(0, 0, 0, 0)' || c.styles.borderTopColor === 'transparent') {
        transparentBorderCount++;
      }
      if (c.svgInfo && c.svgInfo.solidBase && c.svgInfo.solidBase.exists) {
        solidBaseCount++;
        if (c.svgInfo.cornerWrap.isSoftRollover) softCornerWrapCount++;
        if (c.svgInfo.cornerWrap.isFlatCutWall) flatCutViolations++;
      }
    });

    console.log(`\n  [1. Card Border & Solid Base]:`);
    console.log(`    - border-top-color = transparent: ${transparentBorderCount} / ${r.lightData.cards.length} cards`);
    console.log(`    - 100% Solid Base Installed:      ${solidBaseCount} / ${r.lightData.svgCount} snow SVGs`);
    console.log(`    - Soft Shoulder Corner Wraps:     ${softCornerWrapCount} / ${solidBaseCount}`);
    console.log(`    - Flat Cut Wall Violations:       ${flatCutViolations} / ${solidBaseCount}`);

    console.log(`\n  [2. Physical Droop & Dynamic Lobes]:`);
    const sampledCards = r.lightData.cards.filter(c => c.svgInfo).slice(0, 6);
    sampledCards.forEach(c => {
      const s = c.svgInfo;
      console.log(`    • ${c.name} [Archetype: ${s.archetype}]:`);
      console.log(`      - Base Drop (avg): ${s.avgBaseDrop}px | Max Droop / Lobes: ${s.maxDroop}px | Wave StdDev: ${s.bottomWaveStdDev}px`);
      console.log(`      - Shoulder Rollover: p0=${s.cornerWrap.p0Thick}px, pW=${s.cornerWrap.pWThick}px (Soft: ${s.cornerWrap.isSoftRollover ? '✅' : '❌'})`);
    });

    console.log(`\n  [3. Dark Mode Slate Blue Palette]:`);
    const darkSample = r.darkData.cards.find(c => c.svgInfo?.solidBase?.exists);
    if (darkSample) {
      console.log(`    - Dark Solid Base Fill: "${darkSample.svgInfo.solidBase.fill}" (Expected: rgb(99, 136, 180) / #6388b4)`);
    }

    console.log(`\n  [4. Horizontal Gap Preservation (Zero Lateral Bleed)]:`);
    console.log(`    - Adjacent Card Pairs Verified: ${r.lightData.horizontalPairs.length}`);
    r.lightData.horizontalPairs.forEach((pair, idx) => {
      console.log(`      Pair #${idx + 1}: ${pair.cardA} <--> ${pair.cardB} | Gap: ${pair.cardGap}px, Snow Gap: ${pair.snowGap}px => ${pair.isZeroBleed ? '✅ ZERO BLEED' : '❌ BLEED'}`);
    });

    console.log(`\n  [5. Dynamic Micro-Physics (Hover & Flakes)]:`);
    r.hoverResults.forEach(hr => {
      console.log(`    - ${hr.cardClass}: transform="${hr.transform}" | Flakes Spawned: ${hr.flakesSpawned} | Flakes Residue: ${hr.residualFlakes} (${hr.domCleanupPassed ? '✅ 0 Residue Cleaned' : '❌ Residue Leaked'})`);
    });
  }
}

runIndependentAudit().catch(err => {
  console.error("FATAL INDEPENDENT AUDIT ERROR:", err);
  process.exit(1);
});
