import { useMemo } from 'react';
import { useHabitsStore } from '../store/habitsStore';
import { calcStreak } from '../utils/streakUtils';
import { today } from '../utils/dateUtils';
import type { Habit, HabitId, DateString } from '../types';

interface StreakResult {
  habit: Habit;
  streak: number;
}

export const useStreaks = (habits: Habit[], filterIds: HabitId[] | null): StreakResult[] => {
  const logs = useHabitsStore(s => s.logs);

  return useMemo(() => {
    const todayStr = today();

    const completedByHabit = new Map<HabitId, Set<DateString>>();
    for (const log of logs) {
      if (!completedByHabit.has(log.habitId)) completedByHabit.set(log.habitId, new Set());
      completedByHabit.get(log.habitId)!.add(log.date);
    }

    const filtered = filterIds
      ? habits.filter(h => filterIds.includes(h.id))
      : habits;

    return filtered
      .map(habit => ({
        habit,
        streak: calcStreak(habit, completedByHabit.get(habit.id) ?? new Set(), todayStr),
      }))
      .filter(r => r.streak >= 2);
  }, [logs, habits, filterIds]);
};
