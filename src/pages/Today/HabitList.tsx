import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useHabitsStore } from '../../store/habitsStore';
import { useHabits } from '../../hooks/useHabits';
import { HabitItem } from '../../components/HabitItem/HabitItem';
import { today } from '../../utils/dateUtils';
import type { Habit } from '../../types';

interface Props {
  habits: Habit[];
  onEdit: (habit: Habit) => void;
}

interface RowProps {
  habit: Habit;
  onToggle: () => void;
  onEdit: () => void;
}

const SortableRow = ({ habit, onToggle, onEdit }: RowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <HabitItem habit={habit} done={false} onToggle={onToggle} onEdit={onEdit} />
    </div>
  );
};

export const HabitList = ({ habits, onEdit }: Props) => {
  const { completeHabit, reorderHabits } = useHabitsStore();
  const { activeHabits } = useHabits();
  const date = today();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = habits.map(h => h.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const reorderedVisible = arrayMove(ids, oldIndex, newIndex);

    const visibleSet = new Set(reorderedVisible);
    const rest = activeHabits.map(h => h.id).filter(id => !visibleSet.has(id));
    reorderHabits([...reorderedVisible, ...rest]);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={habits.map(h => h.id)} strategy={verticalListSortingStrategy}>
        {habits.map(habit => (
          <SortableRow
            key={habit.id}
            habit={habit}
            onToggle={() => completeHabit(habit.id, date)}
            onEdit={() => onEdit(habit)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};
