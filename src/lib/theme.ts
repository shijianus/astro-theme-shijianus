import type { CollectionEntry } from 'astro:content';
import {
  collectArchives,
  collectCategories,
  collectTags,
  estimateReadingMinutes,
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

export type SidebarHeading = {
  depth: number;
  slug: string;
  text: string;
};

export type SidebarData = {
  recentPosts: CollectionEntry<'posts'>[];
  tags: SidebarTag[];
  archives: SidebarArchive[];
  totalPosts: number;
  totalCategories: number;
  totalTags: number;
  totalReadingMinutes: number;
  headings?: SidebarHeading[];
};

type PostEntry = CollectionEntry<'posts'>;

export function createSidebarData(posts: PostEntry[], headings: SidebarHeading[] = []): SidebarData {
  const sortedPosts = sortPostsByDate(posts);
  const tags = collectTags(sortedPosts);
  const archives = collectArchives(sortedPosts);
  const categories = collectCategories(sortedPosts);
  const totalReadingMinutes = sortedPosts.reduce((total, entry) => total + estimateReadingMinutes(entry), 0);

  return {
    recentPosts: sortedPosts,
    tags,
    archives,
    totalPosts: sortedPosts.length,
    totalCategories: categories.length,
    totalTags: tags.length,
    totalReadingMinutes,
    headings,
  };
}

export function groupPostsByYear(posts: PostEntry[]) {
  const postsByYear = new Map<number, PostEntry[]>();

  for (const post of sortPostsByDate(posts)) {
    const year = post.data.pubDate.getFullYear();
    const bucket = postsByYear.get(year) ?? [];
    bucket.push(post);
    postsByYear.set(year, bucket);
  }

  return [...postsByYear.entries()].sort((left, right) => right[0] - left[0]);
}

export function getLatestByCategory(posts: PostEntry[]) {
  const latestByCategory = new Map<string, string>();

  for (const post of sortPostsByDate(posts)) {
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
