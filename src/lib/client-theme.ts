export type ThemeMode = 'light' | 'dark';
export type AsideState = 'expanded' | 'collapsed';
export type BackgroundSource = 'auto' | 'manual';

type BackgroundStrategy = {
  defaultBackground: string;
  darkBackground: string;
};

const BACKGROUND_KEY = 'shijianus-background';
const BACKGROUND_SOURCE_KEY = 'shijianus-background-source';

function normalizeBackgroundSource(value: string | null | undefined): BackgroundSource | null {
  if (value === 'auto' || value === 'manual') return value;
  return null;
}

export function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

export function syncTheme(nextTheme: ThemeMode) {
  document.documentElement.dataset.theme = nextTheme;
  writeStorage('shijianus-theme', nextTheme);
  window.dispatchEvent(new CustomEvent('shijianus:themechange', { detail: nextTheme }));
}

export function syncAside(nextAside: AsideState) {
  document.documentElement.dataset.aside = nextAside;
  writeStorage('shijianus-aside', nextAside);
}

export function syncBackground(nextBackground: string) {
  document.documentElement.dataset.background = nextBackground;
  writeStorage(BACKGROUND_KEY, nextBackground);
  window.dispatchEvent(new CustomEvent('shijianus:backgroundchange', { detail: nextBackground }));
}

export function syncBackgroundWithSource(nextBackground: string, source: BackgroundSource) {
  document.documentElement.dataset.backgroundSource = source;
  writeStorage(BACKGROUND_SOURCE_KEY, source);
  syncBackground(nextBackground);
}

export function resolveBackgroundSource(
  storedBackground: string | null,
  storedSource: string | null,
  strategy: BackgroundStrategy,
) {
  const normalizedSource = normalizeBackgroundSource(storedSource);
  if (normalizedSource) return normalizedSource;
  if (!storedBackground) return 'auto';
  if (storedBackground === strategy.defaultBackground || storedBackground === strategy.darkBackground) return 'auto';
  return 'manual';
}

export function resolveInitialBackground(
  theme: ThemeMode,
  storedBackground: string | null,
  strategy: BackgroundStrategy,
  source?: BackgroundSource,
) {
  const backgroundSource = source ?? resolveBackgroundSource(storedBackground, null, strategy);
  if (backgroundSource === 'manual' && storedBackground) return storedBackground;
  return theme === 'dark' ? strategy.darkBackground : strategy.defaultBackground;
}

export function resolveThemeAwareBackground(
  theme: ThemeMode,
  currentBackground: string,
  strategy: BackgroundStrategy,
  source: BackgroundSource,
) {
  if (source === 'manual') return currentBackground;
  return theme === 'dark' ? strategy.darkBackground : strategy.defaultBackground;
}

export function applyThemeWithBackground(nextTheme: ThemeMode, strategy: BackgroundStrategy) {
  const currentBackground =
    readStorage(BACKGROUND_KEY) ??
    document.documentElement.dataset.background ??
    strategy.defaultBackground;
  const backgroundSource = resolveBackgroundSource(
    currentBackground,
    readStorage(BACKGROUND_SOURCE_KEY) ?? document.documentElement.dataset.backgroundSource ?? null,
    strategy,
  );
  const nextBackground = resolveThemeAwareBackground(nextTheme, currentBackground, strategy, backgroundSource);

  syncTheme(nextTheme);
  syncBackgroundWithSource(nextBackground, backgroundSource);
  return nextBackground;
}

export function markBackgroundAsManual(nextBackground: string) {
  syncBackgroundWithSource(nextBackground, 'manual');
}
