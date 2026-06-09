import { useMemo } from 'react';
import { useHabitsStore } from '../store/habitsStore';
import type { DateString, HabitId, StatScope } from '../types';

export const useStatistics = (scope: StatScope, filterIds?: HabitId[]) => {
  const habits = useHabitsStore(s => s.habits);
  const logs = useHabitsStore(s => s.logs);

  const progressByDate = useMemo(() => {
    const scopedHabits = habits.filter(h =>
      scope === 'active' ? !h.archivedAt : !!h.archivedAt,
    );
    const scopedIds = new Set(scopedHabits.map(h => h.id));

    const map = new Map<DateString, number>();
    const logsByDate = new Map<DateString, Set<HabitId>>();

    for (const log of logs) {
      if (!scopedIds.has(log.habitId)) continue;
      if (filterIds && !filterIds.includes(log.habitId)) continue;
      if (!logsByDate.has(log.date)) logsByDate.set(log.date, new Set());
      logsByDate.get(log.date)!.add(log.habitId);
    }

    // include dates where all filtered logs were removed (show 0 progress)
    for (const log of logs) {
      if (!scopedIds.has(log.habitId)) continue;
      if (!logsByDate.has(log.date)) logsByDate.set(log.date, new Set());
    }

    for (const [date, completedIds] of logsByDate) {
      const trackable = scopedHabits.filter(h => {
        if (h.archivedAt && h.archivedAt < date) return false;
        if (h.createdAt > date && !completedIds.has(h.id)) return false;
        return true;
      });
      const total = filterIds
        ? trackable.filter(h => filterIds.includes(h.id)).length
        : trackable.length;
      map.set(date, total === 0 ? 0 : completedIds.size / total);
    }

    return map;
  }, [habits, logs, scope, filterIds]);

  return { progressByDate };
};
