import { useEffect } from 'react';

type StickySidebarObserverProps = {
  pageType?: string;
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

function syncScrollableOverflow(root: HTMLElement) {
  const surfaces = root.querySelectorAll<HTMLElement>('.toc-content, .aside-list');
  surfaces.forEach((surface) => {
    const hasOverflow = surface.scrollHeight - surface.clientHeight > 6;
    const atTop = surface.scrollTop <= 4;
    const atBottom = surface.scrollTop + surface.clientHeight >= surface.scrollHeight - 4;
    surface.dataset.overflowTop = hasOverflow && !atTop ? 'true' : 'false';
    surface.dataset.overflowBottom = hasOverflow && !atBottom ? 'true' : 'false';
  });
}

export function StickySidebarObserver({ pageType = 'page' }: StickySidebarObserverProps) {
  useEffect(() => {
    if (!['home', 'post'].includes(pageType)) return;

    let frame = 0;
    const cleanupCallbacks: Array<() => void> = [];
    const resizeObserver = new ResizeObserver(() => scheduleUpdate());

    const updateHomeSticky = (topOffset: number, isMobile: boolean) => {
      const boundary =
        document.querySelector<HTMLElement>('body[data-type="home"] #recent-posts') ??
        document.querySelector<HTMLElement>('body[data-type="home"] #home-pagination');
      const card = document.querySelector<HTMLElement>('body[data-type="home"] .card-feature-panel--overview');

      if (!boundary || !card) return;

      if (isMobile) {
        card.style.transform = 'none';
        card.dataset.stickyState = 'static';
        card.classList.remove('is-sticky-active');
        card.classList.add('is-static-layout');
        return;
      }

      const boundaryRect = boundary.getBoundingClientRect();
      const contentHeight = Math.max(card.scrollHeight, card.offsetHeight, 420);
      const beforePinDistance = boundaryRect.top - topOffset;
      const remainingAfterPin = boundaryRect.bottom - topOffset;

      let stickyState: StickyState = 'reading';
      if (beforePinDistance > 0) {
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
      syncScrollableOverflow(card);
    };

    const updatePostSticky = (topOffset: number, isMobile: boolean) => {
      const aside = document.getElementById('aside-content');
      const articleContainer = document.getElementById('article-container');
      const postCopyright = document.querySelector<HTMLElement>('.post-copyright-block') ?? document.querySelector<HTMLElement>('.post-copyright');
      const postShell = document.getElementById('post') ?? document.querySelector<HTMLElement>('.post-page-shell');
      const track1 = document.getElementById('post-toc-track');
      const track2 = document.getElementById('post-secondary-track');
      const cardToc = document.getElementById('card-toc');

      if (!aside) return;

      if (isMobile) {
        if (track1) {
          track1.style.transform = 'none';
          track1.style.visibility = 'visible';
          track1.style.opacity = '1';
        }
        if (track2) {
          track2.style.transform = 'none';
          track2.style.visibility = 'visible';
          track2.style.opacity = '1';
        }
        return;
      }

      const viewportHeight = Math.max(320, window.innerHeight - topOffset);

      // Dynamic compact TOC check
      if (cardToc) {
        const tocListEl = cardToc.querySelector<HTMLElement>('.toc-list');
        const tocListHeight = tocListEl ? tocListEl.scrollHeight : (cardToc.scrollHeight - 60);
        const isCompact = tocListHeight <= viewportHeight * 0.45;
        aside.dataset.tocCompact = isCompact ? 'true' : 'false';
      }

      // Reading progress percentage & progress bar
      if (articleContainer) {
        const articleRect = articleContainer.getBoundingClientRect();
        const totalScrollable = Math.max(1, articleRect.height - viewportHeight * 0.7);
        const scrolled = topOffset - articleRect.top;
        const currentProgress = clamp(Math.round((scrolled / totalScrollable) * 100), 0, 100);
        const percentEl = document.querySelector<HTMLElement>('#card-toc .toc-percentage');
        const progressBar = document.querySelector<HTMLElement>('#card-toc .toc-progress__bar');
        if (percentEl) percentEl.textContent = `${currentProgress}%`;
        if (progressBar) progressBar.style.width = `${currentProgress}%`;
      }

      const copyrightTop = postCopyright
        ? postCopyright.getBoundingClientRect().top
        : (articleContainer ? articleContainer.getBoundingClientRect().bottom : 999999);

      const postBottom = postShell
        ? postShell.getBoundingClientRect().bottom
        : (articleContainer ? articleContainer.getBoundingClientRect().bottom : 999999);

      // 1. Manage Track 1 (TOC Track)
      if (track1) {
        const track1Height = track1.offsetHeight;
        const remainingBeforeCopyright = copyrightTop - topOffset - 16;

        if (remainingBeforeCopyright < track1Height) {
          // Unpinning upwards above copyright
          const offset1 = Math.round(remainingBeforeCopyright - track1Height);
          track1.style.transform = `translateY(${offset1}px)`;
          if (offset1 <= -track1Height - 20) {
            track1.style.visibility = 'hidden';
            track1.style.opacity = '0';
            track1.style.pointerEvents = 'none';
          } else {
            track1.style.visibility = 'visible';
            track1.style.opacity = '1';
            track1.style.pointerEvents = 'auto';
          }
        } else {
          // Active in article reading zone
          track1.style.transform = 'none';
          track1.style.visibility = 'visible';
          track1.style.opacity = '1';
          track1.style.pointerEvents = 'auto';
        }
        syncScrollableOverflow(track1);
      }

      // 2. Manage Track 2 (Secondary Track: Recent Posts -> Telegram -> Categories)
      if (track2) {
        const track2Height = track2.offsetHeight;

        if (track1) {
          const track1Height = track1.offsetHeight;

          if (isCompact) {
            // Short TOC Mode: Track 2 is attracted directly beneath Track 1 during article reading!
            if (copyrightTop > topOffset + track1Height + 16) {
              // Reading article: Track 2 sits directly below Track 1
              track2.style.transform = `translateY(${track1Height + 16}px)`;
              track2.style.visibility = 'visible';
              track2.style.opacity = '1';
              track2.style.pointerEvents = 'auto';
            } else if (copyrightTop > topOffset) {
              // Transitioning at copyright: Track 2 smoothly follows copyright up into topOffset
              const offset2 = Math.round(copyrightTop - topOffset);
              track2.style.transform = `translateY(${offset2}px)`;
              track2.style.visibility = 'visible';
              track2.style.opacity = '1';
              track2.style.pointerEvents = 'auto';
            } else {
              // Reached copyright & beyond: Track 2 is pinned at topOffset!
              track2.style.visibility = 'visible';
              track2.style.opacity = '1';
              track2.style.pointerEvents = 'auto';

              // Check final termination at #post end:
              const remainingBeforePostEnd = postBottom - topOffset - 16;
              if (remainingBeforePostEnd < track2Height) {
                const unpinOffset = Math.round(remainingBeforePostEnd - track2Height);
                track2.style.transform = `translateY(${unpinOffset}px)`;
              } else {
                track2.style.transform = 'none';
              }
            }
          } else {
            // Long TOC Mode: Track 2 starts at copyrightTop
            if (copyrightTop > topOffset) {
              const offset2 = Math.round(copyrightTop - topOffset);
              track2.style.transform = `translateY(${offset2}px)`;

              if (copyrightTop > window.innerHeight + 100) {
                track2.style.visibility = 'hidden';
                track2.style.opacity = '0';
                track2.style.pointerEvents = 'none';
              } else {
                track2.style.visibility = 'visible';
                track2.style.opacity = '1';
                track2.style.pointerEvents = 'auto';
              }
            } else {
              // Reached copyright & beyond: Track 2 is pinned at topOffset!
              track2.style.visibility = 'visible';
              track2.style.opacity = '1';
              track2.style.pointerEvents = 'auto';

              // Check final termination at #post end:
              const remainingBeforePostEnd = postBottom - topOffset - 16;
              if (remainingBeforePostEnd < track2Height) {
                const unpinOffset = Math.round(remainingBeforePostEnd - track2Height);
                track2.style.transform = `translateY(${unpinOffset}px)`;
              } else {
                track2.style.transform = 'none';
              }
            }
          }
        } else {
          // No TOC on post: Track 2 is active from the start
          track2.style.visibility = 'visible';
          track2.style.opacity = '1';
          track2.style.pointerEvents = 'auto';

          const remainingBeforePostEnd = postBottom - topOffset - 16;
          if (remainingBeforePostEnd < track2Height) {
            const unpinOffset = Math.round(remainingBeforePostEnd - track2Height);
            track2.style.transform = `translateY(${unpinOffset}px)`;
          } else {
            track2.style.transform = 'none';
          }
        }
        syncScrollableOverflow(track2);
      }
    };

    const update = () => {
      const topOffset = resolveHeaderOffset();
      const isMobile = window.matchMedia('(max-width: 1199px)').matches;
      document.documentElement.style.setProperty('--sticky-column-top', `${topOffset}px`);

      if (pageType === 'home') {
        updateHomeSticky(topOffset, isMobile);
      } else if (pageType === 'post') {
        updatePostSticky(topOffset, isMobile);
      }
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    // Observe key elements for resize
    const observeElements = () => {
      const elementsToObserve = [
        document.getElementById('article-container'),
        document.getElementById('post'),
        document.querySelector('.post-copyright-block'),
        document.getElementById('aside-content'),
        document.getElementById('recent-posts'),
      ].filter((el): el is HTMLElement => Boolean(el));

      elementsToObserve.forEach((el) => resizeObserver.observe(el));
    };

    observeElements();
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

