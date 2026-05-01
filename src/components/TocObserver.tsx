import { useEffect } from 'react';

function decodeHash(hash: string) {
  try {
    return decodeURIComponent(hash.replace(/^#/, ''));
  } catch {
    return hash.replace(/^#/, '');
  }
}

export function TocObserver() {
  useEffect(() => {
    const tocCard = document.getElementById('card-toc');
    const article = document.getElementById('article-container');
    if (!tocCard || !article) return;

    const links = Array.from(tocCard.querySelectorAll<HTMLAnchorElement>('.toc-link'));
    if (links.length === 0) return;
    const tocContent = tocCard.querySelector<HTMLElement>('.toc-content');

    const headings = links
      .map((link) => {
        const id = decodeHash(link.hash);
        const element = document.getElementById(id);
        const item = link.closest<HTMLElement>('.toc-item');
        return element ? { id, element, link, item } : null;
      })
      .filter((entry): entry is { id: string; element: HTMLElement; link: HTMLAnchorElement; item: HTMLElement | null } => Boolean(entry));

    if (headings.length === 0) return;

    for (const [index, entry] of headings.entries()) {
      const depth = entry.link.dataset.depth ?? '2';
      const tocIndex = String(index + 1).padStart(2, '0');

      entry.element.dataset.tocHeading = 'true';
      entry.element.dataset.tocDepth = depth;
      entry.element.dataset.tocIndex = tocIndex;
      entry.element.classList.add('article-heading-anchor');

      const existingAnchor = entry.element.querySelector<HTMLAnchorElement>(':scope > .article-heading-anchor__jump');
      if (!existingAnchor) {
        const anchor = document.createElement('a');
        anchor.href = `#${entry.id}`;
        anchor.className = 'article-heading-anchor__jump';
        anchor.setAttribute('aria-label', `跳转到 ${entry.element.textContent?.trim() ?? entry.id}`);
        anchor.dataset.tocIndex = tocIndex;
        anchor.textContent = '#';
        entry.element.appendChild(anchor);
      }
    }

    const percentage = tocCard.querySelector<HTMLElement>('.toc-percentage');
    const currentTitle = tocCard.querySelector<HTMLElement>('.toc-current__title');
    const currentMeta = tocCard.querySelector<HTMLElement>('.toc-current__meta');
    let activeId = '';
    let frame = 0;

    const keepActiveLinkVisible = (link: HTMLAnchorElement) => {
      if (!tocContent || tocContent.matches(':hover') || tocContent.contains(document.activeElement)) return;

      const contentRect = tocContent.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const topInset = contentRect.top + 12;
      const bottomInset = contentRect.bottom - 12;

      if (linkRect.top < topInset) {
        tocContent.scrollTop -= topInset - linkRect.top;
      } else if (linkRect.bottom > bottomInset) {
        tocContent.scrollTop += linkRect.bottom - bottomInset;
      }
    };

    const update = () => {
      const activationOffset = Math.min(220, Math.max(152, window.innerHeight * 0.18));
      const articleRect = article.getBoundingClientRect();
      const pinState =
        articleRect.top > activationOffset
          ? 'entering'
          : articleRect.bottom <= Math.max(180, window.innerHeight * 0.34)
            ? 'leaving'
            : 'reading';
      const articleProgress = Math.round(
        Math.min(
          100,
          Math.max(
            0,
            ((Math.max(0, -articleRect.top + activationOffset) / Math.max(1, articleRect.height - window.innerHeight * 0.2)) * 100),
          ),
        ),
      );

      tocCard.dataset.pinState = pinState;
      if (percentage) percentage.textContent = `${articleProgress}%`;
      tocCard.style.setProperty('--toc-progress', `${articleProgress}%`);

      let active = headings[0];
      for (const entry of headings) {
        if (entry.element.getBoundingClientRect().top <= activationOffset) active = entry;
      }

      for (const entry of headings) {
        const isActive = entry.id === active?.id;
        entry.item?.classList.remove('is-active', 'is-active-branch');
        entry.link.classList.toggle('active', isActive);
        entry.link.setAttribute('aria-current', isActive ? 'true' : 'false');
        entry.element.classList.toggle('is-toc-active', isActive);
      }

      if (active?.item) {
        active.item.classList.add('is-active');
        let parent = active.item.parentElement?.closest<HTMLElement>('.toc-item');
        while (parent) {
          parent.classList.add('is-active-branch');
          parent = parent.parentElement?.closest<HTMLElement>('.toc-item');
        }
      }

      if (active?.id && active.id !== activeId) {
        activeId = active.id;
        tocCard.dataset.activeHeading = active.id;
        keepActiveLinkVisible(active.link);
      }

      if (active) {
        const activeIndex = headings.findIndex((entry) => entry.id === active.id);
        const activeCount = activeIndex >= 0 ? String(activeIndex + 1).padStart(2, '0') : '00';
        const totalCount = String(headings.length).padStart(2, '0');
        const headingDepth = active.link.dataset.depth ?? active.element.dataset.tocDepth ?? '2';
        const headingText =
          active.link.querySelector<HTMLElement>('.toc-text')?.textContent?.trim() ?? active.element.textContent?.trim() ?? active.id;

        if (currentTitle) currentTitle.textContent = headingText;
        if (currentMeta) currentMeta.textContent = `H${headingDepth} · ${activeCount}/${totalCount}`;
      }
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(article);
    resizeObserver.observe(tocCard);

    const onClick = (event: Event) => {
      const target = event.target instanceof HTMLElement ? event.target.closest<HTMLAnchorElement>('.toc-link, .article-heading-anchor__jump') : null;
      if (!target?.hash) return;
      const id = decodeHash(target.hash);
      const element = document.getElementById(id);
      if (!element) return;
      event.preventDefault();
      const scrollMarginTop = Number.parseFloat(window.getComputedStyle(element).scrollMarginTop || '0');
      const top = Math.max(0, window.scrollY + element.getBoundingClientRect().top - (Number.isFinite(scrollMarginTop) ? scrollMarginTop : 0));
      window.scrollTo({ top, behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
      scheduleUpdate();
    };

    tocCard.addEventListener('click', onClick);
    article.addEventListener('click', onClick);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      tocCard.removeEventListener('click', onClick);
      article.removeEventListener('click', onClick);

      for (const entry of headings) {
        entry.element.classList.remove('is-toc-active', 'article-heading-anchor');
        entry.item?.classList.remove('is-active', 'is-active-branch');
        delete entry.element.dataset.tocHeading;
        delete entry.element.dataset.tocDepth;
        delete entry.element.dataset.tocIndex;
        const anchor = entry.element.querySelector(':scope > .article-heading-anchor__jump');
        anchor?.remove();
      }
    };
  }, []);

  return null;
}
