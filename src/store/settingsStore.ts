import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '../types';
import { adoptLegacyStorageKey } from '../utils/storageMigration';

const STORAGE_KEY = 'challenge-tracker-settings';

interface SettingsState {
  theme: Theme;
  /** Master-тогл push-нагадувань (дозвіл браузера запитується окремо). */
  pushEnabled: boolean;
  setTheme: (theme: Theme) => void;
  setPushEnabled: (enabled: boolean) => void;
}

adoptLegacyStorageKey('habit-tracker-settings', STORAGE_KEY);

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      theme: 'system',
      pushEnabled: false,
      setTheme: theme => set({ theme }),
      setPushEnabled: pushEnabled => set({ pushEnabled }),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<SettingsState>;
        if (version < 1) {
          return {
            theme: state.theme ?? 'system',
            pushEnabled: false,
          } as SettingsState;
        }
        // v2 додала pushEnabled.
        if (version < 2) {
          state.pushEnabled = state.pushEnabled ?? false;
        }
        return state as SettingsState;
      },
    },
  ),
);
