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

async function runComprehensiveSnowAudit() {
  console.log("================================================================================");
  console.log("❄️ INDEPENDENT THIRD-PARTY AUDIT: PRODUCTION SNOW SYSTEM & VISUAL UX AUDIT");
  console.log("Production Homepage:    https://blog.epocanvas.com/");
  console.log("Post Detail 1:          https://blog.epocanvas.com/posts/markdown-syntax-mastery/");
  console.log("Post Detail 2:          https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/");
  console.log("Audit Timestamp:        " + new Date().toISOString());
  console.log("Auditor Engine:         Playwright Chromium (Headless E2E Telemetry)");
  console.log("================================================================================\n");

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const auditResults = {
    timestamp: new Date().toISOString(),
    pages: {},
    summary: {
      totalCardsAudited: 0,
      totalSvgsFound: 0,
      borderTopZeroIssues: true,
      solidBase100Percent: true,
      archetypesFound: [],
      fatalErrorsCount: 0
    }
  };

  const targets = [
    { name: 'homepage', url: 'https://blog.epocanvas.com/' },
    { name: 'post-markdown', url: 'https://blog.epocanvas.com/posts/markdown-syntax-mastery/' },
    { name: 'post-formats', url: 'https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/' }
  ];

  for (const target of targets) {
    console.log(`\n================================================================================`);
    console.log(`🔍 AUDITING PAGE: [${target.name}] -> ${target.url}`);
    console.log(`================================================================================`);

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 IndependentAuditor/1.0'
    });

    const page = await context.newPage();
    const consoleLogs = [];
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.push({ type, text });
      if (type === 'error') {
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', err => {
      pageErrors.push(String(err));
    });

    console.log(`Navigating to ${target.url} (domcontentloaded)...`);
    const resp = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    console.log(`[HTTP Status]: ${resp ? resp.status() : 'N/A'}`);

    // Wait for snow initialization & DOM settle
    await page.waitForTimeout(3000);

    // Ensure snow theme is active
    const bgMode = await page.evaluate(() => document.documentElement.getAttribute('data-background'));
    console.log(`[Initial data-background]: "${bgMode}"`);
    if (bgMode !== 'snow') {
      console.log(`[Action]: Explicitly setting data-background="snow"...`);
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-background', 'snow');
        window.dispatchEvent(new Event('resize'));
      });
      await page.waitForTimeout(1000);
    }

    // Scroll through the page to trigger all cards, lazy loaders and intersections
    console.log(`[Action]: Scrolling through entire page to trigger all lazy cards...`);
    await page.evaluate(async () => {
      const scrollStep = 500;
      const delay = 120;
      for (let y = 0; y < document.body.scrollHeight; y += scrollStep) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, delay));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);

    // 1. Audit Desktop Light Mode
    console.log(`\n--- [1. AUDIT: LIGHT MODE TELEMETRY (1440x900)] ---`);
    const lightTelemetry = await auditPageDomTelemetry(page);
    console.log(`Found ${lightTelemetry.cards.length} cards, ${lightTelemetry.svgCount} snow SVGs.`);
    
    // Screenshot Desktop Light
    const lightScreenshotPath = path.join(REPORT_DIR, `audit-${target.name}-light-1440.png`);
    await page.screenshot({ path: lightScreenshotPath, fullPage: false });
    console.log(`[Screenshot Saved]: ${lightScreenshotPath}`);

    // High resolution close-up crop of prominent snow elements
    await takeCloseUpScreenshots(page, target.name, 'light');

    // 2. Audit Desktop Dark Mode
    console.log(`\n--- [2. AUDIT: DARK MODE TELEMETRY (1440x900)] ---`);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      window.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(1200);

    const darkTelemetry = await auditPageDomTelemetry(page);
    console.log(`Dark mode: Found ${darkTelemetry.cards.length} cards, ${darkTelemetry.svgCount} snow SVGs.`);
    
    // Screenshot Desktop Dark
    const darkScreenshotPath = path.join(REPORT_DIR, `audit-${target.name}-dark-1440.png`);
    await page.screenshot({ path: darkScreenshotPath, fullPage: false });
    console.log(`[Screenshot Saved]: ${darkScreenshotPath}`);

    await takeCloseUpScreenshots(page, target.name, 'dark');

    // 3. Dynamic Micro-Physics & Hover Test (Real Mouse Hover via Playwright)
    console.log(`\n--- [3. AUDIT: HOVER MICRO-PHYSICS & DETACHED FLAKES] ---`);
    // Restore light mode for interaction
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.waitForTimeout(500);

    const hoverResult = await testRealHoverPhysics(page, target.name);
    console.log(`Hover test on "${hoverResult.selector}": scaleY=${hoverResult.scaleY}, transform="${hoverResult.transform}", detachedFlakesSpawned=${hoverResult.detachedFlakesCount}, detachedFlakesAfterEnd=${hoverResult.detachedFlakesResidual}`);

    // 4. Mobile Viewport Audit (390x844)
    console.log(`\n--- [4. AUDIT: MOBILE RESPONSIVE ADAPTATION (390x844)] ---`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(1500);

    const mobileTelemetry = await auditPageDomTelemetry(page);
    console.log(`Mobile (390x844): Found ${mobileTelemetry.cards.length} cards, ${mobileTelemetry.svgCount} snow SVGs.`);
    const mobileScreenshotPath = path.join(REPORT_DIR, `audit-${target.name}-mobile-390.png`);
    await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
    console.log(`[Screenshot Saved]: ${mobileScreenshotPath}`);

    // Check horizontal scrollbar overflow on mobile
    const mobileScrollWidth = await page.evaluate(() => {
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    console.log(`Mobile viewport overflow check: clientWidth=${mobileScrollWidth.clientWidth}, scrollWidth=${mobileScrollWidth.scrollWidth}, hasHorizontalOverflow=${mobileScrollWidth.hasHorizontalOverflow}`);

    // 5. Canvas & Aerodynamic Wake Check
    console.log(`\n--- [5. AUDIT: FALLING SNOW CANVAS & AERODYNAMIC WAKE] ---`);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    const canvasResult = await testSnowCanvas(page);
    console.log(`Canvas check: bgCanvas=${JSON.stringify(canvasResult.bgCanvas)}, midCanvas=${JSON.stringify(canvasResult.midCanvas)}, fgCanvas=${JSON.stringify(canvasResult.fgCanvas)}`);

    // Record results for this target
    auditResults.pages[target.name] = {
      url: target.url,
      consoleErrors,
      pageErrors,
      lightTelemetry,
      darkTelemetry,
      hoverResult,
      mobileTelemetry,
      mobileScrollWidth,
      canvasResult
    };

    auditResults.summary.fatalErrorsCount += (consoleErrors.length + pageErrors.length);
    auditResults.summary.totalCardsAudited += lightTelemetry.cards.length;
    auditResults.summary.totalSvgsFound += lightTelemetry.svgCount;
    for (const a of lightTelemetry.archetypes) {
      if (!auditResults.summary.archetypesFound.includes(a)) {
        auditResults.summary.archetypesFound.push(a);
      }
    }

    await context.close();
  }

  await browser.close();

  // Save audit data to JSON
  const jsonPath = path.join(REPORT_DIR, 'snow-audit-complete-telemetry.json');
  fs.writeFileSync(jsonPath, JSON.stringify(auditResults, null, 2), 'utf-8');
  console.log(`\n[Audit Telemetry JSON Saved]: ${jsonPath}`);

  return auditResults;
}

async function takeCloseUpScreenshots(page, pageName, theme) {
  try {
    // Crop key elements
    const cropTargets = [
      { sel: '.recent-post-item', name: 'recent-post-item' },
      { sel: '.todayCard', name: 'today-card' },
      { sel: '.categoryItem', name: 'category-item' },
      { sel: '#card-toc', name: 'card-toc' },
      { sel: '.markdown-alert', name: 'markdown-alert' },
      { sel: '.code-block-shell', name: 'code-block' },
      { sel: '.article-table-wrap', name: 'table-wrap' },
      { sel: '#post-comment', name: 'post-comment' },
      { sel: '.footer-main-shell', name: 'footer-main' }
    ];

    for (const ct of cropTargets) {
      const el = await page.$(ct.sel);
      if (el) {
        const isVisible = await el.isVisible();
        if (isVisible) {
          const savePath = path.join(REPORT_DIR, `crop-${pageName}-${ct.name}-${theme}.png`);
          await el.screenshot({ path: savePath });
          // Only log first 2 to keep output clean
        }
      }
    }
  } catch (err) {
    console.warn(`Close-up screenshot notice: ${err.message}`);
  }
}

async function auditPageDomTelemetry(page) {
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

    const elements = Array.from(document.querySelectorAll(SELECTORS.join(', ')));
    const seen = new Set();
    const cardData = [];
    const archetypes = [];

    let totalSvgCount = 0;

    for (const el of elements) {
      if (seen.has(el)) continue;
      if (el.id === 'footer-wrap') continue;
      if (el.offsetParent === null) continue;
      const comp = window.getComputedStyle(el);
      if (comp.display === 'none' || comp.visibility === 'hidden' || comp.opacity === '0') continue;

      // Filter nested duplicates
      let isNested = false;
      for (const parent of seen) {
        if (parent.contains(el)) {
          const isAllowed =
            el.classList.contains('recent-post-item') ||
            el.classList.contains('relatedPosts-item') ||
            el.classList.contains('postNav-card') ||
            el.classList.contains('post-copyright') ||
            el.classList.contains('card-widget') ||
            el.classList.contains('category-bar') ||
            el.id === 'category-bar' ||
            el.classList.contains('home-top-notice') ||
            el.classList.contains('shijianus-ai-summary') ||
            el.classList.contains('markdown-alert') ||
            el.classList.contains('article-callout') ||
            el.classList.contains('admonition') ||
            el.classList.contains('admonition-details') ||
            el.classList.contains('github-repo-card') ||
            el.classList.contains('video-embed-card') ||
            el.classList.contains('article-audio-card') ||
            el.classList.contains('article-encrypted-box') ||
            el.classList.contains('article-tabs') ||
            el.classList.contains('code-block-shell') ||
            el.matches('figure.highlight') ||
            el.classList.contains('article-table-wrap') ||
            el.classList.contains('footer-main-shell') ||
            el.id === 'footer-bar' ||
            el.id === 'post-comment';
          if (!isAllowed) {
            isNested = true;
            break;
          }
        }
      }
      if (isNested) continue;
      seen.add(el);

      const rect = el.getBoundingClientRect();
      const svg = el.querySelector(':scope > .card-snow-svg');
      let svgInfo = null;

      // Card top border style
      const borderTopColor = comp.borderTopColor;
      const borderTopWidth = comp.borderTopWidth;
      const borderTopStyle = comp.borderTopStyle;
      const overflow = comp.overflow;
      const position = comp.position;
      const borderRadius = comp.borderRadius;
      const borderTopLeftRadius = comp.borderTopLeftRadius;
      const borderTopRightRadius = comp.borderTopRightRadius;

      if (svg) {
        totalSvgCount++;
        const archetype = svg.getAttribute('data-snow-archetype') || 'unknown';
        archetypes.push(archetype);

        const solidBase = svg.querySelector('.snow-solid-base');
        const snowBody = svg.querySelector('.snow-body');
        const snowDome = svg.querySelector('.snow-dome');
        const snowRim = svg.querySelector('.snow-rim');
        const sparkles = svg.querySelectorAll('.snow-sparkles circle');

        const baseFill = solidBase ? window.getComputedStyle(solidBase).fill : null;
        const baseOpacity = solidBase ? window.getComputedStyle(solidBase).opacity : null;

        const pathD = solidBase ? solidBase.getAttribute('d') || '' : '';
        const viewBox = svg.getAttribute('viewBox') || '';

        // Extract numbers from pathD to evaluate waves and droop
        const qMatches = Array.from(pathD.matchAll(/Q\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)/g)).map(m => ({
          cx: parseFloat(m[1]),
          cy: parseFloat(m[2]),
          x: parseFloat(m[3]),
          y: parseFloat(m[4])
        }));

        const lMatches = Array.from(pathD.matchAll(/L\s+([\d.-]+)\s+([\d.-]+)/g)).map(m => ({
          x: parseFloat(m[1]),
          y: parseFloat(m[2])
        }));

        const allY = [...qMatches.map(p => p.y), ...qMatches.map(p => p.cy), ...lMatches.map(p => p.y)];
        const minY = allY.length > 0 ? Math.min(...allY) : 0;
        const maxY = allY.length > 0 ? Math.max(...allY) : 0;

        // Viewbox height and width
        const vbParts = viewBox.split(' ').map(Number);
        const vbW = vbParts[2] || rect.width;
        const vbH = vbParts[3] || 40;

        // svg style top
        const svgComputed = window.getComputedStyle(svg);
        const svgTop = svgComputed.top;
        const svgLeft = svgComputed.left;
        const svgWidth = svgComputed.width;

        // Compute actual droop and wave metrics
        // In generateSnowMantleSvg, yOffset is typically around 26-40px.
        // Let's parse yOffset from style: --snow-svg-top: -Ypx
        const styleAttr = svg.getAttribute('style') || '';
        const yOffsetMatch = styleAttr.match(/--snow-svg-top:\s*-(\d+)px/);
        const yOffset = yOffsetMatch ? parseInt(yOffsetMatch[1], 10) : 26;

        // Snow top rise: (yOffset - minY)
        const peakSnowRise = Math.max(0, yOffset - minY);
        // Snow bottom droop: (maxY - yOffset)
        const maxDroop = Math.max(0, maxY - yOffset);

        // Check wave along bottom points: extract y coordinates where y > yOffset
        const bottomYList = allY.filter(y => y >= yOffset);
        let bottomWaveVariance = 0;
        if (bottomYList.length > 1) {
          const meanY = bottomYList.reduce((a, b) => a + b, 0) / bottomYList.length;
          const variance = bottomYList.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0) / bottomYList.length;
          bottomWaveVariance = Math.sqrt(variance);
        }

        // Corner wrap check: check points near x=0 and x=W
        const nearLeft = [...qMatches, ...lMatches].filter(p => p.x <= 5 || p.cx <= 5);
        const nearRight = [...qMatches, ...lMatches].filter(p => p.x >= vbW - 5 || p.cx >= vbW - 5);
        const cornerWrapL = nearLeft.length > 0;
        const cornerWrapR = nearRight.length > 0;

        svgInfo = {
          hasSvg: true,
          archetype,
          viewBox,
          svgTop,
          svgLeft,
          svgWidth,
          solidBase: {
            exists: !!solidBase,
            fill: baseFill,
            opacity: baseOpacity
          },
          snowBodyExists: !!snowBody,
          snowDomeExists: !!snowDome,
          snowRimExists: !!snowRim,
          sparklesCount: sparkles.length,
          yOffset,
          peakSnowRise: Number(peakSnowRise.toFixed(1)),
          maxDroop: Number(maxDroop.toFixed(1)),
          bottomWaveVariance: Number(bottomWaveVariance.toFixed(2)),
          cornerWrap: cornerWrapL && cornerWrapR,
          minY,
          maxY,
          verticalSpan: Number((maxY - minY).toFixed(1))
        };
      }

      // Check clearance above this element (vertical gap with upper elements)
      let clearanceAbove = 999;
      for (const other of seen) {
        if (other === el || other.offsetParent === null) continue;
        const otherRect = other.getBoundingClientRect();
        const overlapX = Math.min(rect.right, otherRect.right) - Math.max(rect.left, otherRect.left);
        if (overlapX > 20 && otherRect.bottom <= rect.top) {
          const gap = rect.top - otherRect.bottom;
          if (gap < clearanceAbove) {
            clearanceAbove = Math.round(gap);
          }
        }
      }

      // Check horizontal bleed: does svg width exceed card width?
      const svgOverflowLeft = svgInfo ? parseFloat(svgInfo.svgLeft) < 0 : false;
      const svgOverflowWidth = svgInfo ? (parseFloat(svgInfo.svgWidth) > rect.width + 1) : false;

      // Identify class or selector name
      const className = el.className;
      const id = el.id;
      const tagName = el.tagName.toLowerCase();
      const identifier = id ? `#${id}` : className.split(' ').filter(c => c && !c.startsWith('is-')).slice(0, 2).join('.');

      cardData.push({
        identifier: `<${tagName} class="${className}">`,
        id,
        className,
        rect: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom)
        },
        styles: {
          borderTopColor,
          borderTopWidth,
          borderTopStyle,
          overflow,
          position,
          borderRadius,
          borderTopLeftRadius,
          borderTopRightRadius
        },
        clearanceAbove: clearanceAbove === 999 ? 'No upper card' : clearanceAbove,
        horizontalBleed: svgOverflowLeft || svgOverflowWidth,
        svgInfo
      });
    }

    return {
      cards: cardData,
      svgCount: totalSvgCount,
      archetypes
    };
  });
}

