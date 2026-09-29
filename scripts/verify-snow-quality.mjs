import { chromium } from 'playwright';
import assert from 'assert';

async function runAudit() {
  console.log("========================================");
  console.log("🏔️ Snow Mantle E2E Audit Report");
  console.log("========================================\n");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(err));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  const baseUrl = process.env.AUDIT_HOST || 'https://blog.epocanvas.com';
  const urls = [
    `${baseUrl}/`,
    `${baseUrl}/posts/markdown-syntax-mastery/`
  ];

  for (const url of urls) {
    console.log(`\n▶️ Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Ensure snow background is active
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-background', 'snow');
      window.dispatchEvent(new Event('resize'));
    });
    await page.waitForTimeout(2000);

    // Hover test
    console.log(`[Interaction] Simulating hover on cards...`);
    const cardsToHover = await page.$$('.recent-post-item');
    if (cardsToHover.length > 0) {
      try {
        await cardsToHover[0].hover({ force: true });
        await page.waitForTimeout(500);
      } catch(e) {
        console.log(`Hover failed: ${e.message}`);
      }
    }

    const cardStats = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.recent-post-item, #aside-content .card-widget, .categoryItem'));
      const results = [];

      cards.forEach((card, idx) => {
        const svg = card.querySelector('.card-snow-svg');
        const path = card.querySelector('.card-snow-svg path');
        if (!svg || !path) return;

        const rect = card.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        
        // Ensure SVG is constrained within card horizontal bounds
        const isHorizontalConstrained = (svgRect.left >= rect.left - 2) && (svgRect.right <= rect.right + 2);

        // Find top edge Y at given X using SVG isPointInFill
        // The snow path is filled, so we can scan from Y=svgRect.top to svgRect.bottom
        // Actually, we can use the SVG owner document point
        const pt = svg.createSVGPoint();
        const viewBox = svg.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, svgRect.width, svgRect.height];
        const vW = viewBox[2];
        const vH = viewBox[3];

        function getTopYAtX(localX) {
          pt.x = Math.max(0.5, Math.min(vW - 0.5, (localX / Math.max(1, svgRect.width)) * vW));
          for (let y = 0; y <= vH; y += 0.5) {
            pt.y = y;
            if (path.isPointInFill(pt)) {
              return (y / Math.max(1, vH)) * svgRect.height;
            }
          }
          return svgRect.height;
        }

        const W = svgRect.width;
        // Sample points
        const y0 = getTopYAtX(0);
        const y10 = getTopYAtX(10);
        const y20 = getTopYAtX(20);
        const yMid = getTopYAtX(W / 2);
        const yW_20 = getTopYAtX(W - 20);
        const yW_10 = getTopYAtX(W - 10);
        const yW = getTopYAtX(W);

        // Calculate slopes (dy/dx) at edges
        // left edge slope: (y20 - y0) / 20
        // right edge slope: (yW - yW_20) / 20
        const slopeLeft = (y20 - y0) / 20;
        const slopeRight = (yW - yW_20) / 20; // yW is rightmost, so (yW - yW_20)/20. If it dips down, yW > yW_20, slope > 0.
        // Wait, typical "steep drop" means Y increases rapidly at the edges.
        // So y0 is large, y20 is small. slopeLeft = (small - large)/20 < 0, meaning it drops from the center.
        // Let's just calculate absolute drop:
        const dropLeft = Math.abs(y20 - y0);
        const dropRight = Math.abs(yW - yW_20);

        // Determine morphology
        // Thickness is roughly (height - Y)
        const thick0 = svgRect.height - y0;
        const thickMid = svgRect.height - yMid;
        const thickW = svgRect.height - yW;

        let morphology = 'unknown';
        if (Math.abs(thick0 - thickMid) < 10 && Math.abs(thickW - thickMid) < 10) {
          morphology = 'level-blanket';
        } else if (thickMid > thick0 + 10 && thickMid > thickW + 10) {
          morphology = 'center-thick';
        } else if (Math.abs(thick0 - thickW) > 15) {
          morphology = 'windswept';
        }

        const isFooterOrBar = card.id === 'footer-bar' || card.className.includes('footer-bar');
        const isFlatCutEnd = !isFooterOrBar && (thick0 >= thickMid * 0.88 && thickW >= thickMid * 0.88);
        const hasOrganicAsymmetry = Math.abs(thick0 - thickW) > 0.3 || Math.abs(dropLeft - dropRight) > 0.3;

        results.push({
          className: card.className,
          W,
          y0, y20, yMid, yW_20, yW,
          dropLeft, dropRight,
          thick0, thickMid, thickW,
          morphology,
          isHorizontalConstrained,
          isFlatCutEnd,
          hasOrganicAsymmetry,
          isDumbbell: (thick0 > thickMid + 10 && thickW > thickMid + 10)
        });
      });

      // Gap preservation check
      let gapPreserved = true;
      let minGap = 999;
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const r1 = cards[i].getBoundingClientRect();
          const r2 = cards[j].getBoundingClientRect();
          // Check if horizontally adjacent
          if (r1.bottom > r2.top && r1.top < r2.bottom) { // vertically overlapping
            if (r1.right < r2.left) {
              const gap = r2.left - r1.right;
              if (gap > 0 && gap < minGap) minGap = gap;
            } else if (r2.right < r1.left) {
              const gap = r1.left - r2.right;
              if (gap > 0 && gap < minGap) minGap = gap;
            }
          }
        }
      }

      return { results, minGap };
    });

    console.log(`[Gap Preservation] Min horizontal gap between adjacent cards: ${cardStats.minGap === 999 ? 'N/A' : cardStats.minGap + 'px'}`);
    if (cardStats.minGap !== 999 && cardStats.minGap < 5) {
      console.log(`❌ FAILED: Gap is too small (<5px), cards might be bleeding into each other!`);
    } else {
      console.log(`✅ PASSED: Horizontal gaps preserved.`);
    }

    let failCount = 0;
    const morphCounts = {};
    for (const stat of cardStats.results) {
      morphCounts[stat.morphology] = (morphCounts[stat.morphology] || 0) + 1;
      
      let hasSteepDrop = stat.dropLeft > 15 || stat.dropRight > 15;
      if (hasSteepDrop || stat.isDumbbell || !stat.isHorizontalConstrained || stat.isFlatCutEnd) {
        failCount++;
        console.log(`  ❌ Violating Card (${stat.className.substring(0,25)}): W=${Math.round(stat.W)}`);
        if (hasSteepDrop) console.log(`     -> Steep drop detected: LeftDrop=${Math.round(stat.dropLeft)}px, RightDrop=${Math.round(stat.dropRight)}px`);
        if (stat.isDumbbell) console.log(`     -> Dumbbell shape detected! Thick0=${Math.round(stat.thick0)}, Mid=${Math.round(stat.thickMid)}, W=${Math.round(stat.thickW)}`);
        if (stat.isFlatCutEnd) console.log(`     -> Flat cut end detected! Thick0=${Math.round(stat.thick0)}, Mid=${Math.round(stat.thickMid)}, W=${Math.round(stat.thickW)}`);
        if (!stat.isHorizontalConstrained) console.log(`     -> SVG overflows horizontal card bounds!`);
      }
    }

    console.log(`[Morphology Diversity] Distributions:`);
    for (const [k, v] of Object.entries(morphCounts)) {
      console.log(`   - ${k}: ${v} cards`);
    }

    if (failCount === 0 && cardStats.results.length > 0) {
      console.log(`✅ PASSED: No flat cut ends, no steep corner cliffs, no dumbbells. All SVGs constrained with organic rollover.`);
    }
  }

  console.log(`\n[Console Errors] Total fatal errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log(`❌ FAILED: Found console errors:`);
    errors.forEach(e => console.log(`   ${e}`));
  } else {
    console.log(`✅ PASSED: 0 Console Errors.`);
  }

  await browser.close();
}

runAudit().catch(console.error);
