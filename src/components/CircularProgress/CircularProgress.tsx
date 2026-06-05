import { CIRCUMFERENCE, calcOffset } from '../../utils/progressUtils';

interface Props {
  progress: number;  // 0..1
  size?: number;
  color?: string;
  day: number;
  isToday?: boolean;
  isFuture?: boolean;
}

const RADIUS = 13;

export const CircularProgress = ({
  progress,
  size = 34,
  color = '#7CB9A8',
  day,
  isToday = false,
  isFuture = false,
}: Props) => {
  const offset = calcOffset(progress);
  const textColor = isToday ? color : isFuture ? '#cccccc' : '#555555';

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 34 34">
        {/* Track */}
        <circle cx="17" cy="17" r={RADIUS} fill="none" stroke="#F0EDE6" strokeWidth="2.5" />
        {/* Progress arc */}
        {progress > 0 && (
          <circle
            cx="17" cy="17" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 17 17)"
          />
        )}
      </svg>
      <span style={{ position: 'absolute', fontSize: 10, fontWeight: isToday ? 700 : 500, color: textColor }}>
        {day}
      </span>
    </div>
  );
};
