export function readStoredString(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredString(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private browsing; the player still works in memory.
  }
}

export function readStoredBoolean(key: string, fallback = false): boolean {
  const value = readStoredString(key);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export function writeStoredBoolean(key: string, value: boolean): void {
  writeStoredString(key, String(value));
}

export function readStoredNumber(key: string, fallback: number): number {
  const value = readStoredString(key);
  if (value === null) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function writeStoredNumber(key: string, value: number): void {
  writeStoredString(key, String(value));
}

export function readStoredJson<T>(key: string, fallback: T): T {
  const value = readStoredString(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function writeStoredJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}
