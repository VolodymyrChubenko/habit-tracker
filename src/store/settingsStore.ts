import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '../types';

interface SettingsState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  reminderEnabled: boolean;
  reminderTime: string;
  setReminderEnabled: (v: boolean) => void;
  setReminderTime: (t: string) => void;
}

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
      name: 'habit-tracker-settings',
      version: 1,
      migrate: (persisted: unknown) => {
        const state = persisted as Partial<SettingsState>;
        return {
          theme: state.theme ?? 'system',
          reminderEnabled: state.reminderEnabled ?? false,
          reminderTime: state.reminderTime ?? '08:00',
        } as SettingsState;
      },
    },
  ),
);
