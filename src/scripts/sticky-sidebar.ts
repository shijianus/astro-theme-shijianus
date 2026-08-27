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

type RecentHandoffState = 'toc' | 'handoff' | 'support';

// The recent card crosses two independently sticky groups on compact TOCs.
// Keep the handoff state between animation frames so a direction reversal at
// the copyright line cannot make the card snap back to the other group.
let recentHandoffState: RecentHandoffState = 'toc';
let recentHandoffDirection: 'up' | 'down' | 'idle' = 'idle';
let previousPostScrollY: number | null = null;
let recentHandoffPath = '';
let recentHandoffCompact: boolean | null = null;

interface PostStickyGeometry {
  isCompact: boolean;
  docTrackTocTop: number;
  docArticleBottom: number;
  docCopyrightTop: number;
  docPostBottom: number;
  gap: number;
  tocHeight: number;
  recentHeight: number;
  supportHeight: number;
}

let cachedPostGeometry: PostStickyGeometry | null = null;

interface TocViewportRect {
  top: number;
  bottom: number;
  height: number;
}

/**
 * Predict the TOC's sticky rectangle for the current scroll sample. Scroll
 * events run before the browser recalculates CSS-sticky positions, so reading
 * getBoundingClientRect() in that callback can return the previous frame. The
 * track and article document coordinates are stable; projecting them against
 * the new scrollY gives the same rectangle the browser will settle on, with no
 * one-frame lag for the recent-card collision lock.
 */
function resolveTocViewportRect({
  topOffset,
  scrollY,
  trackTop,
  articleBottom,
  tocHeight,
}: {
  topOffset: number;
  scrollY: number;
  trackTop: number;
  articleBottom: number;
  tocHeight: number;
}): TocViewportRect | null {
  if (![topOffset, scrollY, trackTop, articleBottom, tocHeight].every(Number.isFinite) || tocHeight <= 0) {
    return null;
  }

  const naturalTop = trackTop - scrollY;
  const trackEndTop = articleBottom - scrollY - tocHeight;
  const top = Math.min(Math.max(naturalTop, topOffset), trackEndTop);
  return { top, bottom: top + tocHeight, height: tocHeight };
}

function resolveRecentHandoff(
  isCompact: boolean,
  topOffset: number,
  scrollY: number,
  copyrightViewportTop: number,
  tocGroupTop: number,
  cardHeight: number,
): { state: RecentHandoffState; direction: 'up' | 'down' | 'idle'; top: number } {
  const path = window.location.pathname;
  if (path !== recentHandoffPath) {
    recentHandoffPath = path;
    recentHandoffState = 'toc';
    recentHandoffDirection = 'idle';
    previousPostScrollY = scrollY;
  }

  if (recentHandoffCompact !== isCompact) {
    recentHandoffCompact = isCompact;
    recentHandoffState = 'toc';
    recentHandoffDirection = 'idle';
    previousPostScrollY = scrollY;
  }

  const delta = previousPostScrollY === null ? 0 : scrollY - previousPostScrollY;
  if (delta > 0.5) recentHandoffDirection = 'down';
  else if (delta < -0.5) recentHandoffDirection = 'up';
  previousPostScrollY = scrollY;

  if (!isCompact || cardHeight <= 0) {
    recentHandoffState = 'toc';
    return { state: recentHandoffState, direction: recentHandoffDirection, top: tocGroupTop };
  }

  const headerTop = topOffset;
  const handoffStart = tocGroupTop + cardHeight;
  const handoffEnd = headerTop + cardHeight;

  // Establish a deterministic state after a restored/anchored page load.
  if (recentHandoffDirection === 'idle') {
    if (copyrightViewportTop <= handoffEnd) recentHandoffState = 'support';
    else if (copyrightViewportTop <= handoffStart) recentHandoffState = 'handoff';
    else recentHandoffState = 'toc';
  } else if (recentHandoffDirection === 'down') {
    if (recentHandoffState === 'toc' && copyrightViewportTop <= handoffStart) {
      recentHandoffState = 'handoff';
    }
    if (recentHandoffState === 'handoff' && copyrightViewportTop <= handoffEnd) {
      recentHandoffState = 'support';
    }
  } else if (recentHandoffDirection === 'up') {
    if (recentHandoffState === 'support' && copyrightViewportTop >= handoffEnd) {
      recentHandoffState = 'handoff';
    }
    if (recentHandoffState === 'handoff' && copyrightViewportTop >= handoffStart) {
      recentHandoffState = 'toc';
    }
  }

  const handoffTop = Math.max(headerTop, Math.min(tocGroupTop, copyrightViewportTop - cardHeight));
  const top = recentHandoffState === 'toc'
    ? tocGroupTop
    : recentHandoffState === 'support'
      ? headerTop
      : handoffTop;

  return { state: recentHandoffState, direction: recentHandoffDirection, top };
}

