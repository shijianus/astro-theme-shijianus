import type { LyricLine, MusicTrack, PlayMode, PlayerTab, SleepTimerOption } from './types';

export const PLAYER_STORAGE_KEYS = {
  expanded: 'shijianus-mp-expanded-v1',
  position: 'shijianus-mp-position-v1',
  volume: 'shijianus-mp-volume-v1',
  loop: 'shijianus-mp-loop-v1',
  track: 'shijianus-mp-track-v1',
  favorites: 'shijianus-mp-favorites-v1',
  speed: 'shijianus-mp-speed-v1',
  playback: 'shijianus-mp-playback-v1',
} as const;

export const BUBBLE_SIZE = 48;
export const PANEL_WIDTH = 380;
export const DOCK_SAFE_MARGIN = 12;
export const DEFAULT_PROGRESS_RATIO = 0.32;
export const DISCOVER_PAGE_SIZE = 12;
export const DISCOVER_SEEDS = ['热歌', '流行'] as const;

export const TAB_ORDER: PlayerTab[] = ['player', 'lyrics', 'queue', 'discover'];

export const LOOP_MODES: PlayMode[] = ['list', 'single', 'off'];

export const SPEED_STEPS = [1, 1.25, 1.5, 0.75] as const;

export const SLEEP_OPTIONS: ReadonlyArray<{ value: SleepTimerOption; labelKey: string }> = [
  { value: null, labelKey: '定时休眠已关闭' },
  { value: 15, labelKey: '15分钟后自动暂停' },
  { value: 30, labelKey: '30分钟后自动暂停' },
  { value: 60, labelKey: '60分钟后自动暂停' },
  { value: 'end', labelKey: '当前曲目播完后暂停' },
];

export const SOURCE_LABEL_KEYS: Record<string, string> = {
  local: '精选本地',
  netease: '网易云',
  qq: 'QQ音乐',
  kuwo: '酷我',
};

export const FALLBACK_TRACKS: MusicTrack[] = [
  {
    id: 'local-way-back-home',
    name: 'Way Back Home',
    artist: 'SHAUN (숀)',
    album: 'Take',
    source: 'local',
    coverUrl: '/media/audio/covers/way_back_home.jpg',
    urlId: '/media/audio/WayBackHome.flac',
    duration: 215,
  },
  {
    id: 'local-kanojo',
    name: '彼女は旅に出る',
    artist: '三月のパンタシア',
    album: 'ガールズブルー・ハッピーエンド',
    source: 'local',
    coverUrl: '/media/audio/covers/kanojo_wa_tabi_ni_deru.jpg',
    urlId: '/media/audio/彼女は旅に出る.mp3',
    duration: 252,
  },
  {
    id: 'local-irony',
    name: 'アイロニ',
    artist: 'すりぃ',
    album: 'アイロニ',
    source: 'local',
    coverUrl: '/media/audio/covers/irony_scop.jpg',
    urlId: '/media/audio/アイロニ.mp3',
    duration: 214,
  },
];

export const FALLBACK_LYRICS: LyricLine[] = [
  { time: 0, text: '夜航的星光落在肩上' },
  { time: 18, text: '把未说完的话交给风' },
  { time: 36, text: '愿每一次出发都有回声' },
  { time: 54, text: '在漫长的路上缓慢发光' },
  { time: 72, text: '等清晨把远方重新点亮' },
  { time: 90, text: '让时间沿着旋律继续向前' },
  { time: 108, text: '我们会抵达想去的地方' },
  { time: 126, text: '把此刻留在歌声里' },
  { time: 144, text: '直到下一次相遇' },
  { time: 162, text: '星光仍会落在肩上' },
  { time: 180, text: '让风替我们记住这一夜' },
  { time: 198, text: '慢慢走 也会抵达' },
];
