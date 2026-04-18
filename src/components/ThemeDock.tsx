import React, { useEffect, useState } from 'react';
import { ArrowUp, MoonStar, PanelRightClose, PanelRightOpen, SunMedium } from 'lucide-react';

type ThemeMode = 'light' | 'dark';
type AsideState = 'expanded' | 'collapsed';

function syncTheme(nextTheme: ThemeMode) {
  document.documentElement.dataset.theme = nextTheme;
  window.localStorage.setItem('shijianus-theme', nextTheme);
  window.dispatchEvent(new CustomEvent('shijianus:themechange', { detail: nextTheme }));
}

function syncAside(nextAside: AsideState) {
  document.documentElement.dataset.aside = nextAside;
  window.localStorage.setItem('shijianus-aside', nextAside);
}

export function ThemeDock() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [aside, setAside] = useState<AsideState>('expanded');

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = (window.localStorage.getItem('shijianus-theme') as ThemeMode | null) ?? (root.dataset.theme as ThemeMode | undefined) ?? 'dark';
    const savedAside = (window.localStorage.getItem('shijianus-aside') as AsideState | null) ?? (root.dataset.aside as AsideState | undefined) ?? 'expanded';

    root.dataset.theme = savedTheme;
    root.dataset.aside = savedAside;

    setTheme(savedTheme);
    setAside(savedAside);

    const onThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeMode>;
      setTheme(customEvent.detail ?? 'dark');
    };

    window.addEventListener('shijianus:themechange', onThemeChange as EventListener);
    return () => window.removeEventListener('shijianus:themechange', onThemeChange as EventListener);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden flex-col gap-2 md:flex">
      <button
        type="button"
        onClick={() => {
          const nextTheme = theme === 'dark' ? 'light' : 'dark';
          syncTheme(nextTheme);
          setTheme(nextTheme);
        }}
        className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--text-soft)] shadow-sm transition-colors hover:border-[var(--signal)] hover:text-[var(--text-strong)]"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      </button>

      <button
        type="button"
        onClick={() => {
          const nextAside = aside === 'expanded' ? 'collapsed' : 'expanded';
          syncAside(nextAside);
          setAside(nextAside);
        }}
        className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--text-soft)] shadow-sm transition-colors hover:border-[var(--teal)] hover:text-[var(--text-strong)]"
        aria-label="Toggle aside"
      >
        {aside === 'expanded' ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
      </button>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface)] text-[var(--text-soft)] shadow-sm transition-colors hover:border-[var(--lime)] hover:text-[var(--text-strong)]"
        aria-label="Back to top"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
}
