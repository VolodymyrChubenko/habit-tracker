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
import { useChallengesStore } from '../../store/challengesStore';
import { useChallenges } from '../../hooks/useChallenges';
import { ChallengeItem } from '../../components/ChallengeItem/ChallengeItem';
import { today } from '../../utils/dateUtils';
import type { Challenge } from '../../types';

interface Props {
  challenges: Challenge[];
  onEdit: (challenge: Challenge) => void;
}

interface RowProps {
  challenge: Challenge;
  onToggle: () => void;
  onEdit: () => void;
}

const SortableRow = ({ challenge, onToggle, onEdit }: RowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: challenge.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ChallengeItem challenge={challenge} done={false} onToggle={onToggle} onEdit={onEdit} />
    </div>
  );
};

export const ChallengeList = ({ challenges, onEdit }: Props) => {
  const { completeChallenge, reorderChallenges } = useChallengesStore();
  const { activeChallenges } = useChallenges();
  const date = today();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = challenges.map(h => h.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    const reorderedVisible = arrayMove(ids, oldIndex, newIndex);

    const visibleSet = new Set(reorderedVisible);
    const rest = activeChallenges.map(h => h.id).filter(id => !visibleSet.has(id));
    reorderChallenges([...reorderedVisible, ...rest]);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={challenges.map(h => h.id)} strategy={verticalListSortingStrategy}>
        {challenges.map(challenge => (
          <SortableRow
            key={challenge.id}
            challenge={challenge}
            onToggle={() => completeChallenge(challenge.id, date)}
            onEdit={() => onEdit(challenge)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};
