import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';
export const THEME_CHANGE_EVENT = 'rehab_theme_changed';

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function getStoredTheme(defaultTheme: Theme = 'light'): Theme {
  if (typeof window === 'undefined') return defaultTheme;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('rehab_theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored as Theme;
    }
  } catch (error) {
    console.warn('[useTheme] Error reading theme from localStorage:', error);
  }
  return defaultTheme;
}

export function applyThemeToDOM(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;
}

export interface UseThemeReturn {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<UseThemeReturn | null>(null);

export function useThemeState(initialDefault: Theme = 'light'): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme(initialDefault));

  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? getSystemTheme() : theme;

  const isDark = resolvedTheme === 'dark';

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      window.dispatchEvent(
        new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: newTheme } })
      );
    } catch (error) {
      console.warn('[useTheme] Error saving theme to localStorage:', error);
    }

    const nextResolved: ResolvedTheme =
      newTheme === 'system' ? getSystemTheme() : newTheme;
    applyThemeToDOM(nextResolved);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') {
        const currentSystem = mediaQuery.matches ? 'dark' : 'light';
        applyThemeToDOM(currentSystem);
        setThemeState('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY || e.key === 'rehab_theme') {
        const val = e.newValue as Theme | null;
        if (val && (val === 'light' || val === 'dark' || val === 'system')) {
          setThemeState(val);
          const nextRes: ResolvedTheme = val === 'system' ? getSystemTheme() : val;
          applyThemeToDOM(nextRes);
        }
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: Theme }>;
      if (customEvent.detail && customEvent.detail.theme) {
        setThemeState(customEvent.detail.theme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(THEME_CHANGE_EVENT, handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(THEME_CHANGE_EVENT, handleCustomChange);
    };
  }, []);

  return {
    theme,
    resolvedTheme,
    isDark,
    setTheme,
    toggleTheme,
  };
}

export const ThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultTheme?: Theme;
}> = ({ children, defaultTheme = 'light' }) => {
  const themeValue = useThemeState(defaultTheme);

  return (
    <ThemeContext.Provider value={themeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(defaultTheme?: Theme): UseThemeReturn {
  const context = useContext(ThemeContext);
  const standalone = useThemeState(defaultTheme || 'light');
  return context || standalone;
}

export default useTheme;
