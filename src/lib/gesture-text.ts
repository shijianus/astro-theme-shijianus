export const BOOST_LIMIT = 16;
const graphemes = new Intl.Segmenter('und', { granularity: 'grapheme' });

const LEGACY_STARTER_FAKE_REFS_RE =
  /[ \t]*相关参考：\[博客功能与内容格式指南\]\(\/posts\/content-formats-and-markup-mastery\/\)\s*与\s*\[社区规范与等级体系\]\(\/community\/identity-levels-and-badges\/\)。?/g;

const LEGACY_STARTER_OVERLONG_BOOST = '星空背景太帅了！毛玻璃透出质感绝佳';
const CLEAN_STARTER_BOOST = '星空背景太帅，毛玻璃质感绝佳！';

export function boostLength(value: string) {
  return Array.from(graphemes.segment(value.trim())).length;
}

export function truncateBoost(value: string, limit = BOOST_LIMIT): string {
  const singleLine = value.replace(/[\r\n\u2028\u2029]+/gu, ' ').trim();
  const segments = Array.from(graphemes.segment(singleLine), (item) => item.segment);
  if (segments.length <= limit) return singleLine;
  return segments.slice(0, limit).join('');
}

export function normalizeBoostDisplay(content: string, id?: string): string {
  const trimmed = (content || '').trim();
  if (id === 'boost_detail_op_2' && trimmed === LEGACY_STARTER_OVERLONG_BOOST) {
    return CLEAN_STARTER_BOOST;
  }
  if (trimmed === LEGACY_STARTER_OVERLONG_BOOST) {
    return CLEAN_STARTER_BOOST;
  }
  return truncateBoost(trimmed, BOOST_LIMIT);
}

export function stripLegacyFakeWelcomeRefs(id: string | undefined, message: string): string {
  if (id !== 'pinned_welcome_official' || !message) return message;
  return message
    .replace(LEGACY_STARTER_FAKE_REFS_RE, '')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

export function validBoost(value: string) {
  return Boolean(value.trim()) && !/[\r\n\u2028\u2029]/u.test(value) && boostLength(value) <= BOOST_LIMIT;
}

export function parseGestureHash(hash: string) {
  const m = /^#gesture-([\w-]+?)(?:-floor-(\d+)(?:~([\w-]+))?)?$/.exec(hash);
  return m ? { id: m[1], floor: Math.max(1, Number(m[2]) || 1), postId: m[3] } : null;
}

// SQLite CURRENT_TIMESTAMP has no offset and always represents UTC.
export function gestureTimestamp(value: string) {
  return /^\d{4}-\d\d-\d\d[ T]\d\d:\d\d:\d\d(?:\.\d+)?$/.test(value)
    ? value.replace(' ', 'T') + 'Z' : value;
}
