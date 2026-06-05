import { useMemo } from 'react';
import { useHabitsStore } from '../store/habitsStore';
import type { DateString, HabitId } from '../types';

export const useStatistics = (filterIds?: HabitId[]) => {
  const habits = useHabitsStore(s => s.habits);
  const logs = useHabitsStore(s => s.logs);

  const progressByDate = useMemo(() => {
    const map = new Map<DateString, number>();
    const logsByDate = new Map<DateString, Set<HabitId>>();

    for (const log of logs) {
      if (filterIds && !filterIds.includes(log.habitId)) continue;
      if (!logsByDate.has(log.date)) logsByDate.set(log.date, new Set());
      logsByDate.get(log.date)!.add(log.habitId);
    }

    for (const [date, completedIds] of logsByDate) {
      const activeOnDate = habits.filter(h => {
        if (h.archivedAt && h.archivedAt < date) return false;
        if (h.createdAt > date) return false;
        return true;
      });
      const total = filterIds
        ? activeOnDate.filter(h => filterIds.includes(h.id)).length
        : activeOnDate.length;
      map.set(date, total === 0 ? 0 : completedIds.size / total);
    }

    return map;
  }, [habits, logs, filterIds]);

  return { progressByDate };
};
