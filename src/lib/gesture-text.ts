export const BOOST_LIMIT = 16;
const graphemes = new Intl.Segmenter('und', { granularity: 'grapheme' });

export function boostLength(value: string) {
  return Array.from(graphemes.segment(value.trim())).length;
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
