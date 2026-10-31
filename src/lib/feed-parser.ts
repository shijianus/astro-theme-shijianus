/**
 * Universal Feed & Moments RSS/Atom/JSON Parser
 * 
 * 适用于 Node.js 与 Cloudflare Workers/Pages 边缘运行时的零依赖统一订阅源解析器
 * 支持 RSS 2.0、Atom 1.0 与 JSON Feed，解决去中心化友链动态同步的核心难题。
 */

export interface ParsedFeedItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  timestamp: number;
  summary: string;
}

/**
 * 清洗 HTML 标签并保留纯文本摘要
 */
export function sanitizeSnippet(htmlOrText: string, maxLength = 140): string {
  if (!htmlOrText) return '';
  const text = htmlOrText
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 将多源时间字符串（RFC 822 / ISO 8601 等）标准化为毫秒时间戳与可读时间
 */
export function normalizeDate(dateStr: string): { timestamp: number; formatted: string; timeAgo: string } {
  const d = dateStr ? new Date(dateStr) : new Date();
  const timestamp = isNaN(d.getTime()) ? Date.now() : d.getTime();

  // 友好的相对时间计算
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  let timeAgo = '刚刚';
  if (diffSec < 60) {
    timeAgo = '刚刚';
  } else if (diffSec < 3600) {
    timeAgo = `${Math.floor(diffSec / 60)}分钟前`;
  } else if (diffSec < 86400) {
    timeAgo = `${Math.floor(diffSec / 3600)}小时前`;
  } else if (diffSec < 86400 * 30) {
    timeAgo = `${Math.floor(diffSec / 86400)}天前`;
  } else {
    timeAgo = `${Math.floor(diffSec / (86400 * 30))}个月前`;
  }

  // 格式化 YYYY-MM-DD HH:mm
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const formatted = `${y}-${m}-${day} ${hh}:${mm}`;

  return { timestamp, formatted, timeAgo };
}

/**
 * 解析 RSS 2.0 XML 内容
 */
function parseRssXml(xml: string, limit = 5): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];

  for (const itemXml of itemMatches.slice(0, limit)) {
    const rawTitle = (itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1] || '';
    const rawLink = (itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) || [])[1] || '';
    const rawPubDate = (itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || '';
    const rawDesc =
      (itemXml.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i) || [])[1] ||
      (itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) || [])[1] ||
      '';
    const guid = (itemXml.match(/<guid[\s\S]*?>([\s\S]*?)<\/guid>/i) || [])[1] || rawLink;

    const title = sanitizeSnippet(rawTitle, 100);
    const link = rawLink.trim();
    const summary = sanitizeSnippet(rawDesc, 140);
    const { timestamp, formatted } = normalizeDate(rawPubDate);

    if (title && link) {
      items.push({
        id: guid.trim() || link,
        title,
        link,
        pubDate: formatted,
        timestamp,
        summary,
      });
    }
  }

  return items;
}

/**
 * 解析 Atom 1.0 XML 内容
 */
function parseAtomXml(xml: string, limit = 5): ParsedFeedItem[] {
  const items: ParsedFeedItem[] = [];
  const entryMatches = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];

  for (const entryXml of entryMatches.slice(0, limit)) {
    const rawTitle = (entryXml.match(/<title[\s\S]*?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1] || '';
    const linkHref = (entryXml.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i) || [])[1] || '';
    const rawDate =
      (entryXml.match(/<published>([\s\S]*?)<\/published>/i) || [])[1] ||
      (entryXml.match(/<updated>([\s\S]*?)<\/updated>/i) || [])[1] ||
      '';
    const rawSummary =
      (entryXml.match(/<summary[\s\S]*?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i) || [])[1] ||
      (entryXml.match(/<content[\s\S]*?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i) || [])[1] ||
      '';
    const rawId = (entryXml.match(/<id>([\s\S]*?)<\/id>/i) || [])[1] || linkHref;

    const title = sanitizeSnippet(rawTitle, 100);
    const link = linkHref.trim();
    const summary = sanitizeSnippet(rawSummary, 140);
    const { timestamp, formatted } = normalizeDate(rawDate);

    if (title && link) {
      items.push({
        id: rawId.trim() || link,
        title,
        link,
        pubDate: formatted,
        timestamp,
        summary,
      });
    }
  }

  return items;
}

/**
 * 自动识别并解析 XML 或 JSON 订阅源
 */
export function parseFeedContent(content: string, limit = 5): ParsedFeedItem[] {
  if (!content) return [];
  const trimmed = content.trim();

  // JSON Feed
  if (trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed);
      const items = data.items || [];
      return items.slice(0, limit).map((it: any) => {
        const { timestamp, formatted } = normalizeDate(it.date_published || it.date_modified || '');
        return {
          id: String(it.id || it.url),
          title: sanitizeSnippet(it.title || '', 100),
          link: String(it.url || ''),
          pubDate: formatted,
          timestamp,
          summary: sanitizeSnippet(it.content_text || it.summary || it.content_html || '', 140),
        };
      });
    } catch {
      return [];
    }
  }

  // Atom 1.0
  if (/<feed[\s\S]*xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/i.test(trimmed) || /<entry[\s\S]*?<\/entry>/i.test(trimmed)) {
    return parseAtomXml(trimmed, limit);
  }

  // RSS 2.0 / 0.9x
  return parseRssXml(trimmed, limit);
}

/**
 * 带有超时熔断的跨源 Feed 抓取器
 */
export async function fetchFeedSafely(feedUrl: string, timeoutMs = 5000): Promise<ParsedFeedItem[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EpoCanvasMomentsBot/2.0; +https://blog.epocanvas.com)',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json',
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    const text = await res.text();
    return parseFeedContent(text);
  } catch (err: any) {
    console.warn(`[FeedFetcher] 抓取源失败 [${feedUrl}]:`, err.message);
    return [];
  }
}
