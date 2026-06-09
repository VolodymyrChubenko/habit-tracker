import { useHabitsStore } from '../store/habitsStore';
import type { Habit } from '../types';

const byOrder = (a: Habit, b: Habit): number => a.order - b.order;

export const useHabits = () => {
  const habits = useHabitsStore(s => s.habits);
  const activeHabits = habits.filter(h => !h.archivedAt).sort(byOrder);
  const archivedHabits = habits.filter(h => !!h.archivedAt).sort(byOrder);
  return { activeHabits, archivedHabits };
};
