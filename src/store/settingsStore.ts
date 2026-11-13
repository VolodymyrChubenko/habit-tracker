import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Palette, Theme } from '../types';
import { adoptLegacyStorageKey } from '../utils/storageMigration';

const STORAGE_KEY = 'challenge-tracker-settings';

interface SettingsState {
  theme: Theme;
  /** Колірна палітра; незалежна від теми (light/dark/system). */
  palette: Palette;
  /** Master-тогл push-нагадувань (дозвіл браузера запитується окремо). */
  pushEnabled: boolean;
  setTheme: (theme: Theme) => void;
  setPalette: (palette: Palette) => void;
  setPushEnabled: (enabled: boolean) => void;
}

adoptLegacyStorageKey('habit-tracker-settings', STORAGE_KEY);

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      theme: 'system',
      palette: 'default',
      pushEnabled: false,
      setTheme: theme => set({ theme }),
      setPalette: palette => set({ palette }),
      setPushEnabled: pushEnabled => set({ pushEnabled }),
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<SettingsState>;
        if (version < 1) {
          return {
            theme: state.theme ?? 'system',
            palette: 'default',
            pushEnabled: false,
          } as SettingsState;
        }
        // v2 додала pushEnabled.
        if (version < 2) {
          state.pushEnabled = state.pushEnabled ?? false;
        }
        // v3 додала palette.
        if (version < 3) {
          state.palette = state.palette ?? 'default';
        }
        return state as SettingsState;
      },
    },
  ),
);
