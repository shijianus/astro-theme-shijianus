import type { CollectionEntry } from 'astro:content';
import {
  collectArchives,
  collectCategories,
  collectTags,
  estimateReadingMinutes,
  estimateWordCount,
  getPublicPosts,
  resolveCategory,
  sortPostsByDate,
} from './content';

export type SidebarTag = {
  label: string;
  slug: string;
  count: number;
};

export type SidebarArchive = {
  label: string;
  count: number;
};

export type SidebarCategory = {
  label: string;
  slug: string;
  count: number;
};

export type WeightedTaxonomyItem = {
  label: string;
  slug: string;
  count: number;
  weight: number;
};

export type SidebarHeading = {
  depth: number;
  slug: string;
  text: string;
};

export type SidebarPostContextAction = {
  label: string;
  href: string;
  kind: 'comment' | 'reward' | 'archive';
};

export type SidebarPostContext = {
  title: string;
  summary?: string;
  category: {
    label: string;
    href: string;
  };
  meta: string[];
  tags: Array<{
    label: string;
    href: string;
  }>;
  actions: SidebarPostContextAction[];
};

export type SidebarData = {
  recentPosts: CollectionEntry<'posts'>[];
  tags: SidebarTag[];
  archives: SidebarArchive[];
  categories: SidebarCategory[];
  totalPosts: number;
  totalCategories: number;
  totalTags: number;
  totalReadingMinutes: number;
  totalWords: number;
  headings?: SidebarHeading[];
  postContext?: SidebarPostContext;
};

type PostEntry = CollectionEntry<'posts'>;

export function createSidebarData(
  posts: PostEntry[],
  headings: SidebarHeading[] = [],
  options: {
    includeProtected?: boolean;
  } = {},
): SidebarData {
  const sortedPosts = options.includeProtected ? sortPostsByDate(posts) : getPublicPosts(posts);
  const tags = collectTags(sortedPosts, { includeProtected: options.includeProtected });
  const archives = collectArchives(sortedPosts, { includeProtected: options.includeProtected });
  const categories = collectCategories(sortedPosts, { includeProtected: options.includeProtected });
  const totalReadingMinutes = sortedPosts.reduce((total, entry) => total + estimateReadingMinutes(entry), 0);
  const totalWords = sortedPosts.reduce((total, entry) => total + estimateWordCount(entry), 0);

  return {
    recentPosts: sortedPosts,
    tags,
    archives,
    categories,
    totalPosts: sortedPosts.length,
    totalCategories: categories.length,
    totalTags: tags.length,
    totalReadingMinutes,
    totalWords,
    headings,
  };
}

export function groupPostsByYear(posts: PostEntry[], options: { includeProtected?: boolean } = {}) {
  const sourcePosts = options.includeProtected ? sortPostsByDate(posts) : getPublicPosts(posts);
  const postsByYear = new Map<number, PostEntry[]>();

  for (const post of sourcePosts) {
    const year = post.data.pubDate.getFullYear();
    const bucket = postsByYear.get(year) ?? [];
    bucket.push(post);
    postsByYear.set(year, bucket);
  }

  return [...postsByYear.entries()].sort((left, right) => right[0] - left[0]);
}

export function getLatestByCategory(posts: PostEntry[]) {
  const sourcePosts = getPublicPosts(posts);
  const latestByCategory = new Map<string, string>();

  for (const post of sourcePosts) {
    const key = resolveCategory(post);
    if (!latestByCategory.has(key)) latestByCategory.set(key, post.data.title);
  }

  return latestByCategory;
}

export function formatDisplayDate(date: Date, locale = 'zh-CN') {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCompactDate(date: Date, locale = 'zh-CN') {
  return date.toLocaleDateString(locale, {
    month: '2-digit',
    day: '2-digit',
  });
}

export function createWeightedTaxonomy<T extends { label: string; slug: string; count: number }>(items: T[]): WeightedTaxonomyItem[] {
  if (items.length === 0) return [];

  const counts = items.map((item) => item.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const span = Math.max(1, max - min);

  return items.map((item) => ({
    ...item,
    weight: Number(((item.count - min) / span).toFixed(3)),
  }));
}
