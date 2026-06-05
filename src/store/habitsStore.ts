import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';
import type { Habit, HabitId, HabitLog, DateString } from '../types';

interface HabitsState {
  habits: Habit[];
  logs: HabitLog[];
  addHabit: (name: string, color: string) => void;
  completeHabit: (habitId: HabitId, date: DateString) => void;
  uncompleteHabit: (habitId: HabitId, date: DateString) => void;
  archiveHabit: (habitId: HabitId) => void;
  saveLogsForDate: (date: DateString, habitIds: HabitId[]) => void;
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],

      addHabit: (name, color) =>
        set(state => ({
          habits: [
            ...state.habits,
            { id: nanoid(), name, color, createdAt: format(new Date(), 'yyyy-MM-dd') },
          ],
        })),

      completeHabit: (habitId, date) => {
        const already = get().logs.some(l => l.habitId === habitId && l.date === date);
        if (already) return;
        set(state => ({
          logs: [...state.logs, { habitId, date, completedAt: new Date().toISOString() }],
        }));
      },

      uncompleteHabit: (habitId, date) =>
        set(state => ({
          logs: state.logs.filter(l => !(l.habitId === habitId && l.date === date)),
        })),

      archiveHabit: (habitId) =>
        set(state => ({
          habits: state.habits.map(h =>
            h.id === habitId ? { ...h, archivedAt: format(new Date(), 'yyyy-MM-dd') } : h,
          ),
        })),

      saveLogsForDate: (date, habitIds) =>
        set(state => ({
          logs: [
            ...state.logs.filter(l => l.date !== date),
            ...habitIds.map(habitId => ({
              habitId,
              date,
              completedAt: new Date().toISOString(),
            })),
          ],
        })),
    }),
    { name: 'habit-tracker-storage' },
  ),
);
