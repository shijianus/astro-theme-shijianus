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
    const card = document.querySelector<HTMLElement>('body[data-type="home"] .sticky_layout--utility');

    if (boundary && card) {
      targets.push({
        boundary,
        card,
        minHeight: 480,
      });
    }
  }

  if (pageType === 'post') {
    const tocBoundary =
      document.querySelector<HTMLElement>('.post-layout-row--article #article-container') ??
      document.querySelector<HTMLElement>('.post-layout-row--article .post-layout-row__main') ??
      document.querySelector<HTMLElement>('.page-main');
    const tocCard = document.querySelector<HTMLElement>('#post-toc-aside #card-toc');

    if (tocBoundary && tocCard) {
      targets.push({
        boundary: tocBoundary,
        card: tocCard,
        minHeight: 360,
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

    const updateTarget = ({ boundary, card, minHeight }: StickyTarget) => {
      const topOffset = resolveHeaderOffset();
      const viewportBottomInset = 14;
      const viewportHeight = Math.max(320, window.innerHeight - topOffset - viewportBottomInset);
      const boundaryRect = boundary.getBoundingClientRect();
      const boundaryHeight = Math.max(boundary.offsetHeight, boundary.scrollHeight, 220);
      const contentHeight = Math.max(card.scrollHeight, card.offsetHeight, minHeight);
      const beforePinDistance = boundaryRect.top - topOffset;
      const remainingAfterPin = boundaryRect.bottom - topOffset;
      const stickyHeight = Math.min(viewportHeight, Math.max(minHeight, contentHeight));
      const staticHeight = Math.min(boundaryHeight, Math.max(minHeight, contentHeight));
      const hasEnoughBoundary = boundaryHeight > Math.max(200, minHeight * 0.72);

      let stickyState: StickyState = 'reading';
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

      card.style.setProperty('--sticky-card-height', `${Math.round(computedHeight)}px`);
      card.dataset.stickyState = stickyState;
      card.dataset.stickyFull = isFullyPinned ? 'true' : 'false';
      card.classList.toggle('is-static-layout', stickyState === 'static');
      card.classList.toggle('is-sticky-active', stickyState === 'reading' || stickyState === 'leaving');
      syncScrollableOverflow(card);
    };

    const update = () => {
      const topOffset = resolveHeaderOffset();
      document.documentElement.style.setProperty('--sticky-column-top', `${topOffset}px`);

      if (window.matchMedia('(max-width: 1199px)').matches) {
        targets.forEach(({ card }) => {
          card.style.removeProperty('--sticky-card-height');
          card.dataset.stickyState = 'static';
          card.classList.remove('is-sticky-active');
          card.classList.add('is-static-layout');
          syncScrollableOverflow(card);
        });
        return;
      }

      targets.forEach(updateTarget);
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
