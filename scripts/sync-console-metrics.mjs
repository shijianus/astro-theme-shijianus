#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const POSTS_DIR = path.resolve(process.cwd(), 'src/content/posts');
const PUBLIC_DATA_DIR = path.resolve(process.cwd(), 'public/data');
const OUTPUT_FILE = path.resolve(PUBLIC_DATA_DIR, 'console-metrics.json');

const LANG_SUFFIX_REGEX = /(?:[._-])(en|zh-hant|zh-cn|zh-hans|zh-tw|zh-hk|zh-mo|fr|es|de|ja|ko|ru|it|pt|pt-br|vi|ar|nl|pl|tr|sv|no|da|fi|th|id|uk|cs|el|he|ro|hu)$/i;

function getPostCanonicalSlug(id) {
  let current = id;
  while (LANG_SUFFIX_REGEX.test(current)) {
    current = current.replace(LANG_SUFFIX_REGEX, '');
  }
  return current.replace(/[._-]+$/, '');
}

function parseMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;

  try {
    const frontmatter = yaml.load(match[1]);
    const body = match[2];
    return { frontmatter, body };
  } catch (e) {
    return null;
  }
}

function estimateWordCount(body) {
  const plain = body.replace(/[`#>*_[\]\(\)!-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return 0;
  const compact = plain.replace(/\s+/g, '');
  const latinTokens = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(compact.length, latinTokens);
}

function run() {
  if (!fs.existsSync(PUBLIC_DATA_DIR)) {
    fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
  }

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
  const rawPosts = [];

  for (const f of files) {
    const filePath = path.join(POSTS_DIR, f);
    const parsed = parseMarkdown(filePath);
    if (!parsed || parsed.frontmatter.draft) continue;

    const id = f.replace(/\.(md|mdx)$/, '');
    const canonical = getPostCanonicalSlug(id);
    const cleanSlug = canonical.includes('.') ? canonical.replace(/\./g, '-') : canonical;
    const pubDate = new Date(parsed.frontmatter.pubDate);
    const updatedDate = parsed.frontmatter.updatedDate ? new Date(parsed.frontmatter.updatedDate) : undefined;
    const wordCount = estimateWordCount(parsed.body);
    const readingMinutes = Math.max(1, Math.round(wordCount / 220));

    rawPosts.push({
      id,
      canonical,
      href: `/posts/${cleanSlug}/`,
      title: parsed.frontmatter.title || canonical,
      pubDate,
      updatedDate,
      wordCount,
      readingMinutes,
      category: parsed.frontmatter.category || '未分类',
    });
  }

  // Deduplicate by canonical slug (prioritize default without suffix, then earliest)
  const postMap = new Map();
  for (const p of rawPosts) {
    const existing = postMap.get(p.canonical);
    if (!existing) {
      postMap.set(p.canonical, p);
    } else {
      const existingHasSuffix = LANG_SUFFIX_REGEX.test(existing.id);
      const currentHasSuffix = LANG_SUFFIX_REGEX.test(p.id);
      if (existingHasSuffix && !currentHasSuffix) {
        postMap.set(p.canonical, p);
      }
    }
  }

  const publicPosts = Array.from(postMap.values()).sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  const now = new Date();

  // Metrics
  const totalPosts = publicPosts.length;
  let totalWords = 0;
  let totalReadingMinutes = 0;
  for (const p of publicPosts) {
    totalWords += p.wordCount;
    totalReadingMinutes += p.readingMinutes;
  }
  const avgWordsPerPost = totalPosts > 0 ? Math.round(totalWords / totalPosts) : 0;

  const START_DATE = new Date('2024-01-01T00:00:00Z');
  const uptimeDays = Math.floor((now.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24));

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const recentPosts30d = publicPosts.filter(p => p.pubDate >= thirtyDaysAgo && p.pubDate <= now);
  const recentPostCount30d = recentPosts30d.length;

  let activeStatus = 'Status 0';
  let activeLevel = 'Lv.0';
  if (recentPostCount30d > 8) { activeStatus = 'Status 4'; activeLevel = 'Lv.4'; }
  else if (recentPostCount30d >= 5) { activeStatus = 'Status 3'; activeLevel = 'Lv.3'; }
  else if (recentPostCount30d >= 3) { activeStatus = 'Status 2'; activeLevel = 'Lv.2'; }
  else if (recentPostCount30d >= 1) { activeStatus = 'Status 1'; activeLevel = 'Lv.1'; }

  let densityStatus = 'Level 1 (Low)';
  let densityLevel = 'Lv.1';
  if (avgWordsPerPost > 3000) { densityStatus = 'Level 4 (Ultra)'; densityLevel = 'Lv.4'; }
  else if (avgWordsPerPost > 1500) { densityStatus = 'Level 3 (High)'; densityLevel = 'Lv.3'; }
  else if (avgWordsPerPost > 800) { densityStatus = 'Level 2 (Standard)'; densityLevel = 'Lv.2'; }

  // Build 52-week activity map
  const activityMap = new Map();
  const registerActivity = (dateStr, item) => {
    const list = activityMap.get(dateStr) || [];
    if (!list.some(e => e.href === item.href && e.type === item.type)) {
      list.push(item);
      activityMap.set(dateStr, list);
    }
  };

  for (const p of publicPosts) {
    const pubKey = p.pubDate.toISOString().split('T')[0];
    registerActivity(pubKey, {
      title: p.title,
      href: p.href,
      type: 'publish',
      date: pubKey,
    });

    if (p.updatedDate) {
      const upKey = p.updatedDate.toISOString().split('T')[0];
      if (upKey !== pubKey) {
        registerActivity(upKey, {
          title: `${p.title} (更新)`,
          href: p.href,
          type: 'update',
          date: upKey,
        });
      }
    }
  }

  // 52 weeks grid (aligned strictly to Sunday ~ Saturday relative to today)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  today.setHours(0, 0, 0, 0);

  const currentWeekSunday = new Date(today);
  currentWeekSunday.setDate(today.getDate() - today.getDay());

  const startDate = new Date(currentWeekSunday);
  startDate.setDate(currentWeekSunday.getDate() - (51 * 7));

  const totalSlots = 52 * 7;
  const days = [];
  for (let i = 0; i < totalSlots; i++) {
    const cur = new Date(startDate);
    cur.setDate(startDate.getDate() + i);

    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;
    const displayDate = `${y}/${parseInt(m, 10)}/${parseInt(d, 10)}`;

    const isFuture = cur > today;
    const items = isFuture ? [] : (activityMap.get(dateKey) || []);
    const count = items.length;

    let level = 0;
    if (!isFuture) {
      if (count >= 7) level = 4;
      else if (count >= 4) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;
    }

    days.push({
      date: dateKey,
      displayDate,
      level,
      posts: items,
      isFuture,
    });
  }

  const payload = {
    ok: true,
    generatedAt: now.toISOString(),
    stats: {
      posts: totalPosts,
      totalWords,
      readingMinutes: totalReadingMinutes,
      avgWordsPerPost,
      uptimeDays,
      recentPostCount30d,
      activeStatus,
      activeLevel,
      densityStatus,
      densityLevel,
      latestPostDate: publicPosts[0] ? publicPosts[0].pubDate.toISOString().split('T')[0].replace(/-/g, '.') : '-',
      latestPostHref: publicPosts[0] ? publicPosts[0].href : '/archives/',
    },
    activity: days,
    posts: publicPosts.map(p => ({
      title: p.title,
      href: p.href,
      pubDate: p.pubDate.toISOString().split('T')[0],
      updatedDate: p.updatedDate ? p.updatedDate.toISOString().split('T')[0] : null,
      category: p.category,
    })),
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`[sync-console-metrics] Generated metrics payload to ${OUTPUT_FILE}`);
  console.log(`[sync-console-metrics] Total Posts: ${totalPosts}, Words: ${totalWords}, Active: ${activeStatus}, Density: ${densityStatus}`);
}

run();
