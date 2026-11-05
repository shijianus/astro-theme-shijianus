import { useCallback, useEffect, useRef, useState } from 'react';
import type { MusicApi } from '../api';
import { clamp } from '../lib/audio';
import type { MusicTrack, PlayMode, SleepTimerOption } from '../types';

type NoticeKind = 'info' | 'error';
type ShowNotice = (key: string, kind?: NoticeKind, duration?: number) => void;

type UseAudioControllerOptions = {
  api: MusicApi;
  queue: MusicTrack[];
  currentIndex: number;
  currentTrack: MusicTrack | null;
  loopMode: PlayMode;
  sleepTimer: SleepTimerOption;
  setCurrentIndex: (index: number) => void;
  onSleepTimerConsumed: () => void;
  showNotice: ShowNotice;
};

function absoluteUrl(url: string): string {
  if (!url) return '';
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

export function useAudioController({
  api,
  queue,
  currentIndex,
  currentTrack,
  loopMode,
  sleepTimer,
  setCurrentIndex,
  onSleepTimerConsumed,
  showNotice,
}: UseAudioControllerOptions) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const loadedSrcRef = useRef<string | null>(null);
  const playIntentRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [spectrumAvailable, setSpectrumAvailable] = useState(false);

  const queueRef = useRef(queue);
  const currentIndexRef = useRef(currentIndex);
  const currentTrackRef = useRef(currentTrack);
  const loopModeRef = useRef(loopMode);
  const sleepTimerRef = useRef(sleepTimer);
  const apiRef = useRef(api);
  const setCurrentIndexRef = useRef(setCurrentIndex);
  const showNoticeRef = useRef(showNotice);
  const onSleepTimerConsumedRef = useRef(onSleepTimerConsumed);

  queueRef.current = queue;
  currentIndexRef.current = currentIndex;
  currentTrackRef.current = currentTrack;
  loopModeRef.current = loopMode;
  sleepTimerRef.current = sleepTimer;
  apiRef.current = api;
  setCurrentIndexRef.current = setCurrentIndex;
  showNoticeRef.current = showNotice;
  onSleepTimerConsumedRef.current = onSleepTimerConsumed;

  const ensureAudioGraph = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      if (!audioContextRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) {
          setSpectrumAvailable(false);
          return false;
        }

        const context = new AudioContextClass();
        const analyser = context.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.82;

        const source = context.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(context.destination);

        audioContextRef.current = context;
        analyserRef.current = analyser;
        sourceNodeRef.current = source;
        setSpectrumAvailable(true);
      }

      if (audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
        } catch {
          // Resume is retried on the next explicit play gesture.
        }
      }
      return true;
    } catch {
      setSpectrumAvailable(false);
      return false;
    }
  }, []);

  const playAudio = useCallback(async () => {
    const audio = audioRef.current;
    const track = currentTrackRef.current;
    if (!audio || !track) return;

    if (!audio.getAttribute('src')) {
      const src = absoluteUrl(apiRef.current.streamUrl(track));
      if (src) {
        loadedSrcRef.current = src;
        audio.src = src;
        audio.load();
      }
    }

    await ensureAudioGraph();

    if (audio.ended) {
      try {
        audio.currentTime = 0;
      } catch {}
      setCurrentTime(0);
    }

    playIntentRef.current = true;
    try {
      await audio.play();
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'AbortError') return;

      playIntentRef.current = false;
      setIsPlaying(false);
      setIsBuffering(false);
      showNoticeRef.current(
        name === 'NotAllowedError' ? '浏览器阻止了自动播放，请点击播放' : '播放失败，请点击播放重试',
        'error',
        5000,
      );
    }
  }, [ensureAudioGraph]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrackRef.current) return;

    if (audio.paused) {
      void ensureAudioGraph();
      void playAudio();
    } else {
      playIntentRef.current = false;
      audio.pause();
    }
  }, [ensureAudioGraph, playAudio]);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const max = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : time;
    const nextTime = clamp(time, 0, max);
    try {
      audio.currentTime = nextTime;
    } catch {}
    setCurrentTime(nextTime);
  }, []);

  const selectTrack = useCallback(
    (index: number) => {
      const audio = audioRef.current;
      const length = queueRef.current.length;
      if (!audio || length === 0) return;

      const nextIndex = clamp(index, 0, length - 1);
      void ensureAudioGraph();

      if (nextIndex === currentIndexRef.current) {
        if (audio.paused) void playAudio();
        return;
      }

      playIntentRef.current = true;
      setIsPlaying(true);
      setCurrentTime(0);
      setCurrentIndexRef.current(nextIndex);
    },
    [ensureAudioGraph, playAudio],
  );

  const skipTrack = useCallback(
    (direction: 1 | -1) => {
      const audio = audioRef.current;
      const length = queueRef.current.length;
      if (!audio || length === 0) return;

      void ensureAudioGraph();
      const index = currentIndexRef.current;
      const nextIndex = (index + direction + length) % length;

      if (length === 1 || nextIndex === index) {
        try {
          audio.currentTime = 0;
        } catch {}
        setCurrentTime(0);
        void playAudio();
        return;
      }

      playIntentRef.current = true;
      setIsPlaying(true);
      setCurrentTime(0);
      setCurrentIndexRef.current(nextIndex);
    },
    [ensureAudioGraph, playAudio],
  );

  const armAutoplay = useCallback(() => {
    playIntentRef.current = true;
    setIsPlaying(true);
    void ensureAudioGraph();
  }, [ensureAudioGraph]);

  const pausePlayback = useCallback(() => {
    playIntentRef.current = false;
    const audio = audioRef.current;
    if (audio && !audio.paused) audio.pause();
    setIsPlaying(false);
  }, []);

  const stopAndClear = useCallback(() => {
    playIntentRef.current = false;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      try {
        audio.load();
      } catch {}
    }
    loadedSrcRef.current = null;
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsBuffering(false);
  }, []);

  // Load the current track's source without autoplay unless the user has
  // already asked for playback. This is what keeps refresh paused.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      stopAndClear();
      return;
    }

    const src = absoluteUrl(api.streamUrl(currentTrack));
    if (!src || loadedSrcRef.current === src) return;

    loadedSrcRef.current = src;
    audio.pause();
    audio.src = src;
    audio.load();
    setCurrentTime(0);
    setDuration(currentTrack.duration ?? 0);
    setIsBuffering(playIntentRef.current);

    if (playIntentRef.current) {
      void playAudio();
    }
  }, [api, currentTrack, playAudio, stopAndClear]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const onPause = () => {
      // A source swap pauses the old media; keep the intended playing state
      // until the new source reports play (or fails).
      setIsPlaying(playIntentRef.current);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const onDurationChange = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      onDurationChange();
      setIsBuffering(false);
    };

    const onWaiting = () => {
      if (!audio.paused) setIsBuffering(true);
    };

    const onPlaying = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const onCanPlay = () => {
      setIsBuffering(false);
      onDurationChange();
    };

    const onError = () => {
      if (!audio.getAttribute('src') || !currentTrackRef.current) return;
      playIntentRef.current = false;
      setIsPlaying(false);
      setIsBuffering(false);
      showNoticeRef.current('音频加载遇到问题，请重试', 'error', 5000);
    };

    const onEnded = () => {
      const currentQueue = queueRef.current;
      const index = currentIndexRef.current;

      if (sleepTimerRef.current === 'end') {
        onSleepTimerConsumedRef.current();
        playIntentRef.current = false;
        setIsPlaying(false);
        setIsBuffering(false);
        showNoticeRef.current('定时休眠已到达，播放已暂停', 'info', 5000);
        return;
      }

      if (loopModeRef.current === 'single') {
        try {
          audio.currentTime = 0;
        } catch {}
        setCurrentTime(0);
        void playAudio();
        return;
      }

      if (currentQueue.length === 0) {
        playIntentRef.current = false;
        setIsPlaying(false);
        return;
      }

      if (loopModeRef.current === 'off' && index >= currentQueue.length - 1) {
        playIntentRef.current = false;
        setIsPlaying(false);
        setCurrentTime(audio.duration || 0);
        showNoticeRef.current('播放已结束', 'info', 3000);
        return;
      }

      const nextIndex = (index + 1) % currentQueue.length;
      if (currentQueue.length === 1 || nextIndex === index) {
        try {
          audio.currentTime = 0;
        } catch {}
        setCurrentTime(0);
        void playAudio();
        return;
      }

      playIntentRef.current = true;
      setIsPlaying(true);
      setCurrentTime(0);
      setCurrentIndexRef.current(nextIndex);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
    };
  }, [playAudio]);

  useEffect(() => {
    return () => {
      try {
        sourceNodeRef.current?.disconnect();
      } catch {}
      try {
        void audioContextRef.current?.close();
      } catch {}
      audioContextRef.current = null;
      analyserRef.current = null;
      sourceNodeRef.current = null;
    };
  }, []);

  return {
    audioRef,
    analyserRef,
    isPlaying,
    currentTime,
    duration,
    isBuffering,
    spectrumAvailable,
    ensureAudioGraph,
    togglePlay,
    seekTo,
    selectTrack,
    skipTrack,
    armAutoplay,
    pausePlayback,
    stopAndClear,
  };
}
