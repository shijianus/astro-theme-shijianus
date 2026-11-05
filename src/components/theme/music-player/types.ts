export type PlayerTab = 'player' | 'lyrics' | 'queue' | 'discover';

export type PlayMode = 'list' | 'single' | 'off';

export type SleepTimerOption = null | 'end' | 15 | 30 | 60;

export type MusicTrack = {
  id: string;
  name: string;
  artist: string;
  album?: string;
  source: string;
  coverUrl?: string;
  urlId?: string;
  lyricId?: string;
  duration?: number;
};

export type LyricLine = {
  time: number;
  text: string;
};

export type TFunction = (text: string) => string;
