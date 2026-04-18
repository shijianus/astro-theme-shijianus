import React, { useEffect, useState } from 'react';
import { ExternalLink, Menu, MoonStar, SunMedium, X } from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

type SiteHeaderProps = {
  brandName: string;
  domainLabel: string;
  currentPath: string;
  primary: NavItem[];
  utility: NavItem[];
};

function isActive(currentPath: string, href: string) {
  if (href === '/') return currentPath === '/';
  return currentPath.startsWith(href);
}

function applyTheme(nextTheme: 'light' | 'dark') {
  document.documentElement.dataset.theme = nextTheme;
  window.localStorage.setItem('shijianus-theme', nextTheme);
  window.dispatchEvent(new CustomEvent('shijianus:themechange', { detail: nextTheme }));
}

export function SiteHeader({
  brandName,
  domainLabel,
  currentPath,
  primary,
  utility,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const currentTheme = (document.documentElement.dataset.theme as 'light' | 'dark' | undefined) ?? 'dark';
    setTheme(currentTheme);

    const onThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<'light' | 'dark'>;
      setTheme(customEvent.detail ?? 'dark');
    };

    window.addEventListener('shijianus:themechange', onThemeChange as EventListener);
    return () => window.removeEventListener('shijianus:themechange', onThemeChange as EventListener);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [currentPath]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color:color-mix(in_oklab,var(--bg)_84%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
        <a href="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--line-strong)] bg-[var(--surface)] text-sm font-semibold text-[var(--text-strong)]">
            SJ
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
              {brandName}
            </p>
            <p className="truncate text-xs text-[var(--text-soft)]">{domainLabel}</p>
          </div>
        </a>

        <nav className="hidden items-center gap-2 lg:flex">
          {primary.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                isActive(currentPath, item.href)
                  ? 'bg-[var(--surface-muted)] text-[var(--text-strong)]'
                  : 'text-[var(--text-soft)] hover:text-[var(--text-strong)]'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Configurable
          </span>
          {utility.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noreferrer' : undefined}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-[var(--text-soft)] transition-colors hover:text-[var(--text-strong)]"
            >
              {item.label}
              {item.external && <ExternalLink className="h-3.5 w-3.5" />}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              const nextTheme = theme === 'dark' ? 'light' : 'dark';
              applyTheme(nextTheme);
              setTheme(nextTheme);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--line)] text-[var(--text-soft)] transition-colors hover:border-[var(--signal)] hover:text-[var(--text-strong)]"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--line)] text-[var(--text-soft)] lg:hidden"
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[var(--line)] bg-[var(--bg)] lg:hidden">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-4 sm:px-6">
            {primary.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm ${
                  isActive(currentPath, item.href)
                    ? 'bg-[var(--surface-muted)] text-[var(--text-strong)]'
                    : 'text-[var(--text-soft)]'
                }`}
              >
                {item.label}
              </a>
            ))}
            <div className="my-2 h-px bg-[var(--line)]" />
            {utility.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noreferrer' : undefined}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-soft)]"
              >
                {item.label}
                {item.external && <ExternalLink className="h-3.5 w-3.5" />}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                const nextTheme = theme === 'dark' ? 'light' : 'dark';
                applyTheme(nextTheme);
                setTheme(nextTheme);
              }}
              className="mt-2 inline-flex items-center gap-2 rounded-md border border-[var(--line)] px-3 py-2 text-left text-sm text-[var(--text-soft)]"
            >
              {theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              切换到{theme === 'dark' ? '亮色' : '暗色'}模式
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
