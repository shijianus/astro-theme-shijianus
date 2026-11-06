import { useCallback, useEffect, useRef, useState } from 'react';
import { MusicApiError, type MusicApi } from '../api';
import { DISCOVER_PAGE_SIZE, DISCOVER_SEEDS } from '../config';
import type { MusicTrack } from '../types';

type UseDiscoverOptions = {
  api: MusicApi;
  enabled: boolean;
};

function cooldownDeadline(resetAt?: number): number {
  if (!resetAt) return Date.now() + 60_000;
  const milliseconds = resetAt < 1_000_000_000_000 ? resetAt * 1000 : resetAt;
  return Math.max(Date.now() + 1000, milliseconds);
}

export function useDiscover({ api, enabled }: UseDiscoverOptions) {
  const [query, setQuery] = useState('');
  const [seed, setSeed] = useState<string>(DISCOVER_SEEDS[0]);
  const [activeTerm, setActiveTerm] = useState<string>(DISCOVER_SEEDS[0]);
  const [results, setResults] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextPage, setNextPage] = useState(1);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const initializedRef = useRef(false);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<MusicTrack[]>([]);
  const cooldownRef = useRef<number | null>(null);

  const runLoad = useCallback(
    async (term: string, page: number, reset: boolean) => {
      if (cooldownRef.current && Date.now() < cooldownRef.current) return;
      const requestId = ++requestIdRef.current;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setLoading(true);
      setError(null);
      if (reset) {
        resultsRef.current = [];
        setResults([]);
        setHasMore(true);
        setNextPage(1);
      }

      try {
        const tracks = await api.loadMore(term, page, DISCOVER_PAGE_SIZE, controller.signal);
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;

        const base = reset ? [] : resultsRef.current;
        const seen = new Set(base.map((track) => track.id));
        const merged = [...base];
        for (const track of tracks) {
          if (!track?.id || seen.has(track.id)) continue;
          seen.add(track.id);
          merged.push(track);
        }
        const added = merged.length - base.length;
        resultsRef.current = merged;
        setResults(merged);
        setHasMore(tracks.length >= DISCOVER_PAGE_SIZE && added > 0);
        setNextPage(page + 1);
      } catch (caught) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        if (caught instanceof MusicApiError && caught.status === 429) {
          const deadline = cooldownDeadline(caught.resetAt);
          cooldownRef.current = deadline;
          setCooldownUntil(deadline);
          setCooldownRemaining(Math.max(1, Math.ceil((deadline - Date.now()) / 1000)));
          setError('请求过于频繁');
        } else {
          setError('搜索请求失败，请稍后重试');
        }
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [api],
  );

  useEffect(() => {
    if (!enabled || initializedRef.current) return;
    initializedRef.current = true;
    void runLoad(activeTerm, 1, true);
  }, [activeTerm, enabled, runLoad]);

  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownRemaining(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        cooldownRef.current = null;
        setCooldownUntil(null);
        // Keep a 429 message when there are no results to retry from the
        // list; a successful request clears it in runLoad.
        if (resultsRef.current.length > 0) setError(null);
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const search = useCallback(
    (text: string) => {
      if (cooldownRef.current && Date.now() < cooldownRef.current) return;
      const term = text.trim() || seed;
      setQuery(text);
      setActiveTerm(term);
      void runLoad(term, 1, true);
    },
    [runLoad, seed],
  );

  const selectSeed = useCallback(
    (nextSeed: string) => {
      if (cooldownRef.current && Date.now() < cooldownRef.current) return;
      setSeed(nextSeed);
      setQuery('');
      setActiveTerm(nextSeed);
      void runLoad(nextSeed, 1, true);
    },
    [runLoad],
  );

  const loadMore = useCallback(() => {
    if (loading || !hasMore || cooldownRemaining > 0) return;
    void runLoad(activeTerm, nextPage, false);
  }, [activeTerm, cooldownRemaining, hasMore, loading, nextPage, runLoad]);

  const retry = useCallback(() => {
    if (loading || cooldownRemaining > 0) return;
    if (results.length === 0) {
      void runLoad(activeTerm, 1, true);
    } else {
      void runLoad(activeTerm, nextPage, false);
    }
  }, [activeTerm, cooldownRemaining, loading, nextPage, results.length, runLoad]);

  return {
    query,
    setQuery,
    seed,
    results,
    loading,
    error,
    hasMore,
    cooldownRemaining,
    search,
    selectSeed,
    loadMore,
    retry,
  };
}
