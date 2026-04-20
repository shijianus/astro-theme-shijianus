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

    const headings = links
      .map((link) => {
        const id = decodeHash(link.hash);
        const element = document.getElementById(id);
        return element ? { id, element, link } : null;
      })
      .filter((entry): entry is { id: string; element: HTMLElement; link: HTMLAnchorElement } => Boolean(entry));

    const percentage = tocCard.querySelector<HTMLElement>('.toc-percentage');
    let activeId = '';
    let frame = 0;

    const update = () => {
      const articleRect = article.getBoundingClientRect();
      const articleProgress = Math.round(
        Math.min(
          100,
          Math.max(
            0,
            ((Math.max(0, -articleRect.top + 120) / Math.max(1, articleRect.height - window.innerHeight * 0.55)) * 100),
          ),
        ),
      );

      if (percentage) percentage.textContent = `${articleProgress}%`;
      tocCard.style.setProperty('--toc-progress', `${articleProgress}%`);

      let active = headings[0];
      for (const entry of headings) {
        if (entry.element.getBoundingClientRect().top <= 132) active = entry;
      }

      for (const entry of headings) {
        const isActive = entry.id === active?.id;
        entry.link.classList.toggle('active', isActive);
        entry.link.setAttribute('aria-current', isActive ? 'true' : 'false');
      }

      if (active?.id && active.id !== activeId) {
        activeId = active.id;
        active.link.scrollIntoView({ block: 'nearest' });
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

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  return null;
}
