import type { CollectionEntry } from 'astro:content';

type PostEntry = CollectionEntry<'posts'>;

export const PROTECTED_POST_TITLE = '受限文章';
export const PROTECTED_POST_SUMMARY = '这篇文章设置了访问条件，需完成验证后才会展示正文。';
export const PROTECTED_POST_CATEGORY = '受限内容';
export const DEFAULT_POST_COVER = '/media/shijianus/default.png';
export const REMOTE_FALLBACK_COVER =
  'https://drawing.shijian.qzz.io/file/AgACAgEAAyEGAAS6jkJbAAMUapQaP6X-fJmi1j0qYD5NgooECLwAAlEMaxuQM6BEoSo1dHbP8ioBAAMCAAN3AAM9BA.png';
export const PROTECTED_POST_COVER = DEFAULT_POST_COVER;

export function getPostPath(entry: Pick<PostEntry, 'id'>) {
  return `/posts/${entry.id}/`;
}

export function encodePathSegment(value: string) {
  return encodeURIComponent(value).replace(/%20/g, '-');
}

export function getCategoryPath(labelOrSlug: string) {
  return `/categories/${encodePathSegment(slugifySegment(labelOrSlug))}/`;
}

export function getTagPath(labelOrSlug: string) {
  return `/tags/${encodePathSegment(slugifySegment(labelOrSlug))}/`;
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
  return entry.data.cover ?? entry.data.coverVideoPoster ?? entry.data.image?.url ?? DEFAULT_POST_COVER;
}

export function resolveCoverAlt(entry: PostEntry) {
  return entry.data.coverAlt ?? entry.data.image?.alt ?? entry.data.title;
}

export function resolveCoverVideo(entry: PostEntry) {
  return entry.data.coverVideo ?? '';
}

export function hasPostAccess(entry: PostEntry) {
  return Boolean(entry.data.access);
}

export function isProtectedPost(entry: PostEntry) {
  return hasPostAccess(entry);
}

export function getPublicPosts(posts: PostEntry[]) {
  return sortPostsByDate(posts).filter((entry) => !hasPostAccess(entry));
}

export function getDisplayPostTitle(entry: PostEntry, revealProtected = false) {
  return revealProtected || !hasPostAccess(entry) ? entry.data.title : PROTECTED_POST_TITLE;
}

export function getDisplayPostCategory(entry: PostEntry, revealProtected = false) {
  return revealProtected || !hasPostAccess(entry) ? resolveCategory(entry) : PROTECTED_POST_CATEGORY;
}

export function getDisplayPostGroup(entry: PostEntry, revealProtected = false) {
  return revealProtected || !hasPostAccess(entry) ? resolveGroup(entry) : PROTECTED_POST_GROUP;
}

export function getDisplayPostSummary(entry: PostEntry, maxLength = 170, revealProtected = false) {
  if (revealProtected || !hasPostAccess(entry)) {
    return getExcerpt(entry, maxLength);
  }

  return PROTECTED_POST_SUMMARY;
}

export function resolveDisplayCover(entry: PostEntry, revealProtected = false) {
  return revealProtected || !hasPostAccess(entry) ? resolveCover(entry) : PROTECTED_POST_COVER;
}

export function resolveDisplayCoverAlt(entry: PostEntry, revealProtected = false) {
  return revealProtected || !hasPostAccess(entry) ? resolveCoverAlt(entry) : PROTECTED_POST_TITLE;
}

export function getExcerpt(entry: PostEntry, maxLength = 170) {
  const source = entry.data.description ?? entry.body.replace(/\s+/g, ' ').trim();
  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength).trim()}...`;
}

export function estimateReadingMinutes(entry: PostEntry) {
  const tokenCount = estimateWordCount(entry);
  return Math.max(1, Math.round(tokenCount / 220));
}

export function estimateWordCount(entry: PostEntry) {
  const plain = entry.body.replace(/[`#>*_[\]\(\)!-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return 0;
  const compact = plain.replace(/\s+/g, '');
  const latinTokens = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(compact.length, latinTokens);
}

export function slugifySegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function collectCategories(posts: PostEntry[], options: { includeProtected?: boolean } = {}) {
  const sourcePosts = options.includeProtected ? sortPostsByDate(posts) : getPublicPosts(posts);
  const categories = new Map<string, { label: string; slug: string; count: number }>();

  for (const post of sourcePosts) {
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

export function collectTags(posts: PostEntry[], options: { includeProtected?: boolean } = {}) {
  const sourcePosts = options.includeProtected ? sortPostsByDate(posts) : getPublicPosts(posts);
  const tags = new Map<string, { label: string; slug: string; count: number }>();

  for (const post of sourcePosts) {
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

export function collectArchives(posts: PostEntry[], options: { includeProtected?: boolean } = {}) {
  const sourcePosts = options.includeProtected ? sortPostsByDate(posts) : getPublicPosts(posts);
  const archives = new Map<string, { year: number; month: number; label: string; count: number }>();

  for (const post of sourcePosts) {
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

export function getFeaturedPosts(posts: PostEntry[], limit = 4, options: { includeProtected?: boolean } = {}) {
  const sourcePosts = options.includeProtected ? sortPostsByDate(posts) : getPublicPosts(posts);
  return sourcePosts
    .filter((entry) => entry.data.featured || (entry.data.sticky ?? 0) > 0)
    .slice(0, limit);
}

export function getRelatedPosts(posts: PostEntry[], current: PostEntry, limit = 3, options: { includeProtected?: boolean } = {}) {
  const sourcePosts = options.includeProtected ? sortPostsByDate(posts) : getPublicPosts(posts);
  const currentCategory = resolveCategory(current);
  const currentTags = new Set(current.data.tags);

  return sourcePosts
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
