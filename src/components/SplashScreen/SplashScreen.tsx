import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './SplashScreen.module.scss';

interface Props {
  onDone: () => void;
}

const LETTERS = 'IMPROVE YOURSELF'.split('');

export function SplashScreen({ onDone }: Props) {
  const [phases, setPhases] = useState<string[]>([]);
  const timers = useRef<number[]>([]);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach(clearTimeout);
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    const add = (cls: string, at: number) =>
      timers.current.push(window.setTimeout(() => setPhases(p => [...p, cls]), at));

    add('draw', 50);
    add('checkOn', 1250);
    add('morph', 1900);
    add('text', 2450);
    add('exit', 3300);
    timers.current.push(window.setTimeout(finish, 3700));

    const ids = timers.current;
    return () => ids.forEach(clearTimeout);
  }, [finish]);

  const skip = () => {
    if (finished.current) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhases(p => (p.includes('exit') ? p : [...p, 'exit']));
    timers.current.push(window.setTimeout(finish, 250));
  };

  const className = [styles.splash, ...phases.map(p => styles[p])].join(' ');

  return (
    <div className={className} onClick={skip} role="presentation">
      <svg className={styles.logo} viewBox="0 0 200 200" aria-hidden="true">
        <circle
          className={`${styles.ring} ${styles.orange}`}
          cx="100" cy="100" r="74" pathLength="100"
          transform="rotate(-90 100 100)"
        />
        <circle
          className={`${styles.ring} ${styles.green}`}
          cx="100" cy="100" r="74" pathLength="100"
          transform="rotate(-90 100 100)"
        />
        <path className={styles.check} d="M64 104 L88 130 L140 74" pathLength="100" />
      </svg>
      <div className={styles.word} aria-label="IMPROVE YOURSELF">
        {LETTERS.map((ch, i) => (
          <span key={i} style={{ '--i': i } as React.CSSProperties}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </div>
    </div>
  );
}
