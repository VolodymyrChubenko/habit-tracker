import type { Challenge, ChallengeId } from '../../types';

interface Props {
  challenges: Challenge[];
  selected: ChallengeId[] | null; // null = all
  onChange: (ids: ChallengeId[] | null) => void;
}

export const ChallengeSelector = ({ challenges, selected, onChange }: Props) => {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, overflowX: 'auto' }}>
      <button
        onClick={() => onChange(null)}
        style={{
          borderRadius: 20, padding: '5px 13px', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
          background: selected === null ? '#7CB9A8' : '#fff',
          color: selected === null ? '#fff' : '#555',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        Всі
      </button>
      {challenges.map(h => {
        const isActive = selected?.includes(h.id);
        return (
          <button
            key={h.id}
            onClick={() => {
              if (isActive) {
                const next = selected!.filter(id => id !== h.id);
                onChange(next.length === 0 ? null : next);
              } else {
                onChange([...(selected ?? []), h.id]);
              }
            }}
            style={{
              borderRadius: 20, padding: '5px 13px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, border: '1.5px solid #E8E4DC',
              background: isActive ? '#EBF5F2' : '#fff', color: '#555',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
            {h.name}
          </button>
        );
      })}
    </div>
  );
};
