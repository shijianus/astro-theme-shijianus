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
  
  const stickyLayout = document.getElementById('post-sticky-layout');
  const trackToc = document.getElementById('aside-track-toc');
  const trackSupport = document.getElementById('aside-track-support');
  const stickyBoxSupport = document.getElementById('aside-sticky-box-support');

  if (!aside || !stickyLayout) return;

  if (isMobile) {
    stickyLayout.style.transform = 'none';
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

  // Dynamic compact vs long TOC check using real DOM measurement
  let isCompact = false;
  if (cardToc) {
    const tocListEl = cardToc.querySelector<HTMLElement>('.toc-list');
    const tocItems = cardToc.querySelectorAll<HTMLElement>('.toc-item');
    isCompact = tocItems.length <= 6 || Boolean(tocListEl && tocListEl.scrollHeight < 260);
    aside.dataset.tocType = isCompact ? 'short' : 'long';
  }

  const copyrightEl = copyrightBlock || articleContainer;
  const mainEl = pageMain ?? post;
  if (!copyrightEl || !mainEl) return;

  // Clear any legacy manual inline track heights and margins
  if (trackToc && trackToc.style.height && trackToc.style.height !== 'auto') {
    trackToc.style.minHeight = '0px';
    trackToc.style.height = 'auto';
  }
  if (trackSupport && trackSupport.style.marginTop && trackSupport.style.marginTop !== '0px') {
    trackSupport.style.minHeight = '0px';
    trackSupport.style.height = 'auto';
    trackSupport.style.marginTop = '0px';
  }

  // Direct bounding rects of real DOM elements
  const copyrightRect = copyrightEl.getBoundingClientRect();
  const mainRect = mainEl.getBoundingClientRect();
  const tocHeight = cardToc ? cardToc.offsetHeight : 0;
  const supportHeight = stickyBoxSupport ? stickyBoxSupport.offsetHeight : (trackSupport ? trackSupport.offsetHeight : 450);
  const gap = 20;

  // Transition trigger: When TOC card's bottom edge reaches copyright block's top edge.
  // In sticky state at topOffset, TOC bottom in viewport is (topOffset + tocHeight).
  // When copyrightRect.top <= (topOffset + tocHeight), TOC bottom has reached copyright block.
  const tocBottomThreshold = topOffset + tocHeight;
  let offset = 0;

  if (cardToc && tocHeight > 0) {
    if (copyrightRect.top < tocBottomThreshold) {
      const maxShift = -(tocHeight + gap);
      const tocShift = copyrightRect.top - tocBottomThreshold;
      offset = Math.max(maxShift, tocShift);
    }
  }

  // Bottom boundary constraint: Align categories flush with page-main bottom
  const currentSupportTop = topOffset + Math.max(0, (tocHeight + gap) + offset);
  const currentSupportBottom = currentSupportTop + supportHeight;
  if (mainRect.bottom < currentSupportBottom) {
    const bottomCorrection = mainRect.bottom - currentSupportBottom;
    offset += bottomCorrection;
  }

  stickyLayout.style.transform = offset === 0 ? 'none' : `translateY(${Math.round(offset)}px)`;

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

  // IntersectionObserver to observe copyright block and main column boundary crossings
  const intersectionObserver = new IntersectionObserver(
    () => {
      scheduleUpdate();
    },
    {
      root: null,
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0],
    }
  );

  const copyrightBlock = document.querySelector('.post-copyright-block');
  const pageMain = document.querySelector('.page-main') || document.getElementById('post');
  if (copyrightBlock) intersectionObserver.observe(copyrightBlock);
  if (pageMain) intersectionObserver.observe(pageMain);

  const resizeObserver = new ResizeObserver(() => scheduleUpdate());
  const elementsToObserve = [
    document.getElementById('article-container'),
    document.getElementById('post'),
    document.querySelector('.post-copyright-block'),
    document.querySelector('.page-main'),
    document.getElementById('aside-content'),
    document.getElementById('post-sticky-layout'),
    document.getElementById('card-toc'),
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
