import { useCallback, useEffect, useRef, useState } from 'react';
import { parseLrcLike, parseYrc } from '@applemusic-like-lyrics/lyric';
import type { MusicApi, LyricPayload } from '../api';
import { FALLBACK_LYRICS } from '../config';
import { findActiveLyricIndex } from '../lib/lyrics';
import type { LyricLine, LyricsStatus, MusicTrack } from '../types';

type UseLyricsOptions = {
  api: MusicApi;
  track: MusicTrack | null;
  currentTime: number;
  skip?: boolean;
};

type AmllLine = {
  startTime?: number;
  endTime?: number;
  words?: Array<{ word?: string }>;
  text?: string;
};

type ServerLine = {
  time?: number;
  timeSec?: number;
  text?: string;
  words?: Array<{ word?: string }>;
};

function secondsFromServerLine(line: ServerLine): number {
  if (typeof line.timeSec === 'number' && Number.isFinite(line.timeSec)) return line.timeSec;
  if (typeof line.time === 'number' && Number.isFinite(line.time)) return line.time / 1000;
  return 0;
}

function serverLineText(line: ServerLine): string {
  if (typeof line.text === 'string' && line.text.trim()) return line.text.trim();
  if (Array.isArray(line.words)) {
    return line.words.map((word) => word.word || '').join('').trim();
  }
  return '';
}

function normalizeServerLines(value: unknown): LyricLine[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((line): line is ServerLine => Boolean(line && typeof line === 'object'))
    .map((line) => ({ time: secondsFromServerLine(line), text: serverLineText(line) }))
    .filter((line) => line.text.length > 0)
    .sort((a, b) => a.time - b.time);
}

function normalizeAmllLines(lines: AmllLine[]): LyricLine[] {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((line) => {
      const text =
        typeof line.text === 'string' && line.text.trim()
          ? line.text.trim()
          : (line.words || []).map((word) => word.word || '').join('').trim();
      const time = typeof line.startTime === 'number' ? line.startTime / 1000 : 0;
      return { time, text };
    })
    .filter((line) => line.text.length > 0)
    .sort((a, b) => a.time - b.time);
}

function parseRawLyrics(raw: string): LyricLine[] {
  if (!raw || !raw.trim()) return [];
  try {
    if (/^\[\d+,\d+\]/m.test(raw)) {
      return normalizeAmllLines(parseYrc(raw) as unknown as AmllLine[]);
    }
    return normalizeAmllLines(parseLrcLike(raw).lines as unknown as AmllLine[]);
  } catch {
    return [];
  }
}

function parseLyricPayload(payload: LyricPayload): { lines: LyricLine[]; status: LyricsStatus } {
  if (payload.isPureMusic) {
    return { lines: [], status: 'instrumental' };
  }

  const parsedLines = normalizeServerLines(payload.parsed);
  if (parsedLines.length > 0) {
    return { lines: parsedLines, status: 'ready' };
  }

  const enhancedLines = parseRawLyrics(payload.elrc || '');
  if (enhancedLines.length > 0) {
    return { lines: enhancedLines, status: 'ready' };
  }

  const raw = payload.rawLyric || payload.lyric || payload.lrc || '';
  const rawLines = parseRawLyrics(raw);
  if (rawLines.length > 0) {
    return { lines: rawLines, status: 'ready' };
  }

  if (/纯音乐/i.test(raw)) {
    return { lines: [], status: 'instrumental' };
  }

  return { lines: [], status: 'empty' };
}

export function useLyrics({ api, track, currentTime, skip = false }: UseLyricsOptions) {
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [status, setStatus] = useState<LyricsStatus>('idle');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retryToken, setRetryToken] = useState(0);
  const activeIndexRef = useRef(-1);

  useEffect(() => {
    if (!track) {
      setLines([]);
      setStatus('idle');
      setActiveIndex(-1);
      activeIndexRef.current = -1;
      return;
    }

    if (skip) {
      setLines(FALLBACK_LYRICS);
      setStatus('ready');
      setActiveIndex(-1);
      activeIndexRef.current = -1;
      return;
    }

    const controller = new AbortController();
    setLines([]);
    setStatus('loading');
    setActiveIndex(-1);
    activeIndexRef.current = -1;

    api
      .lyric(track, undefined, controller.signal)
      .then((payload) => {
        if (controller.signal.aborted) return;
        const parsed = parseLyricPayload(payload);
        setLines(parsed.lines);
        setStatus(parsed.status);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLines([]);
        setStatus('error');
      });

    return () => controller.abort();
  }, [api, retryToken, skip, track]);

  useEffect(() => {
    if (status !== 'ready' || lines.length === 0) {
      if (activeIndexRef.current !== -1) {
        activeIndexRef.current = -1;
        setActiveIndex(-1);
      }
      return;
    }

    const nextIndex = findActiveLyricIndex(lines, currentTime);
    if (nextIndex !== activeIndexRef.current) {
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }
  }, [currentTime, lines, status]);

  const retry = useCallback(() => {
    setRetryToken((value) => value + 1);
  }, []);

  return { lines, status, activeIndex, retry };
}

export type { LyricsStatus };
