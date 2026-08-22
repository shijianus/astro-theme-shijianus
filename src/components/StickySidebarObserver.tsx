import { useEffect } from 'react';

type StickySidebarObserverProps = {
  pageType?: string;
};

type StickyTarget = {
  boundary: HTMLElement;
  card: HTMLElement;
  minHeight: number;
};

type StickyState = 'static' | 'entering' | 'reading' | 'leaving';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function resolveHeaderOffset() {
  const storedHeight = Number.parseFloat(
    document.documentElement.style.getPropertyValue('--site-header-height') ||
      window.getComputedStyle(document.documentElement).getPropertyValue('--site-header-height') ||
      '0',
  );
  const header = document.getElementById('page-header');
  const headerHeight = storedHeight || header?.getBoundingClientRect().height || 60;
  return Math.round(headerHeight + 14);
}

function resolveTargets(pageType: string) {
  const targets: StickyTarget[] = [];

  if (pageType === 'home') {
    const boundary = document.querySelector<HTMLElement>('body[data-type="home"] #recent-posts') ?? document.querySelector<HTMLElement>('body[data-type="home"] #home-pagination');
    const card = document.querySelector<HTMLElement>('body[data-type="home"] .card-feature-panel--overview');

    if (boundary && card) {
      targets.push({
        boundary,
        card,
        minHeight: 420,
      });
    }
  }

  if (pageType === 'post') {
    const tocBoundary =
      document.querySelector<HTMLElement>('#article-container') ??
      document.querySelector<HTMLElement>('#post') ??
      document.querySelector<HTMLElement>('.page-main');
    const stickyLayout = document.querySelector<HTMLElement>('#aside-content .sticky_layout');

    if (tocBoundary && stickyLayout) {
      targets.push({
        boundary: tocBoundary,
        card: stickyLayout,
        minHeight: 280,
      });
    }
  }

  return targets;
}

function syncScrollableOverflow(root: HTMLElement) {
  const stickyState = (root.dataset.stickyState as StickyState | undefined) ?? 'static';
  const allowTopFade = stickyState === 'reading';
  const allowBottomFade = stickyState === 'reading' || stickyState === 'leaving';
  const surfaces = root.querySelectorAll<HTMLElement>('.toc-content, .aside-list');
  surfaces.forEach((surface) => {
    const hasOverflow = surface.scrollHeight - surface.clientHeight > 6;
    const atTop = surface.scrollTop <= 4;
    const atBottom = surface.scrollTop + surface.clientHeight >= surface.scrollHeight - 4;
    surface.dataset.overflowTop = hasOverflow && allowTopFade && !atTop ? 'true' : 'false';
    surface.dataset.overflowBottom = hasOverflow && allowBottomFade && !atBottom ? 'true' : 'false';
  });
}

