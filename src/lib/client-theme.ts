export type ThemeMode = 'light' | 'dark';
export type AsideState = 'expanded' | 'collapsed';

type BackgroundStrategy = {
  defaultBackground: string;
  darkBackground: string;
};

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
  writeStorage('shijianus-background', nextBackground);
  window.dispatchEvent(new CustomEvent('shijianus:backgroundchange', { detail: nextBackground }));
}

export function resolveThemeAwareBackground(theme: ThemeMode, currentBackground: string, strategy: BackgroundStrategy) {
  if (theme === 'dark' && currentBackground === strategy.defaultBackground) return strategy.darkBackground;
  if (theme === 'light' && currentBackground === strategy.darkBackground) return strategy.defaultBackground;
  return currentBackground;
}

export function resolveInitialBackground(theme: ThemeMode, storedBackground: string | null, strategy: BackgroundStrategy) {
  if (storedBackground) return storedBackground;
  return theme === 'dark' ? strategy.darkBackground : strategy.defaultBackground;
}

export function applyThemeWithBackground(nextTheme: ThemeMode, strategy: BackgroundStrategy) {
  const currentBackground =
    readStorage('shijianus-background') ??
    document.documentElement.dataset.background ??
    strategy.defaultBackground;
  const nextBackground = resolveThemeAwareBackground(nextTheme, currentBackground, strategy);

  syncTheme(nextTheme);
  if (nextBackground !== currentBackground) syncBackground(nextBackground);
  return nextBackground;
}
