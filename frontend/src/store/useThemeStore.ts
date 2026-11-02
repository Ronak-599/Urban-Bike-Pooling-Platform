import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem('twoshare_theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch (e) {
    console.warn('Error reading theme from localStorage', e);
  }
  return 'dark'; // Default to dark theme matching existing platform aesthetic
};

const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme();
  applyThemeToDOM(initial);

  return {
    theme: initial,
    setTheme: (theme: Theme) => {
      try {
        localStorage.setItem('twoshare_theme', theme);
      } catch (e) {
        console.warn('Error saving theme to localStorage', e);
      }
      applyThemeToDOM(theme);
      set({ theme });
    },
    toggleTheme: () => {
      const current = get().theme;
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },
  };
});

