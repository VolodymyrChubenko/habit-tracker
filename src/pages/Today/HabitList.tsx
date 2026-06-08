import { useHabitsStore } from '../../store/habitsStore';
import { HabitItem } from '../../components/HabitItem/HabitItem';
import { today } from '../../utils/dateUtils';
import type { Habit } from '../../types';

interface Props {
  habits: Habit[];
  onEdit: (habit: Habit) => void;
}

export const HabitList = ({ habits, onEdit }: Props) => {
  const { completeHabit } = useHabitsStore();
  const date = today();

  return (
    <>
      {habits.map(habit => (
        <HabitItem
          key={habit.id}
          habit={habit}
          done={false}
          onToggle={() => completeHabit(habit.id, date)}
          onEdit={() => onEdit(habit)}
        />
      ))}
    </>
  );
};