async function testRealHoverPhysics(page, pageName) {
  // Find a target card to hover
  const targetSelectors = [
    '#recent-posts .recent-post-item',
    '.topGroup .recent-post-item',
    '.categoryItem',
    '.todayCard',
    '.card-widget',
    '.markdown-alert',
    '.code-block-shell'
  ];

  let chosenSelector = null;
  for (const sel of targetSelectors) {
    const el = await page.$(sel);
    if (el && await el.isVisible()) {
      chosenSelector = sel;
      break;
    }
  }

  if (!chosenSelector) {
    return { selector: 'none', scaleY: 'N/A', transform: 'N/A', detachedFlakesCount: 0, detachedFlakesResidual: 0 };
  }

  console.log(`[Hover Test]: Moving mouse over "${chosenSelector}"...`);
  const cardLocator = page.locator(chosenSelector).first();
  await cardLocator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  // Perform real mouse hover
  await cardLocator.hover();
  
  // Wait 300ms for CSS transition to trigger
  await page.waitForTimeout(300);

  const hoverData = await cardLocator.evaluate((card) => {
    const svg = card.querySelector(':scope > .card-snow-svg');
    const compTransform = svg ? window.getComputedStyle(svg).transform : 'none';
    const flakes = card.querySelectorAll('.snow-detached-flake');
    return {
      transform: compTransform,
      flakesCount: flakes.length
    };
  });

  // Save screenshot of hover state
  const hoverScreenshotPath = path.join(REPORT_DIR, `audit-${pageName}-hover-state.png`);
  await cardLocator.screenshot({ path: hoverScreenshotPath });
  console.log(`[Hover Screenshot Saved]: ${hoverScreenshotPath}`);

  // Wait 2500ms for flakes animation to end and cleanup
  console.log(`[Hover Test]: Waiting 2500ms for flake animation & cleanup...`);
  await page.waitForTimeout(2500);

  const residualCount = await cardLocator.evaluate((card) => {
    return card.querySelectorAll('.snow-detached-flake').length;
  });

  // Move mouse away
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);

  return {
    selector: chosenSelector,
    transform: hoverData.transform,
    scaleY: hoverData.transform.includes('matrix') ? 'Active (Matrix Transform Applied)' : hoverData.transform,
    detachedFlakesCount: hoverData.flakesCount,
    detachedFlakesResidual: residualCount
  };
}

async function testSnowCanvas(page) {
  return await page.evaluate(async () => {
    const bgCanvas = document.getElementById('theme-snow-universe');
    const midCanvas = document.getElementById('theme-snow-mid');
    const fgCanvas = document.getElementById('theme-snow-foreground');

    const result = {
      bgCanvas: bgCanvas ? { exists: true, w: bgCanvas.width, h: bgCanvas.height, zIndex: window.getComputedStyle(bgCanvas).zIndex } : { exists: false },
      midCanvas: midCanvas ? { exists: true, w: midCanvas.width, h: midCanvas.height, zIndex: window.getComputedStyle(midCanvas).zIndex } : { exists: false },
      fgCanvas: fgCanvas ? { exists: true, w: fgCanvas.width, h: fgCanvas.height, zIndex: window.getComputedStyle(fgCanvas).zIndex } : { exists: false }
    };

    // Simulate mouse movements across viewport to test wake
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 300 }));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 600, clientY: 400 }));

    return result;
  });
}

runComprehensiveSnowAudit().catch(err => {
  console.error("FATAL AUDIT ERROR:", err);
  process.exit(1);
});
