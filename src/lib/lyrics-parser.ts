/**
 * src/lib/lyrics-parser.ts
 *
 * 高精度现代歌词解析引擎 (High-Precision Music Lyrics Parser)
 * 许可证: MIT (宽松开源，零 AGPL 传染风险)
 *
 * 核心功能：
 * 1. 标准 LRC / 多时间戳行级解析：[00:12.34][00:45.67]歌词文本；
 * 2. YRC 逐字逐音节时间戳解析：[startMs,durMs](wStart,wDur)字(wStart,wDur)字...；
 * 3. Enhanced LRC (ELRC) 逐字时间戳：[00:12.34]<00:12.34>字 <00:12.80>字；
 * 4. QRC XML 包装格式与 NetEase JSON 结构化歌词自适应解包；
 * 5. 毫秒级时间偏移量补偿 [offset:+/-ms]；
 * 6. 基于人声自然发音语速声学模型的自然发音时长与间隙预估。
 */

export type LyricSyncType = 'none' | 'line' | 'word';

export interface LyricWord {
  text: string;
  start: number;
  end: number;
  duration?: number;
  startSec?: number;
  endSec?: number;
  durationSec?: number;
}

export interface LyricLine {
  time: number;
  text: string;
  words?: LyricWord[];
  duration?: number;
  timeSec?: number;
  durationSec?: number;
}

export interface HighPrecisionLyricResult {
  syncType: LyricSyncType;
  offset: number;
  lines: LyricLine[];
}

/**
 * 过滤与清洗歌词中的时间戳标记
 */
export function cleanLyricText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '')
    .replace(/<[\d.,\s]+>/g, '')
    .replace(/\([\d.,\s]+\)/g, '')
    .trim();
}

/**
 * 判断是否为非演唱正文的元信息行（如编曲、词曲作者、歌曲名等）
 */
export function isLyricMetadataLine(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (
    /^(作词|作曲|编曲|词|曲|制作|制作人|监制|录音|混音|母带|吉他|贝斯|鼓|和声|弦乐|企划|统筹|OP|SP|演唱|原唱|歌手|专辑|发行|出品|Written|Composed|Arranged|Produced|Lyrics|Music|Vocal|Singer)\s*[:：]/i.test(
      trimmed
    )
  ) {
    return true;
  }
  // 过滤歌曲名/歌手名标题行（如 "青花瓷 - 周杰伦" 或 "Song - Artist"）
  if (/^[^-–—]+[-–—][^-–—]+$/.test(trimmed) && trimmed.length < 50) {
    return true;
  }
  return false;
}

/**
 * 估算行级普通歌词的发音持续时长（避免无持续时间时高亮闪烁）
 */
export function estimateVocalDuration(text: string, gapSec: number): number {
  const clean = text
    .replace(/\[[^\]]+\]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\([^)]+\)/g, '')
    .trim();
  if (!clean) return Math.min(gapSec > 0 ? gapSec : 2.5, 2.0);
  const vocalChars = clean.replace(/[\s\p{P}\p{S}]/gu, '').length;
  const count = Math.max(1, vocalChars);
  const naturalDuration = Math.max(1.2, count * 0.24 + 0.35);
  if (gapSec <= 0) return naturalDuration;
  if (naturalDuration >= gapSec - 0.2) {
    return Math.max(0.4, Math.min(gapSec, gapSec - 0.15));
  }
  return Math.min(gapSec - 0.25, naturalDuration);
}

/**
 * 统一度量衡归一化歌词行数据
 */
