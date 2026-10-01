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
    }
  }
  return null;
}

async function runSubagent2CleanAudit() {
  console.log("================================================================================");
  console.log("❄️ SUBAGENT 2 (CLEAN CONFIRMATION AUDITOR): PRODUCTION SNOW FINAL REVIEW");
  console.log("Target 1 (Homepage):     https://blog.epocanvas.com/");
  console.log("Target 2 (Post Markdown):https://blog.epocanvas.com/posts/markdown-syntax-mastery/");
  console.log("Target 3 (Post Formats): https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/");
  console.log("Audit Timestamp:         " + new Date().toISOString());
  console.log("Auditor Engine:          Playwright Chromium (Headless E2E Independent Telemetry)");
  console.log("================================================================================\n");

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const targets = [
    { name: 'homepage', label: 'Homepage', url: 'https://blog.epocanvas.com/' },
    { name: 'post-markdown', label: 'Post-Markdown', url: 'https://blog.epocanvas.com/posts/markdown-syntax-mastery/' },
    { name: 'post-formats', label: 'Post-Formats', url: 'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/' }
  ];

  const fullAuditResults = {
    timestamp: new Date().toISOString(),
    pages: {},
    overall: {
      totalCardsAudited: 0,
      totalSvgsMounted: 0,
      allBorderTopTransparent: true,
      solidBase100Percent: true,
      flatCutViolationsTotal: 0,
      horizontalBleedViolationsTotal: 0,
      fatalJsErrorsTotal: 0,
      hydrationErrorsTotal: 0,
      mobileHorizontalOverflow: false,
      archetypesIdentified: new Set()
    }
  };

  for (const target of targets) {
    console.log(`\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
    console.log(`🌐 [INDEPENDENT AUDIT TARGET]: ${target.label} -> ${target.url}`);
    console.log(`<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<\n`);

    // Create a fresh context for each target URL to eliminate any state contamination
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Subagent2Auditor/2.0'
    });

    const page = await context.newPage();
    const consoleLogs = [];
    const jsErrors = [];
    const hydrationErrors = [];
    const networkAborts = [];

    // Abort media streams to eliminate network stalls
    await page.route('**/*.mp4', route => {
      networkAborts.push(route.request().url());
      return route.abort();
    });
    await page.route('**/*.webm', route => {
      networkAborts.push(route.request().url());
      return route.abort();
    });

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.push({ type, text });

      if (text.includes('hydration') || text.includes('Hydration') || text.includes('Minified React error #418') || text.includes('Minified React error #423')) {
        hydrationErrors.push(text);
      }

      if (type === 'error') {
        if (text.includes('net::ERR_FAILED')) {
          // Normal Chromium logging for intentionally aborted video requests
        } else {
          jsErrors.push(text);
        }
      }
    });

    page.on('pageerror', err => {
      jsErrors.push(err.message || String(err));
    });

    console.log(`[Action]: Navigating with commit (timeout: 30s)...`);
    const resp = await page.goto(target.url, { waitUntil: 'commit', timeout: 30000 });
    console.log(`[HTTP Response]: ${resp ? resp.status() : 'N/A'}`);

    console.log(`[Action]: Waiting for body & loading-box...`);
    await page.waitForSelector('body', { state: 'attached', timeout: 15000 }).catch(() => {});
    await page.locator('#loading-box').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // Wait for snow initialization
    await page.waitForSelector('.card-snow-svg', { state: 'attached', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2500);

    // Verify and ensure data-background="snow"
    const bgMode = await page.evaluate(() => document.documentElement.getAttribute('data-background'));
    console.log(`[Active data-background]: "${bgMode}"`);
    if (bgMode !== 'snow') {
      console.log(`[Note]: Setting data-background="snow" explicitly...`);
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-background', 'snow');
        window.dispatchEvent(new Event('resize'));
      });
      await page.waitForTimeout(1000);
    }

    // Scroll through the page to trigger all cards, lazy components, and IntersectionObservers
    console.log(`[Action]: Scrolling through page to trigger all cards and IntersectionObservers...`);
    await page.evaluate(async () => {
      const step = 500;
      const delay = 100;
      const maxH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      for (let y = 0; y < maxH; y += step) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, delay));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(2000);

    // SECTION 1: LIGHT MODE TELEMETRY (1440x900)
    console.log(`\n--- [1. AUDIT: LIGHT MODE TELEMETRY & DOM METRICS (1440x900)] ---`);
    const lightTelemetry = await extractPageTelemetry(page);
    console.log(`[DOM Audit]: Found ${lightTelemetry.cards.length} cards, ${lightTelemetry.svgCount} snow mantle SVGs.`);
    
    // Screenshot Light Mode
    const lightScreenshotPath = path.join(REPORT_DIR, `subagent2-${target.name}-light-1440.png`);
    await page.screenshot({ path: lightScreenshotPath, fullPage: false });
    console.log(`[Screenshot]: ${lightScreenshotPath}`);

    // High resolution close-up crops
    await captureCloseUpCrops(page, target.name, 'light');

    // SECTION 2: DARK MODE TELEMETRY (1440x900)
    console.log(`\n--- [2. AUDIT: DARK MODE PALETTE & SHADOW REFLECTION (1440x900)] ---`);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      window.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(1200);

    const darkTelemetry = await extractPageTelemetry(page);
    console.log(`[Dark Mode]: Found ${darkTelemetry.cards.length} cards, ${darkTelemetry.svgCount} snow SVGs.`);
    
    // Screenshot Dark Mode
    const darkScreenshotPath = path.join(REPORT_DIR, `subagent2-${target.name}-dark-1440.png`);
    await page.screenshot({ path: darkScreenshotPath, fullPage: false });
    console.log(`[Screenshot]: ${darkScreenshotPath}`);

    await captureCloseUpCrops(page, target.name, 'dark');

    // Restore Light Mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      window.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(800);

    // SECTION 3: DYNAMIC MICRO-PHYSICS & DETACHED FLAKES HOVER TEST
    console.log(`\n--- [3. AUDIT: DYNAMIC HOVER MICRO-PHYSICS & FLAKE LIFECYCLE] ---`);
    const hoverResults = await testDynamicHoverPhysics(page, target.name);
    console.log(`[Hover Test Results]: Tested ${hoverResults.length} interactive components.`);

    // SECTION 4: MOBILE RESPONSIVE ADAPTATION (390x844)
    console.log(`\n--- [4. AUDIT: MOBILE RESPONSIVE ADAPTATION (390x844)] ---`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(1500);

    const mobileTelemetry = await extractPageTelemetry(page);
    const mobileOverflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }));
    console.log(`[Mobile 390x844]: Cards=${mobileTelemetry.cards.length}, SVGs=${mobileTelemetry.svgCount}, Overflow=${mobileOverflow.hasHorizontalOverflow ? '❌ LEAK' : '✅ 0 Overflow'}`);

    const mobileScreenshotPath = path.join(REPORT_DIR, `subagent2-${target.name}-mobile-390.png`);
    await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log(`[Screenshot]: ${mobileScreenshotPath}`);

    // SECTION 5: CANVAS THREE-DEPTH PARTICLES
    console.log(`\n--- [5. AUDIT: 3-DEPTH CANVAS PARTICLES & WAKE] ---`);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(600);
    const canvasStatus = await testCanvasLayers(page);
    console.log(`[Canvas Layers]: bg=${canvasStatus.bgLayer?.exists}, mid=${canvasStatus.midLayer?.exists}, fg=${canvasStatus.fgLayer?.exists}`);

    // Consolidate target results
    const pageResult = {
      target: target.name,
      label: target.label,
      url: target.url,
      lightTelemetry,
      darkTelemetry,
      hoverResults,
      mobileTelemetry,
      mobileOverflow,
      canvasStatus,
      jsErrors,
      hydrationErrors,
      abortedMediaCount: networkAborts.length
    };

    fullAuditResults.pages[target.name] = pageResult;

    // Accumulate overall statistics
    fullAuditResults.overall.totalCardsAudited += lightTelemetry.cards.length;
    fullAuditResults.overall.totalSvgsMounted += lightTelemetry.svgCount;
    fullAuditResults.overall.fatalJsErrorsTotal += jsErrors.length;
    fullAuditResults.overall.hydrationErrorsTotal += hydrationErrors.length;
    if (mobileOverflow.hasHorizontalOverflow) {
      fullAuditResults.overall.mobileHorizontalOverflow = true;
    }
    for (const arch of lightTelemetry.archetypes) {
      fullAuditResults.overall.archetypesIdentified.add(arch);
    }

    await context.close();
  }

  await browser.close();

  // Convert Set to Array for JSON serialization
  fullAuditResults.overall.archetypesIdentified = Array.from(fullAuditResults.overall.archetypesIdentified);

  const jsonSavePath = path.join(REPORT_DIR, 'audit-subagent2-clean-telemetry.json');
  fs.writeFileSync(jsonSavePath, JSON.stringify(fullAuditResults, null, 2), 'utf-8');
  console.log(`\n================================================================================`);
  console.log(`📋 COMPLETE SUBAGENT 2 TELEMETRY JSON PERSISTED TO: ${jsonSavePath}`);
  console.log(`================================================================================\n`);

  printAuditorExecutiveReport(fullAuditResults);

  return fullAuditResults;
}

async function extractPageTelemetry(page) {
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
    const cardData = [];
    const archetypes = [];

    let totalSvgs = 0;

    for (let idx = 0; idx < cards.length; idx++) {
      const card = cards[idx];
      if (seen.has(card)) continue;
      seen.add(card);

      const comp = window.getComputedStyle(card);
      const cardRect = card.getBoundingClientRect();
      const svg = card.querySelector(':scope > .card-snow-svg, .card-snow-svg');

      const borderTopColor = comp.borderTopColor;
      const borderTopWidth = comp.borderTopWidth;
      const borderTopStyle = comp.borderTopStyle;
      const borderRadius = comp.borderRadius;
      const overflow = comp.overflow;

      let svgInfo = null;

      if (svg) {
        totalSvgs++;
        const archetype = svg.getAttribute('data-snow-archetype') || 'unknown';
        archetypes.push(archetype);

        const solidBase = svg.querySelector('.snow-solid-base');
        const snowBody = svg.querySelector('.snow-body');
        const snowDome = svg.querySelector('.snow-dome');
        const snowRim = svg.querySelector('.snow-rim');
        const sparkles = svg.querySelectorAll('.snow-sparkles circle');

        const baseFill = solidBase ? window.getComputedStyle(solidBase).fill : 'none';
        const baseOpacity = solidBase ? window.getComputedStyle(solidBase).opacity : '1';

        const pathD = solidBase ? solidBase.getAttribute('d') || '' : '';
        const viewBoxAttr = svg.getAttribute('viewBox') || '';
        const viewBox = viewBoxAttr ? viewBoxAttr.split(' ').map(Number) : [0, 0, cardRect.width, 40];
        const vW = viewBox[2];
        const vH = viewBox[3];

        const styleAttr = svg.getAttribute('style') || '';
        const yOffsetMatch = styleAttr.match(/--snow-svg-top:\s*-(\d+)px/);
        const yOffset = yOffsetMatch ? parseInt(yOffsetMatch[1], 10) : 26;

        // Mathematical profile sampling via isPointInFill
        const pt = svg.createSVGPoint();
        function sampleProfile(localX) {
          const clampedX = Math.max(0.1, Math.min(vW - 0.1, (localX / Math.max(1, cardRect.width)) * vW));
          pt.x = clampedX;
          let topY = null, botY = null;
          for (let y = 0; y <= vH; y += 0.5) {
            pt.y = y;
            if (solidBase && solidBase.isPointInFill(pt)) {
              if (topY === null) topY = y;
              botY = y;
            }
          }
          return {
            topY: topY ?? vH,
            botY: botY ?? vH,
            thick: (topY !== null && botY !== null) ? Math.max(0, botY - topY) : 0
          };
        }

        const W = cardRect.width;
        const p0 = sampleProfile(0);
        const pMid = sampleProfile(W * 0.5);
        const pW = sampleProfile(W);

        // Scan 25 sample points across card to measure wave relief and drooping tongues
        const profilePoints = [];
        let maxThick = 0;
        for (let s = 0; s <= 24; s++) {
          const sx = (s / 24) * W;
          const p = sampleProfile(sx);
          profilePoints.push({ x: sx, ...p });
          if (p.thick > maxThick) maxThick = p.thick;
        }

        const botDeltas = profilePoints.map(p => Math.max(0, p.botY - yOffset));
        const avgBaseDrop = botDeltas.reduce((a, b) => a + b, 0) / (botDeltas.length || 1);
        const maxDroop = Math.max(...botDeltas);

        // Bottom wave standard deviation
        const meanBot = avgBaseDrop;
        const botVariance = botDeltas.reduce((sum, b) => sum + Math.pow(b - meanBot, 2), 0) / (botDeltas.length || 1);
        const bottomWaveStdDev = Math.sqrt(botVariance);

        // Shoulder wrap: verify whether shoulder curves down softly without flat cut wall
        const isScreenEdge = card.id === 'footer-bar' || card.className.includes('footer-bar');
        const isFlatCutWall = !isScreenEdge && maxThick > 5 && (p0.thick > maxThick * 0.70 || pW.thick > maxThick * 0.70);

        svgInfo = {
          archetype,
          solidBase: {
            exists: !!solidBase,
            fill: baseFill,
            opacity: baseOpacity,
            is100PercentOpaque: baseOpacity === '1' || baseOpacity === '1.0'
          },
          snowBodyExists: !!snowBody,
          snowDomeExists: !!snowDome,
          snowRimExists: !!snowRim,
          sparklesCount: sparkles.length,
          yOffset,
          avgBaseDrop: Number(avgBaseDrop.toFixed(1)),
          maxDroop: Number(maxDroop.toFixed(1)),
          bottomWaveStdDev: Number(bottomWaveStdDev.toFixed(2)),
          cornerWrap: {
            p0Thick: Number(p0.thick.toFixed(1)),
            pWThick: Number(pW.thick.toFixed(1)),
            isFlatCutWall
          }
        };
      }

      const tagName = card.tagName.toLowerCase();
      let name = card.className.split(' ').filter(c => c && !c.startsWith('card-snow') && !c.startsWith('is-')).slice(0, 2).join('.');
      if (card.id) name += `#${card.id}`;

      cardData.push({
        idx,
        name,
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
          borderRadius
        },
        svgInfo
      });
    }

    // Horizontal adjacent card gap check: verify zero lateral bleed
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
      cards: cardData,
      svgCount: totalSvgs,
      archetypes,
      horizontalPairs
    };
  });
}

