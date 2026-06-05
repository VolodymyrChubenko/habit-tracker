import { useHabitsStore } from '../store/habitsStore';

export const useHabits = () => {
  const habits = useHabitsStore(s => s.habits);
  const activeHabits = habits.filter(h => !h.archivedAt);
  const archivedHabits = habits.filter(h => !!h.archivedAt);
  return { activeHabits, archivedHabits };
};
