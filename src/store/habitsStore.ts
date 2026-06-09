import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';
import type { Habit, HabitId, HabitLog, DateString } from '../types';

interface HabitsState {
  habits: Habit[];
  logs: HabitLog[];
  addHabit: (name: string, color: string) => void;
  updateHabit: (habitId: HabitId, patch: Partial<Pick<Habit, 'name' | 'color'>>) => void;
  deleteHabit: (habitId: HabitId) => void;
  completeHabit: (habitId: HabitId, date: DateString) => void;
  uncompleteHabit: (habitId: HabitId, date: DateString) => void;
  archiveHabit: (habitId: HabitId) => void;
  saveLogsForDate: (date: DateString, completedHabitIds: HabitId[], scopeHabitIds: HabitId[]) => void;
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

      updateHabit: (habitId, patch) =>
        set(state => ({
          habits: state.habits.map(h =>
            h.id === habitId ? { ...h, ...patch } : h,
          ),
        })),

      deleteHabit: (habitId) =>
        set(state => ({
          habits: state.habits.filter(h => h.id !== habitId),
          logs: state.logs.filter(l => l.habitId !== habitId),
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

      saveLogsForDate: (date, completedHabitIds, scopeHabitIds) =>
        set(state => {
          const scope = new Set(scopeHabitIds);
          return {
            logs: [
              ...state.logs.filter(l => l.date !== date || !scope.has(l.habitId)),
              ...completedHabitIds.map(habitId => ({
                habitId,
                date,
                completedAt: new Date().toISOString(),
              })),
            ],
          };
        }),
    }),
    { name: 'habit-tracker-storage' },
  ),
);
