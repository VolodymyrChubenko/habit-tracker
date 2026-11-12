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
  const textColor = isToday
    ? color
    : isFuture ? 'var(--color-day-text-future)' : 'var(--color-day-text-past)';
  const trackColor = isFuture ? 'var(--color-ring-track-future)' : 'var(--color-ring-track-past)';

  return (
    <svg width={size} height={size} viewBox="0 0 34 34">
      <circle cx="17" cy="17" r={RADIUS} fill="none" style={{ stroke: trackColor }} strokeWidth="2.5" />
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
      <text
        x="17" y="17"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="10"
        fontWeight={isToday ? 700 : 500}
        style={{ fill: textColor }}
        fontFamily="inherit"
      >
        {day}
      </text>
    </svg>
  );
};
