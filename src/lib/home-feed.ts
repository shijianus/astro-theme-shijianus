import type { CollectionEntry } from 'astro:content';

type PostEntry = CollectionEntry<'posts'>;

export type HomeFeedPage = {
  posts: PostEntry[];
  currentPage: number;
  lastPage: number;
  total: number;
  pageSize: number;
};

export function resolveHomeFeedPageSize(pageSize: number) {
  return Math.max(1, Math.floor(pageSize || 8));
}

export function getHomeFeedPage(posts: PostEntry[], requestedPage: number, pageSize: number): HomeFeedPage {
  const safePageSize = resolveHomeFeedPageSize(pageSize);
  const lastPage = Math.max(1, Math.ceil(posts.length / safePageSize));
  const currentPage = Math.min(Math.max(1, requestedPage), lastPage);
  const start = (currentPage - 1) * safePageSize;

  return {
    posts: posts.slice(start, start + safePageSize),
    currentPage,
    lastPage,
    total: posts.length,
    pageSize: safePageSize,
  };
}

export function buildHomePageUrl(page: number) {
  return page <= 1 ? '/' : `/page/${page}/`;
}

export function getHomePaginationItems(currentPage: number, lastPage: number) {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1) as Array<number | 'ellipsis'>;
  }

  const points = new Set<number>([1, 2, 3, lastPage - 2, lastPage - 1, lastPage]);

  if (currentPage > 3 && currentPage < lastPage - 2) {
    points.add(currentPage - 1);
    points.add(currentPage);
    points.add(currentPage + 1);
  }

  const ordered = [...points].filter((page) => page >= 1 && page <= lastPage).sort((left, right) => left - right);
  const items: Array<number | 'ellipsis'> = [];

  for (const page of ordered) {
    const previous = items[items.length - 1];
    if (typeof previous === 'number' && page - previous > 1) {
      items.push('ellipsis');
    }
    items.push(page);
  }

  return items;
}
