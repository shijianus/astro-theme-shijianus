import { chromium } from 'playwright';

async function auditSnowSystem() {
  console.log("================================================================================");
  console.log("❄️ INDEPENDENT THIRD-PARTY AUDIT: PRODUCTION SNOW SYSTEM & VISUAL UX AUDIT");
  console.log("Production URL: https://blog.epocanvas.com");
  console.log("Post URL:       https://blog.epocanvas.com/posts/markdown-syntax-mastery/");
  console.log("Audit Timestamp: " + new Date().toISOString());
  console.log("================================================================================\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 AntigravityAuditor/1.0'
  });
  const page = await context.newPage();

  const auditTargets = [
    { name: 'Homepage', url: 'https://blog.epocanvas.com/' },
    { name: 'Post Detail', url: 'https://blog.epocanvas.com/posts/markdown-syntax-mastery/' }
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

    const response = await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    console.log(`[HTTP Status]: ${response?.status() || 'N/A'}`);

    // Wait for snow initialization & DOM settle
    await page.waitForTimeout(3500);

    // Verify data-background attribute
    const bgAttr = await page.evaluate(() => document.documentElement.getAttribute('data-background'));
    console.log(`[HTML data-background]: ${bgAttr}`);

    // Collect DOM card snow mantles data
    const auditData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll(`
        .recent-post-item,
        #aside-content .card-widget,
        .categoryItem,
        .todayCard,
        #random-banner,
        .home-top-notice,
        #footer-bar,
        .footer-main-shell,
        .shijianus-ai-summary,
        .markdown-alert,
        .article-callout,
        .code-block-shell,
        figure.highlight,
        .relatedPosts-item,
        .postNav-card
      `));

      const cardResults = [];

      cards.forEach((card, idx) => {
        const svg = card.querySelector(':scope > .card-snow-svg, .card-snow-svg');
        const path = svg ? svg.querySelector('path') : null;
        if (!svg || !path) return;

        const cardRect = card.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(card);
        const borderRadius = computedStyle.borderRadius;

        const viewBoxAttr = svg.getAttribute('viewBox');
        const viewBox = viewBoxAttr ? viewBoxAttr.split(' ').map(Number) : [0, 0, svgRect.width, svgRect.height];
        const vW = viewBox[2];
        const vH = viewBox[3];
        const seed = svg.getAttribute('data-snow-seed') || 'unknown';
        const archetype = svg.getAttribute('data-snow-archetype') || 'unknown';

        const pathD = path.getAttribute('d') || '';

        // Helper to query thickness at given local x [0..W]
        const pt = svg.createSVGPoint();
        function getProfile(localX) {
          const clampedX = Math.max(0.1, Math.min(vW - 0.1, (localX / Math.max(1, svgRect.width)) * vW));
          pt.x = clampedX;
          let topY = null, botY = null;
          // Step 0.5 coordinate units
          for (let y = 0; y <= vH; y += 0.5) {
            pt.y = y;
            if (path.isPointInFill(pt)) {
              if (topY === null) topY = y;
              botY = y;
            }
          }
          const scaleY = svgRect.height / Math.max(1, vH);
          return {
            topY: (topY ?? vH) * scaleY,
            botY: (botY ?? vH) * scaleY,
            thick: (topY !== null && botY !== null) ? Math.max(0, (botY - topY) * scaleY) : 0
          };
        }

        const W = svgRect.width;
        // Sample thickness at critical points
        const p0 = getProfile(0);
        const p2 = getProfile(Math.min(2, W * 0.01));
        const p5 = getProfile(Math.min(5, W * 0.02));
        const p15 = getProfile(Math.min(15, W * 0.05));
        const p25 = getProfile(Math.min(25, W * 0.08));
        const pQ1 = getProfile(W * 0.25);
        const pMid = getProfile(W * 0.5);
        const pQ3 = getProfile(W * 0.75);
        const pW_25 = getProfile(W - Math.min(25, W * 0.08));
        const pW_15 = getProfile(W - Math.min(15, W * 0.05));
        const pW_5 = getProfile(W - Math.min(5, W * 0.02));
        const pW_2 = getProfile(W - Math.min(2, W * 0.01));
        const pW = getProfile(W);

        // Find max thickness and peak position
        let thickMax = 0;
        let peakX = 0;
        const scanSteps = 30;
        const profileCurve = [];
        for (let s = 0; s <= scanSteps; s++) {
          const sx = (s / scanSteps) * W;
          const p = getProfile(sx);
          profileCurve.push({ x: sx, yTop: p.topY, thick: p.thick });
          if (p.thick > thickMax) {
            thickMax = p.thick;
            peakX = sx;
          }
        }

        // Top edge undulation analysis (variance of slopes to detect natural relief vs CAD line)
        let slopeDeltas = [];
        for (let s = 1; s < profileCurve.length - 1; s++) {
          const dy = profileCurve[s + 1].yTop - profileCurve[s].yTop;
          slopeDeltas.push(dy);
        }
        const meanSlope = slopeDeltas.reduce((a, b) => a + b, 0) / (slopeDeltas.length || 1);
        const slopeVariance = slopeDeltas.reduce((a, b) => a + Math.pow(b - meanSlope, 2), 0) / (slopeDeltas.length || 1);

        // Analyze Left/Right end characteristics
        const thick0 = p0.thick;
        const thickW = pW.thick;
        const dropLeft = Math.abs(p25.topY - p0.topY);
        const dropRight = Math.abs(pW.topY - pW_25.topY);

        // Flat cut check:
        // A flat cut end occurs if the snow ends abruptly with large thickness at x=0 or x=W
        // (e.g. thick0 > 65% of thickMax or a vertical cliff wall).
        // Soft rounded rollover has thick0 and thickW tapering softly to ~1-2.5px, conforming to corner.
        const isScreenEdge = card.id === 'footer-bar' || card.className.includes('footer-bar');
        const isFlatCutWall = !isScreenEdge && thickMax > 5 && (thick0 > thickMax * 0.65 || thickW > thickMax * 0.65);
        const isSoftRollover = (thick0 <= 3.5 || isScreenEdge) && (thickW <= 3.5 || isScreenEdge);

        // Dumbbell shape check: ends thicker than center/max
        const isDumbbell = (thick0 > thickMax + 0.5) || (thickW > thickMax + 0.5) || (thick0 > pMid.thick + 4 && thickW > pMid.thick + 4);

        // Asymmetry evaluation
        const peakRatio = peakX / (W || 1);
        const asymmetryScore = Math.abs(dropLeft - dropRight) + Math.abs(pQ1.thick - pQ3.thick);

        // Card tag/name identification
        const tagName = card.tagName.toLowerCase();
        let name = card.className.split(' ').filter(c => !c.startsWith('card-snow')).join('.');
        if (card.id) name += `#${card.id}`;
        const headerText = card.querySelector('h1, h2, h3, .article-title, .card-widget-title, .item-headline')?.textContent?.trim() || '';

        cardResults.push({
          idx,
          name: name.substring(0, 40),
          headerText: headerText.substring(0, 30),
          seed,
          archetype,
          W: Math.round(W),
          H_card: Math.round(cardRect.height),
          borderRadius,
          thick0: Number(thick0.toFixed(2)),
          thick2: Number(p2.thick.toFixed(2)),
          thick5: Number(p5.thick.toFixed(2)),
          thick25: Number(p25.thick.toFixed(2)),
          thickMid: Number(pMid.thick.toFixed(2)),
          thickW_25: Number(pW_25.thick.toFixed(2)),
          thickW_5: Number(pW_5.thick.toFixed(2)),
          thickW: Number(thickW.toFixed(2)),
          thickMax: Number(thickMax.toFixed(2)),
          peakRatio: Number(peakRatio.toFixed(3)),
          dropLeft: Number(dropLeft.toFixed(2)),
          dropRight: Number(dropRight.toFixed(2)),
          slopeVariance: Number(slopeVariance.toFixed(4)),
          isFlatCutWall,
          isSoftRollover,
          isDumbbell,
          asymmetryScore: Number(asymmetryScore.toFixed(2)),
          svgBounds: {
            left: Number(svgRect.left.toFixed(1)),
            right: Number(svgRect.right.toFixed(1)),
            width: Number(svgRect.width.toFixed(1))
          },
          cardBounds: {
            left: Number(cardRect.left.toFixed(1)),
            right: Number(cardRect.right.toFixed(1)),
            width: Number(cardRect.width.toFixed(1))
          }
        });
      });

      // Adjacent card gap analysis
      const horizontalPairs = [];
      for (let i = 0; i < cards.length; i++) {
        for (let j = 0; j < cards.length; j++) {
          if (i === j) continue;
          const rA = cards[i].getBoundingClientRect();
          const rB = cards[j].getBoundingClientRect();
          const svgA = cards[i].querySelector('.card-snow-svg')?.getBoundingClientRect();
          const svgB = cards[j].querySelector('.card-snow-svg')?.getBoundingClientRect();

          // Check if horizontally adjacent on the same visual tier (vertical overlap > 50%)
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
        cardResults,
        horizontalPairs
      };
    });

    console.log(`[Snow Mantles Detected]: ${auditData.cardResults.length} components`);
    console.log(`[Adjacent Horizontal Pairs]: ${auditData.horizontalPairs.length} pairs`);

    // Dynamic Interaction 1: Hover translateY Tracking
    console.log(`\n[Dynamic Test 1]: Mouse Hover Transform & Snow Mantle Tracking...`);
    const hoverResults = [];
    const hoverableCards = await page.$$('.recent-post-item, .categoryItem');
    for (let h = 0; h < Math.min(3, hoverableCards.length); h++) {
      const cardHandle = hoverableCards[h];
      const beforeState = await cardHandle.evaluate(el => {
        const svg = el.querySelector('.card-snow-svg');
        const cRect = el.getBoundingClientRect();
        const sRect = svg ? svg.getBoundingClientRect() : null;
        return {
          cTop: cRect.top,
          sTop: sRect ? sRect.top : null,
          cLeft: cRect.left,
          sLeft: sRect ? sRect.left : null
        };
      });

      await cardHandle.hover({ force: true });
      await page.waitForTimeout(400);

      const afterState = await cardHandle.evaluate(el => {
        const svg = el.querySelector('.card-snow-svg');
        const cRect = el.getBoundingClientRect();
        const sRect = svg ? svg.getBoundingClientRect() : null;
        const transform = window.getComputedStyle(el).transform;
        return {
          cTop: cRect.top,
          sTop: sRect ? sRect.top : null,
          cLeft: cRect.left,
          sLeft: sRect ? sRect.left : null,
          transform
        };
      });

      // Move mouse away to reset
      await page.mouse.move(0, 0);
      await page.waitForTimeout(200);

      const cardDeltaY = afterState.cTop - beforeState.cTop;
      const svgDeltaY = afterState.sTop - beforeState.sTop;
      const drift = Math.abs(cardDeltaY - svgDeltaY);

      hoverResults.push({
        index: h,
        transform: afterState.transform,
        cardDeltaY: Number(cardDeltaY.toFixed(2)),
        svgDeltaY: Number(svgDeltaY.toFixed(2)),
        drift: Number(drift.toFixed(2)),
        synced: drift < 1.0
      });
    }

    // Dynamic Interaction 2: Scroll Stability & ResizeObserver Tracking
    console.log(`[Dynamic Test 2]: Page Scroll Stability & Attachment Check...`);
    const scrollBefore = await page.evaluate(() => {
      const card = document.querySelector('.recent-post-item, #aside-content .card-widget');
      if (!card) return null;
      const svg = card.querySelector('.card-snow-svg');
      return {
        cardTop: card.getBoundingClientRect().top,
        svgTop: svg?.getBoundingClientRect().top
      };
    });

    await page.evaluate(() => window.scrollBy(0, 450));
    await page.waitForTimeout(400);

    const scrollAfter = await page.evaluate(() => {
      const card = document.querySelector('.recent-post-item, #aside-content .card-widget');
      if (!card) return null;
      const svg = card.querySelector('.card-snow-svg');
      return {
        cardTop: card.getBoundingClientRect().top,
        svgTop: svg?.getBoundingClientRect().top
      };
    });

    const scrollSynced = (scrollBefore && scrollAfter)
      ? Math.abs((scrollAfter.cardTop - scrollBefore.cardTop) - (scrollAfter.svgTop - scrollBefore.svgTop)) < 1.0
      : true;

    // React 19 Hydration and Console Errors Check
    const hydrationErrors = consoleErrors.filter(e =>
      e.includes('Minified React error #418') ||
      e.includes('Hydration failed') ||
      e.includes('did not match') ||
      e.includes('React error')
    );

    fullReport.push({
      target: target.name,
      url: target.url,
      bgAttr,
      cardsAudited: auditData.cardResults.length,
      cardDetails: auditData.cardResults,
      adjacentPairs: auditData.horizontalPairs,
      hoverResults,
      scrollSynced,
      consoleErrorsCount: consoleErrors.length,
      consoleErrors,
      hydrationErrorsCount: hydrationErrors.length,
      hydrationErrors,
      pageErrorsCount: pageErrors.length,
      pageErrors
    });
  }

  await browser.close();

  console.log("\n================================================================================");
  console.log("📊 AUDIT RESULTS SUMMARY & STATISTICAL BREAKDOWN");
  console.log("================================================================================\n");

  for (const rep of fullReport) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`📌 PAGE: ${rep.target}`);
    console.log(`------------------------------------------------------------`);
    console.log(`• Cards with Snow Mantle: ${rep.cardsAudited}`);
    console.log(`• Console Fatal Errors:   ${rep.consoleErrorsCount}`);
    console.log(`• Hydration Errors (#418): ${rep.hydrationErrorsCount}`);
    console.log(`• Page Errors:            ${rep.pageErrorsCount}`);

    let flatCutCount = 0;
    let softRolloverCount = 0;
    let dumbbellCount = 0;
    let asymmetricCount = 0;

    rep.cardDetails.forEach(c => {
      if (c.isFlatCutWall) flatCutCount++;
      if (c.isSoftRollover) softRolloverCount++;
      if (c.isDumbbell) dumbbellCount++;
      if (c.asymmetryScore > 0.5) asymmetricCount++;

      console.log(`\n  [Card #${c.idx}] ${c.name} | Archetype: ${c.archetype} | W=${c.W}px, H=${c.H_card}px, Rad=${c.borderRadius}`);
      console.log(`    Thickness Profile: tip0=${c.thick0}px, x5=${c.thick5}px, x25=${c.thick25}px, mid=${c.thickMid}px, W-25=${c.thickW_25}px, W-5=${c.thickW_5}px, tipW=${c.thickW}px, max=${c.thickMax}px`);
      console.log(`    Left/Right Slope: dropL=${c.dropLeft}px, dropR=${c.dropRight}px | PeakRatio=${c.peakRatio} | AsymScore=${c.asymmetryScore}`);
      console.log(`    Shape Quality: FlatCutWall=${c.isFlatCutWall ? '❌ YES' : '✅ NO'} | SoftRollover=${c.isSoftRollover ? '✅ YES' : '❌ NO'} | Dumbbell=${c.isDumbbell ? '❌ YES' : '✅ NO'}`);
    });

    console.log(`\n  ▶ Summary Metrics for ${rep.target}:`);
    console.log(`    - Flat Cut Wall Violations:   ${flatCutCount} / ${rep.cardsAudited}`);
    console.log(`    - Soft Rollover Compliance:   ${softRolloverCount} / ${rep.cardsAudited}`);
    console.log(`    - Dumbbell Anomalies:         ${dumbbellCount} / ${rep.cardsAudited}`);
    console.log(`    - Organic Asymmetry Verified: ${asymmetricCount} / ${rep.cardsAudited}`);

    console.log(`\n  ▶ Adjacent Horizontal Card Pairs (Gap Preservation):`);
    if (rep.adjacentPairs.length === 0) {
      console.log(`    - No adjacent horizontal cards detected on this viewport.`);
    } else {
      rep.adjacentPairs.forEach((pair, pIdx) => {
        console.log(`    - Pair #${pIdx + 1}: ${pair.cardA} <--> ${pair.cardB} | CardGap=${pair.cardGap}px, SnowGap=${pair.snowGap}px | ZeroBleed=${pair.isZeroBleed ? '✅ PASS' : '❌ BLEED'}`);
      });
    }

    console.log(`\n  ▶ Dynamic Hover Synchronization:`);
    rep.hoverResults.forEach(hr => {
      console.log(`    - Item #${hr.index}: CardMoveY=${hr.cardDeltaY}px, SnowMoveY=${hr.svgDeltaY}px (drift=${hr.drift}px) => ${hr.synced ? '✅ 100% Synced' : '❌ Desynced'}`);
    });

    console.log(`\n  ▶ Dynamic Scroll Stability: ${rep.scrollSynced ? '✅ 100% Synced' : '❌ Desynced'}`);
  }

  return fullReport;
}

auditSnowSystem().catch(err => {
  console.error("Audit Execution Error:", err);
  process.exit(1);
});
