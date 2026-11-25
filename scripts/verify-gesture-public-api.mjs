import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

assert.ok(process.env.GESTURE_BASE_URL);
const production = 'https://blog.epocanvas.com';
const preview = new URL(process.env.GESTURE_BASE_URL).origin;
const responses = await Promise.all([production, preview].map(base => fetch(base + '/api/comments?slug=guestbook', {
  signal: AbortSignal.timeout(60000),
})));
for (const response of responses) assert.equal(response.status, 200);
const [original, restored] = await Promise.all(responses.map(response => response.json()));
assert.ok(original.ok && restored.ok);
const normalize = data => data.comments.map(({ id, postType, message, parentId }) => ({
  id, postType, message, parentId,
})).sort((a, b) => a.id.localeCompare(b.id));
assert.deepEqual(normalize(restored), normalize(original));
const result = { production, preview, samePublicPostsAndBoosts: true,
  comments: restored.comments.length,
  boosts: restored.comments.filter(row => row.postType === 'boost').length };
await writeFile('reports/gesture-scope-correction-20261123/public-api.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
