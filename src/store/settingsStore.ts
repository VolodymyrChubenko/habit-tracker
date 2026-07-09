import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '../types';
import { adoptLegacyStorageKey } from '../utils/storageMigration';

const STORAGE_KEY = 'challenge-tracker-settings';

interface SettingsState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  reminderEnabled: boolean;
  reminderTime: string;
  setReminderEnabled: (v: boolean) => void;
  setReminderTime: (t: string) => void;
}

adoptLegacyStorageKey('habit-tracker-settings', STORAGE_KEY);

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      theme: 'system',
      setTheme: theme => set({ theme }),
      reminderEnabled: false,
      reminderTime: '08:00',
      setReminderEnabled: v => set({ reminderEnabled: v }),
      setReminderTime: t => set({ reminderTime: t }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Partial<SettingsState>;
        if (version < 1) {
          return {
            theme: state.theme ?? 'system',
            reminderEnabled: state.reminderEnabled ?? false,
            reminderTime: state.reminderTime ?? '08:00',
          } as SettingsState;
        }
        return state as SettingsState;
      },
    },
  ),
);
