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

function updateTocHighlight(topOffset: number) {
  const headings = Array.from(
    document.querySelectorAll<HTMLElement>(
      '#article-container h2, #article-container h3, #article-container h4, #article-container h5, #article-container h6'
    )
  );
  if (headings.length === 0) return;

  let activeIndex = -1;
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i]!;
    const top = heading.getBoundingClientRect().top;
    if (top <= topOffset + 80) {
      activeIndex = i;
    } else {
      break;
    }
  }

  if (activeIndex === -1 && headings.length > 0) {
    activeIndex = 0;
  }

  const tocLinks = Array.from(document.querySelectorAll<HTMLElement>('#card-toc .toc-link'));
  const tocItems = Array.from(document.querySelectorAll<HTMLElement>('#card-toc .toc-item'));

  tocLinks.forEach((link, idx) => {
    const isActive = idx === activeIndex;
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  tocItems.forEach((item, idx) => {
    item.classList.toggle('is-active', idx === activeIndex);
  });
}

function updatePostSticky(topOffset: number, isMobile: boolean) {
  const aside = document.getElementById('aside-content');
  const articleContainer = document.getElementById('article-container');
  const cardToc = document.getElementById('card-toc');
  const stickyLayout = document.getElementById('post-sticky-layout') ?? document.querySelector<HTMLElement>('#aside-content .sticky_layout');

  if (!aside) return;

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
    const currentProgress = Math.min(100, Math.max(0, Math.round((scrolled / totalScrollable) * 100)));
    const percentEl = document.querySelector<HTMLElement>('#card-toc .toc-percentage');
    const progressBar = document.querySelector<HTMLElement>('#card-toc .toc-progress__bar');
    if (percentEl) percentEl.textContent = `${currentProgress}%`;
    if (progressBar) progressBar.style.width = `${currentProgress}%`;
  }

  updateTocHighlight(topOffset);

  if (stickyLayout) {
    syncScrollableOverflow(stickyLayout);
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
    document.getElementById('aside-content'),
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
