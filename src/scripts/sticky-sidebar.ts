function resolveHeaderOffset(): number {
  const stored = parseFloat(
    document.documentElement.style.getPropertyValue('--site-header-height') ||
      window.getComputedStyle(document.documentElement).getPropertyValue('--site-header-height') ||
      '0',
  );
  const header = document.getElementById('page-header');
  const headerHeight = stored || header?.getBoundingClientRect().height || 60;
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

function updateHomeSticky(topOffset: number, isMobile: boolean) {
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

  let stickyState = 'reading';
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
}

function updatePostSticky(topOffset: number, isMobile: boolean) {
  const aside = document.getElementById('aside-content');
  const post = document.getElementById('post');
  const articleContainer = document.getElementById('article-container');
  const copyrightBlock = document.querySelector<HTMLElement>('.post-copyright-block');
  const pageMain = document.querySelector<HTMLElement>('.page-main');
  const cardToc = document.getElementById('card-toc');
  
  const trackToc = document.getElementById('aside-track-toc');
  const stickyBoxToc = document.getElementById('aside-sticky-box-toc');
  const trackSupport = document.getElementById('aside-track-support');
  const stickyBoxSupport = document.getElementById('aside-sticky-box-support');

  if (!aside) return;

  if (isMobile) {
    if (trackToc) {
      trackToc.style.minHeight = '0px';
      trackToc.style.height = 'auto';
    }
    if (trackSupport) {
      trackSupport.style.minHeight = '0px';
      trackSupport.style.height = 'auto';
      trackSupport.style.marginTop = '0px';
    }
    return;
  }

  // Dynamic compact vs long TOC check
  let isCompact = false;
  if (cardToc) {
    const tocListEl = cardToc.querySelector<HTMLElement>('.toc-list');
    const tocItems = cardToc.querySelectorAll<HTMLElement>('.toc-item');
    isCompact = tocItems.length <= 6 || Boolean(tocListEl && tocListEl.scrollHeight < 260);
    aside.dataset.tocType = isCompact ? 'short' : 'long';
  }

  // Calculate track bounding constraints
  const docScrollY = window.scrollY;
  const mainEl = pageMain ?? post;
  
  if (mainEl && trackToc && trackSupport) {
    const mainRect = mainEl.getBoundingClientRect();
    const docMainBottom = mainRect.bottom + docScrollY;

    const copyrightRect = copyrightBlock?.getBoundingClientRect();
    const articleRect = articleContainer?.getBoundingClientRect();
    
    // docCopyrightTop is the top of .post-copyright-block (the termination line of TOC)
    const docCopyrightTop = copyrightRect
      ? (copyrightRect.top + docScrollY)
      : (articleRect ? (articleRect.bottom + docScrollY) : (docMainBottom - 500));

    const trackTocRect = trackToc.getBoundingClientRect();
    const docTrackTocTop = trackTocRect.top + docScrollY;

    const gap = 20;
    const minTocH = stickyBoxToc ? stickyBoxToc.offsetHeight : 150;
    const minSupH = stickyBoxSupport ? stickyBoxSupport.offsetHeight : 150;

    // The TOC sticky card sticks at topOffset; its bottom is at topOffset + minTocH.
    // We want support cards to become sticky exactly when the TOC card's BOTTOM edge
    // reaches the copyright block's top edge — i.e., when:
    //   viewport(tocBottom) = viewport(copyrightTop)
    //   topOffset + minTocH = copyrightTop_in_viewport
    //
    // For the support track's sticky trigger to fire at that same scroll position,
    // the support track's absolute top must be at:
    //   docSupportTrackTop = docCopyrightTop - minTocH
    //
    // Support track follows TOC track in DOM (no gap between tracks in layout).
    // TOC track ends at: docTrackTocTop + targetTocHeight = docCopyrightTop - gap + minTocH
    // So: marginTop = (docCopyrightTop - minTocH) - (docCopyrightTop - gap + minTocH)
    //               = gap - 2 * minTocH
    const targetTocHeight = Math.max(
      minTocH,
      Math.round(docCopyrightTop - docTrackTocTop - gap + minTocH),
    );

    // Support track height: from its start (docCopyrightTop - minTocH) to docMainBottom.
    const targetSupportHeight = Math.max(minSupH, Math.round(docMainBottom - docCopyrightTop + minTocH));

    trackToc.style.minHeight = `${targetTocHeight}px`;
    trackToc.style.height = `${targetTocHeight}px`;

    trackSupport.style.minHeight = `${targetSupportHeight}px`;
    trackSupport.style.height = `${targetSupportHeight}px`;
    // marginTop = gap - 2*minTocH: pulls support track up so its absolute top
    // lands at docCopyrightTop - minTocH (TOC-bottom-aligned trigger point).
    trackSupport.style.marginTop = `${gap - 2 * minTocH}px`;
  }

  // Reading progress percentage & progress bar
  if (articleContainer) {
    const articleRect = articleContainer.getBoundingClientRect();
    const totalScrollable = Math.max(1, articleRect.height - window.innerHeight * 0.7);
    const scrolled = topOffset - articleRect.top;
    const currentProgress = Math.min(100, Math.max(0, Math.round((scrolled / totalScrollable) * 100)));
    const percentEl = document.querySelector<HTMLElement>('#card-toc .toc-percentage');
    const progressBar = document.querySelector<HTMLElement>('#card-toc .toc-progress__bar');
    if (percentEl) percentEl.textContent = `${currentProgress}%`;
    if (progressBar) progressBar.style.width = `${currentProgress}%`;
  }
}

export function initStickySidebar() {
  let frame = 0;

  const update = () => {
    const pageType = document.body.getAttribute('data-type') || 'page';
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

  const resizeObserver = new ResizeObserver(() => scheduleUpdate());
  const elementsToObserve = [
    document.getElementById('article-container'),
    document.getElementById('post'),
    document.querySelector('.post-copyright-block'),
    document.querySelector('.page-main'),
    document.getElementById('aside-content'),
    document.getElementById('aside-sticky-box-toc'),
    document.getElementById('aside-sticky-box-support'),
    document.getElementById('recent-posts'),
  ].filter((el): el is HTMLElement => Boolean(el));

  elementsToObserve.forEach((el) => resizeObserver.observe(el));

  window.addEventListener('load', scheduleUpdate);
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  document.addEventListener('astro:page-load', scheduleUpdate);

  update();
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStickySidebar);
  } else {
    initStickySidebar();
  }
}
