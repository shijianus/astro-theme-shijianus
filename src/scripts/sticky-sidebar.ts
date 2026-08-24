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
  const trackRecent = document.getElementById('aside-track-recent');
  const stickyBoxRecent = document.getElementById('aside-sticky-box-recent');
  const recentCard = document.getElementById('card-recent-post');
  const supportRecentCard = document.getElementById('card-recent-post-support');
  const trackSupport = document.getElementById('aside-track-support');
  const stickyBoxSupport = document.getElementById('aside-sticky-box-support');
  const stickyLayout = document.getElementById('post-sticky-layout');

  if (!aside) return;

  if (isMobile) {
    [trackToc, trackRecent, trackSupport].forEach((track) => {
      if (!track) return;
      track.style.minHeight = '0px';
      track.style.height = 'auto';
      track.style.marginTop = '0px';
    });
    stickyBoxRecent?.style.removeProperty('--recent-sticky-top');
    stickyBoxSupport?.style.removeProperty('top');
    recentCard?.removeAttribute('data-promoted');
    recentCard?.removeAttribute('data-suppressed');
    recentCard?.setAttribute('aria-hidden', 'false');
    recentCard?.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => link.removeAttribute('tabindex'));
    supportRecentCard?.setAttribute('data-promoted', 'false');
    supportRecentCard?.setAttribute('aria-hidden', 'true');
    return;
  }

  const mainEl = post ?? pageMain;
  if (!mainEl || !trackToc || !trackSupport) return;

  // Measure the natural flow first. Previous inline heights/margins can move
  // the flex column while it is being resized (especially when the profile
  // card hydrates); clearing them before the read prevents a one-frame drift.
  [trackToc, trackRecent, trackSupport].forEach((track) => {
    if (!track) return;
    track.style.removeProperty('min-height');
    track.style.removeProperty('height');
    track.style.removeProperty('margin-top');
  });

  // A short TOC is defined by its real rendered footprint, not only heading count.
  // This keeps the behaviour stable when typography or viewport dimensions change.
  let isCompact = false;
  if (cardToc) {
    const tocListEl = cardToc.querySelector<HTMLElement>('.toc-list');
    const tocItems = cardToc.querySelectorAll<HTMLElement>('.toc-item');
    const viewportColumnHeight = Math.max(320, window.innerHeight - topOffset);
    const tocListHeight = tocListEl?.scrollHeight ?? cardToc.offsetHeight;
    isCompact = tocItems.length <= 6 || tocListHeight <= viewportColumnHeight * 0.5;
    aside.dataset.tocType = isCompact ? 'short' : 'long';
  } else {
    aside.dataset.tocType = 'none';
  }

  // Read all geometry before writing styles. The three tracks then move as one
  // mapped system, so the sidebar never lags behind the article column.
  const docScrollY = window.scrollY;
  const articleRect = articleContainer?.getBoundingClientRect();
  const copyrightRect = copyrightBlock?.getBoundingClientRect();
  const postRect = mainEl.getBoundingClientRect();
  const trackTocRect = trackToc.getBoundingClientRect();

  const docArticleBottom = articleRect
    ? articleRect.bottom + docScrollY
    : (copyrightRect ? copyrightRect.top + docScrollY : docScrollY);
  const articleToCopyrightGap = articleRect && copyrightRect
    ? Math.max(0, copyrightRect.top - articleRect.bottom)
    : 0;
  const docCopyrightTop = docArticleBottom + articleToCopyrightGap;
  const docPostBottom = postRect.bottom + docScrollY;

  const gap = Math.max(0, Number.parseFloat(stickyLayout ? getComputedStyle(stickyLayout).rowGap : '20') || 20);
  const asideGap = Math.max(0, Number.parseFloat(getComputedStyle(aside).rowGap) || gap);
  const profileRect = aside.querySelector<HTMLElement>('.profile-card')?.getBoundingClientRect();
  const layoutRect = stickyLayout?.getBoundingClientRect();
  const tocFlowTop = profileRect
    ? profileRect.bottom + asideGap
    : (layoutRect?.top ?? trackTocRect.top);
  const docTrackTocTop = tocFlowTop + docScrollY;
  const tocHeight = stickyBoxToc?.offsetHeight ?? 0;
  const recentHeight = stickyBoxRecent?.offsetHeight ?? 0;
  const supportHeight = stickyBoxSupport?.offsetHeight ?? 0;
  const recentStickyTop = isCompact ? topOffset + tocHeight + gap : topOffset;
  const recentCanFit = !isCompact || (docArticleBottom - docScrollY >= recentStickyTop + recentHeight);
  const copyrightAtHeader = docCopyrightTop - docScrollY <= topOffset + 1;
  // Once the TOC no longer has room for the early recent card, promote the
  // second copy at the copyright track immediately. This keeps the card
  // continuous while the TOC is releasing instead of creating a blank gap.
  const promoteRecent = copyrightAtHeader || (isCompact && !recentCanFit);
  const suppressRecent = false;

  stickyBoxRecent?.style.setProperty('--recent-sticky-top', `${Math.round(recentStickyTop)}px`);

  if (supportRecentCard) {
    supportRecentCard.dataset.promoted = promoteRecent ? 'true' : 'false';
    supportRecentCard.setAttribute('aria-hidden', promoteRecent ? 'false' : 'true');
    supportRecentCard.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
      if (promoteRecent) link.removeAttribute('tabindex');
      else link.tabIndex = -1;
    });
  }
  if (recentCard) {
    recentCard.dataset.promoted = promoteRecent ? 'true' : 'false';
    recentCard.dataset.suppressed = suppressRecent ? 'true' : 'false';
    recentCard.setAttribute('aria-hidden', promoteRecent || suppressRecent ? 'true' : 'false');
    recentCard.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
      if (promoteRecent || suppressRecent) link.tabIndex = -1;
      else link.removeAttribute('tabindex');
    });
  }

  // TOC termination is tied to the article's bottom, not the copyright card.
  // For a sticky child this means its track must end at articleBottom.
  const targetTocHeight = Math.max(0, Math.round(docArticleBottom - docTrackTocTop));
  trackToc.style.minHeight = `${targetTocHeight}px`;
  trackToc.style.height = `${targetTocHeight}px`;

  if (trackRecent && stickyBoxRecent && recentHeight > 0) {
    const docTrackRecentFlowTop = docTrackTocTop + targetTocHeight + gap;
    // Short TOCs fill the otherwise empty column immediately below the TOC;
    // long TOCs retain the established copyright-time entry point.
    const targetRecentTop = isCompact
      ? docTrackTocTop + tocHeight + gap
      : docCopyrightTop;
    const recentMarginTop = Math.round(targetRecentTop - docTrackRecentFlowTop);

    trackRecent.style.marginTop = `${recentMarginTop}px`;
    // Keep the recent card sticky until the lower support group takes over at
    // copyright. Its track bridges the mapped interval without changing flow.
    const targetRecentHeight = Math.max(
      recentHeight,
      Math.round(docCopyrightTop - targetRecentTop),
    );
    trackRecent.style.minHeight = `${targetRecentHeight}px`;
    trackRecent.style.height = `${targetRecentHeight}px`;
    trackRecent.dataset.stickyMode = isCompact ? 'short-preload' : 'copyright';
  } else if (trackRecent) {
    trackRecent.style.marginTop = '0px';
    trackRecent.style.minHeight = '0px';
    trackRecent.style.height = '0px';
  }

  // TG/category cards have one and only one activation baseline: copyright.
  // The negative overlap compensates for the recent track so both groups can
  // share the same sticky moment while remaining visually stacked.
  const recentTrackTop = trackRecent
    ? (isCompact ? docTrackTocTop + tocHeight + gap : docCopyrightTop)
    : docTrackTocTop + targetTocHeight + gap;
  const recentTrackHeight = trackRecent
    ? Math.max(recentHeight, Math.round(docCopyrightTop - recentTrackTop))
    : 0;
  const supportFlowTop = recentTrackTop + recentTrackHeight + gap;
  trackSupport.style.marginTop = `${Math.round(docCopyrightTop - supportFlowTop)}px`;
  // Extend the support track so its bottom edge resolves against the post
  // shell's bottom, preserving synchronized end-of-column behaviour.
  const targetSupportHeight = Math.max(
    supportHeight,
    Math.round(docPostBottom - docCopyrightTop),
  );
  trackSupport.style.minHeight = `${targetSupportHeight}px`;
  trackSupport.style.height = `${targetSupportHeight}px`;

  aside.dataset.tocTermination = 'article-bottom';
  aside.dataset.supportActivation = 'copyright';

  // Reading progress percentage & progress bar
  if (articleContainer) {
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
    document.getElementById('aside-sticky-box-recent'),
    document.getElementById('aside-sticky-box-support'),
    document.getElementById('card-recent-post-support'),
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
