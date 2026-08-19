const fs = require('fs');
const file = 'src/components/StickySidebarObserver.tsx';
let code = fs.readFileSync(file, 'utf8');

// Modify update logic to batch reads and writes
const newUpdateTarget = `
    const update = () => {
      // 1. Gather all Reads (Batch Reads)
      const topOffset = resolveHeaderOffset();
      const viewportBottomInset = 14;
      const viewportHeight = Math.max(320, window.innerHeight - topOffset - viewportBottomInset);
      
      const isMobile = window.matchMedia('(max-width: 1199px)').matches;
      
      const targetStates = targets.map(({ boundary, card, minHeight }) => {
        if (isMobile) return { card, isMobile: true };

        const boundaryRect = boundary.getBoundingClientRect();
        const boundaryHeight = Math.max(boundary.offsetHeight, boundary.scrollHeight, 220);
        const contentHeight = Math.max(card.scrollHeight, card.offsetHeight, minHeight);
        const beforePinDistance = boundaryRect.top - topOffset;
        const remainingAfterPin = boundaryRect.bottom - topOffset;
        
        // Overflow reads
        const surfaces = Array.from(card.querySelectorAll<HTMLElement>('.toc-content, .aside-list'));
        const surfaceData = surfaces.map(surface => ({
          surface,
          hasOverflow: surface.scrollHeight - surface.clientHeight > 6,
          atTop: surface.scrollTop <= 4,
          atBottom: surface.scrollTop + surface.clientHeight >= surface.scrollHeight - 4
        }));

        return {
          card,
          isMobile: false,
          boundaryHeight,
          contentHeight,
          minHeight,
          beforePinDistance,
          remainingAfterPin,
          surfaceData
        };
      });

      // 2. Perform all Writes (Batch Writes)
      document.documentElement.style.setProperty('--sticky-column-top', \`\${topOffset}px\`);

      targetStates.forEach(state => {
        const { card, isMobile } = state;
        if (isMobile) {
          card.style.removeProperty('--sticky-card-height');
          card.dataset.stickyState = 'static';
          card.classList.remove('is-sticky-active');
          card.classList.add('is-static-layout');
          return;
        }

        const {
          boundaryHeight,
          contentHeight,
          minHeight,
          beforePinDistance,
          remainingAfterPin,
          surfaceData
        } = state;

        const stickyHeight = Math.min(viewportHeight, Math.max(minHeight, contentHeight));
        const staticHeight = Math.min(boundaryHeight, Math.max(minHeight, contentHeight));
        const hasEnoughBoundary = boundaryHeight > Math.max(200, minHeight * 0.72);

        let stickyState = 'reading';
        let computedHeight = stickyHeight;

        if (!hasEnoughBoundary) {
          stickyState = 'static';
          computedHeight = staticHeight;
        } else if (beforePinDistance > 0) {
          stickyState = 'entering';
          computedHeight = clamp(viewportHeight - beforePinDistance, 140, stickyHeight);
        } else if (remainingAfterPin < stickyHeight) {
          stickyState = 'leaving';
          computedHeight = clamp(remainingAfterPin, 140, stickyHeight);
        } else {
          stickyState = 'reading';
          computedHeight = stickyHeight;
        }

        const isFullyPinned = computedHeight >= stickyHeight - 3;
        if (stickyState !== 'static' && isFullyPinned && beforePinDistance <= 6 && remainingAfterPin >= stickyHeight - 3) {
          stickyState = 'reading';
        }

        card.style.setProperty('--sticky-card-height', \`\${Math.round(computedHeight)}px\`);
        card.dataset.stickyState = stickyState;
        card.dataset.stickyFull = isFullyPinned ? 'true' : 'false';
        card.classList.toggle('is-static-layout', stickyState === 'static');
        card.classList.toggle('is-sticky-active', stickyState === 'reading' || stickyState === 'leaving');

        // Apply surface writes
        const allowTopFade = stickyState === 'reading';
        const allowBottomFade = stickyState === 'reading' || stickyState === 'leaving';
        surfaceData.forEach(({ surface, hasOverflow, atTop, atBottom }) => {
          surface.dataset.overflowTop = hasOverflow && allowTopFade && !atTop ? 'true' : 'false';
          surface.dataset.overflowBottom = hasOverflow && allowBottomFade && !atBottom ? 'true' : 'false';
        });
      });
    };
`;

// Extract the original function to replace
const startIdx = code.indexOf('    const updateTarget =');
const endIdx = code.indexOf('    const scheduleUpdate =');

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + newUpdateTarget + code.substring(endIdx);
  fs.writeFileSync(file, code);
  console.log('Patched StickySidebarObserver.tsx');
} else {
  console.log('Could not find updateTarget boundaries');
}
