import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '../types';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Theme Enforcement: ALWAYS LIGHT MODE
const applyTheme = (theme: Theme) => {
  const root = window.document.documentElement;
  // Force removal of dark class ensuring Light Mode always
  root.classList.remove('dark');
  root.classList.add('light');
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light', // Default to light

      setTheme: (theme: Theme) => {
        applyTheme('light'); // Ignore input, force light
        set({ theme: 'light' });
      },

      toggleTheme: () => {
        // Disable toggle, ensure light
        applyTheme('light');
        set({ theme: 'light' });
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        applyTheme('light'); // Force light on load
      },
    }
  )
);

// Remove system listener to prevent auto-dark mode
// Logica de sistema removida propositalmente