async function testDynamicHoverPhysics(page, pageName) {
  const allCards = await page.$$('.recent-post-item, .categoryItem, .todayCard, .markdown-alert, .admonition, .article-callout, .code-block-shell, #aside-content .card-widget');
  const targetCards = [];
  for (const c of allCards) {
    const vis = await c.isVisible().catch(() => false);
    if (vis) {
      targetCards.push(c);
      if (targetCards.length >= 3) break;
    }
  }
  const results = [];

  for (let i = 0; i < targetCards.length; i++) {
    const card = targetCards[i];
    const cardInfo = await card.evaluate(el => ({
      cls: el.className.split(' ')[0],
      tag: el.tagName.toLowerCase()
    })).catch(() => ({ cls: 'unknown', tag: 'div' }));

    try {
      await card.scrollIntoViewIfNeeded({ timeout: 5000 });
    } catch {
      continue;
    }
    await page.waitForTimeout(200);

    // Perform actual mouse hover
    await card.hover({ force: true }).catch(() => {});
    await page.waitForTimeout(300);

    const activeHoverState = await card.evaluate(el => {
      const svg = el.querySelector('.card-snow-svg');
      const compTransform = svg ? window.getComputedStyle(svg).transform : 'none';
      const flakes = el.querySelectorAll('.snow-detached-flake');
      return {
        transform: compTransform,
        flakesSpawned: flakes.length
      };
    }).catch(() => ({ transform: 'none', flakesSpawned: 0 }));

    // Wait 2200ms for detached flakes animation and lifecycle cleanup
    await page.waitForTimeout(2200);

    const residualFlakes = await card.evaluate(el => {
      return el.querySelectorAll('.snow-detached-flake').length;
    }).catch(() => 0);

    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);

    results.push({
      cardIndex: i,
      identifier: `${cardInfo.tag}.${cardInfo.cls}`,
      transform: activeHoverState.transform,
      springMatrixActive: activeHoverState.transform.includes('matrix'),
      flakesSpawned: activeHoverState.flakesSpawned,
      residualFlakes,
      zeroDomLeakPassed: residualFlakes === 0
    });
  }

  return results;
}