/**
 * Resolve the compact-mode recent-card top from the TOC's *resolved* lower
 * edge. Before the TOC reaches the sticky offset, keep the card at its natural
 * flow position so a late font/image measurement can never push it downward
 * and make it appear to flash in from below. Once the TOC is sticky, the live
 * lower edge becomes the collision boundary and the fixed layout gap is kept
 * in both scroll directions.
 */
function resolveCompactRecentTop({
  topOffset,
  gap,
  tocBox,
  tocViewport,
}: {
  topOffset: number;
  gap: number;
  tocBox: HTMLElement | null;
  tocViewport?: TocViewportRect | null;
}) {
  if (!tocBox) return topOffset;

  const tocRect = tocViewport ?? tocBox.getBoundingClientRect();
  if (!Number.isFinite(tocRect.top) || !Number.isFinite(tocRect.bottom)) {
    return topOffset;
  }

  // Read the rendered track gap at the point of use. During hydration the
  // cached geometry can briefly contain the pre-font/pre-CSS value (often
  // 32px while the settled layout is 16px), which would place the first
  // recent card too low and look like it flashed in from below.
  const layout = tocBox.closest<HTMLElement>('.sticky_layout');
  const renderedGap = layout
    ? Number.parseFloat(getComputedStyle(layout).rowGap)
    : Number.NaN;
  const pairGap = Number.isFinite(renderedGap) ? Math.max(0, renderedGap) : gap;
  // Before the TOC reaches the sticky offset the two cards are already in the
  // same document flow. Returning a large, document-derived top value here
  // would make CSS sticky push the recent card down for one frame while the
  // profile/font measurements settle (the "flash in from below" artefact).
  // The returned threshold is the natural pair top in that phase, so CSS
  // sticky does not allow the recent card to cross the TOC's lower edge.
  const tocIsSticky = tocRect.top <= topOffset + 0.5;

  // Once the TOC is pinned, its *lower* edge is the collision lock. The bottom
  // edge must be considered as soon as it re-enters the viewport (not only
  // after it crosses the header offset): during an upward scroll the TOC can
  // occupy the 0..topOffset band while the recent card is still at the header,
  // which was the one-frame overlap reported on short posts.
  const tocNearStickyBoundary = tocRect.top >= topOffset - 10;
  const tocCollisionTop = tocIsSticky && tocRect.bottom > 0.5
    ? Math.max(
      tocRect.bottom + pairGap,
      tocNearStickyBoundary ? topOffset + tocRect.height + pairGap : topOffset,
    )
    : topOffset;

  // Keep the sticky threshold at the pair's natural top before the TOC pins.
  // This makes the browser enforce the clearance during the same native
  // scroll sample in which the TOC reaches `topOffset`; waiting for a scroll
  // listener would leave a one-frame overlap at that boundary.
  const naturalPairTop = topOffset + tocRect.height + pairGap;

  return Math.max(topOffset, tocIsSticky ? tocCollisionTop : naturalPairTop);
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

function syncPostScrollPosition(topOffset: number, isMobile: boolean) {
  if (isMobile || !cachedPostGeometry) return;

  const aside = document.getElementById('aside-content');
  const articleContainer = document.getElementById('article-container');
  const trackToc = document.getElementById('aside-track-toc');
  const copyrightBlock = document.querySelector<HTMLElement>('.post-copyright-block');
  const stickyBoxToc = document.getElementById('aside-sticky-box-toc');
  const stickyBoxRecent = document.getElementById('aside-sticky-box-recent');
  const stickyBoxSupport = document.getElementById('aside-sticky-box-support');
  const geometry = cachedPostGeometry;
  if (!aside || !stickyBoxRecent || geometry.recentHeight <= 0) return;

  const docScrollY = window.scrollY;
  const articleRect = articleContainer?.getBoundingClientRect();
  const postRect = document.getElementById('post')?.getBoundingClientRect();
  const currentArticleBottom = articleRect
    ? articleRect.bottom + docScrollY
    : geometry.docArticleBottom;
  const currentPostBottom = postRect
    ? postRect.bottom + docScrollY
    : geometry.docPostBottom;
  const currentTocHeight = stickyBoxToc?.offsetHeight ?? geometry.tocHeight;
  const currentRecentHeight = stickyBoxRecent.offsetHeight;
  const currentSupportHeight = stickyBoxSupport?.offsetHeight ?? geometry.supportHeight;

  // Images/fonts can settle after the first layout pass. Refresh only the
  // document coordinates in-place here; rebuilding track heights during a
  // scroll would trigger scroll anchoring and create a second visible jump.
  geometry.docArticleBottom = currentArticleBottom;
  geometry.docPostBottom = currentPostBottom;
  geometry.docTrackTocTop = trackToc
    ? trackToc.getBoundingClientRect().top + docScrollY
    : geometry.docTrackTocTop;
  geometry.docCopyrightTop = copyrightBlock
    ? copyrightBlock.getBoundingClientRect().top + docScrollY
    : geometry.docArticleBottom;
  geometry.tocHeight = currentTocHeight;
  geometry.recentHeight = currentRecentHeight;
  geometry.supportHeight = currentSupportHeight;

  const copyrightViewportTop = geometry.docCopyrightTop - docScrollY;
  const recentStickyTop = geometry.isCompact
    ? topOffset + geometry.tocHeight + geometry.gap
    : topOffset;
  const handoff = resolveRecentHandoff(
    geometry.isCompact,
    topOffset,
    docScrollY,
    copyrightViewportTop,
    recentStickyTop,
    geometry.recentHeight,
  );

  let recentDesiredTop = geometry.isCompact
    ? handoff.top
    : Math.max(topOffset, Math.min(recentStickyTop, copyrightViewportTop - geometry.recentHeight));

  if (geometry.isCompact) {
    // The TOC is a sticky child, so its live lower edge is the only reliable
    // collision boundary while it is leaving the article track. Using the
    // cached track coordinates here introduced a one-frame lag (the recent
    // card could briefly move up before the TOC had finished moving). Read
    // the resolved card rect from this same scroll sample instead and keep a
    // constant gap until the TOC has fully cleared the sticky offset.
    const projectedToc = resolveTocViewportRect({
      topOffset,
      scrollY: docScrollY,
      trackTop: geometry.docTrackTocTop,
      articleBottom: geometry.docArticleBottom,
      tocHeight: geometry.tocHeight,
    });
    recentDesiredTop = resolveCompactRecentTop({
      topOffset,
      gap: geometry.gap,
      tocBox: stickyBoxToc,
      tocViewport: projectedToc,
    });
  }

  stickyBoxRecent.style.setProperty('--recent-sticky-top', `${Math.round(recentDesiredTop)}px`);
  stickyBoxSupport?.style.setProperty(
    '--support-sticky-top',
    `${Math.round(recentDesiredTop + geometry.recentHeight + geometry.gap)}px`,
  );
  aside.dataset.recentHandoff = handoff.state;
  aside.dataset.recentHandoffDirection = handoff.direction;

  if (articleRect) {
    const totalScrollable = Math.max(1, articleRect.height - window.innerHeight * 0.7);
    const scrolled = topOffset - articleRect.top;
    const currentProgress = Math.min(100, Math.max(0, Math.round((scrolled / totalScrollable) * 100)));
    const percentEl = document.querySelector<HTMLElement>('#card-toc .toc-percentage');
    const progressBar = document.querySelector<HTMLElement>('#card-toc .toc-progress__bar');
    if (percentEl) percentEl.textContent = `${currentProgress}%`;
    if (progressBar) progressBar.style.width = `${currentProgress}%`;
  }
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
      track.style.paddingTop = '0px';
    });
    stickyBoxRecent?.style.removeProperty('--recent-sticky-top');
    stickyBoxSupport?.style.removeProperty('--support-sticky-top');
    recentHandoffState = 'toc';
    recentHandoffDirection = 'idle';
    previousPostScrollY = window.scrollY;
    recentHandoffCompact = null;
    cachedPostGeometry = null;
    return;
  }

  const mainEl = post ?? pageMain;
  if (!mainEl || !trackToc || !trackSupport) return;

  // Start every full geometry pass from the natural flow. Keeping the
  // previous scroll-derived `top` while tracks are being remeasured lets a
  // stale value push the recent card below its TOC for one frame (especially
  // while the profile card or web fonts hydrate). The final sticky offsets are
  // written again after the tracks settle below, before the browser paints.
  stickyBoxRecent?.style.removeProperty('--recent-sticky-top');
  stickyBoxSupport?.style.removeProperty('--support-sticky-top');

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
    const viewportColumnHeight = Math.max(320, window.innerHeight - topOffset);
    // Compactness follows the rendered card footprint. Heading count and list
    // scrollHeight can disagree with the actual padded card (especially after
    // fonts settle), which would make the two sticky groups switch modes at
    // different times and cause a visible flash in the recent card.
    const tocCardHeight = cardToc.offsetHeight;
    isCompact = tocCardHeight > 0 && tocCardHeight <= viewportColumnHeight * 0.5;
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
  const supportPadding = !isCompact && recentHeight > 0 ? recentHeight + gap : 0;
  // The recent track must finish before the support group on every post type.
  // Reserving that lower group at the track boundary keeps the two sticky
  // cards separated when the post shell itself reaches its bottom edge.
  const recentTrackReserve = supportHeight > 0 ? supportHeight + gap : 0;
  trackSupport.style.paddingTop = `${Math.round(supportPadding)}px`;

  const recentStickyTop = isCompact ? topOffset + tocHeight + gap : topOffset;
  const copyrightViewportTop = docCopyrightTop - docScrollY;
  const handoff = resolveRecentHandoff(
    isCompact,
    topOffset,
    docScrollY,
    copyrightViewportTop,
    recentStickyTop,
    recentHeight,
  );
  const projectedToc = isCompact
    ? resolveTocViewportRect({
      topOffset,
      scrollY: docScrollY,
      trackTop: docTrackTocTop,
      articleBottom: docArticleBottom,
      tocHeight,
    })
    : null;
  const recentDesiredTop = isCompact
    // Use the resolved TOC lower edge for both the initial pairing and the
    // article-end lock. This keeps the two cards adjacent from the moment
    // they enter the sticky viewport and prevents the recent card from
    // appearing from below while the TOC is still moving.
    ? resolveCompactRecentTop({
      topOffset,
      gap,
      tocBox: stickyBoxToc,
      tocViewport: projectedToc,
    })
    : Math.max(topOffset, Math.min(recentStickyTop, copyrightViewportTop - recentHeight));
  aside.dataset.recentHandoff = handoff.state;
  aside.dataset.recentHandoffDirection = handoff.direction;

  // TOC termination is tied to the article's bottom, not the copyright card.
  // For a sticky child this means its track must end at articleBottom.
  const targetTocHeight = Math.max(0, Math.round(docArticleBottom - docTrackTocTop));
  trackToc.style.minHeight = `${targetTocHeight}px`;
  trackToc.style.height = `${targetTocHeight}px`;

  if (trackRecent && stickyBoxRecent && recentHeight > 0) {
    const docTrackRecentFlowTop = docTrackTocTop + targetTocHeight + gap;
    // Keep one physical recent card for the whole post. Its track starts below
    // a short TOC, then continues through the copyright handoff so CSS sticky
    // can move the same card continuously in both scroll directions.
    const targetRecentTop = isCompact
      ? docTrackTocTop + tocHeight + gap
      : docCopyrightTop;
    const recentMarginTop = Math.round(targetRecentTop - docTrackRecentFlowTop);

    trackRecent.style.marginTop = `${recentMarginTop}px`;
    const targetRecentHeight = Math.max(
      recentHeight,
      Math.round(docPostBottom - targetRecentTop - recentTrackReserve),
    );
    trackRecent.style.minHeight = `${targetRecentHeight}px`;
    trackRecent.style.height = `${targetRecentHeight}px`;
    trackRecent.dataset.stickyMode = isCompact ? 'short-continuous' : 'copyright-continuous';

    stickyBoxRecent.style.setProperty('--recent-sticky-top', `${Math.round(recentDesiredTop)}px`);
  } else if (trackRecent) {
    trackRecent.style.marginTop = '0px';
    trackRecent.style.minHeight = '0px';
    trackRecent.style.height = '0px';
  }

  // TG/category cards keep their copyright baseline. Their sticky top is
  // mapped to the moving recent card's bottom, so TG travels upward with it
  // instead of jumping when the two groups exchange control.
  const recentTrackTop = trackRecent
    ? (isCompact ? docTrackTocTop + tocHeight + gap : docCopyrightTop)
    : docTrackTocTop + targetTocHeight + gap;
  const recentTrackHeight = trackRecent
    ? Math.max(recentHeight, Math.round(docPostBottom - recentTrackTop - recentTrackReserve))
    : 0;
  const supportFlowTop = recentTrackTop + recentTrackHeight + gap;
  trackSupport.style.marginTop = `${Math.round(docCopyrightTop - supportFlowTop)}px`;
  // The support track is never allowed to begin above the copyright baseline.
  // A small flex settling correction prevents TG/category cards from becoming
  // active a frame early while the article/sidebar columns are hydrating.
  const supportTrackDocTop = trackSupport.getBoundingClientRect().top + docScrollY;
  if (supportTrackDocTop < docCopyrightTop - 0.5) {
    const currentMargin = Number.parseFloat(trackSupport.style.marginTop) || 0;
    trackSupport.style.marginTop = `${Math.round(currentMargin + docCopyrightTop - supportTrackDocTop)}px`;
  }
  stickyBoxSupport?.style.setProperty('--support-sticky-top', `${Math.round(recentDesiredTop + recentHeight + gap)}px`);
  // Extend the support track so its bottom edge resolves against the post
  // shell's bottom, preserving synchronized end-of-column behaviour.
  const targetSupportHeight = Math.max(
    supportHeight,
    Math.round(docPostBottom - docCopyrightTop + supportPadding),
  );
  trackSupport.style.minHeight = `${targetSupportHeight}px`;
  trackSupport.style.height = `${targetSupportHeight}px`;

  // Re-read the track origin after all inline heights/margins have been
  // applied. Profile/media hydration can change the sidebar flow by a few
  // pixels during this pass; caching the pre-write coordinate would make the
  // first recent-card top start below its natural position until the next
  // scroll event.
  const resolvedTrackTocTop = trackToc.getBoundingClientRect().top + docScrollY;
  if (isCompact && stickyBoxRecent) {
    const settledToc = resolveTocViewportRect({
      topOffset,
      scrollY: docScrollY,
      trackTop: resolvedTrackTocTop,
      articleBottom: docArticleBottom,
      tocHeight,
    });
    const settledRecentTop = resolveCompactRecentTop({
      topOffset,
      gap,
      tocBox: stickyBoxToc,
      tocViewport: settledToc,
    });
    stickyBoxRecent.style.setProperty('--recent-sticky-top', `${Math.round(settledRecentTop)}px`);
    stickyBoxSupport?.style.setProperty(
      '--support-sticky-top',
      `${Math.round(settledRecentTop + recentHeight + gap)}px`,
    );
  }

  cachedPostGeometry = {
    isCompact,
    docTrackTocTop: resolvedTrackTocTop,
    docArticleBottom,
    docCopyrightTop,
    docPostBottom,
    gap,
    tocHeight,
    recentHeight,
    supportHeight,
  };

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
  let scrollFrame = 0;
  let scrollIdleTimer = 0;
  let scrollSyncActive = false;
  let lastFrameScrollY: number | null = null;

  const syncScrollFrame = () => {
    scrollFrame = 0;
    const pageType = document.body.getAttribute('data-type') || 'page';
    if (pageType !== 'post' || window.matchMedia('(max-width: 1199px)').matches || !cachedPostGeometry) {
      lastFrameScrollY = window.scrollY;
      return;
    }
    const currentScrollY = window.scrollY;
    if (lastFrameScrollY !== currentScrollY) {
      lastFrameScrollY = currentScrollY;
      syncPostScrollPosition(resolveHeaderOffset(), false);
    }
    // Keep the observer alive only while a desktop post has a measured
    // geometry cache. Home/page routes and mobile layouts pay no per-frame
    // cost, and a route change naturally stops the loop on the next tick.
    scrollFrame = window.requestAnimationFrame(syncScrollFrame);
  };

  const ensureScrollFrame = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(syncScrollFrame);
  };

  const update = () => {
    const pageType = document.body.getAttribute('data-type') || 'page';
    if (pageType !== 'post') cachedPostGeometry = null;
    const topOffset = resolveHeaderOffset();
    const isMobile = window.matchMedia('(max-width: 1199px)').matches;
    document.documentElement.style.setProperty('--sticky-column-top', `${topOffset}px`);

    if (pageType === 'home') {
      updateHomeSticky(topOffset, isMobile);
    } else if (pageType === 'post') {
      updatePostSticky(topOffset, isMobile);
    }

    // Astro view transitions can swap a non-post page for a post without a
    // native scroll event. In that case the rAF observer may have stopped on
    // the previous route before this pass measured the new post geometry;
    // restart it now so the first scroll sample cannot lag the TOC sticky
    // position.
    if (pageType === 'post' && !isMobile && cachedPostGeometry) {
      lastFrameScrollY = window.scrollY;
      ensureScrollFrame();
    }
  };

  const scheduleUpdate = () => {
    if (scrollSyncActive) return;
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };

  // Native scrolling moves the article and CSS-sticky TOC before the next
  // paint. The compact-post recent card also has a scroll-derived top value;
  // waiting for rAF leaves one visible frame where the main column has moved
  // but that card still uses its previous position. Update post geometry in
  // the scroll event itself so both columns consume the same scroll sample.
  const handleScroll = () => {
    const pageType = document.body.getAttribute('data-type') || 'page';
    const isMobile = window.matchMedia('(max-width: 1199px)').matches;
    if (pageType === 'post' && !isMobile) {
      scrollSyncActive = true;
      window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => {
        scrollSyncActive = false;
        scheduleUpdate();
      }, 120);
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      const topOffset = resolveHeaderOffset();
      if (cachedPostGeometry) {
        syncPostScrollPosition(topOffset, false);
        lastFrameScrollY = window.scrollY;
        ensureScrollFrame();
      } else update();
      return;
    }
    scheduleUpdate();
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
    document.getElementById('recent-posts'),
  ].filter((el): el is HTMLElement => Boolean(el));

  elementsToObserve.forEach((el) => resizeObserver.observe(el));

  window.addEventListener('load', scheduleUpdate);
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  document.addEventListener('astro:page-load', scheduleUpdate);

  update();
  ensureScrollFrame();
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStickySidebar);
  } else {
    initStickySidebar();
  }
}
