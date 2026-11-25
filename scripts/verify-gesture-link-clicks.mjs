import assert from 'node:assert/strict';
import { withGuestbook } from './guestbook-test-server.mjs';

await withGuestbook(async ({ page, base, add, db }) => {
  await add('links', '[说明](https://example.org/topic?utm_source=test)');
  await add('reply', '重复 http://example.org/topic/ 与 [站内](/guestbook/#gesture-other)', { parent_id: 'links' });
  await add('other', '真实的关联讨论');
  const detail = async () => (await page.request.get(base + '/api/gestures?id=links&trackView=0')).json();
  let data = await detail();
  assert.equal(data.relatedLinks.length, 2);
  assert.equal(data.relatedLinks[0].type, 'gesture');
  assert.ok(data.relatedLinks.every(link => link.clickCount === 0));
  const link = data.relatedLinks[1];
  const click = (linkKey, token = 'local-click-reader', rootId = 'links') => page.request.post(base + '/api/gestures', {
    data: { action: 'link_click', rootId, linkKey },
    headers: { 'X-Comment-Session-Token': token },
  });
  assert.equal((await click('invented-url')).status(), 404);
  assert.equal((await click(link.clickKey, '', 'links')).status(), 400);
  assert.equal((await click(link.clickKey, 'local-reader', 'other')).status(), 404);
  const responses = await Promise.all(Array.from({ length: 5 }, () => click(link.clickKey)));
  assert.ok(responses.every(response => response.status() === 200));
  data = await detail();
  assert.equal(data.relatedLinks[1].clickCount, 1, 'same-session concurrent clicks are atomic and deduplicated');
  await click(link.clickKey, 'another-reader');
  assert.equal((await detail()).relatedLinks[1].clickCount, 2);
  const stored = await db.prepare('SELECT visitor_hash FROM gesture_link_visits').all();
  assert.ok(stored.results.every(row => /^[a-f0-9]{64}$/.test(row.visitor_hash)));
  await db.prepare("UPDATE comments SET status='deleted' WHERE id='links'").run();
  assert.equal((await click(link.clickKey)).status(), 404);
  await add('pinned_welcome_official', '仍可阅读的正文。', {
    author_role: 'admin', created_at: '2026-08-03T08:15:00.000Z', updated_at: '2026-08-04T10:30:00.000Z',
  });
  await add('reply_floor_2_official', '[已退休的初始化引用](https://example.org/retired)', {
    parent_id: 'pinned_welcome_official', updated_at: '2026-08-03T09:20:00.000Z',
  });
  assert.equal((await click('example.org/retired', 'local-reader', 'pinned_welcome_official')).status(), 200);
  console.log('PASS: real citations only, URL deduplication, internal priority, zero initial counts, atomic session deduplication, hashed visitors, deleted roots rejected and existing stored citations preserved.');
});