export function normalizeLyricLines(rawLines: LyricLine[]): LyricLine[] {
  if (!Array.isArray(rawLines)) return [];
  const valid = rawLines.filter((line) => line && typeof line.text === 'string' && line.text.trim());
  if (valid.length === 0) return [];

  return valid
    .map((line) => {
      let timeSec: number;
      if (typeof line.timeSec === 'number' && !Number.isNaN(line.timeSec)) {
        timeSec = line.timeSec > 1000 ? line.timeSec / 1000 : line.timeSec;
      } else if (typeof line.time === 'number' && !Number.isNaN(line.time)) {
        timeSec = line.time > 1000 ? line.time / 1000 : line.time;
      } else {
        timeSec = 0;
      }
      timeSec = Math.max(0, parseFloat(timeSec.toFixed(3)));

      let durSec: number | undefined;
      if (typeof line.durationSec === 'number' && !Number.isNaN(line.durationSec)) {
        durSec = line.durationSec > 60 ? line.durationSec / 1000 : line.durationSec;
      } else if (typeof line.duration === 'number' && !Number.isNaN(line.duration)) {
        durSec = line.duration > 45 ? line.duration / 1000 : line.duration;
      }
      if (typeof durSec === 'number') {
        durSec = Math.max(0.1, parseFloat(durSec.toFixed(3)));
      }

      let words: LyricWord[] | undefined;
      if (Array.isArray(line.words) && line.words.length > 0) {
        words = line.words.map((w) => {
          let wStartSec: number;
          if (typeof w.startSec === 'number' && !Number.isNaN(w.startSec)) {
            wStartSec = w.startSec > 1000 ? w.startSec / 1000 : w.startSec;
          } else if (typeof w.start === 'number' && !Number.isNaN(w.start)) {
            const isMs = w.start > 600 || (typeof w.duration === 'number' && w.duration > 20);
            wStartSec = isMs ? w.start / 1000 : w.start;
          } else {
            wStartSec = timeSec;
          }
          wStartSec = Math.max(0, parseFloat(wStartSec.toFixed(3)));

          let wEndSec: number;
          if (typeof w.endSec === 'number' && !Number.isNaN(w.endSec)) {
            wEndSec = w.endSec > 1000 ? w.endSec / 1000 : w.endSec;
          } else if (typeof w.end === 'number' && !Number.isNaN(w.end)) {
            const isMs = w.end > 600 || (typeof w.duration === 'number' && w.duration > 20);
            wEndSec = isMs ? w.end / 1000 : w.end;
          } else if (typeof w.durationSec === 'number' && !Number.isNaN(w.durationSec)) {
            const d = w.durationSec > 20 ? w.durationSec / 1000 : w.durationSec;
            wEndSec = wStartSec + d;
          } else if (typeof w.duration === 'number' && !Number.isNaN(w.duration)) {
            const d = w.duration > 20 ? w.duration / 1000 : w.duration;
            wEndSec = wStartSec + d;
          } else {
            wEndSec = wStartSec + 0.3;
          }
          wEndSec = Math.max(wStartSec + 0.01, parseFloat(wEndSec.toFixed(3)));
          const wDurSec = Math.max(0.01, parseFloat((wEndSec - wStartSec).toFixed(3)));

          return {
            text: String(w.text || ''),
            start: wStartSec,
            end: wEndSec,
            duration: wDurSec,
            startSec: wStartSec,
            endSec: wEndSec,
            durationSec: wDurSec,
          };
        });
      }

      return {
        time: timeSec,
        timeSec,
        duration: durSec,
        durationSec: durSec,
        text: line.text.trim(),
        words: words && words.length > 0 ? words : undefined,
      };
    })
    .sort((a, b) => a.time - b.time);
}

/**
 * 解析高精度歌词文本（支持 YRC、Enhanced LRC、QRC XML、NetEase JSON 与标准 LRC）
 */
