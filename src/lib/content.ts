import type { CollectionEntry } from 'astro:content';

type PostEntry = CollectionEntry<'posts'>;

export function getPostPath(entry: Pick<PostEntry, 'id'>) {
  return `/posts/${entry.id}/`;
}

export function sortPostsByDate(posts: PostEntry[]) {
  return [...posts]
    .filter((entry) => !entry.data.draft)
    .sort((left, right) => {
      const stickyDelta = (right.data.sticky ?? 0) - (left.data.sticky ?? 0);
      if (stickyDelta !== 0) return stickyDelta;
      return right.data.pubDate.valueOf() - left.data.pubDate.valueOf();
    });
}

export function resolveCategory(entry: PostEntry) {
  return entry.data.category ?? entry.data.space ?? 'uncategorized';
}

export function resolveGroup(entry: PostEntry) {
  return entry.data.group ?? 'General';
}

export function resolveCover(entry: PostEntry) {
  return entry.data.cover ?? entry.data.image?.url ?? '/media/shijianus/hero.jpg';
}

export function resolveCoverAlt(entry: PostEntry) {
  return entry.data.coverAlt ?? entry.data.image?.alt ?? entry.data.title;
}

export function getExcerpt(entry: PostEntry, maxLength = 170) {
  const source = entry.data.description ?? entry.body.replace(/\s+/g, ' ').trim();
  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength).trim()}...`;
}

export function estimateReadingMinutes(entry: PostEntry) {
  const plain = entry.body.replace(/[`#>*_[\]\(\)!-]/g, ' ');
  const tokenCount = plain.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(tokenCount / 220));
}

export function slugifySegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function collectCategories(posts: PostEntry[]) {
  const categories = new Map<string, { label: string; slug: string; count: number }>();

  for (const post of sortPostsByDate(posts)) {
    const label = resolveCategory(post);
    const current = categories.get(label);
    categories.set(label, {
      label,
      slug: slugifySegment(label),
      count: (current?.count ?? 0) + 1,
    });
  }

  return [...categories.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

export function collectTags(posts: PostEntry[]) {
  const tags = new Map<string, { label: string; slug: string; count: number }>();

  for (const post of sortPostsByDate(posts)) {
    for (const tag of post.data.tags) {
      const current = tags.get(tag);
      tags.set(tag, {
        label: tag,
        slug: slugifySegment(tag),
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  return [...tags.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

export function collectArchives(posts: PostEntry[]) {
  const archives = new Map<string, { year: number; month: number; label: string; count: number }>();

  for (const post of sortPostsByDate(posts)) {
    const year = post.data.pubDate.getFullYear();
    const month = post.data.pubDate.getMonth() + 1;
    const key = `${year}-${month}`;
    const label = `${year}.${String(month).padStart(2, '0')}`;
    const current = archives.get(key);

    archives.set(key, {
      year,
      month,
      label,
      count: (current?.count ?? 0) + 1,
    });
  }

  return [...archives.values()].sort((left, right) => {
    if (left.year !== right.year) return right.year - left.year;
    return right.month - left.month;
  });
}

export function getFeaturedPosts(posts: PostEntry[], limit = 4) {
  return sortPostsByDate(posts)
    .filter((entry) => entry.data.featured || (entry.data.sticky ?? 0) > 0)
    .slice(0, limit);
}

export function getRelatedPosts(posts: PostEntry[], current: PostEntry, limit = 3) {
  const currentCategory = resolveCategory(current);
  const currentTags = new Set(current.data.tags);

  return sortPostsByDate(posts)
    .filter((entry) => entry.id !== current.id)
    .map((entry) => {
      let score = 0;
      if (resolveCategory(entry) === currentCategory) score += 3;
      for (const tag of entry.data.tags) {
        if (currentTags.has(tag)) score += 2;
      }
      if (entry.data.featured) score += 1;
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || right.entry.data.pubDate.valueOf() - left.entry.data.pubDate.valueOf())
    .slice(0, limit)
    .map((item) => item.entry);
}
