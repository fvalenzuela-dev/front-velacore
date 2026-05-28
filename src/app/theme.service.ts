import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark';

const THEME_STORAGE_KEY = 'velacore-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly theme = signal<ThemePreference>(this.getInitialTheme());

  readonly currentTheme = this.theme.asReadonly();
  readonly isDark = computed(() => this.currentTheme() === 'dark');

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  toggleTheme(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  setTheme(theme: ThemePreference): void {
    this.theme.set(theme);
    this.applyTheme(theme);
    this.persistTheme(theme);
  }

  private getInitialTheme(): ThemePreference {
    const storedTheme = this.readStoredTheme();

    if (storedTheme) {
      return storedTheme;
    }

    if (typeof globalThis.matchMedia === 'function') {
      return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return 'light';
  }

  private readStoredTheme(): ThemePreference | null {
    try {
      const storedTheme = globalThis.localStorage.getItem(THEME_STORAGE_KEY);
      return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : null;
    } catch {
      return null;
    }
  }

  private persistTheme(theme: ThemePreference): void {
    try {
      globalThis.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Persistence is best-effort; the current page still reflects the selected theme.
    }
  }

  private applyTheme(theme: ThemePreference): void {
    const root = this.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }
}
