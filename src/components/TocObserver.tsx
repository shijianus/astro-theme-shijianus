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

      let active = headings[0];
      for (const entry of headings) {
        if (entry.element.getBoundingClientRect().top <= 132) active = entry;
      }

      for (const entry of headings) {
        entry.link.classList.toggle('active', entry.id === active?.id);
      }

      active?.link.scrollIntoView({ block: 'nearest' });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return null;
}
