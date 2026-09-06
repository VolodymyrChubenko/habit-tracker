import { useEffect, useRef } from 'react';
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
import type { Challenge, ChallengeId } from '../../types';

interface Props {
  challenges: Challenge[];
  remindingIds: ChallengeId[];
  onEdit: (challenge: Challenge) => void;
}

interface RowProps {
  challenge: Challenge;
  reminding: boolean;
  onToggle: () => void;
  onEdit: () => void;
}

// Синтетичний click після дропу спливає в onClick картки — гасимо його на це вікно.
const CLICK_SUPPRESS_MS = 250;

const SortableRow = ({ challenge, reminding, onToggle, onEdit }: RowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: challenge.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // listeners типізовані як Record<string, Function> — звужуємо до пропсів елемента
  const dragHandleProps = { ...attributes, ...listeners } as React.HTMLAttributes<HTMLElement>;

  return (
    <div ref={setNodeRef} style={style}>
      <ChallengeItem
        challenge={challenge}
        done={false}
        reminding={reminding}
        onToggle={onToggle}
        onEdit={onEdit}
        dragHandleProps={dragHandleProps}
      />
    </div>
  );
};

export const ChallengeList = ({ challenges, remindingIds, onEdit }: Props) => {
  const { completeChallenge, reorderChallenges } = useChallengesStore();
  const { activeChallenges } = useChallenges();
  const date = today();
  const justDragged = useRef(false);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const markDragged = () => {
    justDragged.current = true;
    clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      justDragged.current = false;
    }, CLICK_SUPPRESS_MS);
  };

  const guardedEdit = (challenge: Challenge) => {
    if (justDragged.current) return;
    onEdit(challenge);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    markDragged();
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragCancel={markDragged}
    >
      <SortableContext items={challenges.map(h => h.id)} strategy={verticalListSortingStrategy}>
        {challenges.map(challenge => (
          <SortableRow
            key={challenge.id}
            challenge={challenge}
            reminding={remindingIds.includes(challenge.id)}
            onToggle={() => completeChallenge(challenge.id, date)}
            onEdit={() => guardedEdit(challenge)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};
