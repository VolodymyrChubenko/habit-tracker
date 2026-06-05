import { useHabitsStore } from '../store/habitsStore';
import { useHabits } from './useHabits';
import { today } from '../utils/dateUtils';

export const useTodayProgress = () => {
  const { activeHabits } = useHabits();
  const logs = useHabitsStore(s => s.logs);
  const date = today();

  const completedIds = new Set(
    logs.filter(l => l.date === date).map(l => l.habitId),
  );

  const todoHabits = activeHabits.filter(h => !completedIds.has(h.id));
  const doneHabits = activeHabits.filter(h => completedIds.has(h.id));

  return { todoHabits, doneHabits, total: activeHabits.length };
};