export function parseHighPrecisionLrc(raw: string): HighPrecisionLyricResult {
  if (!raw || !raw.trim()) {
    return { syncType: 'line', offset: 0, lines: [] };
  }

  let offsetSec = 0;
  const offsetMatch = raw.match(/\[offset:\s*([+-]?\d+)\]/i);
  if (offsetMatch) {
    offsetSec = (parseInt(offsetMatch[1], 10) || 0) / 1000;
  }

  let cleanInput = raw;
  const qrcXmlMatch = raw.match(/<Lyric_1[^>]*LyricContent="([^"]+)"/i);
  if (qrcXmlMatch) {
    cleanInput = qrcXmlMatch[1]
      .replace(/&#10;/gi, '\n')
      .replace(/&#13;/gi, '\r')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'");
  }

  const rawLines = cleanInput.split('\n');
  const result: LyricLine[] = [];
  let hasWordTimestamps = false;

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^\[(ti|ar|al|by|offset|kana|re|ve|hash|sign|qq|total):/i.test(line)) continue;

    // 1. JSON 格式行 (NetEase / smart-lyric)
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        const json = JSON.parse(line);
        if (Array.isArray(json.c)) {
          let lineText = '';
          const words: LyricWord[] = [];
          let hasWordInfo = false;
          const lineBaseSec = (typeof json.t === 'number' ? json.t : 0) / 1000;

          for (const item of json.c) {
            const tx = item.tx || '';
            lineText += tx;
            if (typeof item.t === 'number' && typeof item.d === 'number') {
              hasWordInfo = true;
              const wStartSec = Math.max(0, item.t / 1000 + offsetSec);
              const wDurSec = Math.max(0, item.d / 1000);
              words.push({
                text: tx,
                start: wStartSec,
                end: wStartSec + wDurSec,
                duration: wDurSec,
                startSec: wStartSec,
                endSec: wStartSec + wDurSec,
                durationSec: wDurSec,
              });
            }
          }

          const cleanText = lineText.trim();
          if (!cleanText || isLyricMetadataLine(cleanText)) continue;

          if (hasWordInfo && words.length > 0) hasWordTimestamps = true;
          const lineTimeSec = words.length > 0 ? words[0].start : Math.max(0, lineBaseSec + offsetSec);
          const lineDurSec = words.length > 0 ? words[words.length - 1].end - lineTimeSec : undefined;

          result.push({
            time: lineTimeSec,
            timeSec: lineTimeSec,
            duration: lineDurSec,
            durationSec: lineDurSec,
            text: cleanText,
            words: words.length > 0 ? words : undefined,
          });
          continue;
        }
      } catch {
        // 继续向下尝试其他格式
      }
    }

    // 2. 匹配 YRC 格式：[lineStartMs,lineDurMs](wordStart,wordDur)word...
    const yrcMatch = line.match(/^\[(\d+),(\d+)\](.*)$/);
    if (yrcMatch) {
      const lineStartSec = Math.max(0, parseInt(yrcMatch[1], 10) / 1000 + offsetSec);
      const lineDurSec = parseInt(yrcMatch[2], 10) / 1000;
      const content = yrcMatch[3];

      const words: LyricWord[] = [];
      const wordRegex = /\((\d+),(\d+)(?:,\d+)?\)([^(]+)/g;
      let wMatch: RegExpExecArray | null;
      let lineText = '';

      while ((wMatch = wordRegex.exec(content)) !== null) {
        let wStartMs = parseInt(wMatch[1], 10);
        const wDurMs = parseInt(wMatch[2], 10);
        const wText = wMatch[3];

        if (wStartMs < parseInt(yrcMatch[1], 10) && wStartMs < 60000) {
          wStartMs = parseInt(yrcMatch[1], 10) + wStartMs;
        }

        const wStartSec = Math.max(0, wStartMs / 1000 + offsetSec);
        const wDurSec = Math.max(0, wDurMs / 1000);
        words.push({
          text: wText,
          start: wStartSec,
          end: wStartSec + wDurSec,
          duration: wDurSec,
          startSec: wStartSec,
          endSec: wStartSec + wDurSec,
          durationSec: wDurSec,
        });
        lineText += wText;
      }

      const cleanText = lineText.trim();
      if (cleanText && !isLyricMetadataLine(cleanText)) {
        if (words.length > 0) hasWordTimestamps = true;
        result.push({
          time: lineStartSec,
          timeSec: lineStartSec,
          duration: lineDurSec > 0 ? lineDurSec : undefined,
          durationSec: lineDurSec > 0 ? lineDurSec : undefined,
          text: cleanText,
          words: words.length > 0 ? words : undefined,
        });
        continue;
      }
    }

    // 3. 匹配标准 LRC 及 Enhanced LRC
    const timeTagRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;
    const timeMatches: number[] = [];
    let tMatch: RegExpExecArray | null;

    while ((tMatch = timeTagRegex.exec(line)) !== null) {
      const mins = parseInt(tMatch[1], 10);
      const secs = parseInt(tMatch[2], 10);
      const ms = tMatch[3] ? parseInt(tMatch[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const timeSec = Math.max(0, mins * 60 + secs + ms / 1000 + offsetSec);
      timeMatches.push(parseFloat(timeSec.toFixed(3)));
    }

    // 提取行内字级时间戳：<mm:ss.xxx>字 或 (start,duration)字
    const lineWords: LyricWord[] = [];
    const textWithoutTimeTags = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '');

    const angleTagRegex = /<(\d{2}:\d{2}(?:\.\d{2,3})?|\d+(?:\.\d+)?)>(?:<(\d+(?:\.\d+)?)>)?([^<]+)/g;
    let angleMatch: RegExpExecArray | null;

    while ((angleMatch = angleTagRegex.exec(textWithoutTimeTags)) !== null) {
      let wStartSec = 0;
      const timeStr = angleMatch[1];
      if (timeStr.includes(':')) {
        const parts = timeStr.split(':');
        wStartSec = parseInt(parts[0], 10) * 60 + parseFloat(parts[1]) + offsetSec;
      } else {
        const num = parseFloat(timeStr);
        wStartSec = (num > 600 ? num / 1000 : num) + offsetSec;
      }
      wStartSec = Math.max(0, parseFloat(wStartSec.toFixed(3)));

      const durStr = angleMatch[2];
      const wDurSec = durStr ? Math.max(0.01, parseFloat(durStr)) : 0.3;
      const wText = angleMatch[3];

      lineWords.push({
        text: wText,
        start: wStartSec,
        end: wStartSec + wDurSec,
        duration: wDurSec,
        startSec: wStartSec,
        endSec: wStartSec + wDurSec,
        durationSec: wDurSec,
      });
    }

    // 备用：括号字时间戳 (startMs,durMs)字
    if (lineWords.length === 0 && /\(\d+,\d+\)/.test(textWithoutTimeTags)) {
      const parenRegex = /\((\d+),(\d+)\)([^(]+)/g;
      let pMatch: RegExpExecArray | null;
      while ((pMatch = parenRegex.exec(textWithoutTimeTags)) !== null) {
        const wStartSec = Math.max(0, parseInt(pMatch[1], 10) / 1000 + offsetSec);
        const wDurSec = Math.max(0.01, parseInt(pMatch[2], 10) / 1000);
        lineWords.push({
          text: pMatch[3],
          start: wStartSec,
          end: wStartSec + wDurSec,
          duration: wDurSec,
          startSec: wStartSec,
          endSec: wStartSec + wDurSec,
          durationSec: wDurSec,
        });
      }
    }

    const plainText = textWithoutTimeTags
      .replace(/<[^>]+>/g, '')
      .replace(/\([^)]+\)/g, '')
      .trim();

    if (!plainText || isLyricMetadataLine(plainText)) continue;

    if (lineWords.length > 0) {
      hasWordTimestamps = true;
    }

    if (timeMatches.length > 0) {
      for (const t of timeMatches) {
        result.push({
          time: t,
          timeSec: t,
          text: plainText,
          words: lineWords.length > 0 ? lineWords : undefined,
        });
      }
    } else if (lineWords.length > 0) {
      const lineStart = lineWords[0].start;
      result.push({
        time: lineStart,
        timeSec: lineStart,
        duration: lineWords[lineWords.length - 1].end - lineStart,
        durationSec: lineWords[lineWords.length - 1].end - lineStart,
        text: plainText,
        words: lineWords,
      });
    }
  }

  result.sort((a, b) => a.time - b.time);

  // 为普通行级歌词计算发音时长，保留间歇呼吸
  for (let i = 0; i < result.length; i++) {
    const cur = result[i];
    if (!cur.duration) {
      const next = result[i + 1];
      const gap = next ? next.time - cur.time : 4.5;
      cur.duration = estimateVocalDuration(cur.text, gap);
    }
    cur.durationSec = cur.duration;
  }

  return {
    syncType: hasWordTimestamps ? 'word' : 'line',
    offset: Math.round(offsetSec * 1000),
    lines: normalizeLyricLines(result),
  };
}

/**
 * 便捷导出纯行数组
 */
export function parseLrc(raw: string): LyricLine[] {
  return parseHighPrecisionLrc(raw).lines;
}