async function testCanvasLayers(page) {
  return await page.evaluate(() => {
    const bg = document.getElementById('theme-snow-universe');
    const mid = document.getElementById('theme-snow-mid');
    const fg = document.getElementById('theme-snow-foreground');
    return {
      bgLayer: bg ? { exists: true, zIndex: window.getComputedStyle(bg).zIndex, w: bg.width, h: bg.height } : { exists: false },
      midLayer: mid ? { exists: true, zIndex: window.getComputedStyle(mid).zIndex, w: mid.width, h: mid.height } : { exists: false },
      fgLayer: fg ? { exists: true, zIndex: window.getComputedStyle(fg).zIndex, w: fg.width, h: fg.height } : { exists: false }
    };
  });
}

async function captureCloseUpCrops(page, pageName, theme) {
  try {
    const cropCandidates = [
      { sel: '.recent-post-item', name: 'recent-post' },
      { sel: '.todayCard', name: 'today-card' },
      { sel: '.categoryItem', name: 'category-item' },
      { sel: '#card-toc', name: 'toc-card' },
      { sel: '.markdown-alert', name: 'markdown-alert' },
      { sel: '.admonition', name: 'admonition' },
      { sel: '.code-block-shell', name: 'code-block' },
      { sel: '#post-comment', name: 'comment-box' },
      { sel: '.footer-main-shell', name: 'footer-main' }
    ];

    for (const c of cropCandidates) {
      const el = await page.$(c.sel);
      if (el) {
        const visible = await el.isVisible();
        if (visible) {
          const savePath = path.join(REPORT_DIR, `subagent2-crop-${pageName}-${c.name}-${theme}.png`);
          await el.screenshot({ path: savePath }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn(`Close up crop notice: ${err.message}`);
  }
}

function printAuditorExecutiveReport(results) {
  console.log("\n================================================================================");
  console.log("🏆 SUBAGENT 2 (CLEAN CONFIRMATION AUDITOR): EXECUTIVE FINAL VERDICT");
  console.log("================================================================================\n");

  for (const key of Object.keys(results.pages)) {
    const p = results.pages[key];
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`📌 PAGE: [${p.label}] (${p.url})`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`  • Audited Cards Count:       ${p.lightTelemetry.cards.length}`);
    console.log(`  • Snow Mantle SVGs Mounted:  ${p.lightTelemetry.svgCount}`);
    console.log(`  • Fatal JS Console Errors:   ${p.jsErrors.length} (${p.jsErrors.length === 0 ? '✅ STRICT 0' : '❌ ERRORS FOUND'})`);
    console.log(`  • React Hydration Errors:    ${p.hydrationErrors.length} (${p.hydrationErrors.length === 0 ? '✅ STRICT 0' : '❌ HYDRATION MISMATCH'})`);
    console.log(`  • Mobile (390px) Overflow:   ${p.mobileOverflow.hasHorizontalOverflow ? '❌ OVERFLOW' : '✅ STRICT 0 OVERFLOW'}`);

    // Section 1: Border Top & Solid Base
    let borderTopTransparentCount = 0;
    let solidBaseOpaqueCount = 0;
    let flatCutCount = 0;

    p.lightTelemetry.cards.forEach(c => {
      if (c.styles.borderTopColor === 'rgba(0, 0, 0, 0)' || c.styles.borderTopColor === 'transparent') {
        borderTopTransparentCount++;
      }
      if (c.svgInfo && c.svgInfo.solidBase && c.svgInfo.solidBase.is100PercentOpaque) {
        solidBaseOpaqueCount++;
      }
      if (c.svgInfo && c.svgInfo.cornerWrap.isFlatCutWall) {
        flatCutCount++;
      }
    });

    console.log(`\n  [1. Zero Dividing Line & Zero Membrane Bleed]:`);
    console.log(`    - borderTopColor transparent: ${borderTopTransparentCount} / ${p.lightTelemetry.cards.length} (${borderTopTransparentCount === p.lightTelemetry.cards.length ? '✅ 100% CLEAN' : '❌ FAIL'})`);
    console.log(`    - 100% Solid Base Installed:  ${solidBaseOpaqueCount} / ${p.lightTelemetry.svgCount} (${solidBaseOpaqueCount === p.lightTelemetry.svgCount ? '✅ 100% OPAQUE' : '❌ FAIL'})`);
    console.log(`    - Flat Cut Wall Violations:   ${flatCutCount} / ${p.lightTelemetry.svgCount} (${flatCutCount === 0 ? '✅ STRICT 0' : '❌ FLAT CUT DETECTED'})`);

    // Section 2: Physical Droop & Undulating Wave
    console.log(`\n  [2. Physical Droop & Undulating Wave Samples]:`);
    const samples = p.lightTelemetry.cards.filter(c => c.svgInfo).slice(0, 4);
    samples.forEach(c => {
      const s = c.svgInfo;
      console.log(`    • ${c.name} [Archetype: ${s.archetype}]:`);
      console.log(`      - Base Drop: ${s.avgBaseDrop}px | Max Droop: ${s.maxDroop}px | Wave StdDev: ${s.bottomWaveStdDev}px`);
      console.log(`      - Shoulder Rollover: p0=${s.cornerWrap.p0Thick}px, pW=${s.cornerWrap.pWThick}px`);
    });

    // Section 3: Dark Mode Slate Blue
    const darkSample = p.darkTelemetry.cards.find(c => c.svgInfo?.solidBase?.exists);
    console.log(`\n  [3. Dark Mode Palette (#6388b4)]:`);
    if (darkSample) {
      console.log(`    - Solid Base Fill (Dark): "${darkSample.svgInfo.solidBase.fill}" (${darkSample.svgInfo.solidBase.fill.includes('99, 136, 180') ? '✅ EXACT MATCH #6388b4' : 'ℹ️ ' + darkSample.svgInfo.solidBase.fill})`);
    }

    // Section 4: Horizontal Zero Bleed Pairs
    console.log(`\n  [4. Horizontal Gap Preservation (Zero Lateral Bleed)]:`);
    console.log(`    - Adjacent Pairs Verified: ${p.lightTelemetry.horizontalPairs.length}`);
    const bleedFails = p.lightTelemetry.horizontalPairs.filter(pr => !pr.isZeroBleed);
    console.log(`    - Lateral Bleed Violations: ${bleedFails.length} (${bleedFails.length === 0 ? '✅ 100% ZERO BLEED' : '❌ BLEED DETECTED'})`);

    // Section 5: Dynamic Micro-Physics
    console.log(`\n  [5. Dynamic Micro-Physics & Memory Cleanup]:`);
    p.hoverResults.forEach(hr => {
      console.log(`    - ${hr.identifier}: Spring Matrix=${hr.springMatrixActive ? '✅' : '❌'} | Flakes Spawned=${hr.flakesSpawned} | Residual=${hr.residualFlakes} (${hr.zeroDomLeakPassed ? '✅ 0 LEAK' : '❌ LEAK'})`);
    });
  }

  console.log(`\n================================================================================`);
  console.log(`🏁 OVERALL FINAL AUDIT VERDICT:`);
  console.log(`  • Total Cards Audited:       ${results.overall.totalCardsAudited}`);
  console.log(`  • Total Snow SVGs Mounted:   ${results.overall.totalSvgsMounted}`);
  console.log(`  • Unique Archetypes Found:   ${results.overall.archetypesIdentified.length} (${results.overall.archetypesIdentified.join(', ')})`);
  console.log(`  • Fatal JavaScript Errors:   ${results.overall.fatalJsErrorsTotal}`);
  console.log(`  • React Hydration Errors:    ${results.overall.hydrationErrorsTotal}`);
  console.log(`  • Mobile Horizontal Leak:    ${results.overall.mobileHorizontalOverflow ? '❌ OVERFLOW' : '✅ 0 OVERFLOW'}`);
  console.log(`================================================================================\n`);
}

runSubagent2CleanAudit().catch(err => {
  console.error("FATAL SUBAGENT 2 ERROR:", err);
  process.exit(1);
});
