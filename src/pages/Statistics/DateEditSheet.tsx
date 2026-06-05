import { useState } from 'react';
import { BottomSheet } from '../../components/BottomSheet/BottomSheet';
import { useHabits } from '../../hooks/useHabits';
import { useHabitsStore } from '../../store/habitsStore';
import { formatDisplayDate } from '../../utils/dateUtils';
import type { DateString, HabitId } from '../../types';

interface Props {
  date: DateString;
  onClose: () => void;
}

export const DateEditSheet = ({ date, onClose }: Props) => {
  const { activeHabits } = useHabits();
  const logs = useHabitsStore(s => s.logs);
  const { saveLogsForDate } = useHabitsStore();

  const initial = new Set<HabitId>(
    logs.filter(l => l.date === date).map(l => l.habitId),
  );
  const [checked, setChecked] = useState<Set<HabitId>>(initial);

  const toggle = (id: HabitId) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    saveLogsForDate(date, [...checked]);
    onClose();
  };

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#222', marginBottom: 4 }}>
        {formatDisplayDate(date)}
      </div>
      <div style={{ fontSize: 12, color: '#aaa', marginBottom: 18 }}>
        Відмітити виконані звички
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeHabits.map(h => (
          <div
            key={h.id}
            onClick={() => toggle(h.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#FAF7F0', borderRadius: 10, cursor: 'pointer' }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, color: '#333' }}>{h.name}</span>
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              background: checked.has(h.id) ? h.color : '#fff',
              border: checked.has(h.id) ? 'none' : '2px solid #E0DDD8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 13,
            }}>
              {checked.has(h.id) ? '✓' : ''}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        style={{ width: '100%', background: '#7CB9A8', color: '#fff', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, marginTop: 18, border: 'none', cursor: 'pointer' }}
      >
        Зберегти
      </button>
    </BottomSheet>
  );
};