export function StickySidebarObserver({ pageType = 'page' }: StickySidebarObserverProps) {
  useEffect(() => {
    if (!['home', 'post'].includes(pageType)) return;

    const targets = resolveTargets(pageType);
    if (targets.length === 0) return;

    let frame = 0;
    const cleanupCallbacks: Array<() => void> = [];
    const resizeObserver = new ResizeObserver(() => scheduleUpdate());
    const mediaLoadTargets = new Set<EventTarget>();

    const bindScrollableSurface = (card: HTMLElement) => {
      const surfaces = Array.from(card.querySelectorAll<HTMLElement>('.toc-content, .aside-list'));
      surfaces.forEach((surface) => {
        if (surface.dataset.scrollObserverBound === 'true') return;
        surface.dataset.scrollObserverBound = 'true';
        const onScroll = () => syncScrollableOverflow(card);
        surface.addEventListener('scroll', onScroll, { passive: true });
        cleanupCallbacks.push(() => {
          surface.removeEventListener('scroll', onScroll);
          delete surface.dataset.scrollObserverBound;
        });
      });
    };

    const bindMediaUpdates = (boundary: HTMLElement) => {
      boundary.querySelectorAll('img, video, iframe').forEach((media) => {
        if (!(media instanceof HTMLElement)) return;
        if (mediaLoadTargets.has(media)) return;
        mediaLoadTargets.add(media);
        media.addEventListener('load', scheduleUpdate, { passive: true });
        media.addEventListener('loadedmetadata', scheduleUpdate, { passive: true });
        media.addEventListener('error', scheduleUpdate, { passive: true });
        cleanupCallbacks.push(() => {
          media.removeEventListener('load', scheduleUpdate);
          media.removeEventListener('loadedmetadata', scheduleUpdate);
          media.removeEventListener('error', scheduleUpdate);
          mediaLoadTargets.delete(media);
        });
      });
    };

    const update = () => {
      // 1. Gather all Reads (Batch Reads)
      const topOffset = resolveHeaderOffset();
      const viewportBottomInset = 14;
      const viewportHeight = Math.max(320, window.innerHeight - topOffset - viewportBottomInset);
      
      const isMobile = window.matchMedia('(max-width: 1199px)').matches;
      
      const targetStates = targets.map(({ boundary, card, minHeight }) => {
        if (isMobile) return { card, boundary, isMobile: true, boundaryHeight: 0, contentHeight: 0, minHeight, beforePinDistance: 0, remainingAfterPin: 0, surfaceData: [] };

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
          boundary,
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
      document.documentElement.style.setProperty('--sticky-column-top', `${topOffset}px`);

      targetStates.forEach(state => {
        const { card, boundary, isMobile } = state;
        if (isMobile) {
          card.style.removeProperty('--sticky-card-height');
          card.style.transform = 'none';
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

        const hasEnoughBoundary = boundaryHeight > Math.max(200, minHeight * 0.72);
        let stickyState = 'reading';

        if (!hasEnoughBoundary) {
          stickyState = 'static';
          card.style.transform = 'none';
        } else if (beforePinDistance > 0) {
          stickyState = 'entering';
          card.style.transform = 'none';
        } else if (remainingAfterPin < contentHeight) {
          stickyState = 'leaving';
          const offset = Math.round(remainingAfterPin - contentHeight);
          card.style.transform = `translateY(${offset}px)`;
        } else {
          stickyState = 'reading';
          card.style.transform = 'none';
        }

        card.dataset.stickyState = stickyState;
        card.classList.toggle('is-static-layout', stickyState === 'static');
        card.classList.toggle('is-sticky-active', stickyState === 'reading' || stickyState === 'leaving');

        // Update reading progress bar and percentage
        if (pageType === 'post' && boundaryHeight > 0) {
          const totalScrollable = Math.max(1, boundaryHeight - window.innerHeight);
          const currentProgress = clamp(Math.round((-beforePinDistance / totalScrollable) * 100), 0, 100);
          const percentEl = document.querySelector<HTMLElement>('#card-toc .toc-percentage');
          const progressBar = document.querySelector<HTMLElement>('#card-toc .toc-progress__bar');
          if (percentEl) percentEl.textContent = `${currentProgress}%`;
          if (progressBar) progressBar.style.width = `${currentProgress}%`;
        }

        // Apply surface writes
        const allowTopFade = stickyState === 'reading';
        const allowBottomFade = stickyState === 'reading' || stickyState === 'leaving';
        surfaceData.forEach(({ surface, hasOverflow, atTop, atBottom }) => {
          surface.dataset.overflowTop = hasOverflow && allowTopFade && !atTop ? 'true' : 'false';
          surface.dataset.overflowBottom = hasOverflow && allowBottomFade && !atBottom ? 'true' : 'false';
        });
      });
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    targets.forEach(({ boundary, card }) => {
      bindScrollableSurface(card);
      bindMediaUpdates(boundary);
      resizeObserver.observe(boundary);
    });

    update();
    window.addEventListener('load', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('load', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      cleanupCallbacks.forEach((callback) => callback());
    };
  }, [pageType]);

  return null;
}
