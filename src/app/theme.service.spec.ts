import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  const storageKey = 'velacore-theme';
  let storage: Map<string, string>;
  let prefersDark = false;

  beforeEach(() => {
    storage = new Map<string, string>();
    prefersDark = false;
    document.documentElement.classList.remove('dark', 'light');
    TestBed.resetTestingModule();

    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: prefersDark })));
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.classList.remove('dark', 'light');
  });

  it('should initialize from the persisted theme', () => {
    storage.set(storageKey, 'dark');

    const service = TestBed.inject(ThemeService);

    expect(service.currentTheme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('should toggle the theme and persist the selection', () => {
    const service = TestBed.inject(ThemeService);

    expect(service.currentTheme()).toBe('light');

    service.toggleTheme();

    expect(service.currentTheme()).toBe('dark');
    expect(storage.get(storageKey)).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    service.toggleTheme();

    expect(service.currentTheme()).toBe('light');
    expect(storage.get(storageKey)).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('should use the system preference when no stored theme exists', () => {
    prefersDark = true;

    const service = TestBed.inject(ThemeService);

    expect(service.currentTheme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
