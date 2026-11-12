import { useState } from 'react';
import { BottomSheet } from '../../components/BottomSheet/BottomSheet';
import { useChallenges } from '../../hooks/useChallenges';
import { useChallengesStore } from '../../store/challengesStore';
import { formatDisplayDate } from '../../utils/dateUtils';
import type { DateString, ChallengeId } from '../../types';

interface Props {
  date: DateString;
  onClose: () => void;
}

export const DateEditSheet = ({ date, onClose }: Props) => {
  const { activeChallenges } = useChallenges();
  const logs = useChallengesStore(s => s.logs);
  const { saveLogsForDate } = useChallengesStore();

  const activeIds = new Set(activeChallenges.map(h => h.id));
  const initial = new Set<ChallengeId>(
    logs.filter(l => l.date === date && activeIds.has(l.challengeId)).map(l => l.challengeId),
  );
  const [checked, setChecked] = useState<Set<ChallengeId>>(initial);

  const toggle = (id: ChallengeId) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    saveLogsForDate(date, [...checked], activeChallenges.map(h => h.id));
    onClose();
  };

  return (
    <BottomSheet onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-sheet-title)', marginBottom: 4 }}>
        {formatDisplayDate(date)}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-sheet-subtitle)', marginBottom: 18 }}>
        Відмітити виконані челенджі
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {activeChallenges.map(h => (
          <div
            key={h.id}
            onClick={() => toggle(h.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--color-sheet-row)', borderRadius: 10, cursor: 'pointer' }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, color: 'var(--color-text)' }}>{h.name}</span>
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
              background: checked.has(h.id) ? h.color : 'var(--color-surface)',
              border: checked.has(h.id) ? 'none' : '2px solid var(--color-checkbox-border)',
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
