#!/usr/bin/env node
/**
 * scripts/verify-lyrics-parser.mjs
 *
 * 验证自研 MIT 歌词解析引擎的功能正确性、精度与鲁棒性。
 */

import assert from 'node:assert/strict';
import {
  parseHighPrecisionLrc,
  parseLrc,
  cleanLyricText,
  isLyricMetadataLine,
  estimateVocalDuration,
} from '../src/lib/lyrics-parser.ts';

console.log('[Lyrics Test] 启动自研歌词解析引擎回归验证...');

// Test 1: 空文本与边界防护
{
  const emptyRes = parseHighPrecisionLrc('');
  assert.equal(emptyRes.lines.length, 0);
  assert.equal(emptyRes.syncType, 'line');

  const wsRes = parseHighPrecisionLrc('   \n\n  ');
  assert.equal(wsRes.lines.length, 0);
}
console.log('  -> PASS: 空输入边界测试通过');

// Test 2: 标准单时间戳与多时间戳 LRC
{
  const lrc = `
[ti:青花瓷]
[ar:周杰伦]
[al:我很忙]
[by:shijianus]
[offset:500]
[00:04.20]素胚勾勒出青花笔锋浓转淡
[00:08.50][01:30.00]瓶身描绘的牡丹一如你初妆
[00:12.80]冉冉檀香透过窗心事我了然
`;

  const res = parseHighPrecisionLrc(lrc);
  assert.equal(res.syncType, 'line');
  assert.equal(res.offset, 500);
  // 多时间戳扩展后应该有 4 行（第 2 行有两个时间戳）
  assert.equal(res.lines.length, 4);

  // 第一行时间检验：4.20s + offset 0.5s = 4.70s
  assert.equal(res.lines[0].time, 4.7);
  assert.equal(res.lines[0].text, '素胚勾勒出青花笔锋浓转淡');
  assert.ok(res.lines[0].duration && res.lines[0].duration > 0);

  // 排序检验：00:08.50 扩展出的第一条在 00:12.80 之前，第二条在 01:30.00
  assert.equal(res.lines[1].text, '瓶身描绘的牡丹一如你初妆');
  assert.equal(res.lines[1].time, 9.0); // 8.5 + 0.5
  assert.equal(res.lines[3].time, 90.5); // 90.0 + 0.5
}
console.log('  -> PASS: 标准 LRC 与多时间戳 + offset 校验通过');

// Test 3: YRC 逐字逐音节时间戳解析
{
  const yrc = `
[0,3500](0,500)素(500,600)胚(1100,500)勾(1600,500)勒(2100,400)出(2500,500)青(3000,500)花
[4000,3200](4000,400)笔(4400,600)锋(5000,500)浓(5500,600)转(6100,1100)淡
`;

  const res = parseHighPrecisionLrc(yrc);
  assert.equal(res.syncType, 'word');
  assert.equal(res.lines.length, 2);

  const l1 = res.lines[0];
  assert.equal(l1.time, 0);
  assert.equal(l1.text, '素胚勾勒出青花');
  assert.ok(Array.isArray(l1.words) && l1.words.length === 7);
  assert.equal(l1.words[0].text, '素');
  assert.equal(l1.words[0].start, 0);
  assert.equal(l1.words[0].end, 0.5);
  assert.equal(l1.words[0].duration, 0.5);

  const l2 = res.lines[1];
  assert.equal(l2.time, 4);
  assert.equal(l2.text, '笔锋浓转淡');
  assert.ok(Array.isArray(l2.words) && l2.words.length === 5);
}
console.log('  -> PASS: YRC 逐字高精时间戳解析通过');

// Test 4: Enhanced LRC (ELRC) 逐字解析
{
  const elrc = `
[00:12.00]<00:12.00>天<00:12.50>青<00:13.00>色<00:13.50>等<00:14.00>烟<00:14.50>雨
[00:16.00]<00:16.00>而<00:16.50>我<00:17.00>在<00:17.50>等<00:18.00>你
`;

  const res = parseHighPrecisionLrc(elrc);
  assert.equal(res.syncType, 'word');
  assert.equal(res.lines.length, 2);
  assert.equal(res.lines[0].text, '天青色等烟雨');
  assert.equal(res.lines[0].words?.length, 6);
  assert.equal(res.lines[0].words?.[0].text, '天');
  assert.equal(res.lines[0].words?.[0].start, 12);
}
console.log('  -> PASS: Enhanced LRC 逐字解析通过');

// Test 5: QRC XML 包装解包
{
  const qrc = `<Lyric_1 LyricType="1" LyricContent="[00:02.00]窗外的麻雀在电线杆上多嘴&#10;[00:06.00]你说这一句很有夏天的感觉"/>`;
  const res = parseHighPrecisionLrc(qrc);
  assert.equal(res.lines.length, 2);
  assert.equal(res.lines[0].text, '窗外的麻雀在电线杆上多嘴');
  assert.equal(res.lines[1].text, '你说这一句很有夏天的感觉');
}
console.log('  -> PASS: QRC XML 嵌套格式解包通过');

// Test 6: 元信息过滤与发音预估
{
  assert.equal(isLyricMetadataLine('作词 : 方文山'), true);
  assert.equal(isLyricMetadataLine('作曲: 周杰伦'), true);
  assert.equal(isLyricMetadataLine('编曲 : 钟兴民'), true);
  assert.equal(isLyricMetadataLine('晴天 - 周杰伦'), true);
  assert.equal(isLyricMetadataLine('刮风这天我试过握着你手'), false);

  const dur = estimateVocalDuration('天青色等烟雨', 4.0);
  assert.ok(dur > 1.0 && dur <= 4.0);
}
console.log('  -> PASS: 元信息清洗与发音模型预估通过');

console.log('\n[Lyrics Test] ✓ 所有歌词解析测试 100% 通过！自研引擎完备性验证达成。');
